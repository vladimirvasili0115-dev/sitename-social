"use client";
import { Compass, Gamepad2, Heart, Images, MessageCircle } from "lucide-react";
import { users } from "@/data/users";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";

const ring = "rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] p-[2px]";
const spots = [
  "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  "right-0 top-1/4 translate-x-1/3",
  "bottom-[8%] right-[10%]",
  "bottom-0 left-1/4 translate-y-1/3",
  "left-0 top-1/3 -translate-x-1/3",
];
const chip = "absolute flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text";

export function AuthHero() {
  const { t } = useTranslation();
  const features = [
    { icon: Images, label: t("auth.feature1") },
    { icon: MessageCircle, label: t("auth.feature2") },
    { icon: Gamepad2, label: t("auth.feature3") },
  ];
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex xl:p-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_50%),radial-gradient(circle_at_85%_80%,color-mix(in_srgb,var(--accent-2)_18%,transparent),transparent_50%)]" />
      <Logo className="relative" />
      <div aria-hidden="true" className="relative mx-auto my-10 h-[300px] w-[300px] xl:h-[340px] xl:w-[340px]">
        <span className="absolute inset-0 rounded-full border border-dashed border-border motion-safe:animate-[spin_70s_linear_infinite]" />
        <span className="absolute inset-[18%] rounded-full border border-border" />
        <span className="absolute inset-[36%] flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-bg">
          <Compass size={40} strokeWidth={2.2} />
        </span>
        {users.slice(1, 6).map((user, index) => (
          <span key={user.id} className={`absolute ${spots[index]} ${ring}`}>
            <Avatar user={user} size="lg" className="border-2 border-surface" />
          </span>
        ))}
        <span className={`${chip} right-[-8%] top-[52%]`}><Heart size={13} className="text-[var(--danger)]" />128</span>
        <span className={`${chip} left-[-4%] top-[8%]`}><MessageCircle size={13} className="text-accent-2" />24</span>
      </div>
      <div className="relative">
        <h2 className="max-w-md text-[32px] font-semibold leading-[1.15] tracking-[-0.035em]">{t("auth.heroTitle")}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">{t("auth.heroText")}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 rounded-full border border-border bg-bg px-3.5 py-2 text-xs font-medium text-text">
              <Icon size={14} className="text-accent" />{label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
