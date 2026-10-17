"use client";
import { useState } from "react";
import { EyeOff, Trash2 } from "lucide-react";
import { dayDiff } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useFriends } from "@/components/friends/useFriends";
import { useInvisible } from "@/components/invisible/useInvisible";
import { useGuests } from "@/components/guests/useGuests";
import { GuestRow, type GuestRelation } from "@/components/guests/GuestRow";

type GuestsTab = "visitors" | "visited";

export default function GuestsPage() {
  const { t } = useTranslation();
  const { visitors, visited, fresh, clear } = useGuests();
  const { friends, outgoingIds, actions } = useFriends();
  const [tab, setTab] = useState<GuestsTab>("visitors");
  const { hidesVisits } = useInvisible();
  const rows = tab === "visitors" ? visitors : visited;
  const relation = (id: string): GuestRelation => (friends.some((item) => item.user.id === id) ? "friend" : outgoingIds.includes(id) ? "pending" : "none");
  const stats = [
    { label: t("messages.today"), value: visitors.filter(({ visit }) => dayDiff(visit.at) === 0).length },
    { label: t("guests.week"), value: visitors.filter(({ visit }) => dayDiff(visit.at) < 7).length },
    { label: t("guests.total"), value: visitors.length },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("nav.guests")}</h1>
        {rows.length ? <Button variant="outline" className="h-10 px-3 text-xs" onClick={() => clear(tab)}><Trash2 size={14} />{t("guests.clear")}</Button> : null}
      </div>
      <dl className="mb-4 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
            <dt className="mt-0.5 truncate text-xs text-muted">{stat.label}</dt>
          </Card>
        ))}
      </dl>
      <Tabs<GuestsTab> active={tab} onChange={setTab} tabs={[{ id: "visitors", label: t("guests.tabVisitors"), count: visitors.length }, { id: "visited", label: t("guests.tabVisited"), count: visited.length }]} />
      {tab === "visited" && hidesVisits ? <p className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-muted"><EyeOff size={14} className="shrink-0 text-accent" />{t("invisible.guestsNote")}</p> : null}
      {rows.length ? (
        <Card>
          <ul className="divide-y divide-border">
            {rows.map(({ visit, person }) => (
              <li key={`${visit.userId}-${visit.at}`}><GuestRow person={person} visit={visit} isNew={tab === "visitors" && fresh.includes(visit.userId)} relation={relation(visit.userId)} onAdd={() => actions.add(visit.userId)} /></li>
            ))}
          </ul>
        </Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{t(tab === "visitors" ? "guests.empty" : "guests.emptyVisited")}</Card>}
    </div>
  );
}
