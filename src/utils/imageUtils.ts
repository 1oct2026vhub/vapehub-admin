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
        messageParts.push(`Width must be ${exactWidth}px`);
      }
      if (exactHeight && img.height !== exactHeight) {
        isValid = false;
        messageParts.push(`Height must be ${exactHeight}px`);
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

/**
 * Validates that an image is square (width === height) and meets minimum dimension requirements.
 *
 * @param file The image File object to validate.
 * @param minDimension Optional. The minimum width and height the square image must be (default: 200px).
 * @returns A promise that resolves to an object containing:
 *  - `valid` (boolean): True if image is square and meets minimum dimensions, false otherwise.
 *  - `message` (string|undefined): An error message if validation fails.
 *  - `dimensions` (object|undefined): The actual dimensions { width, height } of the image if loaded.
 */
export const validateSquareImage = (
  file: File,
  minDimension: number = 200
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File) || !file.type.startsWith("image/")) {
      resolve({ valid: false, message: "Invalid image file." });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width, height } = img;
      
      // First check if image is square
      if (width !== height) {
        resolve({
          valid: false,
          message: `Image must be square (width and height must be equal). Current dimensions: ${width} × ${height} px.`,
          dimensions: { width, height }
        });
        return;
      }
      
      // Then check minimum dimension
      if (width < minDimension || height < minDimension) {
        resolve({
          valid: false,
          message: `Image dimensions must be at least ${minDimension} × ${minDimension} px. Current dimensions: ${width} × ${height} px.`,
          dimensions: { width, height }
        });
        return;
      }
      
      resolve({ 
        valid: true, 
        dimensions: { width, height } 
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, message: "Could not load image to validate dimensions." });
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates image dimensions to allow both square and rectangle images within maximum bounds.
 * For rectangle images: width <= maxWidth AND height <= maxHeight
 * For square images: both dimensions must be within the bounds (width <= maxWidth AND height <= maxHeight)
 *
 * @param file The image File object to validate.
 * @param maxWidth The maximum allowed width in pixels.
 * @param maxHeight The maximum allowed height in pixels.
 * @returns A promise that resolves to an object containing:
 *  - `valid` (boolean): True if dimensions are within bounds, false otherwise.
 *  - `message` (string|undefined): An error message if validation fails.
 *  - `dimensions` (object|undefined): The actual dimensions { width, height } of the image if loaded.
 */
export const validateImageDimensionsWithinBounds = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File) || !file.type.startsWith("image/")) {
      // Not an image file or no file, so dimension validation doesn't strictly apply here.
      // Other validations (e.g., required, file type) should handle these cases.
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width, height } = img;
      
      // Check if dimensions are within bounds
      // Both width and height must be within the maximum bounds
      // This allows both square and rectangle images
      if (width > maxWidth || height > maxHeight) {
        const isSquare = width === height;
        const imageType = isSquare ? 'square' : 'rectangle';
        resolve({
          valid: false,
          message: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image dimensions must be within ${maxWidth} × ${maxHeight} px. Current dimensions: ${width} × ${height} px.`,
          dimensions: { width, height }
        });
        return;
      }
      
      resolve({ 
        valid: true, 
        dimensions: { width, height } 
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, message: "Could not load image to validate dimensions." });
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates desktop banner image dimensions with specific rules:
 * - Square images: dimensions must be between 450x450 and 700x700 (inclusive, same dimensions)
 * - Rectangle images: dimensions must be exactly 1920x700
 *
 * @param file The image File object to validate.
 * @returns A promise that resolves to an object containing:
 *  - `valid` (boolean): True if dimensions are valid, false otherwise.
 *  - `message` (string|undefined): An error message if validation fails.
 *  - `dimensions` (object|undefined): The actual dimensions { width, height } of the image if loaded.
 */
export const validateDesktopBannerImage = (
  file: File
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File) || !file.type.startsWith("image/")) {
      resolve({ valid: false, message: "Invalid image file." });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width, height } = img;
      const isSquare = width === height;
      
      if (isSquare) {
        // Square images: dimensions must be between 450x450 and 700x700 (inclusive)
        if (width < 450 || width > 700 || height < 450 || height > 700) {
          resolve({
            valid: false,
            message: `Square image dimensions must be between 450 × 450 and 700 × 700 px (same dimensions). Current dimensions: ${width} × ${height} px.`,
            dimensions: { width, height }
          });
          return;
        }
      } else {
        // Rectangle images: dimensions must be exactly 1920x700
        if (width !== 1920 || height !== 700) {
          resolve({
            valid: false,
            message: `Rectangle image dimensions must be exactly 1920 × 700 px. Current dimensions: ${width} × ${height} px.`,
            dimensions: { width, height }
          });
          return;
        }
      }
      
      resolve({ 
        valid: true, 
        dimensions: { width, height } 
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, message: "Could not load image to validate dimensions." });
    };
    img.src = URL.createObjectURL(file);
  });
}; 