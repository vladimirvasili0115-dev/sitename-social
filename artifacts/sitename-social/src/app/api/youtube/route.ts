import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Music search for the bottle game. The YouTube key stays on the server (Vercel env: YOUTUBE_API_KEY) and never reaches the browser.
// Quota: a search costs 100 units of the free 10 000 per day, the popular list costs 1; answers are cached to save it.
type Video = { id: string; title: string; duration: string };
const API = "https://www.googleapis.com/youtube/v3";
const clock = (iso: string) => {
  const part = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!part) return "";
  const [h, m, s] = [Number(part[1] ?? 0), Number(part[2] ?? 0), Number(part[3] ?? 0)];
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`;
};

export async function GET(request: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "nokey" }, { status: 503 });

  // Only signed-in users may spend the quota.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const token = request.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";
    const { data } = token ? await createClient(url, anon).auth.getUser(token) : { data: { user: null } };
    if (!data.user) return NextResponse.json({ error: "auth" }, { status: 401 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  try {
    let ids: string[] = [];
    if (query) {
      const found = await fetch(`${API}/search?part=id&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(query)}&key=${key}`, { next: { revalidate: 1800 } });
      if (!found.ok) return NextResponse.json({ error: "fail" }, { status: 502 });
      ids = ((await found.json()).items ?? []).map((item: { id: { videoId: string } }) => item.id.videoId);
    }
    const list = query
      ? `${API}/videos?part=snippet,contentDetails&id=${ids.join(",")}&key=${key}`
      : `${API}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=AZ&maxResults=16&key=${key}`;
    if (query && !ids.length) return NextResponse.json({ videos: [] });
    const details = await fetch(list, { next: { revalidate: query ? 1800 : 3600 } });
    if (!details.ok) return NextResponse.json({ error: "fail" }, { status: 502 });
    const videos: Video[] = ((await details.json()).items ?? []).map((item: { id: string; snippet: { title: string }; contentDetails: { duration: string } }) => ({ id: item.id, title: item.snippet.title, duration: clock(item.contentDetails.duration) }));
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ error: "fail" }, { status: 502 });
  }
}
