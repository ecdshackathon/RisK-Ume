import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ShieldAlert, Target, Activity, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Check, X, Download, Loader2, UploadCloud } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface EvidenceScore {
  skill: string;
  category?: string;
  claim_relevance: number;
  evidence_confidence: number;
  final_ewrs_score: number;
  reason: string;
  proof?: { repository: string; signals: string[] }[];
}

interface EWRSReport {
  overall_ewrs: number;
  skill_evidence_score: number;
  developer_activity_score: number | null;
  has_github: boolean;
  has_jd: boolean;
  verified_skills: EvidenceScore[];
  unverified_skills: EvidenceScore[];
}

function getCategoryLabel(score: number): string {
  if (score >= 80) return "Strong Evidence";
  if (score >= 60) return "Good Evidence";
  if (score >= 40) return "Partial Evidence";
  if (score > 0) return "Weak Evidence";
  return "No Evidence";
}

function SkillEvidenceCard({ skill }: { skill: EvidenceScore }) {
  const [expanded, setExpanded] = useState(false);
  
  const isVerified = skill.evidence_confidence >= 40;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-900">{skill.skill}</h4>
            <Badge variant="outline" className={isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
              {isVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Confidence <strong className="text-gray-900">{skill.evidence_confidence}%</strong></span>
            <span>Job Relevance <strong className="text-gray-900">{skill.claim_relevance}%</strong></span>
          </div>
        </div>
        <div className="text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50">
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evidence</p>
            {skill.proof && skill.proof.length > 0 ? (
              <div className="space-y-3">
                {skill.proof.map((repo, i) => (
                  <div key={i} className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Repository: {repo.repository}</p>
                    <ul className="space-y-1">
                      {repo.signals.map((sig, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-start">
                          <Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">No supporting repository evidence found.</p>
            )}
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Job Relevance</p>
            <p className="text-sm text-gray-700">
              {skill.claim_relevance >= 100 
                ? "Required by target job" 
                : "Not identified as a required skill in the provided job description"}
            </p>
          </div>
          
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Why this score?</p>
            {skill.reason === "AI Explanation unavailable." ? (
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm">
                <strong>Explanation temporarily unavailable.</strong>
                <p className="mt-1">Your numerical assessment is still available because Risk-Ume calculates scores independently of the AI explanation layer.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{skill.reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ResumeFile {
  name: string;
  created_at: string;
  id: string;
}

export function DashboardTab({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ewrsData, setEwrsData] = useState<EWRSReport | null>(null);

  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!token || !user) return;

    // Fetch user resumes
    const fetchResumes = async () => {
      try {
        const { data: files, error: listError } = await supabase.storage.from('resumes').list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
        
        if (listError) throw listError;
        const validFiles = (files || []).filter(f => f.name && !f.name.startsWith('.'));
        setResumes(validFiles as ResumeFile[]);
      } catch (err: any) {
        console.error("Failed to load resumes:", err);
        setResumesError("Unable to load your resumes.");
      } finally {
        setResumesLoading(false);
      }
    };
    fetchResumes();

    Promise.all([
      fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/readiness/calculate', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([dashRes, ewrsRes]) => {
        setData(dashRes);
        setEwrsData(ewrsRes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to calculate Job Readiness\n\nPlease try again.");
        setLoading(false);
      });
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Analyzing your evidence...</h3>
          <div className="text-left inline-block space-y-2 text-sm text-gray-600">
            <p className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Checking Resume</p>
            <p className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Checking Skills</p>
            <p className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Checking GitHub repositories</p>
            <p className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Checking Developer activity</p>
            <p className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Checking Job requirements</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to calculate Job Readiness</h3>
        <p className="text-gray-500 mb-6">Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const handleViewResume = async (fileName: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(`${user.id}/${fileName}`, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error("Failed to generate secure URL", err);
      alert("Unable to view resume. Please try again.");
    }
  };

  const handleUseForATS = async (fileName: string) => {
    if (!user || !token) return;
    try {
      const response = await fetch('/api/resume/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: `${user.id}/${fileName}`,
          filename: fileName
        })
      });
      if (!response.ok) throw new Error("Failed to extract text");
      const { text } = await response.json();
      localStorage.setItem('ats_resume_text', text);
      onNavigate('ats');
    } catch (err) {
      console.error("Failed to load resume text", err);
      alert("Unable to load resume for ATS. Please try again.");
    }
  };


  const latest = data?.latestAssessment;
  const healthScore = latest?.overall_score || 0;
  const atsScore = latest?.ats_score || 0;
  const riskLevel = ewrsData?.overall_ewrs ? Math.round(ewrsData.overall_ewrs) : 'Pending';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here is your career intelligence overview for this week.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onNavigate('ats')} className="bg-indigo-600 hover:bg-indigo-700">
            <Target className="w-4 h-4 mr-2" />
            Run New ATS Scan
          </Button>
          <Button variant="outline" onClick={() => onNavigate('risk')}>
            <ShieldAlert className="w-4 h-4 mr-2" />
            Check Market Trends
          </Button>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-600 mb-1">Resume Health</p>
                <h3 className="text-4xl font-bold text-gray-900">{healthScore}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
              Based on your latest scan
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">ATS Score (Latest)</p>
                <h3 className="text-4xl font-bold text-gray-900">{atsScore}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {latest ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                  Up from {latest.ats_score_before} before optimization
                </>
              ) : (
                'No scans yet'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white md:col-span-1">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Job Readiness Score</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-4xl font-bold text-gray-900">{riskLevel}</h3>
                  <span className="text-gray-500 font-medium">/ 100</span>
                </div>
                {ewrsData && (
                  <Badge className={`mt-2 bg-white text-amber-700 border-amber-200`}>
                    {getCategoryLabel(riskLevel as number)}
                  </Badge>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            
            {ewrsData && (
              <div className="mt-6 space-y-3 border-t border-amber-100 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Skill Evidence <span className="text-gray-400 font-normal">70%</span></span>
                  <span className="font-bold text-gray-900">{ewrsData.skill_evidence_score}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Developer Activity <span className="text-gray-400 font-normal">30%</span></span>
                  {ewrsData.developer_activity_score !== null ? (
                    <span className="font-bold text-gray-900">{ewrsData.developer_activity_score}</span>
                  ) : (
                    <span className="text-amber-600 italic">Not available</span>
                  )}
                </div>
                
                {ewrsData.developer_activity_score !== null ? (
                  <div className="text-xs text-gray-500 mt-2 bg-amber-50/50 p-2 rounded border border-amber-100">
                    {ewrsData.skill_evidence_score} × 0.70 + {ewrsData.developer_activity_score} × 0.30 = {Math.round(ewrsData.overall_ewrs)}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                    GitHub activity was not included because no verified GitHub data was available.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Missing Data Warnings */}
      {ewrsData && (!ewrsData.has_github || !ewrsData.has_jd || (ewrsData.verified_skills.length === 0 && ewrsData.unverified_skills.length === 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!ewrsData.has_github && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Activity className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 text-sm">GitHub Activity Not available</p>
                <p className="text-xs text-blue-700 mt-1">Connect GitHub to include developer activity in your Job Readiness Score.</p>
              </div>
            </div>
          )}
          {!ewrsData.has_jd && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
              <Target className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-purple-900 text-sm">Job-specific relevance Limited</p>
                <p className="text-xs text-purple-700 mt-1">Add a target job description for more precise skill relevance analysis.</p>
              </div>
            </div>
          )}
          {(ewrsData.verified_skills.length === 0 && ewrsData.unverified_skills.length === 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 text-sm">No verifiable skills detected.</p>
                <p className="text-xs text-red-700 mt-1">Your resume did not contain any parseable skills.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Resumes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            My Resumes
          </h2>
        </div>
        
        {resumesLoading ? (
          <div className="flex justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-gray-500">Loading your resumes...</span>
          </div>
        ) : resumesError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-100">
            <p className="text-red-600 mb-4">{resumesError}</p>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">No resumes uploaded yet.</p>
            <Button onClick={() => onNavigate('builder')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload Resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-gray-900 truncate" title={resume.name}>
                    {resume.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Uploaded {new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewResume(resume.name)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUseForATS(resume.name)}
                  >
                    Use for ATS
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Skills Assessment Section */}
      {ewrsData && (
        <div className="space-y-8">
          {ewrsData.verified_skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                Verified Skills
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ewrsData.verified_skills.map((skill, idx) => (
                  <SkillEvidenceCard key={idx} skill={skill} />
                ))}
              </div>
            </div>
          )}
          
          {ewrsData.unverified_skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                Unverified Claims
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ewrsData.unverified_skills.map((skill, idx) => (
                  <SkillEvidenceCard key={idx} skill={skill} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Intelligence */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Weekly Career Intelligence
            </CardTitle>
            <CardDescription>Market signals for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{data?.weeklyTrends?.role} Demand</p>
                  <p className="text-sm text-gray-500">Industry-wide hiring volume</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                  {data?.weeklyTrends?.demandChange}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Your Skill: "{data?.weeklyTrends?.topSkill}"</p>
                  <p className="text-sm text-gray-500">Market trend analysis</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                  Trending {data?.weeklyTrends?.skillTrend}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Docker Demand</p>
                  <p className="text-sm text-gray-500">Related technology</p>
                </div>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                  -3%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benchmarking & Probability */}
        <div className="space-y-8">
          <Card className="border-0 shadow-md bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
            <CardContent className="p-8 relative z-10">
              <h3 className="text-lg font-medium text-indigo-200 mb-2">Competitive Ranking</h3>
              <p className="text-3xl font-bold mb-4">
                You rank in the top <span className="text-emerald-400">{data?.benchmarking?.percentile}%</span>
              </p>
              <p className="text-indigo-200 text-sm">
                Compared to other {data?.benchmarking?.group} in our anonymized dataset.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Interview Probability Predictor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Current Likelihood</span>
                <span className="font-bold text-gray-900">{latest?.interview_prob_before || 42}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: `${latest?.interview_prob_before || 42}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">After Optimization</span>
                <span className="font-bold text-emerald-600">{latest?.interview_prob_after || 67}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${latest?.interview_prob_after || 67}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Based on ATS score, skill alignment, and role demand.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust & Credibility Layer */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Intelligence Powered By</h4>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span><strong>2,400+</strong> Job Descriptions Analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span><strong>{data?.benchmarking?.total_resumes_analyzed?.toLocaleString() || '18,000'}+</strong> Resumes Benchmarked</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Real-time Market Demand Signals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
