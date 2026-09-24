import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ label, value, color }) => (
  <div className="card">
    <p className="text-slate-400 text-sm">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (_) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-slate-400 mt-1">Here&apos;s your task overview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card text-red-400 text-center py-8">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total" value={stats?.total ?? 0} color="text-white" />
            <StatCard label="Todo" value={stats?.todo ?? 0} color="text-slate-300" />
            <StatCard label="In Progress" value={stats?.inProgress ?? 0} color="text-sky-400" />
            <StatCard label="Completed" value={stats?.completed ?? 0} color="text-emerald-400" />
            <StatCard label="Overdue" value={stats?.overdue ?? 0} color="text-red-400" />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/tasks" className="btn-primary">View All Tasks</Link>
              <Link to="/tasks?new=1" className="btn-secondary">Create New Task</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
