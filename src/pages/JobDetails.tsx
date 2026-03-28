import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, MapPin, Clock, DollarSign, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const socket = useStore((state) => state.socket);
  
  const [job, setJob] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobDetails();
    fetchMessages();
    
    if (socket) {
      socket.emit('join_job', id);
      
      const handleNewMessage = (msg: any) => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      };
      
      const handleStatusUpdate = (updatedJob: any) => {
        setJob(updatedJob);
      };
      
      socket.on('new_message', handleNewMessage);
      socket.on('job_status_updated', handleStatusUpdate);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('job_status_updated', handleStatusUpdate);
      };
    }
  }, [id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchJobDetails = async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/jobs/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send_message', {
      jobId: id,
      senderId: user?.id,
      text: newMessage,
    });
    
    setNewMessage('');
  };

  const handleAction = async (action: string) => {
    let endpoint = `/api/jobs/${id}/status`;
    let body: any = { status: action };
    
    if (action === 'CLAIM') {
      endpoint = `/api/jobs/${id}/claim`;
      body = { employeeId: user?.id };
    } else if (action === 'APPROVE') {
      endpoint = `/api/jobs/${id}/approve`;
      body = {};
    }
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (res.ok) {
      const updatedJob = await res.json();
      setJob(updatedJob);
      
      if (action === 'APPROVE') {
        const userRes = await fetch(`/api/users/${user?.id}`);
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          useStore.getState().setUser(updatedUser);
        }
      }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!job) return null;

  const isCustomer = user?.role === 'customer';
  const isEmployee = user?.role === 'employee';
  const canChat = job.status !== 'OPEN' && (job.customerId === user?.id || job.employeeId === user?.id);

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
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-73px)] max-w-4xl mx-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-slate-900 truncate">Job Details</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded font-bold ${getStatusColor(job.status)}`}>
              {job.status.replace('_', ' ')}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500 font-medium">${job.price}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {/* Job Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tasks</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {job.tasks.map((task: string, i: number) => (
              <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                {task}
              </span>
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-0.5"><MapPin size={18} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Location</p>
                <p className="text-sm font-medium text-slate-900">{job.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600 mt-0.5"><Clock size={18} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Posted</p>
                <p className="text-sm font-medium text-slate-900">{formatDistanceToNow(new Date(job.createdAt))} ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mt-0.5"><DollarSign size={18} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Price</p>
                <p className="text-sm font-medium text-slate-900">${job.price} (Escrowed)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        {job.status !== 'COMPLETED' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {isEmployee && job.status === 'OPEN' && (
              <button onClick={() => handleAction('CLAIM')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> Claim Job
              </button>
            )}
            
            {isEmployee && job.status === 'IN_PROGRESS' && (
              <button onClick={() => handleAction('PENDING_REVIEW')} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> Submit for Review
              </button>
            )}
            
            {isCustomer && job.status === 'PENDING_REVIEW' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-xl text-sm">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p>The cleaner has finished the job. Please review and approve to release the payment.</p>
                </div>
                <button onClick={() => handleAction('APPROVE')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} /> Approve & Pay
                </button>
              </div>
            )}
            
            {/* Status messages for when waiting on the other party */}
            {isCustomer && job.status === 'OPEN' && <p className="text-center text-slate-500 text-sm font-medium py-2">Waiting for a cleaner to claim this job...</p>}
            {isCustomer && job.status === 'IN_PROGRESS' && <p className="text-center text-slate-500 text-sm font-medium py-2">Cleaner is currently working on this job.</p>}
            {isEmployee && job.status === 'PENDING_REVIEW' && <p className="text-center text-slate-500 text-sm font-medium py-2">Waiting for customer to approve the job...</p>}
          </div>
        )}

        {/* Chat Area */}
        {canChat && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="bg-slate-50 border-b border-slate-100 p-3">
              <h3 className="font-bold text-slate-900 text-sm">Messages</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 text-sm mt-4">No messages yet. Say hi!</p>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
