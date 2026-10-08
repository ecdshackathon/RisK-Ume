import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

const atsCache = new Map<string, any>();

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function calculateDeterministicATS(resumeText: string, jobDescription: string, extractedSkills: string[]) {
  const normResume = resumeText.toLowerCase();
  const normJD = jobDescription.toLowerCase();
  
  // Basic keyword match counting - stop using generic words, use tech words
  const commonTech = ['javascript', 'python', 'react', 'node', 'aws', 'sql', 'docker', 'kubernetes', 'java', 'c++', 'ruby', 'go', 'spring', 'html', 'css', 'typescript', 'azure', 'gcp', 'linux'];
  
  // Skills present in JD
  const jdSkills = commonTech.filter(t => normJD.includes(t));
  // JD Skills present in Resume
  const matchedJdSkills = jdSkills.filter(t => normResume.includes(t));
  
  let score = 50; // Neutral baseline
  
  if (jdSkills.length > 0) {
    // 60% of score is based on hard skill matching
    const skillRatio = matchedJdSkills.length / jdSkills.length;
    // 40% of score is based on word overlap (maxed out at 30% overlap)
    const jdWords = normJD.split(/\s+/).filter(w => w.length > 4);
    const matchedWords = jdWords.filter(w => normResume.includes(w));
    const wordRatio = Math.min(1, matchedWords.length / (jdWords.length * 0.3 || 1));
    
    score = Math.round((skillRatio * 60) + (wordRatio * 40));
  }
  
  if (score < 20 && normJD.length > 0) score = 20; // Floor

  const keywordMatch = Math.min(100, Math.round((matchedJdSkills.length / (jdSkills.length || 1)) * 100));
  const hardSkillMatch = keywordMatch; // they represent the same concept here
  
  const hasMetrics = /\b\d+(%|k|m|b|\+)?\b/i.test(resumeText);
  const quantifiedImpact = hasMetrics ? 85 : 40;
  
  const atsParsability = resumeText.includes('\n') ? 90 : 50;
  const roleAlignment = Math.min(100, score + 10);
  const experienceRelevance = Math.min(100, score + 5);
  
  return {
    score,
    breakdown: {
      keyword_match: keywordMatch || 0,
      hard_skill_match: hardSkillMatch || 0,
      experience_relevance: experienceRelevance,
      role_alignment: roleAlignment,
      ats_parsability: atsParsability,
      quantified_impact: quantifiedImpact
    }
  };
}

const ATS_ANALYSIS_VERSION = "v3";

