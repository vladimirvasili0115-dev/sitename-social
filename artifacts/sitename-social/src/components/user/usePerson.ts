"use client";
import { useEffect, useState } from "react";
import { people } from "@/data/friends";
import { fetchPerson, isRemoteId, type RemotePerson } from "@/lib/remoteProfiles";

// Resolves a profile id to either a sample person or a real account from the database.
export function usePerson(id: string) {
  const sample = people.find((item) => item.user.id === id);
  const remote = isRemoteId(id);
  const [person, setPerson] = useState<RemotePerson | null>(null);
  const [loading, setLoading] = useState(remote);
  useEffect(() => {
    if (!remote) return;
    let active = true;
    setLoading(true);
    void fetchPerson(id).then((result) => {
      if (!active) return;
      setPerson(result);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id, remote]);
  return { person: sample ? { ...sample, status: "", bio: "", cover: null } : person, loading: sample ? false : loading, remote };
}
