import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { MapPin, Clock, DollarSign, Navigation, ShieldCheck, Zap, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function EmployeeFeed() {
  const user = useStore((state) => state.user);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'active'>('feed');

  useEffect(() => {
    fetchFeed();
    fetchMyJobs();
    
    // Set up polling for new jobs
    const interval = setInterval(() => {
      if (activeTab === 'feed') fetchFeed();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchFeed = async () => {
    const res = await fetch('/api/jobs/feed');
    const data = await res.json();
    setJobs(data);
  };

  const fetchMyJobs = async () => {
    const res = await fetch(`/api/jobs?userId=${user?.id}&role=employee`);
    const data = await res.json();
    setMyJobs(data.filter((j: any) => j.status !== 'COMPLETED'));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Simple mock distance calculation
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const getUrgencyColor = (urgency: string) => {
    switch(urgency) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Available Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">Find work near you</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Earnings</p>
          <p className="text-xl font-bold text-emerald-600">${user?.balance}</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'feed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Job Feed
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Active Jobs {myJobs.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{myJobs.length}</span>}
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'feed' ? (
          jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs available</h3>
              <p className="text-slate-500 text-sm">Check back later for new requests in your area.</p>
            </div>
          ) : (
            jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border flex items-center gap-1.5 ${getUrgencyColor(job.urgency)}`}>
                    {job.urgency === 'HIGH' && <Zap size={12} className="fill-current" />}
                    {job.urgency} URGENCY
                  </div>
                  <div className="text-xl font-bold text-slate-900">${job.price}</div>
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2">{job.tasks.join(' • ')}</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <Navigation size={16} className="text-blue-500" />
                    <span className="font-medium">{calculateDistance(user!.lat, user!.lng, job.lat, job.lng)} km away</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <Clock size={16} className="text-slate-400" />
                    <span className="truncate">{formatDistanceToNow(new Date(job.createdAt))} ago</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500 border-t border-slate-100 pt-3">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </Link>
            ))
          )
        ) : (
          myJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No active jobs</h3>
              <p className="text-slate-500 text-sm">Head to the feed to claim a job.</p>
            </div>
          ) : (
            myJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${job.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                    {job.status.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-bold text-slate-900">${job.price}</div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 truncate">{job.tasks.join(', ')}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> <span className="truncate max-w-[120px]">{job.location}</span></div>
                </div>
              </Link>
            ))
          )
        )}
      </div>
    </div>
  );
}
