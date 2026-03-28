import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('customer@cleanops.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to CleanOps</h1>
        <p className="text-slate-500 text-center mb-8">The smarter way to clean.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/signup" className="text-blue-600 font-semibold">Sign up</Link>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center mb-4">Demo Accounts</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => { setEmail('customer@cleanops.com'); setPassword('password'); }}
              className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Customer
            </button>
            <button 
              onClick={() => { setEmail('employee@cleanops.com'); setPassword('password'); }}
              className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cleaner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
