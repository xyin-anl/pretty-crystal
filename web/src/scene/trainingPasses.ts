import {
  Color,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearSRGBColorSpace,
  Material,
  MeshDepthMaterial,
  NearestFilter,
  NoBlending,
  NoToneMapping,
  Object3D,
  OrthographicCamera,
  RGBAFormat,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

import type { ProjectedAtomAnnotation } from "./exportRenderer";

const BACKGROUND_INSTANCE_ID = 0;

export interface AtomInstanceAnnotation {
  boundingBox: [number, number, number, number] | null;
  instanceColor: [number, number, number];
  instanceId: number;
  occlusionFractionEstimate: number;
  projectedFullAreaPixelsEstimate: number;
  projectedInFrameAreaPixelsEstimate: number;
  renderAtomId: string;
  visiblePixelCount: number;
}

export interface AtomInstanceRasterPass {
  annotations: AtomInstanceAnnotation[];
  backgroundId: 0;
  blob: Blob;
  colorEncoding: "rgb24-little-endian";
  occluderComponents: "visible-mesh-geometry-excluding-screen-space-lines";
}

export interface DepthRasterPass {
  backgroundValue: 1;
  cameraDepthFormula: "near + depth * (far - near)";
  data: Float32Array;
  excludedGeometry: ["screen-space-lines"];
  far: number;
  near: number;
  shape: [number, number];
  transferDtype: "float32";
  transferByteOrder: "little-endian";
  valueConvention: "orthographic-normalized-device-depth";
}

export interface StructureTrainingPasses {
  atomInstances?: AtomInstanceRasterPass;
  depth?: DepthRasterPass;
}

export async function renderStructureTrainingPasses({
  camera,
  projectedAtoms,
  renderer,
  scene,
  width,
  height,
  atomRadiusPixels,
  outputs,
}: {
  atomRadiusPixels: ReadonlyMap<string, number>;
  camera: OrthographicCamera;
  height: number;
  outputs: readonly ("atom_instances" | "depth")[];
  projectedAtoms: readonly ProjectedAtomAnnotation[];
  renderer: WebGLRenderer;
  scene: Scene;
  width: number;
}): Promise<StructureTrainingPasses> {
  const result: StructureTrainingPasses = {};
  if (outputs.includes("atom_instances")) {
    result.atomInstances = await renderAtomInstancePass({
      atomRadiusPixels,
      height,
      projectedAtoms,
      renderer,
      scene,
      width,
      camera,
    });
  }
  if (outputs.includes("depth")) {
    result.depth = renderDepthPass({ camera, height, renderer, scene, width });
  }
  return result;
}

export function instanceIdColor(instanceId: number): [number, number, number] {
  if (!Number.isInteger(instanceId) || instanceId <= 0 || instanceId > 0xffffff) {
    throw new Error(`Atom instance ID ${instanceId} is outside the RGB24 range.`);
  }
  return [instanceId & 0xff, (instanceId >> 8) & 0xff, (instanceId >> 16) & 0xff];
}

export function instanceIdFromColor(red: number, green: number, blue: number): number {
  return red + (green << 8) + (blue << 16);
}

export function unpackRgbaDepth(
  red: number,
  green: number,
  blue: number,
  alpha: number,
): number {
  const unpackDownscale = 255 / 256;
  return (
    (red / 255) * unpackDownscale +
    (green / 255) * (unpackDownscale / 256) +
    (blue / 255) * (unpackDownscale / 65536) +
    (alpha / 255) / 16777216
  );
}

async function renderAtomInstancePass({
  atomRadiusPixels,
  camera,
  height,
  projectedAtoms,
  renderer,
  scene,
  width,
}: {
  atomRadiusPixels: ReadonlyMap<string, number>;
  camera: OrthographicCamera;
  height: number;
  projectedAtoms: readonly ProjectedAtomAnnotation[];
  renderer: WebGLRenderer;
  scene: Scene;
  width: number;
}): Promise<AtomInstanceRasterPass> {
  if (projectedAtoms.length > 0xffffff) {
    throw new Error("Atom instance masks support at most 16,777,215 rendered atoms.");
  }
  const instanceIdByAtomId = new Map(
    projectedAtoms.map((atom, index) => [atom.renderAtomId, index + 1]),
  );
  const restoredObjects: Array<{
    instanceColor: InstancedBufferAttribute | null;
    material: Material | Material[];
    object: MaterialObject;
  }> = [];
  const instanceIdAttributeGeometries: BufferGeometry[] = [];
  const disposableMaterials: Material[] = [];
  const hiddenLines: Object3D[] = [];

  scene.traverse((object) => {
    if (isScreenSpaceLine(object) && object.visible) {
      hiddenLines.push(object);
      object.visible = false;
      return;
    }
    if (!isMaterialObject(object)) {
      return;
    }
    const instanceColor = object instanceof InstancedMesh ? object.instanceColor : null;
    restoredObjects.push({ instanceColor, material: object.material, object });

    if (
      object instanceof InstancedMesh &&
      object.userData.prettyCrystalComponent === "atom-instances"
    ) {
      const renderAtomIds = object.userData.renderAtomIds;
      if (!Array.isArray(renderAtomIds) || renderAtomIds.length !== object.count) {
        throw new Error("An atom instance mesh is missing its render-atom ID mapping.");
      }
      const material = new ShaderMaterial({
        blending: NoBlending,
        depthTest: true,
        depthWrite: true,
        fog: false,
        fragmentShader: `
          varying vec3 vInstanceColor;
          void main() {
            gl_FragColor = vec4(vInstanceColor, 1.0);
          }
        `,
        toneMapped: false,
        transparent: false,
        vertexShader: `
          attribute vec3 instanceIdColorExact;
          varying vec3 vInstanceColor;
          void main() {
            vInstanceColor = instanceIdColorExact;
            vec4 transformedPosition = vec4(position, 1.0);
            #ifdef USE_INSTANCING
              transformedPosition = instanceMatrix * transformedPosition;
            #endif
            gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
          }
        `,
      });
      disposableMaterials.push(material);
      object.material = material;
      const instanceColors = new Float32Array(renderAtomIds.length * 3);
      for (let index = 0; index < renderAtomIds.length; index += 1) {
        const renderAtomId = renderAtomIds[index];
        const instanceId =
          typeof renderAtomId === "string" ? instanceIdByAtomId.get(renderAtomId) : undefined;
        if (instanceId === undefined) {
          throw new Error(`No instance ID was assigned to rendered atom ${String(renderAtomId)}.`);
        }
        const [red, green, blue] = instanceIdColor(instanceId);
        instanceColors.set([red / 255, green / 255, blue / 255], index * 3);
      }
      if (object.geometry.hasAttribute("instanceIdColorExact")) {
        throw new Error("Atom geometry already defines the reserved instance ID attribute.");
      }
      object.geometry.setAttribute(
        "instanceIdColorExact",
        new InstancedBufferAttribute(instanceColors, 3, false),
      );
      instanceIdAttributeGeometries.push(object.geometry);
      return;
    }

    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const blackMaterials = sourceMaterials.map(flatBlackMaterial);
    disposableMaterials.push(...blackMaterials);
    object.material = Array.isArray(object.material) ? blackMaterials : blackMaterials[0]!;
  });

  try {
    const topDownPixels = flipRgbaRows(
      renderRgbaTarget({
        camera,
        clearColor: new Color(0, 0, 0),
        renderer,
        scene,
        width,
        height,
      }),
      width,
      height,
    );
    const visible = instanceStatistics(topDownPixels, width, height, projectedAtoms.length);
    const annotations = projectedAtoms.map((atom, index): AtomInstanceAnnotation => {
      const instanceId = index + 1;
      const stats = visible[index] ?? emptyInstanceStatistics();
      const radius = atomRadiusPixels.get(atom.renderAtomId) ?? 0;
      const projectedFullAreaPixelsEstimate = Math.PI * radius * radius;
      const projectedInFrameAreaPixelsEstimate = projectedCircleInFramePixelCount(
        atom.xy,
        radius,
        width,
        height,
      );
      const occlusionFractionEstimate =
        projectedInFrameAreaPixelsEstimate > 0
          ? clamp01(1 - stats.visiblePixelCount / projectedInFrameAreaPixelsEstimate)
          : 1;
      return {
        boundingBox: stats.boundingBox,
        instanceColor: instanceIdColor(instanceId),
        instanceId,
        occlusionFractionEstimate,
        projectedFullAreaPixelsEstimate,
        projectedInFrameAreaPixelsEstimate,
        renderAtomId: atom.renderAtomId,
        visiblePixelCount: stats.visiblePixelCount,
      };
    });
    const blob = await rgbaPixelsToPngBlob(topDownPixels, width, height);
    return {
      annotations,
      backgroundId: BACKGROUND_INSTANCE_ID,
      blob,
      colorEncoding: "rgb24-little-endian",
      occluderComponents: "visible-mesh-geometry-excluding-screen-space-lines",
    };
  } finally {
    for (const restored of restoredObjects) {
      restored.object.material = restored.material;
      if (restored.object instanceof InstancedMesh) {
        restored.object.instanceColor = restored.instanceColor;
        if (restored.object.instanceColor) {
          restored.object.instanceColor.needsUpdate = true;
        }
      }
    }
    for (const material of disposableMaterials) {
      material.dispose();
    }
    for (const object of hiddenLines) {
      object.visible = true;
    }
    for (const geometry of instanceIdAttributeGeometries) {
      geometry.deleteAttribute("instanceIdColorExact");
    }
  }
}

function renderDepthPass({
  camera,
  height,
  renderer,
  scene,
  width,
}: {
  camera: OrthographicCamera;
  height: number;
  renderer: WebGLRenderer;
  scene: Scene;
  width: number;
}): DepthRasterPass {
  const hiddenLines: Object3D[] = [];
  const restoredObjects: Array<{
    material: Material | Material[];
    object: MaterialObject;
  }> = [];
  const depthMaterials: Material[] = [];
  scene.traverse((object) => {
    if (isScreenSpaceLine(object) && object.visible) {
      hiddenLines.push(object);
      object.visible = false;
      return;
    }
    if (isMaterialObject(object)) {
      restoredObjects.push({ material: object.material, object });
      const sourceMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const replacements = sourceMaterials.map(depthMaterialFor);
      depthMaterials.push(...replacements);
      object.material = Array.isArray(object.material) ? replacements : replacements[0]!;
    }
  });
  try {
    const pixels = renderRgbaTarget({
      camera,
      clearColor: new Color(1, 1, 1),
      renderer,
      scene,
      width,
      height,
    });
    const topDownPixels = flipRgbaRows(pixels, width, height);
    const data = new Float32Array(width * height);
    for (let pixelIndex = 0; pixelIndex < data.length; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      data[pixelIndex] = unpackRgbaDepth(
        topDownPixels[offset] ?? 255,
        topDownPixels[offset + 1] ?? 255,
        topDownPixels[offset + 2] ?? 255,
        topDownPixels[offset + 3] ?? 255,
      );
    }
    return {
      backgroundValue: 1,
      cameraDepthFormula: "near + depth * (far - near)",
      data,
      excludedGeometry: ["screen-space-lines"],
      far: camera.far,
      near: camera.near,
      shape: [height, width],
      transferDtype: "float32",
      transferByteOrder: "little-endian",
      valueConvention: "orthographic-normalized-device-depth",
    };
  } finally {
    for (const restored of restoredObjects) {
      restored.object.material = restored.material;
    }
    for (const object of hiddenLines) {
      object.visible = true;
    }
    for (const material of depthMaterials) {
      material.dispose();
    }
  }
}

function depthMaterialFor(source: Material): MeshDepthMaterial {
  const material = new MeshDepthMaterial({
    blending: NoBlending,
    depthPacking: RGBADepthPacking,
    side: source.side,
  });
  material.toneMapped = false;
  return material;
}

interface MaterialObject extends Object3D {
  material: Material | Material[];
}

function isMaterialObject(object: Object3D): object is MaterialObject {
  return "material" in object && Boolean((object as Partial<MaterialObject>).material);
}

function isScreenSpaceLine(object: Object3D): boolean {
  return (
    object.type.includes("Line") ||
    Boolean((object as Object3D & { isLine?: boolean }).isLine)
  );
}

function flatBlackMaterial(source: Material): Material {
  return new ShaderMaterial({
    blending: NoBlending,
    depthTest: true,
    depthWrite: true,
    fog: false,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `,
    toneMapped: false,
    transparent: false,
    side: source.side,
    vertexShader: `
      #include <batching_pars_vertex>
      void main() {
        vec3 transformed = vec3(position);
        #include <batching_vertex>
        #include <project_vertex>
      }
    `,
  });
}

function renderRgbaTarget({
  camera,
  clearColor,
  height,
  renderer,
  scene,
  width,
}: {
  camera: OrthographicCamera;
  clearColor: Color;
  height: number;
  renderer: WebGLRenderer;
  scene: Scene;
  width: number;
}): Uint8Array {
  const target = new WebGLRenderTarget(width, height, {
    depthBuffer: true,
    format: RGBAFormat,
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    stencilBuffer: false,
    type: UnsignedByteType,
  });
  target.texture.generateMipmaps = false;
  const previousTarget = renderer.getRenderTarget();
  const previousToneMapping = renderer.toneMapping;
  const previousOutputColorSpace = renderer.outputColorSpace;
  const previousAutoClear = renderer.autoClear;
  const previousClearColor = renderer.getClearColor(new Color()).clone();
  const previousClearAlpha = renderer.getClearAlpha();
  const previousBackground = scene.background;
  const previousFog = scene.fog;
  const pixels = new Uint8Array(width * height * 4);

  try {
    renderer.toneMapping = NoToneMapping;
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.autoClear = true;
    renderer.setClearColor(clearColor, 1);
    renderer.setRenderTarget(target);
    scene.background = null;
    scene.fog = null;
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    return pixels;
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.toneMapping = previousToneMapping;
    renderer.outputColorSpace = previousOutputColorSpace;
    renderer.autoClear = previousAutoClear;
    renderer.setClearColor(previousClearColor, previousClearAlpha);
    scene.background = previousBackground;
    scene.fog = previousFog;
    target.dispose();
  }
}

function flipRgbaRows(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const rowBytes = width * 4;
  const flipped = new Uint8Array(pixels.length);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = (height - 1 - row) * rowBytes;
    flipped.set(pixels.subarray(sourceStart, sourceStart + rowBytes), row * rowBytes);
  }
  return flipped;
}

interface InstanceStatistics {
  boundingBox: [number, number, number, number] | null;
  visiblePixelCount: number;
}

function instanceStatistics(
  pixels: Uint8Array,
  width: number,
  height: number,
  instanceCount: number,
): InstanceStatistics[] {
  const statistics = Array.from({ length: instanceCount }, emptyInstanceStatistics);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const instanceId = instanceIdFromColor(
        pixels[offset] ?? 0,
        pixels[offset + 1] ?? 0,
        pixels[offset + 2] ?? 0,
      );
      if (instanceId === BACKGROUND_INSTANCE_ID) {
        continue;
      }
      const stats = statistics[instanceId - 1];
      if (!stats) {
        throw new Error(
          `Instance mask contains undeclared RGB24 ID ${instanceId} at ` +
            `(${x}, ${y}) with color (${pixels[offset] ?? 0}, ` +
            `${pixels[offset + 1] ?? 0}, ${pixels[offset + 2] ?? 0}).`,
        );
      }
      stats.visiblePixelCount += 1;
      if (stats.boundingBox === null) {
        stats.boundingBox = [x, y, x, y];
      } else {
        stats.boundingBox[0] = Math.min(stats.boundingBox[0], x);
        stats.boundingBox[1] = Math.min(stats.boundingBox[1], y);
        stats.boundingBox[2] = Math.max(stats.boundingBox[2], x);
        stats.boundingBox[3] = Math.max(stats.boundingBox[3], y);
      }
    }
  }
  return statistics;
}

function emptyInstanceStatistics(): InstanceStatistics {
  return { boundingBox: null, visiblePixelCount: 0 };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function projectedCircleInFramePixelCount(
  center: [number, number],
  radius: number,
  width: number,
  height: number,
): number {
  if (radius <= 0) {
    return 0;
  }
  const minX = Math.max(0, Math.floor(center[0] - radius));
  const maxX = Math.min(width - 1, Math.ceil(center[0] + radius));
  const minY = Math.max(0, Math.floor(center[1] - radius));
  const maxY = Math.min(height - 1, Math.ceil(center[1] + radius));
  const radiusSquared = radius * radius;
  let count = 0;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - center[0];
      const dy = y + 0.5 - center[1];
      count += Number(dx * dx + dy * dy <= radiusSquared);
    }
  }
  return count;
}

async function rgbaPixelsToPngBlob(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the atom-instance PNG canvas.");
  }
  context.putImageData(
    new ImageData(copyClampedPixels(pixels), width, height),
    0,
    0,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not encode the atom-instance PNG."));
      }
    }, "image/png");
  });
}

function copyClampedPixels(pixels: Uint8Array): Uint8ClampedArray<ArrayBuffer> {
  const copied = new Uint8ClampedArray(pixels.length);
  copied.set(pixels);
  return copied;
}
