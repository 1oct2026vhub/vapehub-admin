import { Area } from "react-easy-crop";

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 400,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create cropped image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92,
    );
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  outputSize = 400,
): Promise<File> {
  const mimeType = fileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  const blob = await getCroppedImageBlob(
    imageSrc,
    pixelCrop,
    outputSize,
    mimeType,
  );
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${baseName}-cropped.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
