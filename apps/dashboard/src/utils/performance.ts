interface RequestMetrics {
  startTime: number;
  endpoint: string;
  method: string;
  tenantId?: string;
}

const activeRequests = new Map<string, RequestMetrics>();

export function startRequestTimer(
  requestId: string,
  endpoint: string,
  method: string,
  tenantId?: string,
) {
  activeRequests.set(requestId, {
    startTime: Date.now(),
    endpoint,
    method,
    tenantId,
  });
}

export function endRequestTimer(requestId: string, statusCode: number) {
  const metrics = activeRequests.get(requestId);
  if (!metrics) return;

  const duration = Date.now() - metrics.startTime;
  activeRequests.delete(requestId);

  // Log slow requests
  if (duration > 5000) {
    console.warn(
      `Slow request: ${metrics.method} ${metrics.endpoint} took ${duration}ms`,
    );
  }

  return { duration, ...metrics, statusCode };
}
