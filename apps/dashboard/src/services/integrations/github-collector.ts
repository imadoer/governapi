interface GitHubCollectorResult {
  openVulnerabilities: number;
  dependencyAlerts: number;
  securityIssues: number;
  lastCommitDate: string | null;
}

export async function collectGitHubData(
  accessToken: string,
  repository: string
): Promise<GitHubCollectorResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "GovernAPI-Intelligence",
  };

  const result: GitHubCollectorResult = {
    openVulnerabilities: 0,
    dependencyAlerts: 0,
    securityIssues: 0,
    lastCommitDate: null,
  };

  try {
    // 1. Get Dependabot alerts (vulnerabilities)
    const alertsRes = await fetch(
      `https://api.github.com/repos/${repository}/dependabot/alerts?state=open`,
      { headers }
    );
    
    if (alertsRes.ok) {
      const alerts = await alertsRes.json();
      result.dependencyAlerts = alerts.length;
      result.openVulnerabilities = alerts.filter((a: any) => 
        a.security_advisory?.severity === 'high' || a.security_advisory?.severity === 'critical'
      ).length;
    }

    // 2. Get security-labeled issues
    const issuesRes = await fetch(
      `https://api.github.com/repos/${repository}/issues?labels=security&state=open`,
      { headers }
    );
    
    if (issuesRes.ok) {
      const issues = await issuesRes.json();
      result.securityIssues = issues.length;
    }

    // 3. Get last commit date
    const commitsRes = await fetch(
      `https://api.github.com/repos/${repository}/commits?per_page=1`,
      { headers }
    );
    
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (commits.length > 0) {
        result.lastCommitDate = commits[0].commit.committer.date;
      }
    }

  } catch (error) {
    console.error("GitHub collector error:", error);
  }

  return result;
}
