export interface GitHubRepoSummary {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  isFork: boolean;
  updatedAt: string;
  createdAt: string;
  pushedAt: string;
  hasReadme?: boolean;
}

export interface MonthlyCommitData {
  month: string;      // e.g. "2024-10" or "Oct"
  commits: number;
  pullRequests: number;
  issues: number;
}

export interface DeveloperSubScores {
  recentActivity: number;     // 0 - 100
  commitConsistency: number;  // 0 - 100
  projectMaintenance: number; // 0 - 100
  contributionVolume: number; // 0 - 100
  repositoryQuality: number;  // 0 - 100
}

export interface DeveloperActivityReport {
  username: string;
  avatarUrl: string;
  bio: string | null;
  publicReposCount: number;
  analyzedReposCount: number;
  totalCommits90d: number;
  pullRequests90d: number;
  issues90d: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { name: string; count: number; percentage: number }[];
  activityTimeline: MonthlyCommitData[];
  subScores: DeveloperSubScores;
  overallScore: number;
  statusLabel: 'Strong Evidence' | 'Good Evidence' | 'Partial Evidence' | 'Weak Evidence' | 'No Evidence';
  reasons: { type: 'positive' | 'warning' | 'negative'; text: string }[];
  improvementSteps: { step: string; expectedImprovement: number }[];
  aiSummary?: string;
  topRepositories: GitHubRepoSummary[];
  isDemoData?: boolean;
}

