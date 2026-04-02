import { EmailService } from './email'

export interface NotificationOptions {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  userId?: string
  metadata?: Record<string, unknown>
}

export class NotificationService {
  /**
   * Send in-app notification (could be extended to store in DB)
   * For now, just logs and returns the notification object
   */
  static async sendInApp(options: NotificationOptions) {
    console.log('📬 In-app notification:', options.title)
    
    // In production, this would:
    // 1. Store in database notifications table
    // 2. Trigger WebSocket event to connected clients
    // 3. Update user's notification count
    
    return {
      id: Date.now().toString(),
      ...options,
      timestamp: new Date(),
      read: false
    }
  }

  /**
   * Send notification via email
   */
  static async sendEmail(to: string, subject: string, html: string) {
    return EmailService.send({ to, subject, html })
  }

  /**
   * Notify user of scan completion
   */
  static async notifyScanComplete(
    userId: string, 
    userEmail: string,
    scanId: string,
    findings: { critical: number; high: number; medium: number; low: number }
  ) {
    // In-app notification
    await this.sendInApp({
      type: findings.critical > 0 ? 'error' : findings.high > 0 ? 'warning' : 'success',
      title: 'Security Scan Complete',
      message: `Found ${findings.critical} critical, ${findings.high} high, ${findings.medium} medium, and ${findings.low} low severity issues.`,
      userId,
      metadata: { scanId, findings }
    })

    // Email notification for critical findings
    if (findings.critical > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
      
      await this.sendEmail(
        userEmail,
        `⚠️ Critical Security Issues Found`,
        `
          <h2>Critical Security Issues Detected</h2>
          <p>Your recent security scan identified <strong>${findings.critical} critical</strong> vulnerabilities that require immediate attention.</p>
          <p><a href="${baseUrl}/dashboard/security?scan=${scanId}">View Full Report →</a></p>
        `
      )
    }
  }

  /**
   * Notify user of payment failure (called from webhook)
   */
  static async notifyPaymentFailed(userEmail: string, userName: string, invoiceUrl?: string) {
    // In-app notification
    await this.sendInApp({
      type: 'error',
      title: 'Payment Failed',
      message: 'We were unable to process your payment. Please update your payment method.',
      metadata: { invoiceUrl }
    })

    // Email notification
    await EmailService.sendPaymentFailed(userEmail, userName, invoiceUrl)
  }

  /**
   * Notify user when trial is expiring
   */
  static async notifyTrialExpiring(userEmail: string, userName: string, daysRemaining: number) {
    // In-app notification
    await this.sendInApp({
      type: 'warning',
      title: 'Trial Expiring Soon',
      message: `Your trial expires in ${daysRemaining} days. Upgrade to continue service.`,
      metadata: { daysRemaining }
    })

    // Email notification
    await EmailService.sendTrialExpiring(userEmail, userName, daysRemaining)
  }

  /**
   * Send welcome notification to new users
   */
  static async notifyWelcome(userEmail: string, userName: string) {
    // In-app notification
    await this.sendInApp({
      type: 'success',
      title: 'Welcome to GovernAPI!',
      message: 'Get started by generating your first API key.',
      metadata: { isWelcome: true }
    })

    // Email notification
    await EmailService.sendWelcome(userEmail, userName)
  }
}
