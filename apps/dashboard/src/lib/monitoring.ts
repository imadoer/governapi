import { supabase } from "./db/supabase";

interface HealthStatus {
  timestamp: string;
  database: "healthy" | "unhealthy" | "degraded";
  apis: "healthy" | "unhealthy" | "idle";
  scanner: "healthy" | "unhealthy" | "degraded";
  alerts: number;
}

interface Alert {
  id: number;
  component: string;
  message: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
}

export class MonitoringService {
  private static instance: MonitoringService;
  private alerts: Alert[] = [];

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async checkSystemHealth(): Promise<HealthStatus> {
    const health: HealthStatus = {
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
      apis: await this.checkAPIHealth(),
      scanner: await this.checkScannerHealth(),
      alerts: this.alerts.length,
    };

    // Store health check
    await supabase.from("system_health").insert(health);

    return health;
  }

  private async checkDatabase(): Promise<"healthy" | "unhealthy"> {
    try {
      const { error } = await supabase.from("apis").select("count(*)").single();
      return error ? "unhealthy" : "healthy";
    } catch {
      return "unhealthy";
    }
  }

  private async checkAPIHealth(): Promise<"healthy" | "idle"> {
    const { data: recentScans } = await supabase
      .from("scans")
      .select("*")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    return (recentScans?.length || 0) > 0 ? "healthy" : "idle";
  }

  private async checkScannerHealth(): Promise<"healthy" | "degraded"> {
    const { data: failedScans } = await supabase
      .from("scans")
      .select("*")
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if ((failedScans?.length || 0) > 5) {
      this.createAlert("Scanner", "High failure rate detected");
      return "degraded";
    }
    return "healthy";
  }

  private createAlert(component: string, message: string): void {
    const alert: Alert = {
      id: Date.now(),
      component,
      message,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    this.alerts.push(alert);
    this.sendWebhookAlert(alert);
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    console.log("Alert:", alert);
    // Webhook implementation here
  }

  getAlerts(): Alert[] {
    return this.alerts.filter(
      (a) => new Date(a.timestamp) > new Date(Date.now() - 24 * 3600000),
    );
  }
}
