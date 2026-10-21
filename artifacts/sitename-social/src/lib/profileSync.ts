import type { ProfileEdits } from "@/types";
import { readProfileEdits, writeProfileEdits } from "./profile";
import { isDataUrl, uploadImage } from "./media";
import { addPhotoRow, resetRemotePhotos } from "./photosSync";
import { createAvatarPost, resetRemotePosts } from "./postsSync";
import { resetRemoteFriends } from "./friendsSync";
import { resetRemoteMessages } from "./messagesSync";
import { resetRemoteNotices } from "./notificationsSync";
import { resetRemoteGroups } from "./groupsSync";
import { resetRemoteStories } from "./storiesSync";
import { resetRemoteGifts } from "./giftsSync";
import { supabase } from "./supabase";

const UID_KEY = "sitename-uid";
const columns = ["name", "status", "bio", "city", "birthday", "relationship", "work", "education", "gender"] as const;

// Local demo data belongs to one account: wipe it when a different user signs in on this browser.
function resetLocalDataFor(userId: string) {
  if (window.localStorage.getItem(UID_KEY) === userId) return;
  Object.keys(window.localStorage).filter((item) => item.startsWith("sitename-") && item !== "sitename-locale").forEach((item) => window.localStorage.removeItem(item));
  window.localStorage.setItem(UID_KEY, userId);
  resetRemotePosts();
  resetRemotePhotos();
  resetRemoteFriends();
  resetRemoteMessages();
  resetRemoteNotices();
  resetRemoteGroups();
  resetRemoteStories();
  resetRemoteGifts();
}

export async function loadProfile(userId: string) {
  if (!supabase) return;
  resetLocalDataFor(userId);
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return;
  writeProfileEdits({
    avatar: data.avatar_url ?? undefined, cover: data.cover_url ?? undefined,
    name: data.name, handle: data.handle, gender: data.gender ?? undefined, birthday: data.birthday ?? "", city: data.city ?? "",
    status: data.status ?? "", bio: data.bio ?? "", work: data.work ?? "", education: data.education ?? "", relationship: data.relationship ?? "single",
    joined: String(data.created_at).slice(0, 10), languages: [], interests: [], followers: 0,
    regGender: data.reg_gender ?? undefined, nameChanges: data.name_changes ?? 0, nameChangedAt: data.name_changed_at ?? undefined,
  });
}

export async function saveProfile(patch: ProfileEdits) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  const changes: Record<string, unknown> = Object.fromEntries(columns.filter((column) => patch[column] !== undefined).map((column) => [column, patch[column] === "" && column === "birthday" ? null : patch[column]]));
  // Photos are uploaded to storage; the profile then points at the public URL instead of the local copy.
  if (isDataUrl(patch.avatar)) changes.avatar_url = await uploadImage(patch.avatar, "avatars");
  // A photo that is already uploaded (picked from your photos) becomes the profile picture as it is.
  const pickedAvatar = typeof patch.avatar === "string" && /^https?:\/\//.test(patch.avatar) ? patch.avatar : null;
  if (pickedAvatar) changes.avatar_url = pickedAvatar;
  if (isDataUrl(patch.cover)) changes.cover_url = await uploadImage(patch.cover, "covers");
  if (changes.avatar_url || changes.cover_url) {
    writeProfileEdits({ ...readProfileEdits(), ...(changes.avatar_url ? { avatar: String(changes.avatar_url) } : {}), ...(changes.cover_url ? { cover: String(changes.cover_url) } : {}) });
  }
  if (changes.avatar_url && !pickedAvatar) {
    void addPhotoRow(String(changes.avatar_url), "profile");
    void createAvatarPost(String(changes.avatar_url));
  }
  Object.keys(changes).forEach((column) => { if (changes[column] === null && column.endsWith("_url")) delete changes[column]; });
  if (!userId || !Object.keys(changes).length) return;
  await supabase.from("profiles").update(changes).eq("id", userId);
}
