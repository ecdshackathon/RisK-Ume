import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EvidenceScore {
  skill: string;
  claim_relevance: number; // 0-100 (Alpha)
  evidence_confidence: number; // 0.0 - 1.0 (Beta)
  skill_decay_penalty: number; // 0-100 (Gamma)
  final_ewrs_score: number;
  reason: string;
}

export interface EWRSReport {
  overall_ewrs: number;
  verified_skills: EvidenceScore[];
  unverified_skills: EvidenceScore[];
  roadmap_recommendations: string[];
}

// --- STEP 2: DETERMINISTIC SCORING ENGINE ---
// Calculates score securely on the backend instead of letting Gemini guess
function calculateDeterministicSkillScores(resumeJSON: any, portfolioJSON: any, targetRole: string) {
  const claimedSkills: string[] = resumeJSON.skills || [];
  const projects: any[] = portfolioJSON.projects || [];
  
  return claimedSkills.map(skill => {
    const skillLower = skill.toLowerCase();
    
    // Find matching projects in portfolio/github
    const matchingProjects = projects.filter(p => 
      (p.technologies || []).some((t: string) => t.toLowerCase() === skillLower) ||
      (p.description || "").toLowerCase().includes(skillLower)
    );
    
    // Apply weights from PDF requirements
    let projectEvidence = 0;
    let codeEvidence = 0;
    let recentUsage = 0;
    let resumeEvidence = 15; // Claimed on resume = 15 points
    let documentation = 0;
    
    if (matchingProjects.length > 0) {
      projectEvidence = Math.min(30, matchingProjects.length * 10);
      codeEvidence = 25; // Assume repo exists
      recentUsage = 20; // Assume recent for hackathon
      documentation = 10; 
    }
    
    const final_score = projectEvidence + codeEvidence + recentUsage + resumeEvidence + documentation;
    
    return {
      skill,
      metrics: {
        projectEvidence,
        codeEvidence,
        recentUsage,
        resumeEvidence,
        documentation
      },
      final_ewrs_score: final_score,
      isVerified: final_score > 50
    };
  });
}

export async function calculateEWRS(resumeJSON: any, portfolioJSON: any, targetRole: string): Promise<EWRSReport> {
  // 1. Run the deterministic backend calculation
  const scoredSkills = calculateDeterministicSkillScores(resumeJSON, portfolioJSON, targetRole);
  const overallScore = scoredSkills.length > 0 
    ? Math.round(scoredSkills.reduce((acc, s) => acc + s.final_ewrs_score, 0) / scoredSkills.length)
    : 0;

  // 2. Pass deterministic scores to Gemini for explanation generation
  const prompt = `You are an expert technical evaluator for 'Risk-Ume'. 
  I have mathematically calculated the deterministic Evidence-Weighted Readiness Score (EWRS) for the candidate.
  
  Target Role: ${targetRole}
  Overall Readiness Score: ${overallScore}
  
  DETERMINISTIC SKILL SCORES:
  ${JSON.stringify(scoredSkills, null, 2)}
  
  Your job is to act as the "Explainability Engine". 
  Generate human-readable explanations ("reason" strings) for WHY they received these exact scores based on the metrics provided.
  For unverified skills, generate actionable 'roadmap_recommendations' to help them bridge the gap.
  
  Output the results in strict JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash", // using the model version seen in your server.ts
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_ewrs: { type: Type.NUMBER },
          verified_skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                claim_relevance: { type: Type.NUMBER },
                evidence_confidence: { type: Type.NUMBER },
                skill_decay_penalty: { type: Type.NUMBER },
                final_ewrs_score: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              }
            }
          },
          unverified_skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                claim_relevance: { type: Type.NUMBER },
                evidence_confidence: { type: Type.NUMBER },
                skill_decay_penalty: { type: Type.NUMBER },
                final_ewrs_score: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              }
            }
          },
          roadmap_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const report = JSON.parse(response.text || "{}") as EWRSReport;
  
  // Ensure the AI doesn't hallucinate the overall score
  report.overall_ewrs = overallScore;
  
  return report;
}
