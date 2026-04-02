import { NextRequest, NextResponse } from "next/server";
import { cache } from "../utils/cache-manager";

export async function withCache<T>(
  request: NextRequest,
  cacheKey: string,
  dataFetcher: () => Promise<T>,
  ttl: number = 300,
): Promise<NextResponse> {
  try {
    // Try to get from cache first
    const cachedData = await cache.get<T>(cacheKey);

    if (cachedData) {
      const response = NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString(),
      });

      response.headers.set("X-Cache", "HIT");
      response.headers.set("Cache-Control", `public, max-age=${ttl}`);
      return response;
    }

    // Fetch fresh data
    const freshData = await dataFetcher();

    // Cache the result
    await cache.set(cacheKey, freshData, { ttl });

    const response = NextResponse.json({
      success: true,
      data: freshData,
      cached: false,
      timestamp: new Date().toISOString(),
    });

    response.headers.set("X-Cache", "MISS");
    response.headers.set("Cache-Control", `public, max-age=${ttl}`);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Cache operation failed",
      },
      { status: 500 },
    );
  }
}

export function generateCacheKey(
  tenantId: string,
  endpoint: string,
  params?: Record<string, any>,
): string {
  const paramString = params ? JSON.stringify(params) : "";
  return `${tenantId}:${endpoint}:${paramString}`;
}
