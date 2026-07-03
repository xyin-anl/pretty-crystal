import type { PxrdPattern } from "../pxrd/pxrdChart";

export class PxrdRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PxrdRequestError";
  }
}

export interface PxrdRequestOptions {
  twoThetaMax?: number;
  twoThetaMin?: number;
  wavelength?: string;
}

export async function fetchPxrdPattern(
  file: File,
  options: PxrdRequestOptions = {},
): Promise<PxrdPattern> {
  const params = new URLSearchParams();
  if (options.wavelength) {
    params.set("wavelength", options.wavelength);
  }
  if (options.twoThetaMin !== undefined) {
    params.set("twoThetaMin", String(options.twoThetaMin));
  }
  if (options.twoThetaMax !== undefined) {
    params.set("twoThetaMax", String(options.twoThetaMax));
  }
  const query = params.toString();
  const endpoint = query ? `/api/pxrd?${query}` : "/api/pxrd";

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": file.type || "application/octet-stream",
        "x-pretty-crystal-filename": encodeURIComponent(file.name),
      },
      body: file,
    });
  } catch {
    throw new PxrdRequestError("The PXRD pattern could not be computed.");
  }

  if (!response.ok) {
    throw new PxrdRequestError(await readPxrdError(response));
  }

  return (await response.json()) as PxrdPattern;
}

async function readPxrdError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      detail?: string | { message?: string };
    };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (payload.detail?.message) {
      return payload.detail.message;
    }
  } catch {
    // Fall through to the status-based message.
  }

  return `PXRD computation failed with status ${response.status}.`;
}
