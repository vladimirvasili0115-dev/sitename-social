import { CircleAlert } from "lucide-react";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p role="alert" className="flex items-start gap-2 rounded-xl border border-danger bg-surface-2 p-3 text-sm text-danger"><CircleAlert size={16} className="mt-0.5 shrink-0" />{message}</p>;
}
