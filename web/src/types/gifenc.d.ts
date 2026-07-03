declare module "gifenc" {
  export interface GifEncoderStream {
    bytes: () => Uint8Array;
    finish: () => void;
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        delay?: number;
        palette?: number[][];
        repeat?: number;
        transparent?: boolean;
      },
    ) => void;
  }

  export function GIFEncoder(): GifEncoderStream;
  export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number): number[][];
  export function applyPalette(
    rgba: Uint8ClampedArray | Uint8Array,
    palette: number[][],
  ): Uint8Array;
}
