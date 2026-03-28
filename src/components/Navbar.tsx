import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Home, Briefcase, Bell, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const notifications = useStore((state) => state.notifications);
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
  };

  const navItems = user?.role === 'customer' 
    ? [
        { path: '/customer', icon: Home, label: 'Home' },
      ]
    : [
        { path: '/employee', icon: Briefcase, label: 'Jobs' },
      ];

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg"><Home size={18} /></span>
          CleanOps
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`text-sm font-medium ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-4">
            <button onClick={() => useStore.getState().clearNotifications()} className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {user?.name.charAt(0)}
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-2">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 min-w-[64px] ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                <Icon size={24} className={isActive ? 'fill-blue-50' : ''} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => useStore.getState().clearNotifications()} className="relative flex flex-col items-center p-2 min-w-[64px] text-slate-400">
            <div className="relative">
              <Bell size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Alerts</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center p-2 min-w-[64px] text-slate-400">
            <LogOut size={24} />
            <span className="text-[10px] font-medium mt-1">Log Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
