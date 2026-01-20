/**
 * Redact Editor Component
 * 
 * Interactive PDF viewer for marking and applying redactions.
 * Uses react-pdf for rendering and allows users to draw redaction boxes.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up pdf.js worker - use bundled approach for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export interface RedactionMark {
    id: string;
    pageIndex: number;
    x: number;      // Percentage (0-100)
    y: number;      // Percentage (0-100)
    width: number;  // Percentage
    height: number; // Percentage
}

interface RedactEditorProps {
    file: File;
    redactions: RedactionMark[];
    onRedactionsChange: (redactions: RedactionMark[]) => void;
}

export const RedactEditor: React.FC<RedactEditorProps> = ({
    file,
    redactions,
    onRedactionsChange
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    // Create URL for the file
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setFileUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setCurrentPage(1);
    };

    // Get redactions for current page
    const currentPageRedactions = redactions.filter(r => r.pageIndex === currentPage - 1);

    // Convert mouse position to percentage of page
    const getPercentagePosition = useCallback((e: React.MouseEvent) => {
        if (!pageRef.current) return { x: 0, y: 0 };

        const rect = pageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click

        const pos = getPercentagePosition(e);
        setIsDrawing(true);
        setDrawStart(pos);
        setCurrentDraw({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }, [getPercentagePosition]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || !drawStart) return;

        const pos = getPercentagePosition(e);

        // Calculate rectangle from start to current position
        const x = Math.min(drawStart.x, pos.x);
        const y = Math.min(drawStart.y, pos.y);
        const width = Math.abs(pos.x - drawStart.x);
        const height = Math.abs(pos.y - drawStart.y);

        setCurrentDraw({ x, y, width, height });
    }, [isDrawing, drawStart, getPercentagePosition]);

    const handleMouseUp = useCallback(() => {
        if (currentDraw && currentDraw.width > 1 && currentDraw.height > 1) {
            // Create new redaction mark
            const newMark: RedactionMark = {
                id: `redact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                pageIndex: currentPage - 1,
                x: currentDraw.x,
                y: currentDraw.y,
                width: currentDraw.width,
                height: currentDraw.height
            };

            onRedactionsChange([...redactions, newMark]);
        }

        setIsDrawing(false);
        setDrawStart(null);
        setCurrentDraw(null);
    }, [currentDraw, currentPage, redactions, onRedactionsChange]);

    const deleteRedaction = useCallback((id: string) => {
        onRedactionsChange(redactions.filter(r => r.id !== id));
    }, [redactions, onRedactionsChange]);

    const nextPage = () => setCurrentPage(p => Math.min(p + 1, numPages));
    const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
    const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
    const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

    if (!fileUrl) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevPage}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium">
                        Page {currentPage} of {numPages}
                    </span>
                    <button
                        onClick={nextPage}
                        disabled={currentPage >= numPages}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium min-w-[4rem] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currentPageRedactions.length} redaction{currentPageRedactions.length !== 1 ? 's' : ''} on this page
                </div>
            </div>

            {/* PDF Viewer with Redaction Overlay */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-4 flex justify-center"
            >
                <div
                    ref={pageRef}
                    className="relative cursor-crosshair select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                            </div>
                        }
                    >
                        <Page
                            pageNumber={currentPage}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>

                    {/* Existing Redaction Marks */}
                    {currentPageRedactions.map((mark) => (
                        <div
                            key={mark.id}
                            className="absolute group"
                            style={{
                                left: `${mark.x}%`,
                                top: `${mark.y}%`,
                                width: `${mark.width}%`,
                                height: `${mark.height}%`,
                            }}
                        >
                            <div className="w-full h-full border-2 border-red-500 bg-red-500/20 transition-colors hover:bg-red-500/40">
                                {/* Delete button on hover */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteRedaction(mark.id);
                                    }}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Current Drawing Rectangle */}
                    {currentDraw && (
                        <div
                            className="absolute border-2 border-red-500 bg-red-500/30 pointer-events-none"
                            style={{
                                left: `${currentDraw.x}%`,
                                top: `${currentDraw.y}%`,
                                width: `${currentDraw.width}%`,
                                height: `${currentDraw.height}%`,
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-center text-sm text-gray-500 dark:text-gray-400">
                Click and drag to mark areas for redaction. Hover over marks to delete them.
            </div>
        </div>
    );
};

export default RedactEditor;
