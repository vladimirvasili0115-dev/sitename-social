"use client";
import { HomeSideCards } from "./HomeSideCards";

// Right column of the home page (computer only): the week's race, the activity bonus and a short invitation.
// The online / registered numbers now stand in the live strip under the banner (NeonHome).
export function SiteStats() {
  return <aside className="hidden w-[260px] shrink-0 xl:block">
    <div className="sticky top-[96px]"><HomeSideCards /></div>
  </aside>;
}
