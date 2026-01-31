import React from 'react';
import { Video, FileText } from 'lucide-react';

const SidebarRight: React.FC = () => {
    return (
        <aside className="hidden xl:block w-80 px-4 py-4 sticky top-14 h-fit space-y-4">
            {/* Updates Widget */}
            <div className="bg-white dark:bg-card-dark rounded-md border border-border-light dark:border-border-dark p-3 shadow-sm transition-colors">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide">Recent Tool Updates</h3>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Video className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 leading-tight hover:underline cursor-pointer">Video Compressor updated</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Added target size & advanced options</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 leading-tight hover:underline cursor-pointer">PDF Compressor updated</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Added target file size support</p>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    View Changelog
                </button>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 sticky top-[calc(100vh-10rem)]">
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
                    <a href="#" className="hover:underline">Terms of Service</a>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <a href="#" className="hover:underline">DMCA</a>
                    <a href="#" className="hover:underline">Contact Support</a>
                </div>
                <p className="mt-3">© 2026 CampusHub Inc. All rights reserved.</p>
            </div>
        </aside>
    );
};

export default SidebarRight;