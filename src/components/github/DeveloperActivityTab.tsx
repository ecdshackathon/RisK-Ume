import React, { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  FolderGit2, 
  Star, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck, 
  Code2, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeveloperActivityReport } from '@/lib/developerActivityScorer';

interface StepProgress {
  step: number;
  text: string;
  status: 'pending' | 'in_progress' | 'done';
}

const DEFAULT_STEPS: StepProgress[] = [
  { step: 1, text: 'Connecting GitHub...', status: 'pending' },
  { step: 2, text: 'Fetching repositories...', status: 'pending' },
  { step: 3, text: 'Analyzing projects & code structure...', status: 'pending' },
  { step: 4, text: 'Analyzing commits & consistency...', status: 'pending' },
  { step: 5, text: 'Calculating developer activity score...', status: 'pending' },
  { step: 6, text: 'Generating AI explanation...', status: 'pending' },
];

export function DeveloperActivityTab() {
  const [username, setUsername] = useState('shadcn');
  const [customToken, setCustomToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<StepProgress[]>(DEFAULT_STEPS);
  const [report, setReport] = useState<DeveloperActivityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (targetUser?: string) => {
    const userToAnalyze = (targetUser || username).trim();
    if (!userToAnalyze) {
      setError('Please enter a GitHub username');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setReport(null);

    // Reset steps
    setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'pending' })));

    try {
      const tokenParam = customToken.trim() ? `&token=${encodeURIComponent(customToken.trim())}` : '';
      const eventSource = new EventSource(`/api/github/analyze-stream?username=${encodeURIComponent(userToAnalyze)}${tokenParam}`);

      eventSource.addEventListener('step', (e) => {
        try {
          const data = JSON.parse(e.data);
          setSteps(prev => prev.map(s => {
            if (s.step === data.step) {
              return { ...s, text: data.text || s.text, status: data.status };
            }
            if (s.step < data.step) {
              return { ...s, status: 'done' };
            }
            return s;
          }));
        } catch (err) {
          console.error('Error parsing SSE step', err);
        }
      });

      eventSource.addEventListener('complete', (e) => {
        try {
          const finalReport: DeveloperActivityReport = JSON.parse(e.data);
          setReport(finalReport);
          setIsAnalyzing(false);
          eventSource.close();
        } catch (err) {
          console.error('Error parsing final report', err);
          setIsAnalyzing(false);
          eventSource.close();
        }
      });

      eventSource.addEventListener('error', (e: any) => {
        console.warn('SSE stream error or complete:', e);
        // If report hasn't arrived, fetch via fallback endpoint
        eventSource.close();
        if (!report) {
          fetchFallback(userToAnalyze);
        }
      });

    } catch (err: any) {
      console.error(err);
      fetchFallback(userToAnalyze);
    }
  };

  const fetchFallback = async (userToAnalyze: string) => {
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToAnalyze, token: customToken.trim() || undefined })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze GitHub activity');
      }
      const data = await res.json();
      setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'done' })));
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting GitHub');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper colors for status
  const getStatusBadge = (label: string) => {
    switch (label) {
      case 'Strong Evidence':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 text-sm">Strong Evidence</Badge>;
      case 'Good Evidence':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 text-sm">Good Evidence</Badge>;
      case 'Partial Evidence':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1 text-sm">Partial Evidence</Badge>;
      case 'Weak Evidence':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1 text-sm">Weak Evidence</Badge>;
      default:
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-3 py-1 text-sm">No Evidence</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header section matching PDF spec */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💻</span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Real Developer Activity Analysis
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Feature #3
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Answers: <span className="font-medium text-gray-700">"Is this person actually developing and building things, or is their GitHub just an empty profile?"</span>
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Try sample:</span>
          {['shadcn', 'facebook', 'student-demo'].map(demo => (
            <button
              key={demo}
              onClick={() => {
                setUsername(demo);
                startAnalysis(demo);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              @{demo}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form & Rate Limit helper */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 font-mono">
                github.com/
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startAnalysis()}
                placeholder="username"
                className="pl-28 h-11 text-base font-medium"
                disabled={isAnalyzing}
              />
            </div>

            <Button
              onClick={() => startAnalysis()}
              disabled={isAnalyzing}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing GitHub...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  Analyze My GitHub
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Uses public GitHub REST API. Works 100% freely without requiring OAuth.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
            >
              <Key className="w-3 h-3" />
              {showTokenInput ? 'Hide Token Setting' : 'Add Personal Token (Optional)'}
            </button>
          </div>

          {showTokenInput && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2 animate-in fade-in duration-200">
              <p className="text-gray-600">
                GitHub allows 60 free unauthenticated checks/hr. To increase to 5,000/hr, paste an optional Personal Access Token (PAT):
              </p>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Stepper matching PDF Page 11 & 27 */}
      {isAnalyzing && (
        <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              Live Analysis Progress
            </CardTitle>
            <CardDescription className="text-xs">
              Streaming real-time event pipeline via Server-Sent Events (SSE)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((st) => (
                <div key={st.step} className="flex items-center gap-3 text-sm">
                  {st.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : st.status === 'in_progress' ? (
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`${st.status === 'done' ? 'text-gray-900 font-medium' : st.status === 'in_progress' ? 'text-indigo-700 font-medium' : 'text-gray-400'}`}>
                    {st.text}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Output Dashboard (Matching PDF page 7-10) */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {report.isDemoData && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span><strong>Demo Fallback Mode:</strong> Displaying simulated profile metrics to bypass GitHub IP rate limits freely.</span>
              </div>
            </div>
          )}

          {/* Top Summary Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score Card */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white flex flex-col justify-between">
              <div className="p-6 bg-gradient-to-br from-indigo-50/60 to-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold tracking-wider uppercase text-gray-500">
                    Developer Activity Score
                  </span>
                  {getStatusBadge(report.statusLabel)}
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black tracking-tight text-gray-900">
                    {report.overallScore}
                  </span>
                  <span className="text-xl font-medium text-gray-400">/ 100</span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      report.overallScore >= 80 ? 'bg-emerald-500' :
                      report.overallScore >= 60 ? 'bg-blue-500' :
                      report.overallScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, report.overallScore)}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Calculated deterministically using commit frequency, code recency, multi-project distribution, and repo quality.
                </p>
              </div>

              {/* Developer Profile Snippet */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                {report.avatarUrl ? (
                  <img src={report.avatarUrl} alt={report.username} className="w-10 h-10 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {report.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">@{report.username}</span>
                    <a 
                      href={`https://github.com/${report.username}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{report.bio || `${report.publicReposCount} repositories on record`}</p>
                </div>
              </div>
            </Card>

            {/* Sub-Score Breakdown (Matching PDF Page 10) */}
            <Card className="border border-gray-200 shadow-sm bg-white lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between">
                  <span>Deterministic Score Breakdown</span>
                  <Badge variant="secondary" className="text-xs font-normal">Weights Tuned</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Prevents reward inflation from meaningless automated commits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {[
                  { label: 'Recent Activity', score: report.subScores.recentActivity, weight: '25%', desc: 'Commits & updates in past 30-90 days' },
                  { label: 'Commit Consistency', score: report.subScores.commitConsistency, weight: '25%', desc: 'Even spread across months vs single spikes' },
                  { label: 'Project Maintenance', score: report.subScores.projectMaintenance, weight: '15%', desc: 'Descriptions, documentation & updates' },
                  { label: 'Contribution Volume', score: report.subScores.contributionVolume, weight: '20%', desc: 'Pull requests, issues & commits' },
                  { label: 'Repository Quality', score: report.subScores.repositoryQuality, weight: '15%', desc: 'Original code vs simple forks, tech variety' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-gray-800">{item.label}</span>
                        <span className="text-gray-400 ml-1.5 font-normal">({item.desc})</span>
                      </div>
                      <span className="font-bold text-gray-900 font-mono">{item.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-700" 
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline Chart (Matching PDF Page 9) */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Activity Timeline (Last 6 Months)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Visual proof of active development regularity over time
                  </CardDescription>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-indigo-600" />
                    <span className="text-gray-600">Commits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-gray-600">Pull Requests</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="commits" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Commits" />
                    <Bar dataKey="pullRequests" fill="#10b981" radius={[4, 4, 0, 0]} name="Pull Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Analysis: "Why is the score X?" + Actionable Roadmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Why is the score X? (Matching PDF Page 7 & 19) */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Why is the score {report.overallScore}?
                </CardTitle>
                <CardDescription className="text-xs">
                  Key evidence signals detected in candidate's repositories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    {r.type === 'positive' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : r.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{r.text}</span>
                  </div>
                ))}

                {report.aiSummary && (
                  <div className="mt-4 p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Technical Evaluator Assessment</span>
                    </div>
                    <p className="leading-relaxed text-indigo-900/90">{report.aiSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actionable Next Steps (Matching PDF Page 20) */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  How to Improve Developer Score
                </CardTitle>
                <CardDescription className="text-xs">
                  Clear development recommendations to reach next tier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.improvementSteps.length > 0 ? (
                  report.improvementSteps.map((imp, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-xs text-gray-700 font-medium leading-relaxed">{imp.step}</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                        +{imp.expectedImprovement} pts
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-4 text-center">
                    Excellent developer discipline! Continue maintaining ongoing projects.
                  </p>
                )}

                {/* Tech Stacks Observed */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Verified Tech Stacks
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topLanguages.map(lang => (
                      <Badge key={lang.name} variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                        {lang.name} ({lang.percentage}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Repositories Grid */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-600" />
                  Top Verified Repositories
                </span>
                <span className="text-xs text-gray-500 font-normal">
                  Showing top {report.topRepositories.length} of {report.analyzedReposCount} projects
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.topRepositories.map((repo) => (
                  <div 
                    key={repo.name} 
                    className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 bg-white"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {repo.name}
                        </span>
                        {repo.isFork && (
                          <Badge variant="outline" className="text-[10px] text-gray-500">Fork</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {repo.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span className="font-medium text-indigo-600">{repo.language || 'Plain'}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-gray-400" />
                          {repo.forks}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
