import { applyPalette, GIFEncoder, quantize } from "gifenc";

const GIF_MAX_COLORS = 256;

/**
 * Encodes rendered frame images into an animated GIF. Frames are composited
 * onto white first because GIF has no useful alpha channel.
 */
export async function encodeGifFromImageBlobs(
  frames: Blob[],
  { fps }: { fps: number },
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error("No animation frames were rendered.");
  }

  const encoder = GIFEncoder();
  const delay = Math.max(20, Math.round(1000 / fps));
  let canvas: HTMLCanvasElement | null = null;
  let context: CanvasRenderingContext2D | null = null;

  for (const frame of frames) {
    const bitmap = await createImageBitmap(frame);
    if (!canvas || !context) {
      canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Could not prepare the GIF encoding canvas.");
      }
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, GIF_MAX_COLORS);
    const index = applyPalette(data, palette);
    encoder.writeFrame(index, canvas.width, canvas.height, {
      delay,
      palette,
      repeat: 0,
    });
  }

  encoder.finish();
  const bytes = encoder.bytes();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "image/gif" });
}
