import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ShieldAlert, Target, Activity, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Check, X, Download, Loader2, UploadCloud, Calculator } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function DashboardTab({ onNavigate }: { onNavigate: (tab: 'risk' | 'ats') => void }) {
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [ewrsData, setEwrsData] = useState<EWRSReport | null>(null);

  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!token) return;

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
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="flex justify-center py-20">Loading dashboard...</div>;
  }

  const latest = data?.latestAssessment;
  const healthScore = latest?.resume_health || 0;
  const atsScore = latest?.ats_score_after || 0;
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

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Job Readiness Score</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{riskLevel}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAlgorithm(true)} className="text-xs bg-white text-amber-700 border-amber-200 hover:bg-amber-50 h-7 px-2">
                  <Calculator className="w-3.5 h-3.5 mr-1" />
                  Algorithm
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
              Evidence-Weighted Readiness (EWRS)
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <p className="font-medium text-gray-900">{data?.weeklyTrends.role} Demand</p>
                  <p className="text-sm text-gray-500">Industry-wide hiring volume</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                  {data?.weeklyTrends.demandChange}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Your Skill: "{data?.weeklyTrends.topSkill}"</p>
                  <p className="text-sm text-gray-500">Market trend analysis</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                  Trending {data?.weeklyTrends.skillTrend}
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
                You rank in the top <span className="text-emerald-400">{data?.benchmarking.percentile}%</span>
              </p>
              <p className="text-indigo-200 text-sm">
                Compared to other {data?.benchmarking.group} in our anonymized dataset.
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
            <span><strong>18,000+</strong> Resumes Benchmarked</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Real-time Market Demand Signals</span>
          </div>
        </div>
      </div>

      {/* Algorithm Transparency Modal */}
      {showAlgorithm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2 text-indigo-900">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold">EWRS Algorithm Explorer</h2>
              </div>
              <button onClick={() => setShowAlgorithm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              <p className="text-gray-600 text-sm">
                Unlike traditional ATS systems that rely on keyword matching, Risk-Ume uses a deterministic <strong>Evidence-Weighted Readiness Score (EWRS)</strong> to calculate actual employability based on verifiable proofs.
              </p>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-sm shadow-inner overflow-x-auto">
                <p className="text-gray-400 mb-2">// The core EWRS mathematical formula</p>
                <p>EWRS = (α × Claim_Relevance) + (β × Evidence_Confidence) - (γ × Skill_Decay_Penalty)</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">How we calculate Evidence Confidence (β):</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold text-xs">30%</span>
                    <span><strong>Project Complexity:</strong> Analyzes repository size, stars, and architecture.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold text-xs">25%</span>
                    <span><strong>Code Evidence:</strong> Verifies actual implementation of the framework/language in source code.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-xs">20%</span>
                    <span><strong>Recency (PushEvents):</strong> Validates recent GitHub activity to ensure the skill isn't rusty.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold text-xs">15%</span>
                    <span><strong>Resume Claim:</strong> Base points for explicitly claiming the skill on the resume.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold text-xs">10%</span>
                    <span><strong>Documentation:</strong> Checks for READMEs, system designs, and deployment configs.</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 text-sm flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  The Skill Decay Penalty (γ)
                </h3>
                <p className="text-sm text-red-700">
                  If our engine detects that a claimed skill has not been actively pushed to a repository in over <strong>180 days</strong>, a progressive mathematical penalty is applied to the overall readiness score.
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <Button onClick={() => setShowAlgorithm(false)} className="bg-indigo-600 hover:bg-indigo-700">
                Close Explorer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

