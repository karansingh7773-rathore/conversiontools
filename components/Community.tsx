import React from 'react';
import { useParams } from 'react-router-dom';
import { Bell, MoreHorizontal, Shield, Calendar, Users, Info, Flag } from 'lucide-react';
import Feed from './Feed';
import { COMMUNITIES } from '../constants';

const Community: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const communityName = id ? `r/${id}` : 'r/StudentHub';

    // Find community metadata or default
    const communityData = COMMUNITIES.find(c => c.name === communityName) || {
        color: 'text-primary',
        icon: null
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Banner Section */}
            <div className="relative mb-4">
                {/* Cover Image */}
                <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-b-md md:rounded-md"></div>

                {/* Header Info */}
                <div className="bg-white border border-border-light rounded-md -mt-4 mx-0 md:mx-4 p-4 relative shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="flex items-end gap-4">
                            {/* Community Icon */}
                            <div className="h-20 w-20 bg-white rounded-full p-1.5 -mt-10 md:-mt-12 flex-shrink-0 relative z-10">
                                <div className="h-full w-full bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-sm">
                                    {id ? id.substring(0, 2).toUpperCase() : 'SH'}
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 leading-none mb-1">{communityName}</h1>
                                <p className="text-sm text-gray-500">The official community for {id || 'StudentHub'} students.</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mb-1">
                            <button className="px-6 py-2 rounded-full bg-white border border-primary text-primary font-bold text-sm hover:bg-orange-50 transition-colors">
                                Joined
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 border border-gray-200">
                                <Bell className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 mt-6 border-b border-border-light overflow-x-auto no-scrollbar">
                        {['Posts', 'Wiki', 'Rules', 'Collections'].map((tab, idx) => (
                            <button
                                key={tab}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${idx === 0
                                    ? 'border-primary text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-0 md:px-4">
                {/* Main Feed Column */}
                <div className="lg:col-span-2">
                    <Feed />
                </div>

                {/* Right Sidebar for Community */}
                <div className="hidden lg:block space-y-4">
                    {/* About Widget */}
                    <div className="bg-white rounded-md border border-border-light p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">About Community</h2>
                            <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed mb-4">
                            Welcome to {communityName}! A place to discuss coursework, share notes, campus gossips, and connect with fellow students.
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created Sep 2026</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Shield className="w-4 h-4" />
                            <span>Restricted</span>
                        </div>

                        <div className="border-t border-border-light my-4"></div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-base font-bold text-gray-900">125k</div>
                                <div className="text-xs text-gray-500">Members</div>
                            </div>
                            <div>
                                <div className="text-base font-bold text-gray-900 flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    420
                                </div>
                                <div className="text-xs text-gray-500">Online</div>
                            </div>
                        </div>

                        <button className="w-full py-2 rounded-full bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity">
                            Create Post
                        </button>
                    </div>

                    {/* Rules Widget */}
                    <div className="bg-white rounded-md border border-border-light p-4 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{communityName} Rules</h2>
                        <div className="space-y-3">
                            {[
                                "Be respectful to others",
                                "No academic dishonesty",
                                "No spam or self-promotion",
                                "Keep discussions relevant",
                                "Protect student privacy"
                            ].map((rule, i) => (
                                <div key={i} className="flex gap-2 items-start text-sm">
                                    <span className="font-bold text-gray-900 min-w-[1.25rem]">{i + 1}.</span>
                                    <span className="text-gray-700">{rule}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Moderators */}
                    <div className="bg-white rounded-md border border-border-light p-4 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Moderators</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-primary font-medium hover:underline cursor-pointer">u/AutoModerator</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-primary font-medium hover:underline cursor-pointer">u/CampusAdmin</span>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Staff</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 mt-4 text-sm font-bold text-primary hover:bg-gray-50 px-2 py-1 rounded transition-colors w-fit">
                            <MessageSquareIcon className="w-4 h-4" />
                            Message Mods
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MessageSquareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export default Community;
