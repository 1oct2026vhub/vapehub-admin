/**
 * Backend converts base64 images in type_cards_html to S3 as:
 *   categories/type-cards/inline.{ext}
 * (extension only — same mime ⇒ same key ⇒ cards overwrite each other.)
 *
 * Encode each card to a distinct mime so keys stay unique:
 *   teal→png, orange→jpeg, green→webp, purple→bmp
 */

const SLOT_MIME: Record<string, string> = {
  teal: "image/png",
  orange: "image/jpeg",
  green: "image/webp",
  purple: "image/bmp",
};

const INDEX_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
] as const;

export function mimeForTypeCardSlot(slot: string, index = 0): string {
  const key = (slot || "").toLowerCase();
  if (SLOT_MIME[key]) return SLOT_MIME[key];
  const cardMatch = key.match(/^card-(\d+)$/);
  if (cardMatch) {
    return INDEX_MIME[Number(cardMatch[1]) % INDEX_MIME.length];
  }
  return INDEX_MIME[Math.abs(index) % INDEX_MIME.length];
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Uncompressed 24-bit BMP (top-down) — used as 4th unique S3 extension. */
function imageDataToBmpDataUrl(imageData: ImageData): string {
  const { width, height, data } = imageData;
  const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const fileSize = 54 + pixelBytes;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);

  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]);
      view.setUint8(offset++, data[i + 1]);
      view.setUint8(offset++, data[i]);
    }
    offset += rowSize - width * 3;
  }

  return `data:image/bmp;base64,${arrayBufferToBase64(buf)}`;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode type-card image"));
    img.src = src;
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image blob"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read error"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Re-encode an image so its data-URI mime matches the card slot.
 * Optional `;name=type-card-{slot}.{ext}` hint for backends that honor it.
 */
export async function encodeTypeCardImageDataUrl(
  source: Blob | string,
  slot: string,
  index = 0
): Promise<string> {
  const mime = mimeForTypeCardSlot(slot, index);
  const ext = mime.split("/")[1] || "png";
  const nameHint = `type-card-${slot || index}.${ext}`;

  const sourceUrl =
    typeof source === "string" ? source : await readBlobAsDataUrl(source);
  const img = await loadImageElement(sourceUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for type-card image encode");
  ctx.drawImage(img, 0, 0);

  if (mime === "image/bmp") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bmpUrl = imageDataToBmpDataUrl(imageData);
    return bmpUrl.replace(
      /^data:image\/bmp;base64,/,
      `data:image/bmp;name=${nameHint};base64,`
    );
  }

  const quality = mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined;
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });

  if (!blob) {
    // Fallback if webp unsupported
    const fallback =
      mime === "image/webp"
        ? await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/png");
          })
        : null;
    if (!fallback) throw new Error(`Failed to encode type-card image as ${mime}`);
    const dataUrl = await readBlobAsDataUrl(fallback);
    return dataUrl.replace(
      /^data:image\/png;base64,/,
      `data:image/png;name=${nameHint};base64,`
    );
  }

  const dataUrl = await readBlobAsDataUrl(blob);
  return dataUrl.replace(
    new RegExp(`^data:${mime.replace("/", "\\/")};base64,`),
    `data:${mime};name=${nameHint};base64,`
  );
}

/**
 * Before save: re-encode every base64 <img> inside type cards to a unique mime
 * so the API does not map multiple cards onto the same inline.{ext} S3 object.
 */
export async function prepareTypeCardsHtmlForSave(html: string): Promise<string> {
  if (!html || !html.includes("data:image")) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const cards = Array.from(doc.querySelectorAll(".type-card"));
  const imgs = Array.from(
    doc.querySelectorAll(
      ".type-card img, .type-cards img, img[data-type-card-img]"
    )
  ) as HTMLImageElement[];

  await Promise.all(
    imgs.map(async (img, index) => {
      const src = img.getAttribute("src") || "";
      if (!src.startsWith("data:image")) return;

      const article = img.closest(".type-card");
      let slot =
        img.getAttribute("data-type-card-img") ||
        img.className.match(/type-card__img--([a-z0-9_-]+)/i)?.[1] ||
        "";
      if (!slot && article) {
        slot =
          article.className.match(/type-card--([a-z0-9_-]+)/i)?.[1] ||
          `card-${Math.max(0, cards.indexOf(article))}`;
      }
      if (!slot) slot = `card-${index}`;

      try {
        const encoded = await encodeTypeCardImageDataUrl(src, slot, index);
        img.setAttribute("src", encoded);
        img.setAttribute("data-type-card-img", slot);
        if (!img.className.includes("type-card__img")) {
          img.classList.add("type-card__img", `type-card__img--${slot}`);
        }
      } catch (err) {
        console.warn("Type-card image encode skipped:", slot, err);
      }
    })
  );

  const head = doc.head?.innerHTML ?? "";
  const body = doc.body?.innerHTML ?? "";
  // Preserve <style> that DOMParser may move into <head>
  if (head.includes("data-type-cards-css") || head.includes("<style")) {
    return `${head}${body}`.trim();
  }
  return body.trim() || html;
}
