class RealWebhookEngine {
  private static instance: RealWebhookEngine;

  static getInstance(): RealWebhookEngine {
    if (!RealWebhookEngine.instance) {
      RealWebhookEngine.instance = new RealWebhookEngine();
    }
    return RealWebhookEngine.instance;
  }

  async triggerThreatDetectedWebhook(tenantId: string, threatData: any) {
    console.log(
      `Triggering threat detected webhook for ${tenantId}:`,
      threatData,
    );
  }

  async triggerWebhook(tenantId: string, eventType: string, payload: any) {
    console.log(`Triggering webhook ${eventType} for ${tenantId}:`, payload);
  }
}

export const realWebhookEngine = RealWebhookEngine.getInstance();
