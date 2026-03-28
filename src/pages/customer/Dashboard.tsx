import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Plus, MapPin, Clock, DollarSign, ChevronRight, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CustomerDashboard() {
  const user = useStore((state) => state.user);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showPostJob, setShowPostJob] = useState(false);
  
  // Form state
  const [location, setLocation] = useState('');
  const [tasks, setTasks] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [price, setPrice] = useState('50');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await fetch(`/api/jobs?userId=${user?.id}&role=customer`);
    const data = await res.json();
    setJobs(data);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user?.id,
        location,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        tasks: tasks.split(',').map(t => t.trim()),
        urgency,
        price: Number(price),
      }),
    });
    if (res.ok) {
      setShowPostJob(false);
      fetchJobs();
      setLocation('');
      setTasks('');
      setPrice('50');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'PENDING_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your cleaning requests</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Balance</p>
          <p className="text-xl font-bold text-slate-900">${user?.balance}</p>
        </div>
      </div>

      {showPostJob ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-lg font-bold mb-4">Post a New Job</h2>
          <form onSubmit={handlePostJob} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Address</label>
              <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. 123 Main St, Apt 4B" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tasks (comma separated)</label>
              <input required type="text" value={tasks} onChange={e => setTasks(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Vacuum, Dusting, Kitchen" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="LOW">Low (Flexible)</option>
                  <option value="MEDIUM">Medium (Within 24h)</option>
                  <option value="HIGH">High (ASAP)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                <input required type="number" min="10" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowPostJob(false)} className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
              <button type="submit" className="flex-1 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">Post Job</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs yet</h3>
              <p className="text-slate-500 text-sm mb-6">Create your first cleaning request to get started.</p>
              <button onClick={() => setShowPostJob(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-md shadow-blue-200">
                <Plus size={20} /> Post a Job
              </button>
            </div>
          ) : (
            jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-bold text-slate-900">${job.price}</div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 truncate">{job.tasks.join(', ')}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> <span className="truncate max-w-[120px]">{job.location}</span></div>
                  <div className="flex items-center gap-1.5"><Clock size={16} className="text-slate-400" /> {formatDistanceToNow(new Date(job.createdAt))} ago</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {!showPostJob && jobs.length > 0 && (
        <button 
          onClick={() => setShowPostJob(true)}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 z-40"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
