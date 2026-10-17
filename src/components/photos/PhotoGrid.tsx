"use client";
import type { Photo } from "@/types";

export function PhotoGrid({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  return (
    <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
      {photos.map((photo, index) => (
        <li key={photo.id}>
          <button onClick={() => onOpen(index)} aria-label={`${index + 1} / ${photos.length}`} className="block aspect-square w-full overflow-hidden rounded-lg bg-surface-2 hover:opacity-80">
            <img src={photo.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        </li>
      ))}
    </ul>
  );
}
