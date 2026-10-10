"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Story } from "@/types";
import { stories } from "@/data/stories";
import { resizeImage } from "@/lib/profile";
import { storiesStore } from "@/lib/stores";
import { addRemoteStory, ensureStoriesLoaded, remoteStories, removeRemoteStory } from "@/lib/storiesSync";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";

const DAY = 86_400_000;
const online = Boolean(supabase);

// Which stories were already viewed stays on this device; the stories themselves come from the database.
export function useStories() {
  const [state, update] = useStore(storiesStore);
  const remote = useSyncExternalStore(remoteStories.subscribe, remoteStories.get, remoteStories.getServer);
  const { user } = useProfile();
  const accountId = useAuth().user?.id;
  useEffect(() => ensureStoriesLoaded(accountId), [accountId]);
  return useMemo(() => {
    const markSeen = (id: string) => update((current) => (current.seen.includes(id) ? current : { ...current, seen: [...current.seen, id] }));
    if (online) {
      return {
        stories: remote.map((story): Story => (story.mine ? { ...story, user, seen: true } : { ...story, seen: state.seen.includes(story.id) })),
        add: async (file: File) => addRemoteStory(await resizeImage(file, 900)),
        markSeen,
        removeSlide: (id: string) => void removeRemoteStory(id),
      };
    }
    const fresh = state.mine.filter((slide) => Date.now() - slide.at < DAY);
    const own: Story[] = fresh.length ? [{ id: "story-me", user, slides: fresh, mine: true, seen: true }] : [];
    return {
      stories: [...own, ...stories.map((story) => ({ ...story, seen: story.seen || state.seen.includes(story.id) }))],
      add: async (file: File) => {
        const image = await resizeImage(file, 900);
        update((current) => ({ ...current, mine: [...current.mine, { id: `my-s-${Date.now()}`, image, at: Date.now() }] }));
      },
      markSeen,
      removeSlide: (id: string) => update((current) => ({ ...current, mine: current.mine.filter((slide) => slide.id !== id) })),
    };
  }, [state, remote, user, update]);
}
