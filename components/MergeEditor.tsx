import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    X, Loader2, Download, Trash2, GripVertical, Plus,
    ChevronLeft, PanelLeftClose, PanelLeft, FileText, ZoomIn, ZoomOut, Minus
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { mergePdfs, downloadBlob, getPageCount } from '../services/pdfClientUtils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MergeFile {
    id: string;
    file: File;
    name: string;
    size: string;
    pageCount: number;
    url: string;
}

interface MergeEditorProps {
    files: File[];
    onClose: () => void;
}

const MergeEditor: React.FC<MergeEditorProps> = ({ files: initialFiles, onClose }) => {
    const [mergeFiles, setMergeFiles] = useState<MergeFile[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewScale, setPreviewScale] = useState(1.0);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Initialize files on mount
    useEffect(() => {
        const loadFiles = async () => {
            const loaded: MergeFile[] = [];
            for (const file of initialFiles) {
                if (file.name.toLowerCase().endsWith('.pdf')) {
                    try {
                        const pageCount = await getPageCount(file);
                        loaded.push({
                            id: `${Date.now()}-${Math.random()}`,
                            file,
                            name: file.name,
                            size: formatSize(file.size),
                            pageCount,
                            url: URL.createObjectURL(file)
                        });
                    } catch (e) {
                        console.error('Failed to load PDF:', file.name, e);
                    }
                }
            }
            setMergeFiles(loaded);
        };
        loadFiles();

        // Cleanup URLs on unmount
        return () => {
            mergeFiles.forEach(f => URL.revokeObjectURL(f.url));
        };
    }, []);

    // Wheel zoom handler (Ctrl+scroll or pinch)
    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        let lastTouchDistance = 0;

        const handleWheel = (e: WheelEvent) => {
            // Require Ctrl/Cmd + scroll for zoom (allows normal scrolling)
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setPreviewScale(prev => Math.max(0.25, Math.min(3, prev + delta)));
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDistance > 0) {
                    const scale = distance / lastTouchDistance;
                    setPreviewScale(prev => Math.max(0.25, Math.min(3, prev * scale)));
                }
                lastTouchDistance = distance;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    // Add more files
    const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files;
        if (!newFiles) return;

        const loaded: MergeFile[] = [];
        for (const file of Array.from(newFiles)) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                try {
                    const pageCount = await getPageCount(file);
                    loaded.push({
                        id: `${Date.now()}-${Math.random()}`,
                        file,
                        name: file.name,
                        size: formatSize(file.size),
                        pageCount,
                        url: URL.createObjectURL(file)
                    });
                } catch (e) {
                    console.error('Failed to load PDF:', file.name, e);
                }
            }
        }
        setMergeFiles(prev => [...prev, ...loaded]);
        e.target.value = '';
    };

    // Remove a file
    const removeFile = (id: string) => {
        const file = mergeFiles.find(f => f.id === id);
        if (file) URL.revokeObjectURL(file.url);
        setMergeFiles(prev => prev.filter(f => f.id !== id));
    };

    // Drag and drop reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFiles = [...mergeFiles];
        const draggedFile = newFiles[draggedIndex];
        newFiles.splice(draggedIndex, 1);
        newFiles.splice(index, 0, draggedFile);
        setMergeFiles(newFiles);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Merge and download
    const handleMerge = async () => {
        if (mergeFiles.length < 2) {
            alert('Please add at least 2 PDF files to merge');
            return;
        }

        setIsProcessing(true);
        try {
            const files = mergeFiles.map(f => f.file);
            const mergedBlob = await mergePdfs(files);
            downloadBlob(mergedBlob, 'merged.pdf');
        } catch (error) {
            console.error('Merge failed:', error);
            alert('Failed to merge PDFs: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Get total page count
    const totalPages = mergeFiles.reduce((sum, f) => sum + f.pageCount, 0);

    return (
        <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-[#171717] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1A1A1B] border-b border-gray-200 dark:border-[#343536]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#343536] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Merge PDF</h1>
                    <span className="text-sm text-gray-500">{mergeFiles.length} files • {totalPages} pages</span>
                </div>
                <button
                    onClick={handleMerge}
                    disabled={isProcessing || mergeFiles.length < 2}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Merging...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download Merged PDF
                        </>
                    )}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex min-h-0">
                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white dark:bg-[#1A1A1B] border border-gray-200 dark:border-[#343536] rounded-r-lg shadow-md hover:bg-gray-50 dark:hover:bg-[#343536]"
                    style={{ left: sidebarOpen ? '280px' : '0' }}
                >
                    {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>

                {/* Sidebar - File List */}
                <div
                    className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-[#1A1A1B] border-r border-gray-200 dark:border-[#343536] flex flex-col`}
                >
                    <div className="p-4 border-b border-gray-200 dark:border-[#343536]">
                        <h2 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Files to Merge</h2>
                        <p className="text-xs text-gray-400 mb-3">Drag to reorder</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                            <Plus className="w-4 h-4" />
                            Add More Files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleAddFiles}
                            className="hidden"
                        />
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {mergeFiles.map((mergeFile, index) => (
                            <div
                                key={mergeFile.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-2 p-3 mb-2 rounded-lg border ${draggedIndex === index
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                                    : 'border-gray-200 dark:border-[#343536] hover:bg-gray-50 dark:hover:bg-[#343536]'
                                    } cursor-grab active:cursor-grabbing`}
                            >
                                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{mergeFile.name}</p>
                                    <p className="text-xs text-gray-500">{mergeFile.size} • {mergeFile.pageCount} pages</p>
                                </div>
                                <button
                                    onClick={() => removeFile(mergeFile.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PDF Preview Area - Scrollable */}
                <div
                    className="flex-1 overflow-y-auto bg-gray-200 dark:bg-[#120F0F] p-6"
                    ref={previewContainerRef}
                >
                    <div className="flex flex-col items-center space-y-6">
                        {mergeFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                                <FileText className="w-16 h-16 mb-4 text-gray-300" />
                                <p className="text-lg">No PDF files added</p>
                                <p className="text-sm">Add PDF files to see preview</p>
                            </div>
                        ) : (
                            mergeFiles.map((mergeFile, fileIndex) => (
                                <div key={mergeFile.id} className="w-full flex flex-col items-center space-y-4">
                                    {/* File Header */}
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {fileIndex + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mergeFile.name}</span>
                                    </div>

                                    {/* Pages Preview - Centered and Width-based */}
                                    <Document
                                        file={mergeFile.url}
                                        loading={
                                            <div className="flex items-center justify-center h-40 bg-white rounded-lg w-full max-w-2xl">
                                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                            </div>
                                        }
                                    >
                                        {Array.from({ length: mergeFile.pageCount }, (_, i) => (
                                            <div
                                                key={i}
                                                className="mb-6 shadow-2xl rounded-lg overflow-hidden"
                                                style={{
                                                    width: `${Math.round(previewScale * 600)}px`,
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                <Page
                                                    pageNumber={i + 1}
                                                    width={Math.round(previewScale * 600)}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                    className="bg-white"
                                                />
                                                {/* Page number label */}
                                                <div className="text-center text-xs text-gray-500 py-2 bg-gray-50 dark:bg-gray-800">
                                                    Page {i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </Document>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Zoom Controls Bar - Like Stirling PDF */}
            <div className="flex items-center justify-center gap-4 py-3 bg-white dark:bg-[#1A1A1B] border-t border-gray-200 dark:border-[#343536]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPreviewScale(Math.max(0.25, previewScale - 0.1))}
                        disabled={previewScale <= 0.25}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#343536] rounded-lg disabled:opacity-30 transition-colors"
                        title="Zoom Out"
                    >
                        <Minus className="w-4 h-4" />
                    </button>

                    <span className="w-16 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {Math.round(previewScale * 100)}%
                    </span>

                    <button
                        onClick={() => setPreviewScale(Math.min(3, previewScale + 0.1))}
                        disabled={previewScale >= 3}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#343536] rounded-lg disabled:opacity-30 transition-colors"
                        title="Zoom In"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick zoom presets */}
                <div className="flex items-center gap-1 border-l border-gray-200 dark:border-[#343536] pl-4">
                    {[0.5, 0.75, 1, 1.5, 2].map(scale => (
                        <button
                            key={scale}
                            onClick={() => setPreviewScale(scale)}
                            className={`px-2 py-1 text-xs rounded ${Math.abs(previewScale - scale) < 0.05
                                ? 'bg-red-500 text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-[#343536] text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            {Math.round(scale * 100)}%
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MergeEditor;
