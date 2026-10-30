import type { Metadata } from "next";
import { MafiaGame } from "@/components/mafia/MafiaGame";

export const metadata: Metadata = { title: "Mafiya — Ravetill" };

export default function MafiaPage() {
  return <MafiaGame />;
}
