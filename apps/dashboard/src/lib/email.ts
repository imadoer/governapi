import { Resend } from 'resend'

// Initialize Resend with API key from env
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'GovernAPI <noreply@governapi.com>'

  /**
   * Send an email using Resend
   * Gracefully handles missing API key (logs warning but doesn't throw)
   */
  static async send(options: EmailOptions): Promise<boolean> {
    if (!resend) {
      console.warn('⚠️  RESEND_API_KEY not configured. Email not sent:', options.subject)
      console.warn('   Set RESEND_API_KEY in .env to enable email delivery')
      return false
    }

    try {
      const result = await resend.emails.send({
        from: options.from || this.DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html
      })

      console.log('✅ Email sent:', options.subject, 'to', options.to)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcome(to: string, userName: string) {
    const html = this.getWelcomeTemplate(userName)
    
    return this.send({
      to,
      subject: 'Welcome to GovernAPI! 🚀',
      html
    })
  }

  /**
   * Send trial expiring notification
   */
  static async sendTrialExpiring(to: string, userName: string, daysRemaining: number) {
    const html = this.getTrialExpiringTemplate(userName, daysRemaining)
    
    return this.send({
      to,
      subject: `Your GovernAPI trial expires in ${daysRemaining} days`,
      html
    })
  }

  /**
   * Send payment failed notification
   */
  static async sendPaymentFailed(to: string, userName: string, invoiceUrl?: string) {
    const html = this.getPaymentFailedTemplate(userName, invoiceUrl)
    
    return this.send({
      to,
      subject: '⚠️ GovernAPI Payment Failed - Action Required',
      html
    })
  }

  /**
   * Welcome email template
   */
  private static getWelcomeTemplate(userName: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GovernAPI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
    <!-- Header -->
    <div style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="display: inline-block; padding: 16px 24px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 12px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">GovernAPI</h1>
      </div>
      <h2 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Welcome aboard, ${userName}! 🎉</h2>
      <p style="margin: 16px 0 0; color: #94a3b8; font-size: 16px;">You're all set to secure and govern your APIs</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <p style="margin: 0 0 24px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
        Thank you for choosing GovernAPI! We're excited to help you secure, monitor, and govern your APIs with enterprise-grade protection.
      </p>

      <!-- Quick Start Steps -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 20px; color: white; font-size: 18px; font-weight: 600;">🚀 Quick Start Guide</h3>
        
        <div style="margin-bottom: 16px;">
          <div style="display: inline-block; width: 28px; height: 28px; background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 50%; text-align: center; line-height: 28px; color: #06b6d4; font-weight: bold; margin-right: 12px;">1</div>
          <span style="color: white; font-weight: 500;">Generate your first API key</span>
          <p style="margin: 8px 0 0 40px; color: #94a3b8; font-size: 14px;">Authenticate and start making API calls</p>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: inline-block; width: 28px; height: 28px; background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 50%; text-align: center; line-height: 28px; color: #06b6d4; font-weight: bold; margin-right: 12px;">2</div>
          <span style="color: white; font-weight: 500;">Run your first security scan</span>
          <p style="margin: 8px 0 0 40px; color: #94a3b8; font-size: 14px;">Identify vulnerabilities and compliance issues</p>
        </div>

        <div>
          <div style="display: inline-block; width: 28px; height: 28px; background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 50%; text-align: center; line-height: 28px; color: #06b6d4; font-weight: bold; margin-right: 12px;">3</div>
          <span style="color: white; font-weight: 500;">Explore your dashboard</span>
          <p style="margin: 8px 0 0 40px; color: #94a3b8; font-size: 14px;">View real-time insights and threat detection</p>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>

      <!-- Support Info -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0 0 12px; color: #94a3b8; font-size: 14px;">
          <strong style="color: white;">Need help?</strong> We're here for you!
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          📧 <a href="mailto:support@governapi.com" style="color: #06b6d4; text-decoration: none;">support@governapi.com</a><br>
          📚 <a href="${baseUrl}/docs" style="color: #06b6d4; text-decoration: none;">Documentation</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} GovernAPI. All rights reserved.
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        <a href="${baseUrl}/privacy" style="color: #64748b; text-decoration: none;">Privacy Policy</a> · 
        <a href="${baseUrl}/terms" style="color: #64748b; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Trial expiring email template
   */
  private static getTrialExpiringTemplate(userName: string, daysRemaining: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial is Expiring Soon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
    <!-- Header -->
    <div style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
        ⏰
      </div>
      <h2 style="margin: 0; color: white; font-size: 26px; font-weight: bold;">Your trial expires in ${daysRemaining} days</h2>
      <p style="margin: 12px 0 0; color: #94a3b8; font-size: 16px;">Don't lose access to your API security</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
        Hi ${userName},
      </p>
      <p style="margin: 0 0 24px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
        Your GovernAPI trial will end in <strong style="color: white;">${daysRemaining} days</strong>. To continue protecting your APIs with enterprise-grade security, upgrade to a paid plan today.
      </p>

      <!-- Stats Box -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px; color: white; font-size: 16px; font-weight: 600;">What you'll keep with a paid plan:</h3>
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li style="margin-bottom: 12px; color: #94a3b8; font-size: 14px;">✓ Unlimited API security scans</li>
          <li style="margin-bottom: 12px; color: #94a3b8; font-size: 14px;">✓ Real-time threat detection</li>
          <li style="margin-bottom: 12px; color: #94a3b8; font-size: 14px;">✓ Compliance monitoring</li>
          <li style="margin-bottom: 12px; color: #94a3b8; font-size: 14px;">✓ 24/7 support</li>
          <li style="color: #94a3b8; font-size: 14px;">✓ All your existing data and configurations</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/pricing" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          Upgrade Now →
        </a>
      </div>

      <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; text-align: center;">
        Questions? <a href="mailto:sales@governapi.com" style="color: #06b6d4; text-decoration: none;">Contact our sales team</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} GovernAPI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Payment failed email template
   */
  private static getPaymentFailedTemplate(userName: string, invoiceUrl?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Action Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
    <!-- Header -->
    <div style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
        ⚠️
      </div>
      <h2 style="margin: 0; color: white; font-size: 26px; font-weight: bold;">Payment Failed</h2>
      <p style="margin: 12px 0 0; color: #94a3b8; font-size: 16px;">Action required to continue service</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
        Hi ${userName},
      </p>
      <p style="margin: 0 0 24px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
        We were unable to process your recent payment for GovernAPI. To avoid any interruption to your service, please update your payment method.
      </p>

      <!-- Alert Box -->
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
          <strong style="color: #ef4444;">Important:</strong> If payment is not received within 7 days, your account may be suspended and you'll lose access to:
        </p>
        <ul style="margin: 12px 0 0; padding-left: 20px; color: #fca5a5; font-size: 14px;">
          <li>API security monitoring</li>
          <li>Threat detection alerts</li>
          <li>Compliance reports</li>
          <li>Historical scan data</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${invoiceUrl || `${baseUrl}/dashboard/billing`}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          Update Payment Method →
        </a>
      </div>

      <!-- Support -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0 0 12px; color: #94a3b8; font-size: 14px;">
          <strong style="color: white;">Need help?</strong>
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          If you believe this is an error or need assistance, please contact us at<br>
          <a href="mailto:billing@governapi.com" style="color: #06b6d4; text-decoration: none;">billing@governapi.com</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} GovernAPI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}
