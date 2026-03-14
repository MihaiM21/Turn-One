import { NextRequest, NextResponse } from "next/server";
import {
  forceRefreshNewsDashboardData,
  getLatestNewsDashboardData,
  initializeNewsDashboardScheduler,
} from "@/lib/news-dashboard-scheduler";

export const runtime = "nodejs";

initializeNewsDashboardScheduler();

export async function GET() {
  try {
    const data = await getLatestNewsDashboardData();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[News API] Failed to fetch latest session:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch latest session data",
      },
      { status: 500 }
    );
  }
}

function extractToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return header.trim();
}

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = extractToken(request);
  if (!token) return false;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend.t1f1.com/api";

  try {
    const response = await fetch(`${backendUrl}/admin/check`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { isAdmin?: boolean };
    return data.isAdmin === true;
  } catch (error) {
    console.error("[News API] Admin validation failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const admin = await isAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await forceRefreshNewsDashboardData();
    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[News API] Forced refresh failed:", error);
    return NextResponse.json({ error: "Failed to refresh news session data" }, { status: 500 });
  }
}
