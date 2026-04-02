interface JiraCollectorResult {
  openSecurityTickets: number;
  resolvedSecurityTickets: number;
  staleTickets: number;
  avgResolutionTimeDays: number;
}

export async function collectJiraData(
  email: string,
  apiToken: string,
  instanceUrl: string,
  projectKey: string
): Promise<JiraCollectorResult> {
  console.log('🎫 Jira Collector Called:', { email, instanceUrl, projectKey });
  
  const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const result: JiraCollectorResult = {
    openSecurityTickets: 0,
    resolvedSecurityTickets: 0,
    staleTickets: 0,
    avgResolutionTimeDays: 0,
  };

  try {
    // Search for security-related issues using new API
    const jql = `project=${projectKey} AND (summary ~ "security" OR summary ~ "vulnerability" OR summary ~ "SSL" OR summary ~ "authentication") AND status != Done`;
    
    console.log('📡 Fetching Jira issues with JQL:', jql);
    
    const response = await fetch(
      `${instanceUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql,
          fields: ['summary', 'status', 'created']
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Jira API Response:', { total: data.total, issueCount: data.issues?.length });
      
      result.openSecurityTickets = data.total || data.issues?.length || 0;

      // Count stale tickets (open > 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (data.issues) {
        result.staleTickets = data.issues.filter((issue: any) =>
          new Date(issue.fields.created) < thirtyDaysAgo
        ).length;
        
        console.log('📊 Found tickets:', { 
          open: result.openSecurityTickets, 
          stale: result.staleTickets 
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Jira API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Jira collector error:", error);
  }

  console.log('📊 Final Result:', result);
  return result;
}
