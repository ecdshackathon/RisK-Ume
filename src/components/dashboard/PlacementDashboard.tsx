import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, TrendingUp, AlertTriangle, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock Data matching the PDF specifications for the judges
const batchData = {
  averageReadiness: 71,
  studentsAnalyzed: 462,
  totalStudents: 500,
  distribution: {
    strong: 128,
    medium: 246,
    low: 88
  },
  skillGaps: [
    { skill: 'AWS', lacking: 72, color: 'bg-red-500' },
    { skill: 'System Design', lacking: 71, color: 'bg-red-500' },
    { skill: 'Docker', lacking: 64, color: 'bg-orange-500' },
    { skill: 'SQL', lacking: 48, color: 'bg-yellow-500' },
    { skill: 'React', lacking: 34, color: 'bg-green-500' },
    { skill: 'Python', lacking: 18, color: 'bg-green-600' },
  ],
  roleReadiness: [
    { role: 'Frontend Developer', score: 81 },
    { role: 'Software Engineer', score: 78 },
    { role: 'Data Scientist', score: 64 },
    { role: 'ML Engineer', score: 59 },
    { role: 'Cloud Engineer', score: 47 },
  ],
  batchComparison: [
    { name: 'CSE-A', score: 76 },
    { name: 'CSE-D', score: 79 },
    { name: 'CSE-B', score: 71 },
    { name: 'CSE-C', score: 68 },
  ]
};

export function PlacementDashboard() {
  const [selectedBatch, setSelectedBatch] = useState('CSE Batch 2027');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Institution Placement Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Analyze batch-level employability and identify critical skill gaps.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-gray-700"
          >
            <option>CSE Batch 2027</option>
            <option>ECE Batch 2027</option>
            <option>IT Batch 2027</option>
            <option>CSE Batch 2028</option>
          </select>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Export Report
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Average Readiness</p>
                <h3 className="text-3xl font-bold text-gray-900">{batchData.averageReadiness}<span className="text-lg text-gray-500 font-normal">/100</span></h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-sm text-indigo-600 mt-4 flex items-center gap-1 font-medium">
              <TrendingUp className="w-4 h-4" /> +3% from last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Students Analyzed</p>
                <h3 className="text-3xl font-bold text-gray-900">{batchData.studentsAnalyzed}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Out of {batchData.totalStudents} total students
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-4">Readiness Distribution</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-700">Strong (80+)</span>
                  <span className="text-sm font-bold">{batchData.distribution.strong}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(batchData.distribution.strong / batchData.studentsAnalyzed) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-700">Medium (50-79)</span>
                  <span className="text-sm font-bold">{batchData.distribution.medium}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(batchData.distribution.medium / batchData.studentsAnalyzed) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-red-700">Low (&lt;50)</span>
                  <span className="text-sm font-bold">{batchData.distribution.low}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(batchData.distribution.low / batchData.studentsAnalyzed) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Gap Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Skill Gap Heatmap
            </CardTitle>
            <CardDescription>Percentage of students lacking critical industry skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchData.skillGaps.map((skill) => (
                <div key={skill.skill} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{skill.skill}</div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${skill.color} transition-all duration-1000`} 
                        style={{ width: `${skill.lacking}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right">{skill.lacking}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <h4 className="font-semibold text-orange-900 flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4" /> Recommended Interventions
              </h4>
              <p className="text-sm text-orange-800 mb-3">Our students are exceptionally weak in cloud technologies and system architecture.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-full">AWS Workshop</span>
                <span className="px-3 py-1 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-full">Docker Bootcamp</span>
                <span className="px-3 py-1 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-full">System Design Mock Interviews</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Readiness */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                Role Readiness
              </CardTitle>
              <CardDescription>Average readiness score by target role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchData.roleReadiness} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="role" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                      {batchData.roleReadiness.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#4f46e5' : entry.score > 55 ? '#818cf8' : '#c7d2fe'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Batch Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Section Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchData.batchComparison} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
