import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, FileText, Briefcase, Download } from 'lucide-react';
import { analyzeATS, ATSAnalysis } from '@/lib/gemini';
import { ATSUploadPanel } from './ATSUploadPanel';
import { JobDescriptionInput } from './JobDescriptionInput';
import { ATSScoreMeter } from './ATSScoreMeter';
import { GapAnalysisCard } from './GapAnalysisCard';
import { ResumeDiffViewer } from './ResumeDiffViewer';
// removed IntelligencePanel import
import { AdvancedATSReport } from './AdvancedATSReport';
import { motion, AnimatePresence } from 'motion/react';
import { generateOptimizedResume } from '@/lib/docxGenerator';
import { useAuth } from '@/lib/auth';

function normalizeATSResponse(raw: any): ATSAnalysis {
  return {
    ...raw,
    score_before: typeof raw.score_before === 'number' ? raw.score_before : 50,
    score_after: typeof raw.score_after === 'number' ? raw.score_after : 50,
    score_breakdown: raw.score_breakdown || {
      keyword_match: 0,
      hard_skill_match: 0,
      experience_relevance: 0,
      role_alignment: 0,
      ats_parsability: 0,
      quantified_impact: 0
    },
    top_improvements: Array.isArray(raw.top_improvements) ? raw.top_improvements : [],
    resume_jd_match: raw.resume_jd_match || { strong_matches: [], partial_matches: [], missing_requirements: [], low_relevance_content: [] },
    keyword_coverage: raw.keyword_coverage || { technical_skills: [], industry_terms: [], action_verbs: [], role_terms: [] },
    section_analysis: Array.isArray(raw.section_analysis) ? raw.section_analysis : [],
    smart_rewrites: Array.isArray(raw.smart_rewrites) ? raw.smart_rewrites : [],
    quantification_opportunities: Array.isArray(raw.quantification_opportunities) ? raw.quantification_opportunities : [],
    formatting_checks: Array.isArray(raw.formatting_checks) ? raw.formatting_checks : [],
    semantic_alignment: raw.semantic_alignment || { target_role: "General", alignment_percentage: 0, strong_alignment: [], weak_alignment: [], missing_concepts: [] },
    missing_skills: Array.isArray(raw.missing_skills) ? raw.missing_skills : [],
    missing_keywords: Array.isArray(raw.missing_keywords) ? raw.missing_keywords : [],
    hard_skills: Array.isArray(raw.hard_skills) ? raw.hard_skills : [],
    soft_skills: Array.isArray(raw.soft_skills) ? raw.soft_skills : [],
    add_lines: Array.isArray(raw.add_lines) ? raw.add_lines : [],
    remove_lines: Array.isArray(raw.remove_lines) ? raw.remove_lines : [],
    rewrite_lines: Array.isArray(raw.rewrite_lines) ? raw.rewrite_lines : [],
  } as ATSAnalysis;
}

export function ATSOptimizer({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { token } = useAuth();
  const [resumeText, setResumeText] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ats_resume_text');
      if (saved) {
        localStorage.removeItem('ats_resume_text');
        return saved;
      }
    }
    return '';
  });
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      setError('Please provide both your resume and the job description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze resume.');
      }
      
      const result = await response.json();
      setAnalysis(normalizeATSResponse(result));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {!analysis ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-indigo-600 text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle>Step 1: Your Resume</CardTitle>
                </div>
                <CardDescription className="text-indigo-100">
                  Paste your resume text or upload a text file.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ATSUploadPanel onTextChange={setResumeText} value={resumeText} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <CardTitle>Step 2: Job Description</CardTitle>
                </div>
                <CardDescription className="text-emerald-100">
                  Paste the full job description you're targeting.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <JobDescriptionInput onTextChange={setJobDescription} value={jobDescription} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col items-center gap-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            <Button 
              size="lg" 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full max-w-md h-14 text-lg font-bold shadow-xl shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                'Analyze & Optimize Resume'
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                {(analysis as any).analysis_provider && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium border border-gray-200">
                    {(analysis as any).analysis_provider === 'gemini' ? 'AI Analysis' : 
                     (analysis as any).analysis_provider === 'cache' ? 'Cached Analysis' : 
                     (analysis as any).analysis_provider === 'local_fallback' ? 'Local Fallback' : 'Local Analysis'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>New Analysis</Button>
                {onNavigate && (
                  <Button 
                    variant="outline" 
                    onClick={() => onNavigate('builder')}
                    className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Resume Builder
                  </Button>
                )}
                <Button 
                  onClick={() => generateOptimizedResume(resumeText, analysis)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download DOCX
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Score & Summary */}
              <div className="lg:col-span-1 space-y-8">
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-8">
                    <h3 className="text-center font-bold text-gray-900 mb-6">ATS Compatibility Score</h3>
                    <ATSScoreMeter 
                      before={analysis.score_before} 
                      after={analysis.score_after} 
                      level={analysis.match_level} 
                    />
                  </div>
                  <CardContent className="p-6 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Projected Improvement</p>
                        <p className="text-xs text-emerald-700">+{analysis.score_after - analysis.score_before} points increase</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <div className="lg:col-span-2 space-y-8">
                <AdvancedATSReport analysis={analysis} />
                
                <div className="pt-12 mt-12 border-t border-gray-200">
                  <h3 className="text-xl font-bold text-gray-400 mb-6 uppercase tracking-wider">Advanced Analysis & Legacy Metrics</h3>
                  <div className="space-y-8 opacity-80">
                    <GapAnalysisCard 
                      missingSkills={analysis.missing_skills} 
                      missingKeywords={analysis.missing_keywords} 
                      hardSkills={analysis.hard_skills}
                      softSkills={analysis.soft_skills}
                    />
                    
                    <ResumeDiffViewer 
                      addLines={analysis.add_lines}
                      removeLines={analysis.remove_lines}
                      rewriteLines={analysis.rewrite_lines}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
