import { GoogleGenAI, Type } from "@google/genai";
import { RiskProfile, RiskScores } from "./riskEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIAnalysis {
  summary: string;
  top_risk_factors: string[];
  recommendations: string[];
  career_pivots: string[];
  skill_priorities: { skill: string; reason: string; impact: string }[];
}

export interface ATSAnalysis {
  score_before: number;
  score_after: number;
  match_level: 'Low' | 'Moderate' | 'High';
  resume_health: number;
  interview_prob_before: number;
  interview_prob_after: number;
  missing_skills: string[];
  missing_keywords: string[];
  hard_skills: string[];
  soft_skills: string[];
  formatting_score: number;
  quantified_achievements_score: number;
  grammar_tone_score: number;
  salary_readiness_score: number;
  salary_band_estimate: string;
  career_gap_risk: string;
  keyword_decay: { keyword: string; trend: 'up' | 'down' }[];
  culture_fit_score: number;
  multi_role_conflict: string;
  hiring_manager_profile: string[];
  add_lines: { content: string; impact: string; reason: string }[];
  remove_lines: { content: string; reason: string }[];
  rewrite_lines: { before: string; after: string; reason: string }[];
  impact_prediction: {
    visibility_increase: string;
    key_improvement: string;
  };
  
  // Detailed Analysis Fields
  score_breakdown?: {
    keyword_match: number;
    hard_skill_match: number;
    experience_relevance: number;
    role_alignment: number;
    ats_parsability: number;
    quantified_impact: number;
  };
  keyword_coverage?: {
    technical_skills: Array<{ keyword: string; status: string; evidence: string; importance: string }>;
    industry_terms: Array<{ keyword: string; status: string }>;
    action_verbs: string[];
    role_terms: Array<{ keyword: string; category: string; frequency: number; status: string }>;
  };
  resume_jd_match?: {
    strong_matches: Array<{ requirement: string; resume_evidence: string; status: string; why: string }>;
    partial_matches: Array<{ requirement: string; resume_evidence: string; status: string; why: string }>;
    missing_requirements: Array<{ requirement: string; resume_evidence: string; status: string; why: string }>;
    low_relevance_content: Array<{ requirement: string; resume_evidence: string; status: string; why: string }>;
  };
  section_analysis?: Array<{
    section: string;
    score: number;
    status: string;
    problems: string[];
    recommendation: string[];
  }>;
  top_improvements?: Array<{
    priority: string;
    issue: string;
    why: string;
    action: string;
    impact: string;
  }>;
  smart_rewrites?: Array<{
    current: string;
    recommended: string;
    why: string;
    terms_added: string[];
    evidence_source: string;
  }>;
  quantification_opportunities?: Array<{
    current: string;
    opportunity: string;
    possible_metrics: string[];
  }>;
  formatting_checks?: Array<{
    check: string;
    status: string;
    explanation: string;
  }>;
  semantic_alignment?: {
    target_role: string;
    alignment_percentage: number;
    strong_alignment: string[];
    weak_alignment: string[];
    missing_concepts: string[];
  };
  skill_evidence?: Array<{
    skill: string;
    status: string;
    evidence: string;
    importance: string;
  }>;
}

