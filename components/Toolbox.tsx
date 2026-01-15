import React, { useState, useEffect } from 'react';
import { TOOLS } from '../constants';
import ToolCard from './ToolCard';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Toolbox: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All Tools');

    useEffect(() => {
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        } else {
            setSelectedCategory('All Tools');
        }
    }, [categoryParam]);

    const handleToolClick = (id: string) => {
        navigate(`/tool/${id}`);
    };

    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        if (cat === 'All Tools') {
            searchParams.delete('category');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ category: cat });
        }
    };

    const categories = [
        'All Tools',
        'PDF Page Ops',
        'PDF Office',
        'PDF Security',
        'PDF Advanced',
        'Image Tools',
        'Video Tools'
    ];

    const filteredTools = selectedCategory === 'All Tools' 
        ? TOOLS 
        : TOOLS.filter(tool => tool.category === selectedCategory);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="bg-white dark:bg-card-dark rounded-lg p-6 mb-6 shadow-sm border border-border-light dark:border-border-dark transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Utility Toolbox</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed">
                            A privacy-first suite of tools powered by Stirling PDF, ImgProxy, and FFmpeg. No file limits, no watermarks, secure on-device processing.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="px-5 py-2 rounded-full border border-primary text-primary font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                            API Docs
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-2 no-scrollbar">
                {categories.map((filter) => (
                    <button 
                        key={filter}
                        onClick={() => handleCategoryClick(filter)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                            selectedCategory === filter
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white dark:bg-card-dark border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {filteredTools.map((tool) => (
                    <div key={tool.id} onClick={() => handleToolClick(tool.id)}>
                        <ToolCard tool={tool} />
                    </div>
                ))}
            </div>
            
            {/* Empty State */}
            {filteredTools.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No tools found in this category.
                </div>
            )}
        </div>
    );
};

export default Toolbox;
