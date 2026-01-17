import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    X, Loader2, Download, Scissors, Plus, Minus, FileText, Trash2
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { splitPdf, downloadBlob, downloadMultiple, getPageCount } from '../services/pdfClientUtils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SplitEditorProps {
    file: File;
    onClose: () => void;
}

interface SplitGroup {
    startPage: number;
    endPage: number;
    color: string;
}

// Color palette for split groups
const GROUP_COLORS = [
    'bg-blue-100 border-blue-500',
    'bg-green-100 border-green-500',
    'bg-purple-100 border-purple-500',
    'bg-orange-100 border-orange-500',
    'bg-pink-100 border-pink-500',
    'bg-cyan-100 border-cyan-500',
    'bg-yellow-100 border-yellow-500',
    'bg-red-100 border-red-500',
];

const SplitEditor: React.FC<SplitEditorProps> = ({ file, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [numPages, setNumPages] = useState<number>(0);
    const [splitPoints, setSplitPoints] = useState<number[]>([]); // Pages AFTER which to split
    const [isProcessing, setIsProcessing] = useState(false);
    const [hoveredGap, setHoveredGap] = useState<number | null>(null);
    const [thumbnailSize, setThumbnailSize] = useState<number>(150);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize PDF
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
    };

    // Toggle split point at a gap
    const toggleSplitPoint = (afterPage: number) => {
        setSplitPoints(prev => {
            if (prev.includes(afterPage)) {
                return prev.filter(p => p !== afterPage);
            } else {
                return [...prev, afterPage].sort((a, b) => a - b);
            }
        });
    };

    // Calculate split groups based on split points
    const getSplitGroups = (): SplitGroup[] => {
        if (splitPoints.length === 0) {
            return [{ startPage: 1, endPage: numPages, color: GROUP_COLORS[0] }];
        }

        const groups: SplitGroup[] = [];
        let start = 1;

        for (let i = 0; i < splitPoints.length; i++) {
            groups.push({
                startPage: start,
                endPage: splitPoints[i],
                color: GROUP_COLORS[i % GROUP_COLORS.length]
            });
            start = splitPoints[i] + 1;
        }

        // Add the last group
        if (start <= numPages) {
            groups.push({
                startPage: start,
                endPage: numPages,
                color: GROUP_COLORS[splitPoints.length % GROUP_COLORS.length]
            });
        }

        return groups;
    };

    // Get group color for a specific page
    const getPageGroupColor = (pageNum: number): string => {
        const groups = getSplitGroups();
        for (const group of groups) {
            if (pageNum >= group.startPage && pageNum <= group.endPage) {
                return group.color;
            }
        }
        return GROUP_COLORS[0];
    };

    // Check if there's a split after a specific page
    const hasSplitAfter = (pageNum: number): boolean => {
        return splitPoints.includes(pageNum);
    };

    // Clear all splits
    const clearAllSplits = () => {
        setSplitPoints([]);
    };

    // Split into single pages
    const splitIntoSinglePages = () => {
        const allSplits = Array.from({ length: numPages - 1 }, (_, i) => i + 1);
        setSplitPoints(allSplits);
    };

    // Handle split and download
    const handleSplit = async () => {
        if (splitPoints.length === 0) {
            alert('No split points selected. Click between pages to add splits.');
            return;
        }

        setIsProcessing(true);
        try {
            // Build page ranges from split points
            const groups = getSplitGroups();
            const ranges = groups.map(g =>
                g.startPage === g.endPage ? `${g.startPage}` : `${g.startPage}-${g.endPage}`
            ).join(',');

            const splitFiles = await splitPdf(file, {
                mode: 'range',
                ranges
            });

            await downloadMultiple(splitFiles);
        } catch (error) {
            console.error('Split failed:', error);
            alert('Failed to split PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    const groups = getSplitGroups();

    return (
        <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Split PDF</h1>
                    <span className="text-sm text-gray-500">{numPages} pages • {splitPoints.length} split point(s)</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={clearAllSplits}
                        disabled={splitPoints.length === 0}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30"
                    >
                        Clear Splits
                    </button>
                    <button
                        onClick={handleSplit}
                        disabled={isProcessing || splitPoints.length === 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Splitting...
                            </>
                        ) : (
                            <>
                                <Scissors className="w-4 h-4" />
                                Download {groups.length} Files
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Split Groups Summary */}
            {splitPoints.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 overflow-x-auto">
                    <span className="text-sm font-medium text-gray-500 flex-shrink-0">Result:</span>
                    {groups.map((group, idx) => (
                        <div
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg border-2 flex-shrink-0 ${group.color.replace('bg-', 'bg-').replace('border-', 'border-')}`}
                        >
                            <span className="text-sm font-medium">
                                File {idx + 1}: {group.startPage === group.endPage
                                    ? `Page ${group.startPage}`
                                    : `Pages ${group.startPage}-${group.endPage}`}
                                ({group.endPage - group.startPage + 1} pages)
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                    <Scissors className="w-4 h-4" />
                    <span>Click between pages to add split points. Each split creates a separate PDF file.</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={splitIntoSinglePages}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                    >
                        Split All (Every Page)
                    </button>
                    <div className="flex items-center gap-1 border-l border-blue-300 dark:border-blue-600 pl-3 ml-2">
                        <button
                            onClick={() => setThumbnailSize(Math.max(80, thumbnailSize - 30))}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-10 text-center">{thumbnailSize}px</span>
                        <button
                            onClick={() => setThumbnailSize(Math.min(300, thumbnailSize + 30))}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Thumbnail Grid with Split Gaps */}
            <div className="flex-1 overflow-auto p-6">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center h-full min-h-[400px] text-red-500">
                            <p>Failed to load PDF. Please try again.</p>
                        </div>
                    }
                >
                    {numPages > 0 && (
                        <div className="flex flex-wrap items-start justify-center gap-1">
                            {Array.from({ length: numPages }, (_, i) => {
                                const pageNum = i + 1;
                                const groupColor = getPageGroupColor(pageNum);
                                const hasSplit = hasSplitAfter(pageNum);
                                const isHovered = hoveredGap === pageNum;
                                const isLastPage = pageNum === numPages;

                                return (
                                    <React.Fragment key={pageNum}>
                                        {/* Page Thumbnail */}
                                        <div
                                            className={`relative rounded-lg overflow-hidden shadow-lg border-2 transition-all ${groupColor}`}
                                            style={{ width: thumbnailSize }}
                                        >
                                            <Page
                                                pageNumber={pageNum}
                                                width={thumbnailSize}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                            {/* Page Number Badge */}
                                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                                                {pageNum}
                                            </div>
                                        </div>

                                        {/* Split Gap - Clickable area between pages */}
                                        {!isLastPage && (
                                            <div
                                                className={`relative flex items-center justify-center cursor-pointer transition-all ${hasSplit
                                                    ? 'w-6 bg-red-500'
                                                    : isHovered
                                                        ? 'w-4 bg-blue-300 dark:bg-blue-600'
                                                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-blue-200'
                                                    }`}
                                                style={{
                                                    height: thumbnailSize * 1.4,
                                                    minWidth: hasSplit ? '24px' : '8px'
                                                }}
                                                onClick={() => toggleSplitPoint(pageNum)}
                                                onMouseEnter={() => setHoveredGap(pageNum)}
                                                onMouseLeave={() => setHoveredGap(null)}
                                                title={hasSplit ? 'Click to remove split' : 'Click to split here'}
                                            >
                                                {/* Scissor icon on hover or when split exists */}
                                                {(isHovered || hasSplit) && (
                                                    <Scissors
                                                        className={`w-4 h-4 ${hasSplit ? 'text-white' : 'text-blue-600 dark:text-blue-300'}`}
                                                        style={{ transform: 'rotate(90deg)' }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </Document>
            </div>
        </div>
    );
};

export default SplitEditor;
