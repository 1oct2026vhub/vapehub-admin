// import crypto from "crypto";

// const SECRET_KEY = process.env.COOKIE_SECRET || "your-secret-key"; // Store in .env
// const ALGORITHM = "aes-256-cbc";
// const IV_LENGTH = 16; // AES block size

// export const encryptToken = (token: string): string => {
//   const iv = crypto.randomBytes(IV_LENGTH);
//   const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, "hex"), iv);
//   let encrypted = cipher.update(token, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return iv.toString("hex") + ":" + encrypted;
// };

// export const decryptToken = (encryptedToken: string): string => {
//   const [ivHex, encrypted] = encryptedToken.split(":");
//   const iv = Buffer.from(ivHex, "hex");
//   const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, "hex"), iv);
//   let decrypted = decipher.update(encrypted, "hex", "utf8");
//   decrypted += decipher.final("utf8");
//   return decrypted;
// };

import { setCookie, getCookie, deleteCookie } from "cookies-next";
import CryptoJS from "crypto-js";
import { redirect } from "next/navigation"; // Use redirect for App Router

// Secret key for encryption (store this securely, e.g., in .env)
const SECRET_KEY =
  process.env.NEXT_PUBLIC_CRYPTO_SECRET || "default_secret_key";

/**
 * Encrypts the token before storing it in cookies
 */
export const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

/**
 * Decrypts the token from cookies
 */
export const decryptToken = (
  encryptedToken: string | undefined,
): string | null => {
  if (!encryptedToken) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Token decryption failed:", error);
    return null;
  }
};

/**
 * Stores the encrypted token in cookies
 */
export const storeAuthToken = (token: string) => {
  const encryptedToken = encryptToken(token);
  setCookie("auth_token", encryptedToken, {
    httpOnly: false, // Set to `true` if handling from server-side
    secure: process.env.NODE_ENV === "production",
    // sameSite: "Strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
};

/**
 * Retrieves the decrypted token from cookies
 */
export const getAuthToken = (): string | null => {
  const encryptedToken = getCookie("auth_token");
  return decryptToken(encryptedToken as string);
};

/**
 * Stores the user info object in cookies
 */
export const storeUser = (user: object) => {
  const encryptedUser = encryptToken(JSON.stringify(user));
  setCookie("user_info", encryptedUser, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
};

/**
 * Retrieves the user info from cookies
 */
export const getUser = (): any | null => {
  const encryptedUser = getCookie("user_info");
  const decryptedUser = decryptToken(encryptedUser as string);
  if (decryptedUser) {
    try {
      return JSON.parse(decryptedUser);
    } catch (error) {
      console.error("Failed to parse user info:", error);
      return null;
    }
  }
  return null;
};

/**
 * Clears all page state from sessionStorage (used for filter state)
 */
export const clearAllPageState = () => {
  if (typeof window === "undefined") return;
  
  try {
    // Clear all sessionStorage items that match the usePageState pattern
    // Pattern: ${pathname}:${storageKey}
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes(":")) {
        // All usePageState keys contain a colon separator
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing page state:", error);
  }
};

/**
 * Removes the auth token (for logout)
 */
export const logoutUser = () => {
  deleteCookie("auth_token", { path: "/" });
  deleteCookie("user_info", { path: "/" });
  
  // Clear all page state (filters, etc.) from sessionStorage
  clearAllPageState();
  
  // Use window.location for client-side redirect to avoid Next.js redirect issues
  if (typeof window !== "undefined") {
    window.location.href = "/sign-in";
  }
};
