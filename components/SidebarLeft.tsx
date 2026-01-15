import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Wrench, Layers, Image as ImageIcon, Video, History } from 'lucide-react';

const SidebarLeft: React.FC = () => {
    const navigate = useNavigate();

    const navigateToCategory = (cat: string) => {
        navigate(`/tools?category=${encodeURIComponent(cat)}`);
    };

    return (
        <aside className="hidden lg:block w-64 px-2 py-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
            <div className="space-y-1 mb-6">
                <NavLink 
                    to="/tools" 
                    end
                    className={({ isActive }) => 
                        `flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${isActive ? "bg-gray-200 dark:bg-gray-800 text-black dark:text-white font-semibold" : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`
                    }
                >
                    <Home className="w-5 h-5" />
                    <span className="text-sm">Home</span>
                </NavLink>
                <NavLink 
                    to="/history" 
                    className={({ isActive }) => 
                        `flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${isActive ? "bg-gray-200 dark:bg-gray-800 text-black dark:text-white font-semibold" : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`
                    }
                >
                    <History className="w-5 h-5" />
                    <span className="text-sm">History</span>
                </NavLink>
            </div>

            <div className="border-t border-border-light dark:border-border-dark my-2"></div>

            <div className="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">
                Categories
            </div>
            <div className="space-y-1 mb-6">
                <div 
                    onClick={() => navigateToCategory('PDF Page Ops')}
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                >
                    <Layers className="w-5 h-5 text-red-500" />
                    <span className="text-sm">PDF Page Ops</span>
                </div>
                <div 
                    onClick={() => navigateToCategory('Image Tools')}
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                >
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">Image Tools</span>
                </div>
                <div 
                    onClick={() => navigateToCategory('Video Tools')}
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                >
                    <Video className="w-5 h-5 text-teal-500" />
                    <span className="text-sm">Video Tools</span>
                </div>
                <div 
                    onClick={() => navigateToCategory('PDF Security')}
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                >
                    <Wrench className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">Utilities</span>
                </div>
            </div>
        </aside>
    );
};

export default SidebarLeft;