export async function parseResumeToJSON(resumeText: string) {
  const prompt = `Parse the following resume text into a structured JSON format. 
  Extract personal information, work experience, education, projects, and skills.
  
  Resume Text:
  ${resumeText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personal: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING },
              lastName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              website: { type: Type.STRING },
              summary: { type: Type.STRING }
            }
          },
          work: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          edu: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                school: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          proj: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tech: { type: Type.STRING },
                url: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export interface HeatmapLine {
  text: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
}

export async function generateHeatmap(resumeText: string): Promise<HeatmapLine[]> {
  const prompt = `Analyze the following resume text and generate a recruiter readability heatmap.
  Assign a visibility score (0-100) to each significant line or bullet point based on keyword strength, action verbs, and quantified impact.
  Color mapping:
  - 60-100: green (strong)
  - 30-59: yellow (moderate)
  - 0-29: red (weak)
  
  Resume Text:
  ${resumeText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            score: { type: Type.NUMBER },
            color: { type: Type.STRING, enum: ['green', 'yellow', 'red'] }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export async function analyzeATS(resumeText: string, jobDescription: string): Promise<ATSAnalysis> {
  console.log("MOCK MODE ENABLED: Bypassing Gemini ATS Optimizer to prevent 503 API crash during demo.");
  
  // Return a flawlessly formatted demo payload
  return {
    score_before: 62,
    score_after: 94,
    match_level: "High",
    resume_health: 88,
    interview_prob_before: 42,
    interview_prob_after: 89,
    missing_skills: ["GraphQL", "Kafka", "CI/CD Pipelines", "System Design"],
    missing_keywords: ["Microservices Architecture", "Distributed Systems", "Cloud-Native"],
    hard_skills: ["React", "Node.js", "Docker", "Kubernetes", "PostgreSQL"],
    soft_skills: ["Cross-functional Leadership", "Agile Methodologies", "Problem Solving"],
    formatting_score: 95,
    quantified_achievements_score: 80,
    grammar_tone_score: 98,
    salary_readiness_score: 85,
    salary_band_estimate: "$110,000 - $145,000",
    career_gap_risk: "LOW (Tech Industry tolerant of project-based gaps)",
    keyword_decay: [
      { keyword: "REST", trend: "down" },
      { keyword: "gRPC", trend: "up" }
    ],
    culture_fit_score: 90,
    multi_role_conflict: "None detected. Clear alignment with Backend/Full-Stack Engineering.",
    hiring_manager_profile: ["Values scalable architecture", "Prefers quantified metrics over generic duties"],
    add_lines: [
      { content: "Architected distributed microservices handling 10k+ requests/sec using Node.js and Redis", impact: "High", reason: "Directly matches 'distributed systems' keyword in JD." }
    ],
    remove_lines: [
      { content: "Proficient in Microsoft Word and Excel", reason: "Assumed for engineers. Wastes valuable ATS parsing real estate." }
    ],
    rewrite_lines: [
      { before: "Worked on the backend API.", after: "Engineered scalable RESTful APIs resulting in a 40% reduction in query latency.", reason: "Adds quantified impact which ATS parsers heavily favor." }
    ],
    impact_prediction: {
      visibility_increase: "+52%",
      key_improvement: "Quantified system-level achievements"
    }
  };
}

export async function generateAIAnalysis(profile: RiskProfile, scores: RiskScores): Promise<AIAnalysis> {
  console.log("MOCK MODE ENABLED: Bypassing Gemini Risk Score AI to prevent API crash during demo.");
  
  return {
    summary: `Based on your profile as a ${profile.role} in the ${profile.industry} industry, your overall employability risk is ${scores.level} (${scores.totalScore.toFixed(1)}/100). While your core engineering skills are highly valued, the rapid advancement of generative AI introduces moderate automation risk to junior-level tasks.`,
    top_risk_factors: [
      "AI Automation: Routine coding and testing tasks are increasingly automated.",
      "Market Saturation: High influx of entry-to-mid level developers in the current market.",
      "Economic Headwinds: The tech sector is currently favoring senior talent and specialized AI roles."
    ],
    recommendations: [
      "Pivot towards system architecture and distributed systems where human reasoning is critical.",
      "Incorporate AI-assisted development tools (Copilot, Cursor) into your daily workflow to multiply your output.",
      "Focus on building domain-specific business logic expertise rather than pure syntax knowledge."
    ],
    career_pivots: [
      "AI Solutions Architect",
      "Data Engineering & Pipeline Automation",
      "Cloud Infrastructure Engineer"
    ],
    skill_priorities: [
      {
        skill: "Machine Learning / GenAI APIs",
        reason: "Companies are aggressively integrating LLMs into their products.",
        impact: "High"
      },
      {
        skill: "System Design & Architecture",
        reason: "Scalability and microservices design remain difficult to automate.",
        impact: "High"
      },
      {
        skill: "Cloud Native (Kubernetes/Docker)",
        reason: "Infrastructure management is a core requirement for modern backend deployment.",
        impact: "Moderate"
      }
    ]
  };
}
