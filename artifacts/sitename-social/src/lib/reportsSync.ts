import type { Person } from "@/types";
import { removeFiles } from "./media";
import { isRemoteId } from "./remoteProfiles";
import { supabase } from "./supabase";
import { fetchUsers } from "./usersCache";

export type ReportTarget = { type: "post" | "comment" | "video" | "user"; id: string };
export type ReportReason = "spam" | "abuse" | "adult" | "fraud" | "other";
export type ReportAction = "dismiss" | "delete" | "ban";
export type Report = { id: string; type: ReportTarget["type"]; targetId: string; reason: ReportReason; note: string; snapshot: string; mediaUrl: string | null; at: number; reporter?: Person; owner?: Person; ownerId: string };
type Row = { id: string; reporter_id: string; target_type: ReportTarget["type"]; target_id: string; target_owner: string; reason: ReportReason; note: string; snapshot: string; media_url: string | null; created_at: string };
export const REPORT_EVENT = "sitename-report";

// Opens the report window from anywhere (post menu, profile menu, video).
export function openReport(target: ReportTarget) {
  window.dispatchEvent(new CustomEvent<ReportTarget>(REPORT_EVENT, { detail: target }));
}

export async function sendReport(target: ReportTarget, reason: ReportReason, note: string): Promise<"ok" | "duplicate" | "failed"> {
  // Sample content (no database) has nothing to store: the report is simply acknowledged.
  if (!supabase || !isRemoteId(target.id)) return "ok";
  const { error } = await supabase.from("reports").insert({ target_type: target.type, target_id: target.id, reason, note: note.slice(0, 500) });
  if (!error) return "ok";
  if (error.code === "23505") return "duplicate";
  console.error("Report could not be sent:", error.message);
  return "failed";
}

let adminFor: string | null = null;
let adminValue = false;
export async function fetchIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!supabase || !userId) return false;
  if (adminFor === userId) return adminValue;
  const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) return false;
  adminFor = userId;
  adminValue = Boolean(data);
  return adminValue;
}

export async function fetchReports(): Promise<Report[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("reports").select("id,reporter_id,target_type,target_id,target_owner,reason,note,snapshot,media_url,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(200);
  if (error) {
    console.error("Reports could not be loaded:", error.message);
    return null;
  }
  const rows = data as Row[];
  const users = await fetchUsers(rows.flatMap((row) => [row.reporter_id, row.target_owner]));
  return rows.map((row) => ({
    id: row.id, type: row.target_type, targetId: row.target_id, reason: row.reason, note: row.note, snapshot: row.snapshot, mediaUrl: row.media_url,
    at: Date.parse(row.created_at), reporter: users.get(row.reporter_id), owner: users.get(row.target_owner), ownerId: row.target_owner,
  }));
}

export async function resolveReport(report: Report, action: ReportAction): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc("admin_resolve", { report: report.id, action });
  if (error) {
    console.error("Report could not be resolved:", error.message);
    return false;
  }
  if (action === "delete") await removeFiles([report.mediaUrl]);
  return true;
}
