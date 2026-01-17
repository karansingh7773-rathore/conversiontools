import React, { useEffect, useState } from 'react';

/**
 * VideoEditorRedirect - Redirects users to the new standalone video editor
 * 
 * The new video editor is deployed separately on Vercel and uses FFmpeg
 * on the HF Space backend for real video rendering.
 */

// Update this URL after deploying the video editor to Vercel
const VIDEO_EDITOR_URL = import.meta.env.VITE_VIDEO_EDITOR_URL || 'http://localhost:3000';

const VideoEditorRedirect: React.FC = () => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = VIDEO_EDITOR_URL;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
                <div className="mb-6">
                    <svg
                        className="w-16 h-16 mx-auto text-primary-500 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Video Editor
                </h1>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Opening the new video editor with advanced features...
                </p>

                <div className="text-5xl font-bold text-primary-500 mb-6">
                    {countdown}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Redirecting in {countdown} seconds...
                </p>

                <button
                    onClick={() => window.location.href = VIDEO_EDITOR_URL}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                    Open Now
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-400">
                        Features: Timeline editing • Cut & Trim • Speed control • FFmpeg rendering
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoEditorRedirect;
