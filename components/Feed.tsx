import React, { useState } from 'react';
import { POSTS } from '../constants';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, MoreHorizontal, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

const Feed: React.FC = () => {
    const [filter, setFilter] = useState('Hot');

    return (
        <div className="max-w-3xl">
            {/* Create Post Input */}
            <div className="bg-white rounded-md border border-border-light p-2 mb-4 flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                     <div className="h-full w-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">SL</div>
                </div>
                <input 
                    type="text" 
                    placeholder="Create Post" 
                    className="bg-gray-100 hover:bg-white border border-transparent hover:border-blue-500 rounded-md flex-1 px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-md">
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-md">
                    <LinkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-md border border-border-light p-2 mb-4 flex items-center space-x-2 mb-4">
                 {['Best', 'Hot', 'New', 'Top'].map((f) => (
                     <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${filter === f ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                     >
                         {f}
                     </button>
                 ))}
                 <div className="flex-grow"></div>
                 <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full">
                     <MoreHorizontal className="w-5 h-5" />
                 </button>
            </div>

            {/* Posts */}
            <div className="space-y-3">
                {POSTS.map(post => (
                    <div key={post.id} className="bg-white rounded-md border border-border-light hover:border-gray-400 transition-colors cursor-pointer flex">
                        {/* Vote Column */}
                        <div className="w-10 bg-gray-50/50 rounded-l-md flex flex-col items-center py-2 space-y-1 border-r border-transparent">
                            <button className="text-gray-400 hover:text-primary hover:bg-gray-100 p-1 rounded">
                                <ArrowBigUp className="w-6 h-6" />
                            </button>
                            <span className="text-xs font-bold text-gray-900">{post.upvotes}</span>
                            <button className="text-gray-400 hover:text-blue-500 hover:bg-gray-100 p-1 rounded">
                                <ArrowBigDown className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Column */}
                        <div className="p-2 pb-1 flex-1">
                            {/* Meta */}
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                                <span className="font-bold text-gray-900 hover:underline">{post.subreddit}</span>
                                <span>•</span>
                                <span>Posted by <span className="hover:underline">u/{post.author}</span></span>
                                <span>{post.timestamp}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-medium text-gray-900 mb-2 pr-4">{post.title}</h3>

                            {/* Body */}
                            {post.content && (
                                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{post.content}</p>
                            )}
                            
                            {/* Image */}
                            {post.image && (
                                <div className="mb-3 rounded-md overflow-hidden border border-gray-100 max-h-[400px] flex justify-center bg-black">
                                    <img src={post.image} alt="Post content" className="object-contain h-full" />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-1 text-gray-500 text-xs font-bold">
                                <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{post.comments} Comments</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-colors">
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-colors">
                                    <span className="tracking-widest">...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Feed;
