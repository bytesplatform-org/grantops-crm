import { connection } from "next/server";
import { getGrantNews } from "@/lib/news/sources";

// Runs per request (never prerendered at build), while each source's data is
// cached for an hour inside getGrantNews.
export async function GET() {
  await connection();
  const news = await getGrantNews();
  return Response.json(news, { status: news.sources.some((s) => s.ok) ? 200 : 502 });
}
