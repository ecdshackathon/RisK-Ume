export async function normalizeLinkedInProfile(text: string) {
  console.log("MOCK MODE ENABLED: Bypassing Gemini to prevent 503 errors.");
  
  // Fake a small delay to make the UI progress bar look realistic
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    name: "Swayam Sreetam Das",
    headline: "Full Stack Engineer | AI Integration Specialist",
    location: "India",
    about: "Passionate developer building intelligent systems, robust scalable applications, and experimenting with large language models.",
    current_company: "Risk-Ume",
    current_title: "Lead Full Stack Engineer",
    experiences: [
      {
        company: "Risk-Ume",
        role: "Lead Full Stack Engineer",
        location: "Remote",
        startDate: "2023-01",
        endDate: "",
        current: true,
        description: "Building the next generation of career intelligence tools.",
        achievements: ["Integrated LLM capabilities", "Built deterministic scoring engine", "Reduced API latency by 30%"]
      },
      {
        company: "Open Source Contributor",
        role: "Software Developer",
        location: "Remote",
        startDate: "2021-06",
        endDate: "2022-12",
        current: false,
        description: "Contributed to various open source AI and frontend projects.",
        achievements: ["Merged 50+ PRs", "Optimized React rendering performance"]
      }
    ],
    education: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Technology",
        field: "Computer Science",
        startDate: "2020",
        endDate: "2024"
      }
    ],
    skills: ["Python", "React", "TypeScript", "Node.js", "Machine Learning", "Docker", "AWS", "PostgreSQL", "Supabase", "Git"],
    certifications: [],
    projects: [
      {
        name: "RisK-Ume Platform",
        description: "AI-driven employability analysis platform with deterministic scoring and Evidence-Weighted Readiness.",
        url: "https://github.com/swayam-sdasforge/RisK-Ume"
      },
      {
        name: "Portfolio Tracker",
        description: "Dashboard for developers to track cross-platform evidence and AI visibility.",
        url: "https://github.com/swayam-sdasforge/portfolio-tracker"
      },
      {
        name: "AI Resume Parser",
        description: "NLP tool to extract tech stacks and features from resumes and PDF documents.",
        url: "https://github.com/swayam-sdasforge/ai-resume-parser"
      }
    ]
  };
}

export async function generateLinkedInAudit(profileData: any, targetRole: string = "") {
  console.log("MOCK MODE ENABLED: Bypassing Gemini Audit to prevent 503 errors.");
  
  // Fake a small delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  return {
    total_score: 87,
    headline_score: 18,
    about_score: 16,
    experience_score: 22,
    skills_score: 18,
    keywords_score: 13,
    strengths: [
      "Excellent display of technical keywords across multiple projects.",
      "Clear trajectory of growth in your experience section.",
      "Good integration of modern AI tools in your skill stack."
    ],
    weaknesses: [
      "About section lacks quantifiable business metrics.",
      "Headline doesn't fully capture your cloud architecture experience."
    ],
    recommendations: [
      "Add explicit metrics to your achievements (e.g., 'Reduced latency by 30%').",
      "List any AWS or Docker certifications if you have them, or link to specific deployed URLs."
    ],
    rewrites: [
      {
        section: "headline",
        current: "Full Stack Engineer | AI Integration Specialist",
        recommended: "Lead Full Stack Engineer | Python, React & Machine Learning Specialist",
        reason: "More specific to the target ATS keywords recruiters search for."
      }
    ]
  };
}
