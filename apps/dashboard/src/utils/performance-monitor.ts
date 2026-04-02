import { database } from "../infrastructure/database";
import { logger } from "./logging/logger";

interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: Date;
  tenantId?: string;
}

export class PerformanceMonitor {
  private static slowQueries: QueryPerformance[] = [];
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    tenantId?: string,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (duration > this.SLOW_QUERY_THRESHOLD) {
        this.logSlowQuery(queryName, duration, tenantId);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Query failed", {
        queryName,
        duration,
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private static logSlowQuery(
    query: string,
    duration: number,
    tenantId?: string,
  ): void {
    const queryPerf: QueryPerformance = {
      query,
      duration,
      timestamp: new Date(),
      tenantId,
    };

    this.slowQueries.push(queryPerf);

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    logger.warn("Slow query detected", {
      query,
      duration: `${duration}ms`,
      tenantId,
    });
  }

  static getSlowQueries(): QueryPerformance[] {
    return [...this.slowQueries];
  }

  static async getDatabaseStats(): Promise<{
    activeConnections: number;
    slowQueries: number;
    avgQueryTime: number;
  }> {
    try {
      const stats = await database.queryOne(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) as slow_queries,
          (SELECT avg(mean_exec_time) FROM pg_stat_statements) as avg_query_time
      `);

      return {
        activeConnections: parseInt(stats?.active_connections || "0"),
        slowQueries: parseInt(stats?.slow_queries || "0"),
        avgQueryTime: parseFloat(stats?.avg_query_time || "0"),
      };
    } catch {
      return {
        activeConnections: 0,
        slowQueries: this.slowQueries.length,
        avgQueryTime: 0,
      };
    }
  }
}
