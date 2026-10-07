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

export async function calculateEWRS(resumeJSON: any, portfolioJSON: any, targetRole: string): Promise<EWRSReport> {
  const prompt = `You are an expert technical evaluator. Calculate the Evidence-Weighted Readiness Score (EWRS) by cross-referencing the candidate's Resume claims with their actual Portfolio/LinkedIn proof of work.
  
  Target Role: ${targetRole}
  
  RESUME CLAIMS (What they say they can do):
  ${JSON.stringify(resumeJSON.skills || [])}
  ${JSON.stringify(resumeJSON.work || [])}
  
  PORTFOLIO EVIDENCE (What they actually did):
  ${JSON.stringify(portfolioJSON.projects || [])}
  ${JSON.stringify(portfolioJSON.experiences || [])}
  
  For each technical skill, evaluate:
  1. Claim Relevance (0-100): How relevant is this skill to the Target Role?
  2. Evidence Confidence (0.0 - 1.0): Did they actually prove this skill in their Portfolio Evidence? (0.0 if missing, 1.0 if deep proof).
  3. Skill Decay Penalty (0-100): Is the evidence old? (0 if recent, 50+ if > 2 years old).
  
  The formula is: Final Score = (0.3 * Claim Relevance) + (0.6 * (Evidence Confidence * 100)) - (0.1 * Skill Decay Penalty)
  
  Output the results in strict JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
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

  return JSON.parse(response.text || "{}") as EWRSReport;
}
