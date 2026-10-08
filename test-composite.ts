import { calculateEWRS } from './src/lib/evidenceEngine.ts';
import { fetchGitHubData, getSimulatedGitHubData } from './src/lib/githubService.ts';

// Mock global.fetch to simulate different GitHub profiles based on username
const originalFetch = global.fetch;
global.fetch = async (url: string | URL | Request, options?: RequestInit) => {
  const urlStr = url.toString();
  
  // STRONG ACTIVITY PROFILE
  if (urlStr.includes('/users/strong_dev/repos')) {
    return new Response(JSON.stringify([
      { name: 'ml-project', full_name: 'strong_dev/ml-project', stargazers_count: 50, forks_count: 10, language: 'Python', default_branch: 'main', pushed_at: new Date().toISOString(), hasReadme: true },
      { name: 'react-app', full_name: 'strong_dev/react-app', stargazers_count: 30, forks_count: 5, language: 'TypeScript', default_branch: 'main', pushed_at: new Date().toISOString(), hasReadme: false }
    ]));
  }
  if (urlStr.includes('/users/strong_dev/events/public')) {
    // Return 30 commit events to simulate high activity
    return new Response(JSON.stringify(Array(30).fill({ type: 'PushEvent', created_at: new Date().toISOString() })));
  }
  if (urlStr.includes('/users/strong_dev')) {
    return new Response(JSON.stringify({ login: 'strong_dev', public_repos: 50 }));
  }
  if (urlStr.includes('/git/trees/main?recursive=1')) {
    if (urlStr.includes('strong_dev/ml-project')) {
      return new Response(JSON.stringify({ tree: [{path: 'src/model.py'}, {path: 'requirements.txt'}] }));
    }
    if (urlStr.includes('strong_dev/react-app')) {
      return new Response(JSON.stringify({ tree: [{path: 'src/App.tsx'}, {path: 'package.json'}] }));
    }
  }

  // WEAK ACTIVITY PROFILE
  if (urlStr.includes('/users/weak_dev/repos')) {
    return new Response(JSON.stringify([]));
  }
  if (urlStr.includes('/users/weak_dev/events/public')) {
    return new Response(JSON.stringify([])); // No activity
  }
  if (urlStr.includes('/users/weak_dev')) {
    return new Response(JSON.stringify({ login: 'weak_dev', public_repos: 0 }));
  }

  // STRONG SKILLS, WEAK ACTIVITY PROFILE
  if (urlStr.includes('/users/mixed_dev/repos')) {
    return new Response(JSON.stringify([
      { name: 'ml-project', full_name: 'mixed_dev/ml-project', stargazers_count: 0, forks_count: 0, language: 'Python', default_branch: 'main', pushed_at: "2020-01-01T00:00:00Z", hasReadme: true }
    ]));
  }
  if (urlStr.includes('/users/mixed_dev/events/public')) {
    return new Response(JSON.stringify([])); // No recent activity
  }
  if (urlStr.includes('/users/mixed_dev')) {
    return new Response(JSON.stringify({ login: 'mixed_dev', public_repos: 1 }));
  }
  if (urlStr.includes('/git/trees/main?recursive=1') && urlStr.includes('mixed_dev/ml-project')) {
      return new Response(JSON.stringify({ tree: [{path: 'src/model.py'}, {path: 'src/train.py'}, {path: 'requirements.txt'}] }));
  }

  if (urlStr.includes('/contents/')) {
    if (urlStr.includes('requirements.txt')) return new Response('numpy\npandas\nscikit-learn');
    if (urlStr.includes('package.json')) return new Response('{"dependencies": {"react": "18.0.0"}}');
  }

  return new Response('Not Found', { status: 404 });
};

async function runScenario(name: string, username: string | null, dummyResume: any, targetRole: string, atsContext: any) {
  console.log(`\n\n========== SCENARIO: ${name} ==========`);
  
  let githubData = null;
  if (username) {
    githubData = await fetchGitHubData(username, "dummy");
  }

  const dummyPortfolio = { projects: [] };
  const report = await calculateEWRS(dummyResume, dummyPortfolio, githubData, targetRole, atsContext);

  console.log(`OVERALL JOB READINESS SCORE: ${report.overall_ewrs}`);
  
  for (const skill of report.verified_skills || []) {
    console.log(`- [Verified] ${skill.skill}: EWRS ${skill.final_ewrs_score} (Relevance: ${skill.claim_relevance})`);
  }
  for (const skill of report.unverified_skills || []) {
    console.log(`- [Unverified] ${skill.skill}: EWRS ${skill.final_ewrs_score} (Relevance: ${skill.claim_relevance})`);
  }
}

async function runAll() {
  // Test A — Strong developer (High skill evidence, High GitHub activity)
  await runScenario(
    "Test A (Strong Developer)",
    "strong_dev",
    { skills: ["Python", "React", "Docker"] },
    "Software Engineer",
    { requiredSkills: ["Python", "React"] }
  );

  // Test B — Weak evidence (Many claims, little/no proof, low activity)
  await runScenario(
    "Test B (Weak Evidence)",
    "weak_dev",
    { skills: ["Python", "AWS", "Kubernetes", "C++", "Java", "Docker", "React"] },
    "Software Engineer",
    { requiredSkills: ["Python"] }
  );

  // Test C — Strong skills, weak activity (Score decreases but not collapse)
  await runScenario(
    "Test C (Strong skills, weak activity)",
    "mixed_dev",
    { skills: ["Python"] },
    "Software Engineer",
    { requiredSkills: ["Python"] }
  );

  // Test D — No GitHub (Handles deliberately rather than 0 penalty)
  await runScenario(
    "Test D (No GitHub Connected)",
    null, // null githubData
    { skills: ["Python"] },
    "Software Engineer",
    { requiredSkills: ["Python"] }
  );

  // Test E — Job relevance (React/Python highly relevant, Docker fallback)
  await runScenario(
    "Test E (Job Relevance ATS parsed)",
    "strong_dev",
    { skills: ["Python", "React", "Ruby"] },
    "Software Engineer",
    { requiredSkills: ["Python", "React"] }
  );
}

runAll().catch(console.error);
