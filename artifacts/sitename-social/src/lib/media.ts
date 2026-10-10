import { supabase } from "./supabase";

const BUCKET = "media";

// Uploads a resized image (data URL) into the signed-in user's folder and returns its public URL.
export async function uploadImage(dataUrl: string, folder: "posts" | "avatars" | "covers" | "photos" | "messages" | "stories" | "videos"): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) {
    console.error("Image could not be uploaded:", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Uploads any file (voice message, video, music) into the signed-in user's folder.
export async function uploadBlob(blob: Blob, folder: "voice" | "videos" | "music", extension: string): Promise<string | null> {
  if (!supabase) return null;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return null;
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "application/octet-stream", cacheControl: "31536000" });
  if (error) {
    console.error("File could not be uploaded:", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Deletes uploaded files by their public URLs (only the owner's files can be removed).
export async function removeFiles(urls: (string | null | undefined)[]) {
  if (!supabase) return;
  const marker = `/object/public/${BUCKET}/`;
  const paths = urls.flatMap((url) => (url?.includes(marker) ? [decodeURIComponent(url.slice(url.indexOf(marker) + marker.length))] : []));
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

// Removes everything the signed-in user has uploaded. Used when the account is deleted.
export async function removeAllMyFiles() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return;
  const bucket = supabase.storage.from(BUCKET);
  const { data: folders } = await bucket.list(userId, { limit: 100 });
  for (const folder of folders ?? []) {
    for (let round = 0; round < 20; round += 1) {
      const { data: files } = await bucket.list(`${userId}/${folder.name}`, { limit: 1000 });
      if (!files?.length) break;
      const { error } = await bucket.remove(files.map((file) => `${userId}/${folder.name}/${file.name}`));
      if (error || files.length < 1000) break;
    }
  }
}

export const isDataUrl = (value?: string | null): value is string => Boolean(value?.startsWith("data:"));
