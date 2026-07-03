/** MP4 (H.264) encoding of pre-rendered animation frames via WebCodecs. */

const MICROSECONDS_PER_SECOND = 1_000_000;
const KEYFRAME_INTERVAL = 30;
// High profile, level 5.2: comfortably covers 4K export resolutions.
const AVC_CODEC_STRING = "avc1.640034";
const BITS_PER_PIXEL_PER_SECOND = 0.15;

export function isMp4ExportSupported(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
}

/** Encodes equally sized PNG frame blobs into an MP4 at the given frame rate. */
export async function encodeMp4FromImageBlobs(
  images: Blob[],
  { fps }: { fps: number },
): Promise<Blob> {
  if (images.length === 0) {
    throw new Error("No frames to encode.");
  }
  if (!isMp4ExportSupported()) {
    throw new Error("MP4 export needs WebCodecs support in this browser.");
  }

  const { ArrayBufferTarget, Muxer } = await import("mp4-muxer");
  const firstBitmap = await createImageBitmap(images[0]!);
  // H.264 requires even dimensions.
  const width = firstBitmap.width - (firstBitmap.width % 2);
  const height = firstBitmap.height - (firstBitmap.height % 2);
  firstBitmap.close();

  const muxer = new Muxer({
    fastStart: "in-memory",
    target: new ArrayBufferTarget(),
    video: { codec: "avc", height, width },
  });

  let encoderError: unknown = null;
  const encoder = new VideoEncoder({
    error: (error) => {
      encoderError = error;
    },
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  });
  encoder.configure({
    bitrate: Math.max(1_000_000, Math.round(width * height * fps * BITS_PER_PIXEL_PER_SECOND)),
    codec: AVC_CODEC_STRING,
    framerate: fps,
    height,
    width,
  });

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = width;
  frameCanvas.height = height;
  const context = frameCanvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a 2D canvas for MP4 encoding.");
  }

  const frameDuration = MICROSECONDS_PER_SECOND / fps;
  for (let index = 0; index < images.length; index += 1) {
    const bitmap = await createImageBitmap(images[index]!);
    // Animations render on transparent backgrounds; MP4 has no alpha, so
    // composite onto white.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const frame = new VideoFrame(frameCanvas, {
      duration: frameDuration,
      timestamp: index * frameDuration,
    });
    encoder.encode(frame, { keyFrame: index % KEYFRAME_INTERVAL === 0 });
    frame.close();

    if (encoderError) {
      throw encoderError instanceof Error ? encoderError : new Error(String(encoderError));
    }
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  if (encoderError) {
    throw encoderError instanceof Error ? encoderError : new Error(String(encoderError));
  }

  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}