export function calculateDeveloperActivityScore(
  repos: GitHubRepoSummary[],
  events: any[],
  userProfile: { login: string; public_repos: number; created_at: string; followers: number }
): DeveloperActivityReport {
  const now = new Date();
  
  // 1. Process 90-day Events
  let totalCommits90d = 0;
  let pullRequests90d = 0;
  let issues90d = 0;
  
  // Group events by month for the timeline (last 6 months)
  const monthMap: Record<string, { commits: number; prs: number; issues: number }> = {};
  
  // Initialize last 6 months in chronological order
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en-US', { month: 'short' });
    monthMap[key] = { commits: 0, prs: 0, issues: 0 };
  }

  // Parse PushEvents, PullRequestEvents, IssuesEvents
  events.forEach((ev: any) => {
    const createdAt = new Date(ev.created_at);
    const mKey = createdAt.toLocaleString('en-US', { month: 'short' });
    
    if (ev.type === 'PushEvent') {
      const commitCount = ev.payload?.commits?.length || 1;
      totalCommits90d += commitCount;
      if (monthMap[mKey]) monthMap[mKey].commits += commitCount;
    } else if (ev.type === 'PullRequestEvent') {
      pullRequests90d++;
      if (monthMap[mKey]) monthMap[mKey].prs++;
    } else if (ev.type === 'IssuesEvent') {
      issues90d++;
      if (monthMap[mKey]) monthMap[mKey].issues++;
    }
  });

  const activityTimeline: MonthlyCommitData[] = Object.keys(monthMap).map((m) => ({
    month: m,
    commits: monthMap[m].commits,
    pullRequests: monthMap[m].prs,
    issues: monthMap[m].issues,
  }));

  // 2. Repository Analysis & Language Extraction
  const originalRepos = repos.filter((r) => !r.isFork);
  const totalStars = repos.reduce((acc, r) => acc + (r.stars || 0), 0);
  const totalForks = repos.reduce((acc, r) => acc + (r.forks || 0), 0);

  const langCountMap: Record<string, number> = {};
  repos.forEach((r) => {
    if (r.language) {
      langCountMap[r.language] = (langCountMap[r.language] || 0) + 1;
    }
  });

  const totalLangRepos = Object.values(langCountMap).reduce((a, b) => a + b, 0) || 1;
  const topLanguages = Object.entries(langCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalLangRepos) * 100),
    }));

  // 3. Sub-score Calculations (Deterministic)

  // Sub-score A: Recent Activity (0-100)
  // Has commits in past 30 days? Past 90 days?
  const recent30dEvents = events.filter((ev: any) => {
    const diffDays = (now.getTime() - new Date(ev.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  });
  
  let recentActivity = 0;
  if (recent30dEvents.length >= 20) recentActivity = 95;
  else if (recent30dEvents.length >= 10) recentActivity = 85;
  else if (recent30dEvents.length >= 3) recentActivity = 70;
  else if (events.length > 0) recentActivity = 50;
  else {
    // Check most recent repo pushed date
    const latestPush = repos.reduce((latest, r) => {
      const p = new Date(r.pushedAt || 0).getTime();
      return p > latest ? p : latest;
    }, 0);
    const daysSinceLastPush = (now.getTime() - latestPush) / (1000 * 3600 * 24);
    if (daysSinceLastPush < 30) recentActivity = 60;
    else if (daysSinceLastPush < 90) recentActivity = 40;
    else if (daysSinceLastPush < 180) recentActivity = 20;
    else recentActivity = 5;
  }

  // Sub-score B: Commit Consistency (0-100)
  // Check spread across the 6 months timeline. Spikes with zeroes in other months get penalized.
  const activeMonths = activityTimeline.filter((m) => m.commits > 0 || m.pullRequests > 0).length;
  let commitConsistency = 0;
  if (activeMonths >= 5) commitConsistency = 92;
  else if (activeMonths === 4) commitConsistency = 82;
  else if (activeMonths === 3) commitConsistency = 68;
  else if (activeMonths === 2) commitConsistency = 45;
  else if (activeMonths === 1) commitConsistency = 25;
  else commitConsistency = repos.length > 0 ? 15 : 0;

  // Sub-score C: Project Maintenance (0-100)
  // Repos updated in the past 6-12 months, presence of descriptions, README, stars
  const reposWithDesc = repos.filter((r) => r.description && r.description.trim().length > 10).length;
  const descRatio = repos.length > 0 ? reposWithDesc / repos.length : 0;
  let projectMaintenance = Math.min(100, Math.round(
    (descRatio * 40) + 
    (Math.min(totalStars, 10) * 3) + 
    (Math.min(repos.length, 10) * 3)
  ));
  if (repos.length > 0 && projectMaintenance < 20) projectMaintenance = 25;

  // Sub-score D: Contribution Volume (0-100)
  // Healthy volume considering commit count, PR count, issue discussions
  const volumePoints = (totalCommits90d * 0.8) + (pullRequests90d * 5) + (issues90d * 3);
  let contributionVolume = Math.min(95, Math.round(Math.min(volumePoints, 100)));
  if (contributionVolume === 0 && repos.length > 0) contributionVolume = 20;

  // Sub-score E: Repository Quality (0-100)
  // Original vs forked repos, language clarity, multi-repo breadth
  const originalRatio = repos.length > 0 ? originalRepos.length / repos.length : 0;
  const langDiversity = Math.min(topLanguages.length, 4);
  let repositoryQuality = Math.min(100, Math.round(
    (originalRatio * 50) + 
    (langDiversity * 10) + 
    (repos.length >= 3 ? 15 : 5)
  ));

  // 4. Overall Weighted Score (0-100) as per PDF architecture
  // PDF page 10: "Commit frequency + Project quality + Project complexity + Consistency + Recent activity"
  const overallScore = Math.min(100, Math.max(0, Math.round(
    (recentActivity * 0.25) +
    (commitConsistency * 0.25) +
    (projectMaintenance * 0.15) +
    (contributionVolume * 0.20) +
    (repositoryQuality * 0.15)
  )));

  // Status mapping matching PDF page 7
  let statusLabel: 'Strong Evidence' | 'Good Evidence' | 'Partial Evidence' | 'Weak Evidence' | 'No Evidence';
  if (overallScore >= 80) statusLabel = 'Strong Evidence';
  else if (overallScore >= 60) statusLabel = 'Good Evidence';
  else if (overallScore >= 40) statusLabel = 'Partial Evidence';
  else if (overallScore >= 1) statusLabel = 'Weak Evidence';
  else statusLabel = 'No Evidence';

  // 5. Reasons & Explanations (Matching PDF format)
  const reasons: { type: 'positive' | 'warning' | 'negative'; text: string }[] = [];

  if (repos.length > 0) {
    reasons.push({ type: 'positive', text: `Found ${repos.length} public repositories (${originalRepos.length} original projects)` });
  } else {
    reasons.push({ type: 'negative', text: 'No public repositories found on this profile' });
  }

  if (recentActivity >= 60) {
    reasons.push({ type: 'positive', text: `Recent activity detected (${totalCommits90d} commits in the last 90 days)` });
  } else {
    reasons.push({ type: 'warning', text: 'Low commit activity in the recent 30-90 days' });
  }

  if (activeMonths >= 3) {
    reasons.push({ type: 'positive', text: `Consistent development pattern across ${activeMonths} recent months` });
  } else if (repos.length > 0) {
    reasons.push({ type: 'warning', text: 'Activity is grouped in isolated bursts rather than a steady monthly rhythm' });
  }

  if (pullRequests90d > 0) {
    reasons.push({ type: 'positive', text: `Collaborative engineering evidence: ${pullRequests90d} pull requests` });
  } else {
    reasons.push({ type: 'warning', text: 'No recent pull request or collaborative code review evidence found' });
  }

  if (topLanguages.length >= 2) {
    reasons.push({ type: 'positive', text: `Multi-stack development: ${topLanguages.map(l => l.name).join(', ')}` });
  }

  // 6. Actionable Improvements (Matching PDF page 20)
  const improvementSteps: { step: string; expectedImprovement: number }[] = [];
  if (commitConsistency < 75) {
    improvementSteps.push({ step: 'Establish regular weekly commits rather than single-day burst pushes', expectedImprovement: 5 });
  }
  if (pullRequests90d === 0) {
    improvementSteps.push({ step: 'Contribute to open source projects or collaborate via Pull Requests', expectedImprovement: 4 });
  }
  if (reposWithDesc < repos.length * 0.7) {
    improvementSteps.push({ step: 'Add descriptive READMEs, architecture notes, and live demos to top repositories', expectedImprovement: 3 });
  }
  if (recentActivity < 70) {
    improvementSteps.push({ step: 'Push active project updates within the current week to refresh recency signal', expectedImprovement: 6 });
  }

  // Top repositories sorted by stars & update date
  const topRepositories = [...repos]
    .sort((a, b) => b.stars - a.stars || new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .slice(0, 6);

  return {
    username: userProfile.login,
    avatarUrl: (userProfile as any).avatar_url || '',
    bio: (userProfile as any).bio || null,
    publicReposCount: userProfile.public_repos || repos.length,
    analyzedReposCount: repos.length,
    totalCommits90d,
    pullRequests90d,
    issues90d,
    totalStars,
    totalForks,
    topLanguages,
    activityTimeline,
    subScores: {
      recentActivity,
      commitConsistency,
      projectMaintenance,
      contributionVolume,
      repositoryQuality,
    },
    overallScore,
    statusLabel,
    reasons,
    improvementSteps,
    topRepositories,
  };
}
