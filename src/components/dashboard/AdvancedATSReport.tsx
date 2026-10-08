import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Star, FileText, ChevronRight, BarChart } from 'lucide-react';

export function AdvancedATSReport({ analysis }: { analysis: any }) {
  const getBadgeVariant = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes('strong') || s.includes('good') || s.includes('pass') || s.includes('demonstrated')) return 'default';
    if (s.includes('missing') || s.includes('fail')) return 'destructive';
    return 'secondary';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 mt-8">
      {/* SCORE BREAKDOWN */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart className="w-5 h-5 text-indigo-500" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Keyword Match", score: analysis.score_breakdown?.keyword_match || 0 },
              { label: "Hard Skills", score: analysis.score_breakdown?.hard_skill_match || 0 },
              { label: "Experience Relevance", score: analysis.score_breakdown?.experience_relevance || 0 },
              { label: "Role Alignment", score: analysis.score_breakdown?.role_alignment || 0 },
              { label: "ATS Parsability", score: analysis.score_breakdown?.ats_parsability || 0 },
              { label: "Quantified Impact", score: analysis.score_breakdown?.quantified_impact || 0 }
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-500 ease-out" 
                    style={{ width: `${item.score}%`, backgroundColor: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TOP IMPROVEMENTS */}
      {analysis.top_improvements?.length > 0 && (
        <Card className="border-0 shadow-md border-t-4 border-t-indigo-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-500 fill-indigo-100" />
              Top Improvements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.top_improvements.map((imp: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={imp.priority.toLowerCase() === 'high' ? 'destructive' : 'secondary'}>
                    Priority {idx + 1}
                  </Badge>
                  <h4 className="font-bold text-gray-900">{imp.issue}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{imp.why}</p>
                <div className="flex items-start gap-2 bg-indigo-50/50 p-3 rounded-lg">
                  <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Action: {imp.action}</p>
                    <p className="text-xs text-indigo-600 mt-1">Expected Impact: {imp.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* RESUME vs JD */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Resume ↔ Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysis.resume_jd_match?.strong_matches?.length > 0 && (
            <div>
              <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Strong Matches</h4>
              <div className="space-y-3">
                {analysis.resume_jd_match.strong_matches.map((m: any, i: number) => (
                  <div key={i} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                    <p className="font-medium text-gray-900">{m.requirement}</p>
                    <p className="text-sm text-gray-600 mt-1">Evidence: {m.resume_evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analysis.resume_jd_match?.missing_requirements?.length > 0 && (
            <div>
              <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> Missing Requirements</h4>
              <div className="space-y-3">
                {analysis.resume_jd_match.missing_requirements.map((m: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <p className="font-medium text-gray-900">{m.requirement}</p>
                    <p className="text-sm text-gray-600 mt-1">{m.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KEYWORD COVERAGE */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Keyword Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyword_coverage?.technical_skills?.map((t: any, i: number) => (
                  <Badge key={i} variant={getBadgeVariant(t.status)}>{t.keyword}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Action Verbs</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyword_coverage?.action_verbs?.map((v: string, i: number) => (
                  <Badge key={i} variant="outline" className="bg-gray-50">{v}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION ANALYSIS */}
      {analysis.section_analysis?.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Section Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.section_analysis.map((sec: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900">{sec.section}</h4>
                  <Badge variant={getBadgeVariant(sec.status)}>{sec.score}/100</Badge>
                </div>
                {sec.problems && sec.problems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-red-500 uppercase mb-1">Problems</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      {sec.problems.map((p: string, j: number) => <li key={j}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {sec.recommendation && sec.recommendation.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Recommendations</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      {sec.recommendation.map((r: string, j: number) => <li key={j}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SMART REWRITES */}
      {analysis.smart_rewrites?.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Smart Rewrites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.smart_rewrites.map((rw: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Current</p>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100 mt-1">{rw.current}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Recommended</p>
                  <p className="text-sm text-gray-900 font-medium bg-emerald-50 p-2 rounded border border-emerald-100 mt-1">{rw.recommended}</p>
                </div>
                <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Why:</span> {rw.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* QUANTIFICATION OPPORTUNITIES */}
      {analysis.quantification_opportunities?.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Quantification Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.quantification_opportunities.map((opp: any, i: number) => (
              <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm font-medium text-amber-900 mb-2">"{opp.current}"</p>
                <div className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p>{opp.opportunity}</p>
                    {opp.possible_metrics && opp.possible_metrics.length > 0 && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Metrics to consider: {opp.possible_metrics.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* FORMATTING CHECKS */}
      {analysis.formatting_checks?.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">ATS Formatting Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.formatting_checks.map((fc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    {fc.status.toLowerCase().includes('pass') ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="font-medium text-gray-900 text-sm">{fc.check}</span>
                  </div>
                  <span className="text-sm text-gray-600">{fc.explanation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEMANTIC ALIGNMENT */}
      {analysis.semantic_alignment && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Semantic Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Target Role</p>
              <p className="text-lg font-bold text-gray-900">{analysis.semantic_alignment.target_role}</p>
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Semantic Match</span>
                  <span className="text-sm font-bold text-indigo-600">{analysis.semantic_alignment.alignment_percentage}%</span>
                </div>
                <div className="w-full bg-indigo-50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${analysis.semantic_alignment.alignment_percentage}%` }} 
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold text-emerald-700 mb-2">Strong Alignment</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysis.semantic_alignment.strong_alignment?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-amber-600 mb-2">Weak Alignment</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysis.semantic_alignment.weak_alignment?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-600 mb-2">Missing Concepts</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysis.semantic_alignment.missing_concepts?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