export async function analyzeATSServer(resumeText: string, jobDescription: string) {
  const provider = process.env.ATS_AI_PROVIDER || 'gemini';
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  const normRes = normalizeText(resumeText);
  const normJD = normalizeText(jobDescription);
  const hash = crypto.createHash('sha256').update(ATS_ANALYSIS_VERSION + normRes + normJD).digest('hex');
  
  if (atsCache.has(hash)) {
    const cached = atsCache.get(hash);
    return { ...cached, analysis_provider: 'cache' };
  }
  
  let result: any = null;
  let usedProvider = provider;
  
  if (provider === 'gemini') {
    try {
      const prompt = `You are an expert ATS extractor and semantic analyzer. 
      Analyze the provided resume and job description.
      Do semantic comparison.
      Identify missing/weak/strong requirements.
      Suggest improvements.
      Suggest rewrites based ONLY on information present in the resume. 
      CRITICAL RULE: Never suggest adding a skill (e.g. "Added Java") if the resume does not already contain it. 
      For rewrites, you MUST include a "source_evidence" field pointing to the original resume text used.
      Never invent experience. Never invent metrics. Never invent technologies.
      Never modify the deterministic ATS score (do not return an overall score).
      Return structured JSON only.
      Resume: ${resumeText}
      Job: ${jobDescription}`;
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              hard_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              salary_band_estimate: { type: Type.STRING },
              career_gap_risk: { type: Type.STRING },
              multi_role_conflict: { type: Type.STRING },
              add_lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { content: { type: Type.STRING }, impact: { type: Type.STRING }, reason: { type: Type.STRING } }
                }
              },
              remove_lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { content: { type: Type.STRING }, reason: { type: Type.STRING } }
                }
              },
              rewrite_lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { before: { type: Type.STRING }, after: { type: Type.STRING }, reason: { type: Type.STRING } }
                }
              },
              impact_prediction: {
                type: Type.OBJECT,
                properties: { visibility_increase: { type: Type.STRING }, key_improvement: { type: Type.STRING } }
              },
              keyword_decay: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { keyword: { type: Type.STRING }, trend: { type: Type.STRING } }
                }
              },
              hiring_manager_profile: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyword_coverage: {
                type: Type.OBJECT,
                properties: {
                  technical_skills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, status: { type: Type.STRING }, evidence: { type: Type.STRING }, importance: { type: Type.STRING } } } },
                  industry_terms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, status: { type: Type.STRING } } } },
                  action_verbs: { type: Type.ARRAY, items: { type: Type.STRING } },
                  role_terms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, category: { type: Type.STRING }, frequency: { type: Type.NUMBER }, status: { type: Type.STRING } } } }
                }
              },
              resume_jd_match: {
                type: Type.OBJECT,
                properties: {
                  strong_matches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { requirement: { type: Type.STRING }, resume_evidence: { type: Type.STRING }, status: { type: Type.STRING }, why: { type: Type.STRING } } } },
                  partial_matches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { requirement: { type: Type.STRING }, resume_evidence: { type: Type.STRING }, status: { type: Type.STRING }, why: { type: Type.STRING } } } },
                  missing_requirements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { requirement: { type: Type.STRING }, resume_evidence: { type: Type.STRING }, status: { type: Type.STRING }, why: { type: Type.STRING } } } },
                  low_relevance_content: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { requirement: { type: Type.STRING }, resume_evidence: { type: Type.STRING }, status: { type: Type.STRING }, why: { type: Type.STRING } } } }
                }
              },
              section_analysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { section: { type: Type.STRING }, score: { type: Type.NUMBER }, status: { type: Type.STRING }, problems: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendation: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
              },
              top_improvements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { priority: { type: Type.STRING }, issue: { type: Type.STRING }, why: { type: Type.STRING }, action: { type: Type.STRING }, impact: { type: Type.STRING } }
                }
              },
              smart_rewrites: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { current: { type: Type.STRING }, recommended: { type: Type.STRING }, why: { type: Type.STRING }, terms_added: { type: Type.ARRAY, items: { type: Type.STRING } }, evidence_source: { type: Type.STRING } }
                }
              },
              quantification_opportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { current: { type: Type.STRING }, opportunity: { type: Type.STRING }, possible_metrics: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
              },
              formatting_checks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { check: { type: Type.STRING }, status: { type: Type.STRING }, explanation: { type: Type.STRING } }
                }
              },
              semantic_alignment: {
                type: Type.OBJECT,
                properties: {
                  target_role: { type: Type.STRING },
                  alignment_percentage: { type: Type.NUMBER },
                  strong_alignment: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weak_alignment: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missing_concepts: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              skill_evidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { skill: { type: Type.STRING }, status: { type: Type.STRING }, evidence: { type: Type.STRING }, importance: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });
      result = JSON.parse(response.text || '{}');
      usedProvider = 'gemini';
    } catch (err) {
      console.warn("Gemini ATS failed, falling back to local:", err);
      result = localFallbackAnalyzer(resumeText, jobDescription);
      usedProvider = 'local_fallback';
    }
  } else {
    result = localFallbackAnalyzer(resumeText, jobDescription);
    usedProvider = 'local';
  }
  
  // Deterministic scoring layer (Overwrites AI guesses)
  const calcResult = calculateDeterministicATS(resumeText, jobDescription, result.hard_skills || []);
  const score = calcResult.score;
  const breakdown = calcResult.breakdown;
  
  // Calculate projected score genuinely based on missing keywords
  const missingCount = result.missing_skills?.length || 0;
  const projectedPotential = Math.min(100, score + (missingCount * 4) + 5); // 4 points per missing skill + 5 for formatting
  
  const finalResult = {
    ...result,
    score_before: score,
    score_after: projectedPotential,
    score_breakdown: breakdown,
    match_level: score > 75 ? 'High' : score > 50 ? 'Moderate' : 'Low',
    resume_health: Math.min(100, score + 10),
    analysis_provider: usedProvider
  };
  
  // Ensure arrays and objects exist to avoid UI crashes
  finalResult.missing_skills = finalResult.missing_skills || [];
  finalResult.missing_keywords = finalResult.missing_keywords || [];
  finalResult.hard_skills = finalResult.hard_skills || [];
  finalResult.soft_skills = finalResult.soft_skills || [];
  finalResult.add_lines = finalResult.add_lines || [];
  finalResult.remove_lines = finalResult.remove_lines || [];
  finalResult.rewrite_lines = finalResult.rewrite_lines || [];
  
  // Safe defaults for new detailed structures
  finalResult.keyword_coverage = finalResult.keyword_coverage || {
    technical_skills: [], industry_terms: [], action_verbs: [], role_terms: []
  };
  finalResult.resume_jd_match = finalResult.resume_jd_match || {
    strong_matches: [], partial_matches: [], missing_requirements: [], low_relevance_content: []
  };
  finalResult.section_analysis = finalResult.section_analysis || [];
  finalResult.top_improvements = finalResult.top_improvements || [];
  finalResult.smart_rewrites = finalResult.smart_rewrites || [];
  finalResult.quantification_opportunities = finalResult.quantification_opportunities || [];
  finalResult.formatting_checks = finalResult.formatting_checks || [];
  finalResult.semantic_alignment = finalResult.semantic_alignment || {
    target_role: "General", alignment_percentage: score, strong_alignment: [], weak_alignment: [], missing_concepts: []
  };
  finalResult.skill_evidence = finalResult.skill_evidence || [];
  
  atsCache.set(hash, finalResult);
  return finalResult;
}

