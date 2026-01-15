import React from 'react';
import { Tool } from '../types';

interface ToolCardProps {
    tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
    return (
        <div className={`group bg-white dark:bg-card-dark rounded-md border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md h-full flex flex-col ${tool.isComingSoon ? 'opacity-75' : ''}`}>
            <div className="p-4 flex flex-col h-full relative">
                {tool.isComingSoon && (
                    <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 ${tool.bgColor} rounded-lg ${tool.color}`}>
                        <tool.icon className="w-6 h-6" />
                    </div>
                    {tool.badge && !tool.isComingSoon && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300`}>
                            {tool.badge}
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {tool.title}
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
                    {tool.description}
                </p>

                <button 
                    disabled={tool.isComingSoon}
                    className={`w-full py-2 font-medium rounded-full text-sm transition-all ${
                        tool.isComingSoon 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 group-hover:bg-primary group-hover:text-white'
                    }`}
                >
                    {tool.ctaText}
                </button>
            </div>
        </div>
    );
};

export default ToolCard;
