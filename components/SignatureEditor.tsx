import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    ZoomIn, ZoomOut, Trash2, Undo2, Redo2, Pause, Play,
    Upload, Loader2, Save, X, Download
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { signPdfClientSide, downloadBlob } from '../services/pdfClientSigning';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Types
interface SignatureEditorProps {
    file: File;
    onSign: (data: { signatures: SignatureData[] }) => Promise<void>;
    isProcessing: boolean;
    onClose?: () => void;
}

export interface SignatureData {
    signatureImage: string;
    page: number;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
}

interface PlacedSignature {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    image: string;
    page: number;
    aspectRatio: number; // width / height for proper scaling
}

type SignatureMode = 'canvas' | 'image' | 'text';

const FONTS = ['Helvetica', 'Times', 'Courier', 'Arial', 'Georgia'];

const SignatureEditor: React.FC<SignatureEditorProps> = ({ file, onSign, isProcessing, onClose }) => {
    // PDF State
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [pdfUrl, setPdfUrl] = useState<string>('');

    // Signature Creation State
    const [mode, setMode] = useState<SignatureMode>('canvas');
    const [signatureReady, setSignatureReady] = useState<boolean>(false);
    const [currentSignature, setCurrentSignature] = useState<string>('');
    const [placementActive, setPlacementActive] = useState<boolean>(true);

    // Canvas Modal State
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState<boolean>(false);

    // Canvas Mode State
    const [penColor, setPenColor] = useState<string>('#000000');
    const [penSize, setPenSize] = useState<number>(2);

    // Text Mode State
    const [signatureText, setSignatureText] = useState<string>('');
    const [textFont, setTextFont] = useState<string>('Helvetica');
    const [textFontSize, setTextFontSize] = useState<number>(24);
    const [textColor, setTextColor] = useState<string>('#000000');

    // Image Mode State
    const [uploadedImage, setUploadedImage] = useState<string>('');

    // Placed Signatures State
    const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>([]);
    const [history, setHistory] = useState<PlacedSignature[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
    const [localProcessing, setLocalProcessing] = useState<boolean>(false);

    // Refs
    const modalCanvasRef = useRef<SignatureCanvas>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pdfPageRef = useRef<HTMLDivElement>(null); // Ref for the actual PDF page wrapper
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textCanvasRef = useRef<HTMLCanvasElement>(null);

    // Load PDF URL
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, numPages)));
    };

    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

    // Canvas Modal Handlers
    const openCanvasModal = () => {
        setIsCanvasModalOpen(true);
    };

    const closeCanvasModal = () => {
        setIsCanvasModalOpen(false);
    };

    const clearModalCanvas = () => {
        modalCanvasRef.current?.clear();
    };

    const saveModalCanvas = () => {
        if (modalCanvasRef.current && !modalCanvasRef.current.isEmpty()) {
            // Use getCanvas() instead of getTrimmedCanvas() to avoid trim-canvas dependency issue
            const canvas = modalCanvasRef.current.getCanvas();
            const dataUrl = canvas.toDataURL('image/png');
            setCurrentSignature(dataUrl);
            setSignatureReady(true);
            setIsCanvasModalOpen(false);
        }
    };

    // Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setUploadedImage(dataUrl);
                setCurrentSignature(dataUrl);
                setSignatureReady(true);
            };
            reader.readAsDataURL(file);
        }
    };

    // Text to Image
    const saveTextSignature = useCallback(() => {
        if (!signatureText.trim()) return;

        const canvas = textCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.font = `${textFontSize}px ${textFont}`;
        const metrics = ctx.measureText(signatureText);
        const padding = 10;

        canvas.width = metrics.width + padding * 2;
        canvas.height = textFontSize + padding * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${textFontSize}px ${textFont}`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        ctx.fillText(signatureText, padding, padding);

        const dataUrl = canvas.toDataURL('image/png');
        setCurrentSignature(dataUrl);
        setSignatureReady(true);
    }, [signatureText, textFont, textFontSize, textColor]);

    // Click to place signature on PDF page
    const handlePdfClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!signatureReady || !placementActive || !currentSignature) return;

        // Use the PDF page wrapper ref for accurate positioning
        const pdfPage = pdfPageRef.current;
        if (!pdfPage) return;

        const rect = pdfPage.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;

        // Load image to get proper aspect ratio
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.width / img.height;

            // Base width at 15% of page, height calculated from aspect ratio
            const sigWidth = 15;
            // Convert height to percentage (aspect ratio is in pixels, need to account for page aspect)
            const pageAspect = rect.width / rect.height;
            const sigHeight = (sigWidth / aspectRatio) * pageAspect;

            const newSignature: PlacedSignature = {
                id: Date.now().toString(),
                x: Math.max(0, Math.min(clickX - sigWidth / 2, 100 - sigWidth)),
                y: Math.max(0, Math.min(clickY - sigHeight / 2, 100 - sigHeight)),
                width: sigWidth,
                height: sigHeight,
                image: currentSignature,
                page: currentPage,
                aspectRatio: aspectRatio
            };

            const newPlaced = [...placedSignatures, newSignature];
            setPlacedSignatures(newPlaced);
            setSelectedSignatureId(newSignature.id);

            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPlaced);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        };
        img.src = currentSignature;
    }, [signatureReady, placementActive, currentSignature, currentPage, placedSignatures, history, historyIndex]);

    const removeSignature = (id: string) => {
        const newPlaced = placedSignatures.filter(s => s.id !== id);
        setPlacedSignatures(newPlaced);
        setSelectedSignatureId(null);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPlaced);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Resize signature handler - maintains aspect ratio
    const handleResize = useCallback((sigId: string, corner: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const pdfPage = pdfPageRef.current;
        if (!pdfPage) return;

        const sig = placedSignatures.find(s => s.id === sigId);
        if (!sig) return;

        const rect = pdfPage.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = sig.width;
        const startHeight = sig.height;
        const startLeft = sig.x;
        const startTop = sig.y;
        const aspectRatio = sig.aspectRatio || (startWidth / startHeight);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
            const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newX = startLeft;
            let newY = startTop;

            // Calculate new size based on corner being dragged
            const pageAspect = rect.width / rect.height;

            if (corner.includes('right')) {
                newWidth = Math.max(5, Math.min(100 - startLeft, startWidth + deltaX));
                newHeight = (newWidth / aspectRatio) * pageAspect;
            } else if (corner.includes('left')) {
                newWidth = Math.max(5, startWidth - deltaX);
                newHeight = (newWidth / aspectRatio) * pageAspect;
                newX = startLeft + (startWidth - newWidth);
            }

            if (corner.includes('bottom')) {
                newHeight = Math.max(5, Math.min(100 - startTop, startHeight + deltaY));
                newWidth = (newHeight * aspectRatio) / pageAspect;
            } else if (corner.includes('top')) {
                newHeight = Math.max(5, startHeight - deltaY);
                newWidth = (newHeight * aspectRatio) / pageAspect;
                newY = startTop + (startHeight - newHeight);
            }

            // Clamp values
            newWidth = Math.max(3, Math.min(80, newWidth));
            newHeight = Math.max(3, Math.min(80, newHeight));
            newX = Math.max(0, Math.min(100 - newWidth, newX));
            newY = Math.max(0, Math.min(100 - newHeight, newY));

            const updated = placedSignatures.map(s =>
                s.id === sigId ? { ...s, width: newWidth, height: newHeight, x: newX, y: newY } : s
            );
            setPlacedSignatures(updated);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            // Save to history
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(placedSignatures);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [placedSignatures, history, historyIndex]);

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPlacedSignatures(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPlacedSignatures(history[historyIndex + 1]);
        }
    };

    const handleApplySignatures = async () => {
        // Process signatures LOCALLY using pdf-lib - no server needed!
        if (placedSignatures.length === 0) {
            alert('No signatures placed on the PDF');
            return;
        }

        setLocalProcessing(true);
        try {
            // Convert signatures to the format expected by pdf-lib
            const signaturesData = placedSignatures.map(sig => ({
                signatureImage: sig.image,
                page: sig.page,
                positionX: sig.x,
                positionY: sig.y,
                width: sig.width,
                height: sig.height
            }));

            // Sign the PDF entirely in the browser - INSTANT!
            const signedPdfBlob = await signPdfClientSide(file, signaturesData);

            // Generate filename
            const originalName = file.name.replace(/\.pdf$/i, '');
            const filename = `${originalName}_signed.pdf`;

            // Download the signed PDF
            downloadBlob(signedPdfBlob, filename);

            // Also call onSign to notify parent (optional, for UI state)
            await onSign({
                signatures: signaturesData
            });
        } catch (error) {
            console.error('Failed to sign PDF:', error);
            alert('Failed to sign PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLocalProcessing(false);
        }
    };

    const signaturesOnPage = placedSignatures.filter(s => s.page === currentPage);

    return (
        <>
            {/* FULL SCREEN OVERLAY */}
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
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sign & Certify</h1>
                    </div>
                    <button
                        onClick={handleApplySignatures}
                        disabled={isProcessing || localProcessing || placedSignatures.length === 0}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {(isProcessing || localProcessing) ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download Signed PDF
                            </>
                        )}
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex min-h-0">
                    {/* Left Sidebar - Narrow */}
                    <div className="w-64 flex-shrink-0 bg-white dark:bg-[#1A1A1B] border-r border-gray-200 dark:border-[#343536] overflow-y-auto">
                        <div className="p-4 space-y-5">
                            {/* Step 1: Configure Signature */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">1</span>
                                    Configure Signature
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Choose how you want to create the signature
                                </p>

                                {/* Mode Tabs */}
                                <div className="flex border border-gray-200 dark:border-[#343536] rounded-lg overflow-hidden text-sm">
                                    {(['canvas', 'image', 'text'] as SignatureMode[]).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                setMode(m);
                                                setSignatureReady(false);
                                                setCurrentSignature('');
                                            }}
                                            className={`flex-1 px-3 py-2 font-medium capitalize transition-colors ${mode === m
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                : 'bg-white dark:bg-[#343536] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#4C555C]'
                                                }`}
                                        >
                                            {m === 'canvas' ? 'Canvas' : m === 'image' ? 'Image' : 'Text'}
                                        </button>
                                    ))}
                                </div>

                                {/* Canvas Mode - Click to open modal */}
                                {mode === 'canvas' && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Draw your signature</h4>

                                        {/* Preview box - click to open modal */}
                                        <div
                                            onClick={openCanvasModal}
                                            className="border border-gray-300 dark:border-[#343536] rounded-lg bg-white h-24 flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            {currentSignature ? (
                                                <img src={currentSignature} alt="Signature" className="max-h-20 max-w-full" />
                                            ) : (
                                                <span className="text-sm text-gray-400">Click to draw</span>
                                            )}
                                        </div>

                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            Click to open the drawing canvas
                                        </p>
                                    </div>
                                )}

                                {/* Image Mode */}
                                {mode === 'image' && (
                                    <div className="space-y-3">
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="w-full px-3 py-3 border-2 border-dashed border-gray-300 dark:border-[#343536] rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-red-500 hover:text-red-500 transition-colors"
                                        >
                                            <Upload className="w-5 h-5 mx-auto mb-1" />
                                            Select image file
                                        </button>

                                        {uploadedImage && (
                                            <div className="p-2 border border-gray-200 dark:border-[#343536] rounded-lg">
                                                <img src={uploadedImage} alt="Signature" className="max-h-16 mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Text Mode */}
                                {mode === 'text' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Text <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={signatureText}
                                                onChange={(e) => setSignatureText(e.target.value)}
                                                placeholder="Enter text"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#343536] rounded-lg bg-white dark:bg-[#343536] text-sm"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Font</label>
                                            <select
                                                value={textFont}
                                                onChange={(e) => setTextFont(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                            >
                                                {FONTS.map(font => (
                                                    <option key={font} value={font}>{font}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Font size</label>
                                                <input
                                                    type="number"
                                                    value={textFontSize}
                                                    onChange={(e) => setTextFontSize(Math.max(8, parseInt(e.target.value) || 16))}
                                                    min={8}
                                                    max={72}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Colour</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={textColor}
                                                        onChange={(e) => setTextColor(e.target.value)}
                                                        className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={saveTextSignature}
                                            disabled={!signatureText.trim()}
                                            className="w-full px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> Save
                                        </button>

                                        <canvas ref={textCanvasRef} className="hidden" />
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Place & Save */}
                            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                                    Place & save
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Position the signature on your PDF
                                </p>

                                {/* Undo/Redo/Pause */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={undo}
                                        disabled={historyIndex === 0}
                                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
                                        title="Undo"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={historyIndex >= history.length - 1}
                                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
                                        title="Redo"
                                    >
                                        <Redo2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPlacementActive(!placementActive)}
                                        className={`flex-1 px-3 py-2 border rounded-lg flex items-center justify-center gap-2 text-xs font-medium ${placementActive
                                            ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                            }`}
                                    >
                                        {placementActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                        {placementActive ? 'Pause' : 'Resume'}
                                    </button>
                                </div>

                                {/* Info Box - Highlight when signature is ready */}
                                <div className={`p-3 rounded-lg transition-all ${signatureReady
                                    ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-500 animate-pulse'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    }`}>
                                    <h5 className={`text-xs font-medium mb-1 ${signatureReady
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {signatureReady ? '✓ Signature ready!' : 'How to add signature'}
                                    </h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {signatureReady
                                            ? 'Click anywhere on the PDF to place your signature.'
                                            : mode === 'canvas'
                                                ? 'Click the canvas area above to draw.'
                                                : mode === 'image'
                                                    ? 'Upload your signature image above.'
                                                    : 'Enter your name above and click Save.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDF Preview Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-gray-200 dark:bg-gray-900">
                        {/* PDF Container - scrollable area */}
                        <div
                            ref={pdfContainerRef}
                            className={`flex-1 overflow-auto relative ${signatureReady && placementActive ? 'cursor-crosshair' : ''}`}
                        >
                            <div className="flex justify-center p-6">
                                {/* PDF Page Wrapper - click handler and signatures relative to this */}
                                <div
                                    ref={pdfPageRef}
                                    onClick={handlePdfClick}
                                    className="relative shadow-2xl"
                                >
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        loading={
                                            <div className="flex items-center justify-center h-[600px] bg-white">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            </div>
                                        }
                                    >
                                        <Page
                                            pageNumber={currentPage}
                                            scale={scale}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </Document>

                                    {/* Placed Signatures */}
                                    {signaturesOnPage.map((sig) => {
                                        const isSelected = selectedSignatureId === sig.id;
                                        return (
                                            <div
                                                key={sig.id}
                                                className={`absolute group cursor-move ${isSelected ? 'z-20' : 'z-10'}`}
                                                style={{
                                                    left: `${sig.x}%`,
                                                    top: `${sig.y}%`,
                                                    width: `${sig.width}%`,
                                                    height: `${sig.height}%`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSignatureId(sig.id);
                                                }}
                                            >
                                                <img
                                                    src={sig.image}
                                                    alt="Signature"
                                                    className="w-full h-full object-contain"
                                                    draggable={false}
                                                />

                                                {/* Selection border - visible when selected or hovered */}
                                                <div className={`absolute inset-0 border-2 ${isSelected ? 'border-blue-500' : 'border-transparent group-hover:border-blue-400'} pointer-events-none`} />

                                                {/* Corner Resize Handles - Blue circles like Stirling PDF */}
                                                {(isSelected || true) && (
                                                    <>
                                                        {/* Top-left */}
                                                        <div
                                                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-md"
                                                            onMouseDown={(e) => handleResize(sig.id, 'top-left', e)}
                                                        />
                                                        {/* Top-right */}
                                                        <div
                                                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-md"
                                                            onMouseDown={(e) => handleResize(sig.id, 'top-right', e)}
                                                        />
                                                        {/* Bottom-left */}
                                                        <div
                                                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-md"
                                                            onMouseDown={(e) => handleResize(sig.id, 'bottom-left', e)}
                                                        />
                                                        {/* Bottom-right */}
                                                        <div
                                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-md"
                                                            onMouseDown={(e) => handleResize(sig.id, 'bottom-right', e)}
                                                        />
                                                    </>
                                                )}

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeSignature(sig.id);
                                                    }}
                                                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* PDF Controls */}
                        <div className="flex items-center justify-center gap-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={currentPage}
                                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                        min={1}
                                        max={numPages}
                                        className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                                    />
                                    <span className="text-sm text-gray-500">/ {numPages}</span>
                                </div>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === numPages} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => goToPage(numPages)} disabled={currentPage === numPages} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                                <button onClick={zoomOut} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium w-14 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={zoomIn} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CANVAS MODAL */}
            {isCanvasModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[700px] max-w-[90vw]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Draw your signature</h2>
                            <button onClick={closeCanvasModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Pen Settings */}
                            <div className="flex gap-6 mb-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-gray-600 dark:text-gray-400">Colour</label>
                                    <input
                                        type="color"
                                        value={penColor}
                                        onChange={(e) => setPenColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-gray-600 dark:text-gray-400">Pen size</label>
                                    <input
                                        type="number"
                                        value={penSize}
                                        onChange={(e) => setPenSize(Math.max(1, parseInt(e.target.value) || 1))}
                                        min={1}
                                        max={10}
                                        className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Canvas Area */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                                <SignatureCanvas
                                    ref={modalCanvasRef}
                                    penColor={penColor}
                                    canvasProps={{
                                        width: 650,
                                        height: 300,
                                        className: 'signature-canvas w-full'
                                    }}
                                    minWidth={penSize * 0.5}
                                    maxWidth={penSize}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={clearModalCanvas}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear canvas
                            </button>
                            <button
                                onClick={saveModalCanvas}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SignatureEditor;
