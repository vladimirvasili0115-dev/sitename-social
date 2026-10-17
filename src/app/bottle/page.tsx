"use client";
import { useRouter } from "next/navigation";
import { GameWindow } from "@/components/bottle/GameWindow";

// Direct link to the game: opens it full screen; closing returns to the games list.
export default function BottlePage() {
  const router = useRouter();
  return <GameWindow startFull onClose={() => router.push("/games")} />;
}
