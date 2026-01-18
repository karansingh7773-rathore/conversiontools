import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    X, Loader2, Download, RotateCcw, RotateCw, Trash2, Plus,
    CheckSquare, Square, GripVertical, Check
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import * as pdfClient from '../services/pdfClientUtils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface OrganizeEditorProps {
    files: File[];
    onClose: () => void;
    onAddMoreFiles?: () => void;
}

interface PageInfo {
    id: string;
    pageNumber: number;
    originalPageNumber: number;
    rotation: number; // 0, 90, 180, 270
    selected: boolean;
    fileIndex: number;
}

const OrganizeEditor: React.FC<OrganizeEditorProps> = ({ files, onClose, onAddMoreFiles }) => {
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [pdfUrls, setPdfUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hoveredPage, setHoveredPage] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);
    const [draggedPage, setDraggedPage] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const longPressRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Detect mobile - use width only (touchstart triggers on laptops with touchscreen)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize PDF URLs and pages
    useEffect(() => {
        const urls = files.map(file => URL.createObjectURL(file));
        setPdfUrls(urls);

        // Load page counts for all files
        const loadPages = async () => {
            setIsLoading(true);
            const allPages: PageInfo[] = [];

            for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
                try {
                    const pageCount = await pdfClient.getPageCount(files[fileIdx]);
                    for (let i = 1; i <= pageCount; i++) {
                        allPages.push({
                            id: `${fileIdx}-${i}`,
                            pageNumber: allPages.length + 1,
                            originalPageNumber: i,
                            rotation: 0,
                            selected: false,
                            fileIndex: fileIdx
                        });
                    }
                } catch (error) {
                    console.error(`Error loading PDF ${fileIdx}:`, error);
                }
            }

            setPages(allPages);
            setIsLoading(false);
        };

        loadPages();

        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, [files]);

    // Get selected pages count
    const selectedCount = pages.filter(p => p.selected).length;

    // Toggle page selection
    const toggleSelection = useCallback((pageId: string, event?: React.MouseEvent) => {
        setPages(prev => prev.map(p => {
            if (p.id === pageId) {
                return { ...p, selected: !p.selected };
            }
            // Shift+Click for range selection
            if (event?.shiftKey && p.selected) {
                return p;
            }
            return p;
        }));
        if (!selectionMode) setSelectionMode(true);
    }, [selectionMode]);

    // Select all / Deselect all
    const toggleSelectAll = () => {
        const allSelected = pages.every(p => p.selected);
        setPages(prev => prev.map(p => ({ ...p, selected: !allSelected })));
        if (!allSelected) setSelectionMode(true);
    };

    // Rotate single page
    const rotatePage = (pageId: string, direction: 'cw' | 'ccw') => {
        setPages(prev => prev.map(p => {
            if (p.id === pageId) {
                const delta = direction === 'cw' ? 90 : -90;
                return { ...p, rotation: (p.rotation + delta + 360) % 360 };
            }
            return p;
        }));
    };

    // Rotate selected pages
    const rotateSelected = (direction: 'cw' | 'ccw') => {
        setPages(prev => prev.map(p => {
            if (p.selected) {
                const delta = direction === 'cw' ? 90 : -90;
                return { ...p, rotation: (p.rotation + delta + 360) % 360 };
            }
            return p;
        }));
    };

    // Rotate all pages
    const rotateAll = (direction: 'cw' | 'ccw') => {
        setPages(prev => prev.map(p => {
            const delta = direction === 'cw' ? 90 : -90;
            return { ...p, rotation: (p.rotation + delta + 360) % 360 };
        }));
    };

    // Delete single page
    const deletePage = (pageId: string) => {
        setPages(prev => {
            const filtered = prev.filter(p => p.id !== pageId);
            return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        });
    };

    // Delete selected pages
    const deleteSelected = () => {
        setPages(prev => {
            const filtered = prev.filter(p => !p.selected);
            return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        });
        setSelectionMode(false);
    };

    // Clear selection
    const clearSelection = () => {
        setPages(prev => prev.map(p => ({ ...p, selected: false })));
        setSelectionMode(false);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, pageId: string) => {
        setDraggedPage(pageId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedPage !== null && dragOverIndex !== null) {
            setPages(prev => {
                const dragIdx = prev.findIndex(p => p.id === draggedPage);
                if (dragIdx === -1) return prev;

                const newPages = [...prev];
                const [removed] = newPages.splice(dragIdx, 1);
                newPages.splice(dragOverIndex, 0, removed);

                return newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
            });
        }
        setDraggedPage(null);
        setDragOverIndex(null);
    };

    // Mobile long-press handler
    const handleTouchStart = (pageId: string) => {
        longPressRef.current = setTimeout(() => {
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            toggleSelection(pageId);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressRef.current) {
            clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    // Handle file add
    const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        // This would need to be handled by parent component
        if (onAddMoreFiles) {
            onAddMoreFiles();
        }
    };

    // Download processed PDF
    const handleDownload = async () => {
        if (pages.length === 0) return;

        setIsProcessing(true);
        try {
            // Build page order array
            const pageOrder: number[] = pages.map(p => p.originalPageNumber);

            // Group pages by rotation angle
            const rotationGroups: Record<number, number[]> = {};
            pages.forEach((page, idx) => {
                if (page.rotation !== 0) {
                    if (!rotationGroups[page.rotation]) {
                        rotationGroups[page.rotation] = [];
                    }
                    rotationGroups[page.rotation].push(idx + 1); // 1-indexed page numbers
                }
            });

            let resultBlob: Blob;

            // First reorder if needed
            const needsReorder = pageOrder.some((p, i) => p !== i + 1);
            if (needsReorder) {
                resultBlob = await pdfClient.reorderPages(files[0], pageOrder);
            } else {
                resultBlob = files[0];
            }

            // Then apply rotations - one call per rotation angle
            for (const [angleStr, pageNumbers] of Object.entries(rotationGroups)) {
                const angle = parseInt(angleStr) as 90 | 180 | 270;
                const tempFile = new File([resultBlob], 'temp.pdf', { type: 'application/pdf' });
                resultBlob = await pdfClient.rotatePdf(tempFile, angle, pageNumbers);
            }

            pdfClient.downloadBlob(resultBlob, `${files[0].name.replace(/\.pdf$/i, '')}_organized.pdf`);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to process PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Grid columns based on screen size - use more columns on desktop for better overview
    const gridCols = isMobile
        ? 'grid-cols-2 gap-2'
        : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4';
    const thumbnailSize = isMobile ? 130 : 150;


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
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Organize Pages</h1>
                    <span className="text-sm text-gray-500">
                        {pages.length} pages {selectedCount > 0 && `• ${selectedCount} selected`}
                    </span>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={isProcessing || pages.length === 0}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download
                        </>
                    )}
                </button>
            </div>

            {/* Desktop Toolbar */}
            {!isMobile && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-[#1A1A1B] border-b border-gray-200 dark:border-[#343536] flex items-center gap-4">
                    {/* Add More PDFs button */}
                    {onAddMoreFiles && (
                        <button
                            onClick={onAddMoreFiles}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800/40"
                        >
                            <Plus className="w-4 h-4" />
                            Add More PDFs
                        </button>
                    )}
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-[#343536] rounded-lg text-sm"
                    >
                        {pages.every(p => p.selected) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        Select All
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-[#343536]" />
                    <button
                        onClick={() => rotateAll('ccw')}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-[#343536] rounded-lg text-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Rotate All Left
                    </button>
                    <button
                        onClick={() => rotateAll('cw')}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-[#343536] rounded-lg text-sm"
                    >
                        <RotateCw className="w-4 h-4" />
                        Rotate All Right
                    </button>
                    {selectedCount > 0 && (
                        <>
                            <div className="h-6 w-px bg-gray-300 dark:bg-[#343536]" />
                            <button
                                onClick={() => rotateSelected('ccw')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Rotate Selected Left
                            </button>
                            <button
                                onClick={() => rotateSelected('cw')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
                            >
                                <RotateCw className="w-4 h-4" />
                                Rotate Selected Right
                            </button>
                            <button
                                onClick={deleteSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Thumbnail Grid */}
            <div className={`flex-1 overflow-auto p-2 ${isMobile ? 'pb-24' : 'p-4'}`}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        <div className={`grid ${gridCols}`}>
                            {pages.map((page, index) => (
                                <div
                                    key={page.id}
                                    draggable={!isMobile || reorderMode}
                                    onDragStart={(e) => handleDragStart(e, page.id)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onMouseEnter={() => !isMobile && setHoveredPage(page.id)}
                                    onMouseLeave={() => !isMobile && setHoveredPage(null)}
                                    onTouchStart={() => isMobile && handleTouchStart(page.id)}
                                    onTouchEnd={handleTouchEnd}
                                    onClick={(e) => {
                                        if (isMobile) {
                                            // On mobile: tap always selects/deselects (shows action bar)
                                            toggleSelection(page.id, e);
                                        }
                                    }}
                                    className={`relative group cursor-pointer transition-all ${page.selected
                                        ? 'ring-4 ring-red-500 rounded-lg'
                                        : dragOverIndex === index
                                            ? 'ring-4 ring-green-500 rounded-lg'
                                            : ''
                                        }`}
                                >
                                    {/* Page Thumbnail */}
                                    <div
                                        className="bg-white dark:bg-[#343536] rounded-lg shadow-md overflow-hidden"
                                        style={{
                                            transform: `rotate(${page.rotation}deg)`,
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        <Document
                                            file={pdfUrls[page.fileIndex]}
                                            loading={null}
                                        >
                                            <Page
                                                pageNumber={page.originalPageNumber}
                                                width={thumbnailSize}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </Document>
                                    </div>

                                    {/* Page Number Badge */}
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-xs rounded-full z-10">
                                        {page.pageNumber}
                                    </div>

                                    {/* Selection Checkmark (Mobile) */}
                                    {page.selected && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-10">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Hover Overlay (Desktop only) */}
                                    {!isMobile && hoveredPage === page.id && (
                                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center gap-2 z-20">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); rotatePage(page.id, 'ccw'); }}
                                                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg"
                                                title="Rotate Left"
                                            >
                                                <RotateCcw className="w-4 h-4 text-gray-700" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); rotatePage(page.id, 'cw'); }}
                                                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg"
                                                title="Rotate Right"
                                            >
                                                <RotateCw className="w-4 h-4 text-gray-700" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                                                className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full shadow-lg"
                                                title="Delete Page"
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Drag Handle (Reorder Mode) */}
                                    {reorderMode && (
                                        <div className="absolute top-2 left-2 p-1 bg-gray-800/80 rounded z-10">
                                            <GripVertical className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Rotation Indicator */}
                                    {page.rotation !== 0 && (
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded z-10">
                                            {page.rotation}°
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add More PDFs Button */}
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#343536] hover:bg-gray-300 dark:hover:bg-[#5C666E] rounded-lg text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add More PDFs
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                multiple
                                className="hidden"
                                onChange={handleAddFiles}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Bottom Action Bar */}
            {isMobile && (selectionMode || selectedCount > 0) && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1B] border-t border-gray-200 dark:border-[#343536] px-4 py-3 flex items-center justify-around shadow-lg z-30">
                    <button
                        onClick={() => rotateSelected('ccw')}
                        disabled={selectedCount === 0}
                        className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300 disabled:opacity-30"
                    >
                        <RotateCcw className="w-6 h-6" />
                        <span className="text-xs">Rotate Left</span>
                    </button>
                    <button
                        onClick={() => rotateSelected('cw')}
                        disabled={selectedCount === 0}
                        className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300 disabled:opacity-30"
                    >
                        <RotateCw className="w-6 h-6" />
                        <span className="text-xs">Rotate Right</span>
                    </button>
                    <button
                        onClick={deleteSelected}
                        disabled={selectedCount === 0}
                        className="flex flex-col items-center gap-1 text-red-500 disabled:opacity-30"
                    >
                        <Trash2 className="w-6 h-6" />
                        <span className="text-xs">Delete</span>
                    </button>
                    <button
                        onClick={() => setReorderMode(!reorderMode)}
                        className={`flex flex-col items-center gap-1 ${reorderMode ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <GripVertical className="w-6 h-6" />
                        <span className="text-xs">Reorder</span>
                    </button>
                    <button
                        onClick={clearSelection}
                        className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                        <span className="text-xs">Done</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrganizeEditor;
