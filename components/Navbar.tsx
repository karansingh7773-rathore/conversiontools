import React from 'react';
import { Search, Menu, Moon, Sun, GraduationCap } from 'lucide-react';

interface NavbarProps {
    toggleSidebar: () => void;
    toggleDarkMode: () => void;
    isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, toggleDarkMode, isDarkMode }) => {
    return (
        <nav className="sticky top-0 z-50 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark px-4 py-2 flex items-center justify-between h-14 transition-colors">
            <div className="flex items-center space-x-4">
                <button 
                    className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-200"
                    onClick={toggleSidebar}
                >
                    <Menu className="w-6 h-6" />
                </button>
                <a href="#" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold hidden md:block tracking-tight text-gray-900 dark:text-white">CampusHub</span>
                </a>
                
            </div>

            <div className="flex-1 max-w-2xl px-4 hidden md:block">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all hover:bg-white dark:hover:bg-black hover:border-gray-200 dark:hover:border-gray-700"
                        placeholder="Search for tools..."
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                 <button 
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="hidden sm:block px-4 py-2 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    Log In
                </button>
                <button className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-red-600 rounded-full transition-colors shadow-sm">
                    Sign Up
                </button>
            </div>
        </nav>
    );
};

export default Navbar;