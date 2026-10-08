import { calculateDeterministicSkillScores } from './src/lib/evidenceEngine.ts';
import { fetchGitHubData } from './src/lib/githubService.ts';

// Mock global.fetch to simulate GitHub API
const originalFetch = global.fetch;
global.fetch = async (url: string | URL | Request, options?: RequestInit) => {
  const urlStr = url.toString();
  
  if (urlStr.includes('/users/testuser/repos')) {
    return new Response(JSON.stringify([
      { name: 'ml-project', full_name: 'testuser/ml-project', description: 'ML stuff', language: 'Jupyter Notebook', default_branch: 'main', pushed_at: new Date().toISOString(), hasReadme: true },
      { name: 'react-app', full_name: 'testuser/react-app', description: 'UI', language: 'TypeScript', default_branch: 'main', pushed_at: new Date().toISOString(), hasReadme: false },
      { name: 'docs-only', full_name: 'testuser/docs-only', description: 'Docs', language: null, default_branch: 'main', pushed_at: new Date().toISOString(), hasReadme: true }
    ]));
  }
  
  if (urlStr.includes('/users/testuser/events/public')) {
    return new Response(JSON.stringify([{ type: 'PushEvent', created_at: new Date().toISOString() }]));
  }
  
  if (urlStr.includes('/users/testuser')) {
    return new Response(JSON.stringify({ login: 'testuser' }));
  }

  if (urlStr.includes('/git/trees/main?recursive=1')) {
    if (urlStr.includes('ml-project')) {
      return new Response(JSON.stringify({ tree: [{path: 'src/model.py'}, {path: 'src/train.py'}, {path: 'requirements.txt'}] }));
    }
    if (urlStr.includes('react-app')) {
      return new Response(JSON.stringify({ tree: [{path: 'src/App.tsx'}, {path: 'package.json'}] }));
    }
    if (urlStr.includes('docs-only')) {
      return new Response(JSON.stringify({ tree: [{path: 'README.md'}] }));
    }
  }

  if (urlStr.includes('/contents/')) {
    if (urlStr.includes('requirements.txt')) return new Response('numpy\npandas\nscikit-learn');
    if (urlStr.includes('package.json')) return new Response('{"dependencies": {"react": "18.0.0"}}');
    if (urlStr.includes('README.md')) return new Response('This project uses Python.');
  }

  return new Response('Not Found', { status: 404 });
};

async function runTest() {
  const username = "testuser"; 

  console.log(`Fetching Mocked GitHub data for ${username}...`);
  const githubData = await fetchGitHubData(username, 'dummy');

  const dummyResume = {
    skills: ["Python", "AWS", "React", "Docker", "Kubernetes", "Data Science", "C++"]
  };
  
  const dummyPortfolio = {
    projects: []
  };

  const targetRole = "Software Engineer";

  console.log("Running Deterministic Evidence Engine...");
  const scoredSkills = await calculateDeterministicSkillScores(dummyResume, dummyPortfolio, githubData, targetRole);

  const overallScore = scoredSkills.length > 0 
    ? Math.round(scoredSkills.reduce((acc, s) => acc + s.final_ewrs_score, 0) / scoredSkills.length)
    : 0;

  console.log("\n=== FINAL EWRS REPORT ===");
  console.log(`Overall Score: ${overallScore}`);
  
  for (const skill of scoredSkills) {
    console.log(`\n--- Skill: ${skill.skill} ---`);
    console.log(`Confidence: ${skill.evidence_confidence}`);
    console.log(`Category: ${skill.category}`);
    console.log(`Final EWRS: ${skill.final_ewrs_score}`);
    console.log(`Evidence breakdown:`, JSON.stringify(skill.evidence));
    console.log(`Proof signals:`, JSON.stringify(skill.proof, null, 2));
  }
}

runTest().catch(console.error);
