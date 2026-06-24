import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex bg-slate-50">

            <div className="fixed inset-0 -z-10 bg-slate-50/50 pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-purple-100/30 blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-200/20 blur-[120px]" />
            </div>

            {/* Sidebar (Handles its own mobile visibility) */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
                <Navbar />
                <main className="flex-grow p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};



export default DashboardLayout;
