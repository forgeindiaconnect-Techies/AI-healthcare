import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { colors } from '../../theme/colors';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full font-sans" style={{ background: colors.bg }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>
      
      <Sidebar sidebarOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="dashboard-main-content flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
