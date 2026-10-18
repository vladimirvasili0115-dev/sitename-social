"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { Card } from "@/components/ui/Card";
import { useFriends } from "@/components/friends/useFriends";
import { usePhotos } from "@/components/photos/usePhotos";
import { useGifts } from "@/components/gifts/useGifts";
import { usePosts } from "@/components/feed/usePosts";
import { useProfile } from "@/components/profile/useProfile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs, type ProfileTab } from "@/components/profile/ProfileTabs";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { ProfileFriends } from "@/components/profile/ProfileFriends";
import { ProfilePhotos } from "@/components/profile/ProfilePhotos";
import { ProfileGifts } from "@/components/profile/ProfileGifts";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, details, update } = useProfile();
  const [tab, setTab] = useState<ProfileTab>("wall");
  const [editing, setEditing] = useState(false);
  const { friends: friendList } = useFriends();
  const { photos, remove: removePhoto } = usePhotos();
  const { received: profileGifts } = useGifts();
  const profilePhotos = useMemo(() => photos.map((photo) => photo.src), [photos]);
  const friends = useMemo(() => friendList.map((item) => item.user), [friendList]);
  const { mine: posts } = usePosts();
  const stats = [
    { label: "nav.friends" as const, value: friends.length },
    { label: "saved.tabPosts" as const, value: posts.length },
    { label: "nav.photos" as const, value: profilePhotos.length },
    { label: "nav.gifts" as const, value: profileGifts.length },
  ];
  return (
    <div className="mx-auto max-w-[780px]">
      <ProfileHeader user={user} details={details} stats={stats} onUpdate={update} onEdit={() => setEditing(true)} />
      <ProfileTabs active={tab} onChange={setTab} />
      {tab === "wall" ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="md:w-[270px] md:shrink-0">
            <ProfileAbout details={details} />
            <ProfileFriends friends={friends} onSeeAll={() => setTab("friends")} />
            <ProfilePhotos photos={photos} onSeeAll={() => setTab("photos")} onDelete={(photo) => removePhoto(photo.id)} onSetAvatar={(photo) => update({ avatar: photo.src })} />
            <ProfileGifts gifts={profileGifts} onSeeAll={() => setTab("gifts")} />
          </div>
          <div className="min-w-0 flex-1">
            <PostComposer />
            {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}
          </div>
        </div>
      ) : null}
      {tab === "about" ? <ProfileAbout details={details} full /> : null}
      {tab === "friends" ? <ProfileFriends friends={friends} full /> : null}
      {tab === "photos" ? <ProfilePhotos photos={photos} full onDelete={(photo) => removePhoto(photo.id)} onSetAvatar={(photo) => update({ avatar: photo.src })} /> : null}
      {tab === "gifts" ? <ProfileGifts gifts={profileGifts} full /> : null}
      {editing ? <EditProfileModal user={user} details={details} onSave={update} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
