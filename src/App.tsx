/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/customer/Dashboard';
import EmployeeFeed from './pages/employee/Feed';
import JobDetails from './pages/JobDetails';
import Navbar from './components/Navbar';

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: 'customer' | 'employee' }) {
  const user = useStore((state) => state.user);
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const user = useStore((state) => state.user);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        {user && <Navbar />}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/customer" element={<PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>} />
            <Route path="/employee" element={<PrivateRoute role="employee"><EmployeeFeed /></PrivateRoute>} />
            
            <Route path="/jobs/:id" element={<PrivateRoute><JobDetails /></PrivateRoute>} />
            
            <Route path="/" element={
              user ? (
                <Navigate to={user.role === 'customer' ? '/customer' : '/employee'} />
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
