import React, { useState, useEffect } from 'react';
import useBreakpoints from './useBreakpoints';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [stats, setStats] = useState(null);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, loyaltyRes, leaderboardRes, friendsRes] = await Promise.all([
        fetch('http://localhost:5000/api/activity/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/loyalty/calculate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/loyalty/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/friends', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (loyaltyRes.ok) setLoyaltyData(await loyaltyRes.json());
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      if (friendsRes.ok) setFriends(await friendsRes.json());
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  // Prepare chart data
  const actionData = stats?.breakdown?.map(item => ({
    name: item.action_type.replace('_', ' '),
    count: parseInt(item.count)
  })) || [];

  const loyaltyChartData = leaderboard.slice(0, 10).map((user, idx) => ({
    name: user.login,
    score: user.loyalty_score,
    rank: idx + 1
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your activity, loyalty, and social engagement
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Actions"
            value={stats?.overall?.total_actions || 0}
            icon="🎯"
            color="bg-blue-500"
          />
          <MetricCard
            title="Active Days"
            value={stats?.overall?.active_days || 0}
            icon="📅"
            color="bg-green-500"
          />
          <MetricCard
            title="Loyalty Score"
            value={loyaltyData?.loyaltyScore || 0}
            icon="⭐"
            color="bg-yellow-500"
          />
          <MetricCard
            title="Friends"
            value={friends.filter(f => f.status === 'accepted').length}
            icon="👥"
            color="bg-purple-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Activity Breakdown
            </h2>
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-10">No activity data yet</p>
            )}
          </div>

          {/* Loyalty Leaderboard Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Top 10 Loyalty Leaders
            </h2>
            {loyaltyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loyaltyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-10">No leaderboard data</p>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            🏆 Full Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Loyalty Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Active Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Collection Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((user, idx) => (
                  <tr key={user.login} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {idx < 3 ? (
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.login}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.loyalty_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.days_active} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.collection_size} items
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Friends Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            👥 Your Friends
          </h2>
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {friend.login}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      friend.status === 'accepted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {friend.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {friend.name} {friend.surname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Collection: {friend.collection_size} items
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">
              No friends yet. Start connecting with other collectors!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
      <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl`}>
        {icon}
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;