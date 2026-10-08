import { analyzeATSServer } from './src/lib/atsEngine.ts';

async function runTests() {
  process.env.TEST_MODE = 'false';
  process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
  process.env.ATS_AI_PROVIDER = 'gemini';
  
  const resume = "Experienced software engineer with 5 years in Node.js, React, and AWS.";
  const jd = "Looking for a full stack developer with Node, React, and Python experience. AWS is a plus.";
  const jd2 = "Looking for a DevOps engineer with AWS, Docker, Kubernetes, and Python.";
  
  console.log("=== TEST A: Gemini ===");
  const resA = await analyzeATSServer(resume, jd);
  console.log("Provider:", resA.analysis_provider); // Should be gemini
  
  console.log("\\n=== TEST B: Cache ===");
  const resB = await analyzeATSServer(resume, jd);
  console.log("Provider:", resB.analysis_provider); // Should be cache
  
  console.log("\\n=== TEST C: Different JD ===");
  const resC = await analyzeATSServer(resume, jd2);
  console.log("Provider:", resC.analysis_provider); // Should be gemini
  
  console.log("\\n=== TEST D: Local Fallback ===");
  process.env.GEMINI_API_KEY = "invalid_key";
  const resD = await analyzeATSServer(resume, jd2 + " extra");
  console.log("Provider:", resD.analysis_provider); // Should be local_fallback
  
  console.log("\\n=== TEST E: Local Mode ===");
  process.env.ATS_AI_PROVIDER = 'local';
  const resE = await analyzeATSServer(resume, jd);
  console.log("Provider:", resE.analysis_provider); // Should be local
}

runTests().catch(console.error);
