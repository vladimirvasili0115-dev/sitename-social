import type { ProfileEdits } from "@/types";

const STORAGE_KEY = "sitename-profile";
export const PROFILE_EVENT = "sitename-profile-change";

// Mock storage: replace with API calls when the backend exists.
export function readProfileEdits(): ProfileEdits {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileEdits) : {};
  } catch {
    return {};
  }
}

export function writeProfileEdits(edits: ProfileEdits) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  } catch {
    // Storage full or blocked: the change still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent<ProfileEdits>(PROFILE_EVENT, { detail: edits }));
}

export function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be read"));
    };
    image.src = url;
  });
}
