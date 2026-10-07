import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function LearningTimeline({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/learning-consistency', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.overall_score !== undefined) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await fetch('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ github_username: 'demo_user' })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-4 border rounded shadow-sm bg-white animate-pulse h-64"></div>;

  if (!data || data.monthly_activity.length === 0) {
    return (
      <div className="p-6 border rounded shadow-sm bg-white text-center mt-6">
        <h3 className="text-lg font-semibold mb-2">Time / Consistency Learning Signal</h3>
        <p className="text-gray-500 mb-4">Connect your GitHub to see your learning consistency over time.</p>
        <button onClick={handleSync} disabled={syncing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {syncing ? 'Syncing...' : 'Sync GitHub Activity'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded shadow-sm bg-white mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Learning Consistency Signal</h3>
        <div className="text-2xl font-bold text-blue-600">{data.overall_score}/100</div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6 text-center text-sm">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-500">Activity</div>
          <div className="font-bold text-lg">{data.activity_consistency}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-500">Skill Growth</div>
          <div className="font-bold text-lg">{data.skill_growth}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-500">Proj. Maint.</div>
          <div className="font-bold text-lg">{data.project_maintenance}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-500">Recent</div>
          <div className="font-bold text-lg">{data.recent_learning}</div>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-gray-700 mb-2">Activity Timeline (Last 6 Months)</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthly_activity}>
            <XAxis dataKey="month" tick={{fontSize: 12}} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Primary Skills Timeline</h4>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {data.monthly_activity.map((m: any, i: number) => (
            m.primary_skill && (
              <div key={i} className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                <span className="font-bold">{m.month}:</span> {m.primary_skill}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
