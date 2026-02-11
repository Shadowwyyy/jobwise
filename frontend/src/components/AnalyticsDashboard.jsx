import { useState, useEffect } from 'react';

export default function AnalyticsDashboard({ darkMode }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/analytics/stats');
      const data = await resp.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Resumes Uploaded"
          value={stats?.totals.resumes || 0}
          icon="📄"
          darkMode={darkMode}
        />
        <StatCard
          title="Jobs Analyzed"
          value={stats?.totals.job_descriptions || 0}
          icon="💼"
          darkMode={darkMode}
        />
        <StatCard
          title="Content Generated"
          value={stats?.totals.generated_content || 0}
          icon="✨"
          darkMode={darkMode}
        />
      </div>

      {/* Content type breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generated Content Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <TypeCard
            label="Cover Letters"
            count={stats?.by_type.cover_letters || 0}
            color="green"
            darkMode={darkMode}
          />
          <TypeCard
            label="Skill Matches"
            count={stats?.by_type.matches || 0}
            color="blue"
            darkMode={darkMode}
          />
          <TypeCard
            label="Interview Preps"
            count={stats?.by_type.interview_preps || 0}
            color="purple"
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity (Last 7 Days)</h3>
        {stats?.recent_activity.length > 0 ? (
          <div className="space-y-2">
            {stats.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{activity.count}x</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, darkMode }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function TypeCard({ label, count, color, darkMode }) {
  const colors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}