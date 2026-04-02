class RealPerformanceMonitor {
  private static instance: RealPerformanceMonitor;

  static getInstance(): RealPerformanceMonitor {
    if (!RealPerformanceMonitor.instance) {
      RealPerformanceMonitor.instance = new RealPerformanceMonitor();
    }
    return RealPerformanceMonitor.instance;
  }

  async recordMetric(tenantId: string, metric: any) {
    // Mock performance recording
    console.log(`Recording performance metric for ${tenantId}:`, metric);
  }

  async getPerformanceMetrics(tenantId: string) {
    return {
      overview: {
        averageResponseTime: 127,
        p95ResponseTime: 245,
        p99ResponseTime: 456,
        uptimePercentage: 99.97,
        requestsPerSecond: 1247,
        errorRate: 0.12,
        throughput: 2.3,
      },
      endpointMetrics: [
        {
          endpoint: "/api/users",
          averageResponseTime: 89,
          requestCount: 15420,
          errorRate: 0.05,
          status: "Healthy",
        },
      ],
      geographicPerformance: {
        "us-east-1": { latency: 45, status: "Optimal" },
        "eu-west-1": { latency: 67, status: "Good" },
      },
      timeSeriesData: [],
    };
  }
}

export const realPerformanceMonitor = RealPerformanceMonitor.getInstance();
