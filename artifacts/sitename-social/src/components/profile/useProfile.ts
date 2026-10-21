"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileDetails, ProfileEdits, User } from "@/types";
import { currentUser } from "@/data/users";
import { profileDetails } from "@/data/profile";
import { PROFILE_EVENT, readProfileEdits, writeProfileEdits } from "@/lib/profile";
import { saveProfile } from "@/lib/profileSync";
import { initialsAvatar } from "@/lib/avatar";
import { supabase } from "@/lib/supabase";

export function useProfile() {
  const [edits, setEdits] = useState<ProfileEdits>({});
  useEffect(() => {
    setEdits(readProfileEdits());
    const onChange = (event: Event) => setEdits((event as CustomEvent<ProfileEdits>).detail);
    window.addEventListener(PROFILE_EVENT, onChange);
    return () => window.removeEventListener(PROFILE_EVENT, onChange);
  }, []);
  const update = useCallback((patch: ProfileEdits) => {
    writeProfileEdits({ ...readProfileEdits(), ...patch });
    void saveProfile(patch);
  }, []);
  return useMemo(() => {
    const { name, avatar, handle, ...rest } = edits;
    // With a real account, empty fields stay empty: the demo person (sample name, status, bio …) is only for the offline demo.
    const base = supabase ? { ...currentUser, name: "", handle: "", avatar: "" } : currentUser;
    const baseDetails: ProfileDetails = supabase ? { cover: "", status: "", bio: "", city: "", birthday: "", relationship: "single", work: "", education: "", languages: [], interests: [], joined: "", followers: 0 } : profileDetails;
    const user: User = { ...base, name: name || base.name, avatar: avatar || (supabase ? initialsAvatar(name || "?") : currentUser.avatar), handle: handle || base.handle };
    const details: ProfileDetails = { ...baseDetails, ...rest, cover: rest.cover || (supabase ? "" : profileDetails.cover) };
    return { user, details, update };
  }, [edits, update]);
}
