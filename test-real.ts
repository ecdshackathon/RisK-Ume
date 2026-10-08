import { calculateDeterministicSkillScores } from './src/lib/evidenceEngine.ts';
import { fetchGitHubData } from './src/lib/githubService.ts';

async function runTest() {
  // Use octocat as they are guaranteed to exist, have real repositories, 
  // and few enough repos to avoid instant rate limiting on unauthenticated IPs.
  const username = "octocat"; 

  console.log(`Fetching REAL GitHub data for ${username} without mocks...`);
  const githubData = await fetchGitHubData(username);
  
  if (githubData.isMock) {
     console.log("WARNING: Rate limit hit, using simulated data. The test will proceed with simulated data.");
  } else {
     console.log(`Success: Retrieved ${githubData.repos.length} repositories for ${username}.`);
  }

  const dummyResume = {
    skills: ["Ruby", "Ruby on Rails", "Python", "JavaScript", "HTML"]
  };
  
  const dummyPortfolio = {
    projects: []
  };

  const targetRole = "Software Engineer";

  console.log("Running Deterministic Evidence Engine (Real Data Phase 1)...");
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
