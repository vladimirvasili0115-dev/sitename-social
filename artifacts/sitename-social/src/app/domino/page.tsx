import type { Metadata } from "next";
import { DominoGame } from "@/components/domino/DominoGame";

export const metadata: Metadata = { title: "Domino — Ravetill" };

export default function DominoPage() {
  return <DominoGame />;
}
