interface SlackCollectorResult {
  securityMentions: number;
  threatMentions: number;
  incidentMentions: number;
  lastActivityDate: string | null;
}

export async function collectSlackData(
  botToken: string,
  channelId: string
): Promise<SlackCollectorResult> {
  const headers = {
    Authorization: `Bearer ${botToken}`,
    "Content-Type": "application/json",
  };

  const result: SlackCollectorResult = {
    securityMentions: 0,
    threatMentions: 0,
    incidentMentions: 0,
    lastActivityDate: null,
  };

  try {
    // Get last 7 days of messages
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const url = `https://slack.com/api/conversations.history?channel=${channelId}&oldest=${sevenDaysAgo}`;
    
    console.log('📡 Fetching Slack messages:', { url, sevenDaysAgo });
    
    const res = await fetch(url, { headers });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Slack API Response:', { 
        ok: data.ok, 
        error: data.error,
        messageCount: data.messages?.length 
      });
      
      if (data.ok && data.messages) {
        console.log(`📨 Processing ${data.messages.length} messages`);
        
        data.messages.forEach((msg: any, index: number) => {
          const text = (msg.text || '').toLowerCase();
          console.log(`Message ${index}:`, text.substring(0, 80));
          
          if (text.includes('security') || text.includes('vulnerability')) {
            console.log('  ✅ Found security/vulnerability');
            result.securityMentions++;
          }
          if (text.includes('threat') || text.includes('attack')) {
            console.log('  ✅ Found threat/attack');
            result.threatMentions++;
          }
          if (text.includes('incident') || text.includes('breach')) {
            console.log('  ✅ Found incident/breach');
            result.incidentMentions++;
          }
        });
        
        if (data.messages.length > 0) {
          result.lastActivityDate = new Date(parseFloat(data.messages[0].ts) * 1000).toISOString();
        }
      } else {
        console.error('❌ Slack API returned error:', data.error);
      }
    } else {
      console.error('❌ Slack API fetch failed:', res.status);
    }
  } catch (error) {
    console.error("❌ Slack collector error:", error);
  }

  console.log('📊 Final Result:', result);
  return result;
}
