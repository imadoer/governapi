import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
})

export async function callGovernAI(message: string): Promise<string> {
  try {
    // If no API key, return demo response
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
      return getDemoResponse(message)
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are GovernAI, an expert API security analyst assistant for GovernAPI. 
          You help users understand their API security posture, compliance status, and threat landscape.
          Be concise, professional, and actionable. Use bullet points when appropriate.
          Always prioritize security best practices.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    return response.choices[0].message?.content || 'No response generated.'
  } catch (error) {
    console.error('GovernAI error:', error)
    return 'I\'m experiencing technical difficulties. Please try again or check your OpenAI API key configuration.'
  }
}

// Demo responses for when API key isn't configured
function getDemoResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('threat') || lowerMessage.includes('24')) {
    return `**Last 24 Hours Threat Summary:**

- 🔴 3 high-severity SQL injection attempts blocked
- 🟡 12 rate-limit violations detected
- 🟢 47 requests flagged as suspicious bot traffic
- ✅ No successful breaches detected

**Recommendations:**
- Review firewall rules for IPs: 192.168.1.x
- Update rate limits on /api/auth endpoint
- Enable advanced bot protection`
  }

  if (lowerMessage.includes('compliance') || lowerMessage.includes('endpoint')) {
    return `**Compliance Check Results:**

❌ **Failed Endpoints:**
- /api/v1/users - Missing authentication headers
- /api/v2/admin - Insufficient encryption (TLS 1.1)

✅ **Passed Endpoints:**
- /api/v1/auth - Fully compliant
- /api/v2/data - SOC 2 certified

**Action Items:**
1. Upgrade TLS to 1.3 on admin endpoints
2. Implement OAuth 2.0 on user routes`
  }

  if (lowerMessage.includes('soc 2') || lowerMessage.includes('improvement')) {
    return `**SOC 2 Improvement Plan:**

**Current Score:** 78/100

**Priority Actions:**
1. ✅ Enable audit logging on all endpoints
2. ⚠️ Implement automated backup verification
3. ⚠️ Add multi-factor authentication for admin access
4. ✅ Deploy real-time threat monitoring

**Timeline:** 2-3 weeks to full compliance

Would you like detailed steps for any of these items?`
  }

  return `I'm GovernAI, your API security analyst. I can help you with:

- Threat analysis and summaries
- Compliance status checks
- Security recommendations
- Vulnerability assessments
- SOC 2 / ISO 27001 guidance

Try asking:
- "Summarize threats in the last 24 hours"
- "Which endpoints failed compliance?"
- "Show SOC 2 improvement steps"

**Note:** Connect your OpenAI API key in .env for live AI responses.`
}
