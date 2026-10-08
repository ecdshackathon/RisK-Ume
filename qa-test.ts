import { calculateEWRS } from './src/lib/evidenceEngine.ts';
import { fetchGitHubData } from './src/lib/githubService.ts';

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

  // RATE LIMITED PROFILE
  if (urlStr.includes('/users/rate_limited')) {
    return new Response("API rate limit exceeded", { status: 403, headers: new Headers({'x-ratelimit-remaining': '0'}) });
  }

  if (urlStr.includes('/contents/')) {
    if (urlStr.includes('requirements.txt')) return new Response('numpy\npandas\nscikit-learn');
    if (urlStr.includes('package.json')) return new Response('{"dependencies": {"react": "18.0.0"}}');
  }

  // GEMINI MOCK FOR TEST 7
  if (urlStr.includes('generativelanguage.googleapis.com')) {
    if (process.env.TEST_SCENARIO === 'gemini_fail') {
      return new Response('Internal Server Error', { status: 500 });
    }
    if (process.env.TEST_SCENARIO === 'gemini_hallucinate') {
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                overall_ewrs: 999, // Hallucination
                verified_skills: [
                  {
                    skill: "Python",
                    category: "Language",
                    claim_relevance: 999, // Hallucination
                    evidence_confidence: 999, // Hallucination
                    skill_decay_penalty: 0,
                    final_ewrs_score: 999, // Hallucination
                    reason: "Because I said so",
                    sources: [],
                    proof: [{ repository: "fake-repo", signals: ["fake-signal"] }] // Hallucination
                  }
                ],
                unverified_skills: [],
                roadmap_recommendations: []
              })
            }]
          }
        }]
      }));
    }
    
    // Normal mocked Gemini response
    return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                overall_ewrs: 50,
                verified_skills: [
                  { skill: "Python", reason: "Good python code" },
                  { skill: "React", reason: "Good react code" }
                ],
                unverified_skills: [
                  { skill: "Docker", reason: "No docker code" },
                  { skill: "Ruby", reason: "No ruby code" },
                  { skill: "C++", reason: "No c++ code" }
                ],
                roadmap_recommendations: []
              })
            }]
          }
        }]
      }));
  }

  return new Response('Not Found', { status: 404 });
};

async function runScenario(name: string, username: string | null, dummyResume: any, targetRole: string, atsContext: any, scenarioEnv: string = '') {
  console.log(`\n\n========== SCENARIO: ${name} ==========`);
  process.env.TEST_SCENARIO = scenarioEnv;
  
  let githubData = null;
  if (username) {
    githubData = await fetchGitHubData(username, "dummy");
  }

  const dummyPortfolio = { projects: [] };
  const report = await calculateEWRS(dummyResume, dummyPortfolio, githubData, targetRole, atsContext);

  console.log(`OVERALL JOB READINESS SCORE: ${report.overall_ewrs}`);
  if (isNaN(report.overall_ewrs) || report.overall_ewrs < 0 || report.overall_ewrs > 100) {
     console.error(`ERROR: Boundary failed for overall_ewrs: ${report.overall_ewrs}`);
  }
  
  for (const skill of report.verified_skills || []) {
    console.log(`- [Verified] ${skill.skill}: EWRS ${skill.final_ewrs_score} (Relevance: ${skill.claim_relevance}, Conf: ${skill.evidence_confidence})`);
    if (isNaN(skill.final_ewrs_score) || skill.final_ewrs_score < 0 || skill.final_ewrs_score > 100) console.error(`BOUNDARY ERROR: ${skill.skill}`);
    if (skill.proof?.length > 0) console.log(`  Proof: ${JSON.stringify(skill.proof)}`);
  }
  for (const skill of report.unverified_skills || []) {
    console.log(`- [Unverified] ${skill.skill}: EWRS ${skill.final_ewrs_score} (Relevance: ${skill.claim_relevance}, Conf: ${skill.evidence_confidence})`);
    if (isNaN(skill.final_ewrs_score) || skill.final_ewrs_score < 0 || skill.final_ewrs_score > 100) console.error(`BOUNDARY ERROR: ${skill.skill}`);
  }
}

async function runAll() {
  process.env.TEST_MODE = 'false'; // Ensure we use the Gemini path, not the hardcoded skip
  
  // Test 1 — Normal candidate
  await runScenario("Test 1 (Normal Candidate)", "strong_dev", { skills: ["Python", "React", "Docker"] }, "Software Engineer", { requiredSkills: ["Python", "React", "Docker"] });

  // Test 2 — No GitHub connected
  await runScenario("Test 2 (No GitHub)", null, { skills: ["Python", "React"] }, "Software Engineer", { requiredSkills: ["Python", "React"] });

  // Test 3 — No claimed skills (With and without GitHub)
  await runScenario("Test 3a (No claims, No GitHub)", null, { skills: [] }, "Software Engineer", { requiredSkills: ["Python"] });
  await runScenario("Test 3b (No claims, With GitHub)", "strong_dev", { skills: [] }, "Software Engineer", { requiredSkills: ["Python"] });

  // Test 4 — No Job Description (Fallback behavior)
  await runScenario("Test 4 (No Job Description)", "strong_dev", { skills: ["Software Engineer", "React"] }, "Software Engineer", undefined);

  // Test 5 — Rate-limited GitHub
  await runScenario("Test 5 (Rate-limited GitHub)", "rate_limited", { skills: ["Python"] }, "Software Engineer", { requiredSkills: ["Python"] });

  // Test 6 — Gemini failure
  await runScenario("Test 6 (Gemini API Error)", "strong_dev", { skills: ["Python"] }, "Software Engineer", { requiredSkills: ["Python"] }, "gemini_fail");

  // Test 7 — Gemini attempts to change score
  await runScenario("Test 7 (Gemini Hallucination)", "strong_dev", { skills: ["Python"] }, "Software Engineer", { requiredSkills: ["Python"] }, "gemini_hallucinate");

  // Test 8 — Job relevance (Ruby/C++ should be 60 relevance, Python/React 100)
  await runScenario("Test 8 (Job Relevance)", "strong_dev", { skills: ["Python", "React", "Ruby", "C++"] }, "Software Engineer", { requiredSkills: ["Python", "React", "Docker"] });
}

runAll().catch(console.error);
