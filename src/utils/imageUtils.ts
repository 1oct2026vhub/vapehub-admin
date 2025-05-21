/**
 * Validates the dimensions of an image file against exact width and height requirements.
 *
 * @param file The image File object to validate.
 * @param exactWidth Optional. The exact width the image must be.
 * @param exactHeight Optional. The exact height the image must be.
 * @returns A promise that resolves to an object containing:
 *  - `valid` (boolean): True if dimensions are valid or not applicable, false otherwise.
 *  - `message` (string|undefined): An error message if validation fails.
 *  - `dimensions` (object|undefined): The actual dimensions { width, height } of the image if loaded.
 */
export const validateImageDimensions = (
  file: File,
  exactWidth?: number,
  exactHeight?: number
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File) || !file.type.startsWith("image/")) {
      // Not an image file or no file, so dimension validation doesn't strictly apply here.
      // Other validations (e.g., required, file type) should handle these cases.
      resolve({ valid: true }); 
      return;
    }
    if (!exactWidth && !exactHeight) {
      // No dimension constraints provided.
      resolve({ valid: true }); 
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let isValid = true;
      let messageParts: string[] = [];
      
      if (exactWidth && img.width !== exactWidth) {
        isValid = false;
        messageParts.push(`Width must be ${exactWidth}px (is ${img.width}px)`);
      }
      if (exactHeight && img.height !== exactHeight) {
        isValid = false;
        messageParts.push(`Height must be ${exactHeight}px (is ${img.height}px)`);
      }

      if (!isValid) {
        resolve({ 
          valid: false, 
          message: messageParts.join('; ') + '.', 
          dimensions: { width: img.width, height: img.height } 
        });
      } else {
        resolve({ valid: true, dimensions: { width: img.width, height: img.height } });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      // This error means the file couldn't be loaded as an image, which might be a different issue
      // than incorrect dimensions, but it prevents dimension checking.
      resolve({ valid: false, message: "Could not load image to validate dimensions." }); 
    };
    img.src = URL.createObjectURL(file);
  });
}; 