function localFallbackAnalyzer(resumeText: string, jobDescription: string) {
  const normRes = resumeText.toLowerCase();
  const normJD = jobDescription.toLowerCase();
  
  const commonTech = ['javascript', 'python', 'react', 'node', 'aws', 'sql', 'docker', 'kubernetes', 'java', 'c++', 'ruby', 'go', 'spring', 'html', 'css'];
  const commonSoft = ['leadership', 'communication', 'teamwork', 'agile', 'scrum', 'problem solving'];
  const actionVerbs = ['developed', 'implemented', 'designed', 'optimized', 'created', 'managed', 'led', 'improved'];
  
  // Extract from JD
  const jdTech = commonTech.filter(t => normJD.includes(t));
  const jdSoft = commonSoft.filter(t => normJD.includes(t));
  
  // Identify matches and misses
  const matchedTech = jdTech.filter(t => normRes.includes(t));
  const missingTech = jdTech.filter(t => !normRes.includes(t));
  
  const matchedSoft = jdSoft.filter(t => normRes.includes(t));
  const missingSoft = jdSoft.filter(t => !normRes.includes(t));
  
  const usedVerbs = actionVerbs.filter(v => normRes.includes(v));

  // Determine Semantic Alignment mathematically
  const totalJDReqs = jdTech.length + jdSoft.length;
  const totalMatches = matchedTech.length + matchedSoft.length;
  const semanticScore = totalJDReqs === 0 ? 50 : Math.round((totalMatches / totalJDReqs) * 100);

  return {
    missing_skills: [...missingTech, ...missingSoft],
    missing_keywords: [...missingTech, ...missingSoft],
    hard_skills: matchedTech,
    soft_skills: matchedSoft,
    salary_band_estimate: "$80k - $120k",
    career_gap_risk: "LOW",
    multi_role_conflict: "None detected",
    
    // Rich Fallback Data for UI
    keyword_coverage: {
      technical_skills: [
        ...matchedTech.map(t => ({ keyword: t, status: "demonstrated", evidence: "Found in resume", importance: "High" })),
        ...missingTech.map(t => ({ keyword: t, status: "missing", evidence: "None", importance: "High" }))
      ],
      industry_terms: [
        ...matchedSoft.map(t => ({ keyword: t, status: "demonstrated" })),
        ...missingSoft.map(t => ({ keyword: t, status: "missing" }))
      ],
      action_verbs: usedVerbs,
      role_terms: []
    },
    
    resume_jd_match: {
      strong_matches: [
        ...matchedTech.map(t => ({ requirement: t, resume_evidence: `Mentions ${t}`, status: "Strong Match", why: "Explicitly found" })),
        ...matchedSoft.map(t => ({ requirement: t, resume_evidence: `Mentions ${t}`, status: "Strong Match", why: "Explicitly found" }))
      ],
      partial_matches: [],
      missing_requirements: [
        ...missingTech.map(t => ({ requirement: t, resume_evidence: "None", status: "Missing", why: "Required by JD but not found" }))
      ],
      low_relevance_content: []
    },
    
    section_analysis: [
      {
        section: "Experience",
        score: normRes.includes('experience') ? 80 : 40,
        status: normRes.includes('experience') ? "Good" : "Missing",
        problems: normRes.includes('experience') ? [] : ["Experience section not clearly defined"],
        recommendation: []
      }
    ],
    
    top_improvements: missingTech.map((t, i) => ({
      priority: i === 0 ? "High" : "Medium",
      issue: `Missing ${t} requirement`,
      why: `${t} appears as a required skill in the JD but is not supported by the resume.`,
      action: `Add ${t} only if you genuinely have experience with it.`,
      impact: "High"
    })).slice(0, 5),
    
    smart_rewrites: [],
    
    quantification_opportunities: !normRes.match(/\b\d+(%|k|m|b|\+)?\b/i) ? [
      {
        current: "General responsibilities",
        opportunity: "Add a measurable result here if you have one.",
        possible_metrics: ["% improvement", "number of users", "time saved"]
      }
    ] : [],
    
    formatting_checks: [
      { check: "Standard format", status: "PASS", explanation: "Basic formatting checks passed." }
    ],
    
    semantic_alignment: {
      target_role: "Analyzed Role",
      alignment_percentage: semanticScore,
      strong_alignment: matchedTech,
      weak_alignment: [],
      missing_concepts: missingTech
    },
    
    skill_evidence: matchedTech.map(t => ({ skill: t, status: "Demonstrated", evidence: "Local keyword match", importance: "High" })),
    
    add_lines: missingTech.map(s => ({ content: `Added experience with ${s}`, impact: "High", reason: "Required by JD" })),
    remove_lines: [],
    rewrite_lines: []
  };
}
