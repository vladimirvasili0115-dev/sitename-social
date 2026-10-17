"use client";
import type { Person } from "@/types";
import { Card } from "@/components/ui/Card";
import { FriendCard, type FriendCardKind } from "./FriendCard";
import type { FriendActions } from "./useFriends";

type Props = { title?: string; people: Person[]; kind: FriendCardKind | ((person: Person) => FriendCardKind); actions: FriendActions; empty: string };

export function FriendsList({ title, people, kind, actions, empty }: Props) {
  return (
    <section className="mb-6">
      {title ? <h2 className="mb-3 px-1 text-sm font-semibold">{title}<span className="ml-2 font-normal text-muted">{people.length}</span></h2> : null}
      {people.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {people.map((person) => <li key={person.user.id}><FriendCard person={person} kind={typeof kind === "function" ? kind(person) : kind} actions={actions} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{empty}</Card>}
    </section>
  );
}
