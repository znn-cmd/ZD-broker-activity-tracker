import { NextRequest, NextResponse } from "next/server";
import { runRemindersForDate } from "@/server/services/reminder-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getReportDateFromRequest(request: NextRequest): string {
  try {
    const body = request.nextUrl.searchParams.get("date");
    if (body) {
      const d = new Date(body + "T12:00:00Z");
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  } catch {
    // ignore
  }
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : cronSecret;
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportDate = getReportDateFromRequest(request);
  const result = await runRemindersForDate(reportDate);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : cronSecret;
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reportDate: string;
  try {
    const body = (await request.json().catch(() => ({}))) as { date?: string };
    if (body.date && typeof body.date === "string") {
      const d = new Date(body.date + "T12:00:00Z");
      reportDate = !Number.isNaN(d.getTime())
        ? d.toISOString().slice(0, 10)
        : new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    } else {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      reportDate = yesterday.toISOString().slice(0, 10);
    }
  } catch {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    reportDate = yesterday.toISOString().slice(0, 10);
  }

  const result = await runRemindersForDate(reportDate);
  return NextResponse.json(result);
}
