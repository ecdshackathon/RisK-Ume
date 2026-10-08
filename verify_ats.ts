import { analyzeATSServer } from './src/lib/atsEngine';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function runVerification() {
  console.log("=== STARTING ATS VERIFICATION ===");
  const resume = `
John Doe
Software Engineer
Email: john@example.com

SUMMARY
Experienced software engineer with 5 years of experience building scalable web applications. Strong background in React, Node.js, and SQL databases.

EXPERIENCE
Frontend Developer | TechCorp | 2019 - Present
- Developed a high-performance web application using React.
- Improved application load time by 30%.
- Integrated RESTful APIs using Node.js.

SKILLS
React, Node.js, SQL, JavaScript, HTML, CSS
`;

  const jd = `
Senior Frontend Engineer

Requirements:
- 5+ years of experience in web development.
- Deep expertise in React and Node.js.
- Strong knowledge of Java and Spring Boot.
- Experience with AWS (S3, EC2).
- Proven ability to optimize web performance.
`;

  try {
    console.log("Testing full Gemini response...");
    const result = await analyzeATSServer(resume, jd);
    
    console.log("--- RESULTS ---");
    console.log("API fields populated:");
    console.log("score_breakdown:", !!result.score_breakdown ? "PASS" : "FAIL");
    console.log("top_improvements:", (result.top_improvements?.length > 0) ? "PASS" : "FAIL");
    console.log("resume_jd_match:", (result.resume_jd_match?.missing_requirements?.length > 0) ? "PASS" : "FAIL");
    console.log("keyword_coverage:", !!result.keyword_coverage ? "PASS" : "FAIL");
    console.log("section_analysis:", (result.section_analysis?.length > 0) ? "PASS" : "FAIL");
    console.log("smart_rewrites:", !!result.smart_rewrites ? "PASS" : "FAIL");
    console.log("quantification_opportunities:", !!result.quantification_opportunities ? "PASS" : "FAIL");
    console.log("formatting_checks:", (result.formatting_checks?.length > 0) ? "PASS" : "FAIL");
    console.log("semantic_alignment:", !!result.semantic_alignment ? "PASS" : "FAIL");

    console.log("\nDeep check on hallucination (Java/AWS):");
    const techSkills = result.keyword_coverage?.technical_skills || [];
    const missingJava = techSkills.some(t => t.keyword.toLowerCase().includes('java') && t.status.toLowerCase().includes('missing'));
    const missingAws = techSkills.some(t => t.keyword.toLowerCase().includes('aws') && t.status.toLowerCase().includes('missing'));
    console.log("Hallucination protection:", (missingJava || missingAws) ? "PASS (Correctly identified as missing)" : "FAIL");

    console.log("\nDeep check on Score Breakdown:");
    console.log(JSON.stringify(result.score_breakdown, null, 2));
    console.log("\nTop Improvements:");
    console.log(JSON.stringify(result.top_improvements, null, 2));
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runVerification();
