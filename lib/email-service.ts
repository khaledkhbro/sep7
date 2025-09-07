// Email Service Abstraction Layer
// Supports multiple email providers with failover

interface EmailProvider {
  id: number
  name: string
  type: "smtp" | "api" | "service"
  provider: string
  config: any
  is_active: boolean
  daily_limit: number
  monthly_limit: number
  current_daily_usage: number
  current_monthly_usage: number
}

interface EmailData {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  template_data?: Record<string, any>
}

class EmailService {
  private providers: EmailProvider[] = []

  async loadProviders() {
    try {
      const response = await fetch("/api/admin/email/providers")
      if (response.ok) {
        this.providers = await response.json()
      }
    } catch (error) {
      console.error("Failed to load email providers:", error)
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (this.providers.length === 0) {
      await this.loadProviders()
    }

    const activeProviders = this.providers
      .filter((p) => p.is_active && this.canSendEmail(p))
      .sort((a, b) => b.id - a.id) // Primary first, then by priority

    for (const provider of activeProviders) {
      try {
        const success = await this.sendWithProvider(provider, emailData)
        if (success) {
          await this.updateUsageStats(provider.id)
          return true
        }
      } catch (error) {
        console.error(`Failed to send email with ${provider.name}:`, error)
        await this.logProviderError(provider.id, error)
      }
    }

    return false
  }

  private canSendEmail(provider: EmailProvider): boolean {
    // Check daily and monthly limits
    if (provider.current_daily_usage >= provider.daily_limit) return false
    if (provider.current_monthly_usage >= provider.monthly_limit) return false
    return true
  }

  private async sendWithProvider(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    switch (provider.provider) {
      case "ses":
        return this.sendWithSES(provider, emailData)
      case "sendgrid":
        return this.sendWithSendGrid(provider, emailData)
      case "mailgun":
        return this.sendWithMailgun(provider, emailData)
      case "resend":
        return this.sendWithResend(provider, emailData)
      case "gmail":
      case "outlook":
      case "custom":
        return this.sendWithSMTP(provider, emailData)
      default:
        throw new Error(`Unsupported provider: ${provider.provider}`)
    }
  }

  private async sendWithSES(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    // AWS SES implementation
    const { access_key, secret_key, region } = provider.config

    // This would use AWS SDK in a real implementation
    console.log("Sending with SES:", { provider: provider.name, to: emailData.to })
    return true
  }

  private async sendWithSendGrid(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    // SendGrid implementation
    const { api_key } = provider.config

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: emailData.to }],
            },
          ],
          from: { email: emailData.from || "noreply@example.com" },
          subject: emailData.subject,
          content: [{ type: "text/html", value: emailData.html || emailData.text || "" }],
        }),
      })

      return response.ok
    } catch (error) {
      console.error("SendGrid error:", error)
      return false
    }
  }

  private async sendWithMailgun(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    // Mailgun implementation
    const { api_key, domain } = provider.config

    console.log("Sending with Mailgun:", { provider: provider.name, to: emailData.to })
    return true
  }

  private async sendWithResend(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    // Resend implementation
    const { api_key } = provider.config

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailData.from || "noreply@example.com",
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Resend error:", error)
      return false
    }
  }

  private async sendWithSMTP(provider: EmailProvider, emailData: EmailData): Promise<boolean> {
    // SMTP implementation (would use nodemailer in real implementation)
    const { host, port, username, password, secure } = provider.config

    console.log("Sending with SMTP:", {
      provider: provider.name,
      host,
      port,
      to: emailData.to,
    })
    return true
  }

  private async updateUsageStats(providerId: number) {
    try {
      await fetch(`/api/admin/email/providers/${providerId}/usage`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to update usage stats:", error)
    }
  }

  private async logProviderError(providerId: number, error: any) {
    try {
      await fetch(`/api/admin/email/providers/${providerId}/error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: error.message }),
      })
    } catch (logError) {
      console.error("Failed to log provider error:", logError)
    }
  }
}

export const emailService = new EmailService()

// Template rendering utility
export function renderEmailTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match
  })
}

// Queue email for sending
export async function queueEmail(
  to: string,
  templateName: string,
  templateData: Record<string, any> = {},
): Promise<boolean> {
  try {
    const response = await fetch("/api/email/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_email: to,
        template_name: templateName,
        template_data: templateData,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Failed to queue email:", error)
    return false
  }
}
