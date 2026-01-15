import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Toolbox from './components/Toolbox';
import ToolDetail from './components/ToolDetail';

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check local storage or preference
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <HashRouter>
            <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
                <Navbar 
                    toggleSidebar={toggleSidebar} 
                    toggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                />
                
                <div className="flex max-w-[1600px] mx-auto pt-4 justify-center">
                    <SidebarLeft />
                    
                    <main className="flex-1 px-0 md:px-4 lg:px-6 pb-10 min-w-0">
                        <Routes>
                            <Route path="/" element={<Navigate to="/tools" replace />} />
                            <Route path="/tools" element={<Toolbox />} />
                            <Route path="/tool/:id" element={<ToolDetail />} />
                            <Route path="*" element={<Navigate to="/tools" replace />} />
                        </Routes>
                    </main>

                    <SidebarRight />
                </div>
            </div>
        </HashRouter>
    );
};

export default App;