import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Upload, Download, Loader2, AlertCircle,
    Trash2, GripVertical, FileText, ArrowRight, RotateCw,
    MoveLeft, MoveRight, CheckCircle, Plus
} from 'lucide-react';
import { TOOLS } from '../constants';
import * as api from '../services/api';
import * as pdfClient from '../services/pdfClientUtils';
import SignatureEditor, { SignatureData } from './SignatureEditor';
import MergeEditor from './MergeEditor';
import SplitEditor from './SplitEditor';
import OrganizeEditor from './OrganizeEditor';

// Types
interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: string;
    pages?: number;
}

interface PageInfo {
    id: number;
    num: number;
    rot: number;
}

const ToolDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const tool = TOOLS.find(t => t.id === id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // File management state
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingMessage, setProcessingMessage] = useState('');

    // Input string states (for proper backspace handling)
    const [targetSizeMBInput, setTargetSizeMBInput] = useState('50');
    const [validationError, setValidationError] = useState<string | null>(null);

    // Mock Pages for Rotate/Organize (will be populated from uploaded PDF)
    const [mockPages, setMockPages] = useState<PageInfo[]>(
        Array.from({ length: 8 }, (_, i) => ({ id: i, num: i + 1, rot: 0 }))
    );

    // Split State
    const [splitMode, setSplitMode] = useState<'ranges' | 'groups' | 'size'>('ranges');
    const [splitRanges, setSplitRanges] = useState('');
    const [splitGroupSize, setSplitGroupSize] = useState('');
    const [splitFileSize, setSplitFileSize] = useState('');

    // Layout State
    const [layoutMode, setLayoutMode] = useState('1');
    const [borders, setBorders] = useState(true);

    // Security/Advanced State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [useAes, setUseAes] = useState(true);
    const [ocrLanguage, setOcrLanguage] = useState('eng');
    const [ocrDeskew, setOcrDeskew] = useState(true);
    const [ocrClean, setOcrClean] = useState(false);

    const [compressionQuality, setCompressionQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [pdfTargetSizeMB, setPdfTargetSizeMB] = useState<string>('');

    // Metadata state
    const [metaTitle, setMetaTitle] = useState('');
    const [metaAuthor, setMetaAuthor] = useState('');
    const [metaSubject, setMetaSubject] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaCreator, setMetaCreator] = useState('');

    // Watermark state
    const [watermarkText, setWatermarkText] = useState('');
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
    const [watermarkPosition, setWatermarkPosition] = useState('center');

    // URL to PDF
    const [urlInput, setUrlInput] = useState('');

    // PDF to Office state
    const [officeFormat, setOfficeFormat] = useState<'docx' | 'xlsx' | 'pptx'>('docx');
    const [ocrForScanned, setOcrForScanned] = useState(false); // Only for scanned/image-based PDFs


    // Image States
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [maintainRatio, setMaintainRatio] = useState(true);
    const [resizeMode, setResizeMode] = useState<'fit' | 'fill' | 'crop'>('fit');
    const [imageQuality, setImageQuality] = useState(80);
    const [imageFormat, setImageFormat] = useState<'webp' | 'avif' | 'jpeg' | 'png'>('webp');

    // Video States
    const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [compressionMethod, setCompressionMethod] = useState<'preset' | 'target_size' | 'target_percentage' | 'target_quality' | 'target_resolution' | 'target_bitrate'>('preset');
    const [targetSizeMB, setTargetSizeMB] = useState(50);
    const [targetPercentage, setTargetPercentage] = useState(50);
    const [targetQuality, setTargetQuality] = useState(23); // CRF
    const [muteAudio, setMuteAudio] = useState(false);
    const [trimStart, setTrimStart] = useState("00:00:00");
    const [trimEnd, setTrimEnd] = useState("00:00:30");
    const [videoFormat, setVideoFormat] = useState('mp4');
    const [videoPreset, setVideoPreset] = useState<'1080p' | '720p' | '480p' | '360p'>('720p');
    const [videoSpeed, setVideoSpeed] = useState(1.0);
    const [videoRotation, setVideoRotation] = useState('90');
    const [gifFps, setGifFps] = useState(15);
    const [gifWidth, setGifWidth] = useState(480);
    const [gifDuration, setGifDuration] = useState(5);

    // Audio States
    const [audioFormat, setAudioFormat] = useState('mp3');
    const [audioBitrate, setAudioBitrate] = useState('192k');
    const [audioVolume, setAudioVolume] = useState(1.0);
    const [audioSpeed, setAudioSpeed] = useState(1.0);
    const [fadeIn, setFadeIn] = useState(0);
    const [fadeOut, setFadeOut] = useState(0);
    const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('medium');

    // Pipeline state
    const [pipelineSteps, setPipelineSteps] = useState<string[]>(['Merge Files']);

    if (!tool) return <div className="p-8 text-center text-gray-500">Tool not found</div>;

    // File handling
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: UploadedFile[] = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: formatFileSize(file.size)
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setError(null);
        setSuccess(null);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;

        const newFiles: UploadedFile[] = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: formatFileSize(file.size)
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setError(null);
        setSuccess(null);
    }, []);

    const removeFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const clearAllFiles = () => {
        setUploadedFiles([]);
        setError(null);
        setSuccess(null);
        setValidationError(null);
    };

    // Simulate progress for realistic feedback during processing
    const simulateProgress = (duration: number = 10000) => {
        setProcessingProgress(5);
        let progress = 5;
        const interval = setInterval(() => {
            // Increase progress gradually, slow down near the end
            if (progress < 40) {
                progress += Math.random() * 8 + 2;
            } else if (progress < 70) {
                progress += Math.random() * 5 + 1;
            } else if (progress < 90) {
                progress += Math.random() * 2 + 0.5;
            } else if (progress < 95) {
                progress += Math.random() * 0.5;
            }
            // Cap at 95% until actual completion
            progress = Math.min(progress, 95);
            setProcessingProgress(Math.round(progress));
        }, duration / 20);

        return () => {
            clearInterval(interval);
            setProcessingProgress(100);
        };
    };

    // Validate target size input
    const validateTargetSize = (value: string): boolean => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 1) {
            setValidationError('Minimum target size is 1 MB');
            return false;
        }
        setValidationError(null);
        return true;
    };

    // Page manipulation for rotate/organize
    const rotatePage = (pageId: number, dir: 'cw' | 'ccw' = 'cw') => {
        setMockPages(prev => prev.map(p => {
            if (p.id === pageId) {
                const delta = dir === 'cw' ? 90 : -90;
                return { ...p, rot: (p.rot + delta + 360) % 360 };
            }
            return p;
        }));
    };

    const rotateAll = () => {
        setMockPages(prev => prev.map(p => ({ ...p, rot: (p.rot + 90) % 360 })));
    };

    const deletePage = (pageId: number) => {
        setMockPages(prev => prev.filter(p => p.id !== pageId));
    };

    const movePage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index > 0) {
            const newPages = [...mockPages];
            [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
            setMockPages(newPages);
        } else if (direction === 'right' && index < mockPages.length - 1) {
            const newPages = [...mockPages];
            [newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]];
            setMockPages(newPages);
        }
    };

    // Process button handler
    const handleProcess = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            let result: { success: boolean; data?: Blob; error?: string; filename?: string };
            const files = uploadedFiles.map(f => f.file);

            switch (id) {
                // PDF Page Ops - CLIENT-SIDE (INSTANT!)
                case 'pdf-merge': {
                    if (files.length < 2) throw new Error('Please upload at least 2 PDF files');
                    // Validate all files are PDFs
                    const nonPdfFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
                    if (nonPdfFiles.length > 0) {
                        throw new Error(`Invalid file(s): ${nonPdfFiles.map(f => f.name).join(', ')}. Only PDF files can be merged.`);
                    }
                    setProcessingMessage('Merging PDFs... (processing locally)');
                    const mergedBlob = await pdfClient.mergePdfs(files);
                    pdfClient.downloadBlob(mergedBlob, 'merged.pdf');
                    result = { success: true };
                    break;
                }

                case 'pdf-split': {
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    setProcessingMessage('Splitting PDF... (processing locally)');
                    let splitFiles;
                    if (splitMode === 'groups') {
                        splitFiles = await pdfClient.splitPdf(files[0], {
                            mode: 'every',
                            everyN: splitGroupSize ? parseInt(splitGroupSize) : 1
                        });
                    } else if (splitMode === 'ranges' && splitRanges) {
                        splitFiles = await pdfClient.splitPdf(files[0], {
                            mode: 'range',
                            ranges: splitRanges
                        });
                    } else {
                        splitFiles = await pdfClient.splitPdf(files[0], { mode: 'all' });
                    }
                    await pdfClient.downloadMultiple(splitFiles);
                    result = { success: true };
                    break;
                }

                case 'pdf-rotate': {
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    setProcessingMessage('Rotating PDF... (processing locally)');
                    // Get rotation angle from first rotated page (or default 90)
                    const firstRotated = mockPages.find(p => p.rot !== 0);
                    const angle = (firstRotated?.rot || 90) as pdfClient.RotationAngle;

                    // Get pages with rotation
                    const pagesToRotate = mockPages.filter(p => p.rot !== 0).map(p => p.num);
                    const rotatedBlob = await pdfClient.rotatePdf(
                        files[0],
                        angle,
                        pagesToRotate.length > 0 ? pagesToRotate : undefined
                    );
                    pdfClient.downloadBlob(rotatedBlob, `${files[0].name.replace(/\.pdf$/i, '')}_rotated.pdf`);
                    result = { success: true };
                    break;
                }

                case 'pdf-organize': {
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    setProcessingMessage('Organizing PDF... (processing locally)');
                    const newOrder = mockPages.map(p => p.num);
                    const organizedBlob = await pdfClient.reorderPages(files[0], newOrder);
                    pdfClient.downloadBlob(organizedBlob, `${files[0].name.replace(/\.pdf$/i, '')}_organized.pdf`);
                    result = { success: true };
                    break;
                }

                case 'pdf-layout':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    result = await api.createPDFLayout(files[0], parseInt(layoutMode), borders);
                    break;

                // PDF Security
                case 'pdf-password':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    if (!password) throw new Error('Please enter a password');
                    if (password !== confirmPassword) throw new Error('Passwords do not match');
                    result = await api.addPDFPassword(files[0], password, useAes);
                    break;

                case 'pdf-watermark': {
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    if (!watermarkText) throw new Error('Please enter watermark text');
                    setProcessingMessage('Adding watermark... (processing locally)');
                    const watermarkedBlob = await pdfClient.addWatermark(files[0], {
                        text: watermarkText,
                        opacity: watermarkOpacity,
                        position: watermarkPosition as 'center' | 'diagonal' | 'top' | 'bottom'
                    });
                    pdfClient.downloadBlob(watermarkedBlob, `${files[0].name.replace(/\.pdf$/i, '')}_watermarked.pdf`);
                    result = { success: true };
                    break;
                }

                case 'pdf-metadata':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    result = await api.editPDFMetadata(files[0], {
                        title: metaTitle || undefined,
                        author: metaAuthor || undefined,
                        subject: metaSubject || undefined,
                        keywords: metaKeywords || undefined,
                        creator: metaCreator || undefined
                    });
                    break;

                // PDF Advanced (Stirling)
                case 'pdf-ocr':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    result = await api.ocrPDF(files[0], {
                        language: ocrLanguage,
                        deskew: ocrDeskew,
                        clean: ocrClean
                    });
                    break;

                case 'pdf-compress':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    result = await api.compressPDF(
                        files[0],
                        compressionQuality,
                        pdfTargetSizeMB ? parseFloat(pdfTargetSizeMB) : undefined
                    );
                    break;

                case 'pdf-repair':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    result = await api.repairPDF(files[0]);
                    break;

                case 'pdf-to-office':
                    if (files.length === 0) throw new Error('Please upload a PDF file');
                    setProcessingMessage(ocrForScanned ? 'OCR + Converting to Office format...' : 'Converting to Office format...');
                    result = await api.pdfToOffice(files[0], officeFormat, ocrForScanned);
                    break;

                case 'file-to-pdf':
                    if (files.length === 0) throw new Error('Please upload a file');
                    result = await api.fileToPDF(files[0]);
                    break;

                case 'url-to-pdf':
                    if (!urlInput) throw new Error('Please enter a URL');
                    result = await api.urlToPDF(urlInput);
                    break;

                case 'images-to-pdf':
                    if (files.length === 0) throw new Error('Please upload at least one image');
                    result = await api.imagesToPDF(files, 'A4');
                    break;

                case 'pdf-compare':
                    if (files.length < 2) throw new Error('Please upload 2 PDF files to compare');
                    result = await api.comparePDFs(files[0], files[1]);
                    break;

                // Image Tools
                case 'img-resize':
                    if (files.length === 0) throw new Error('Please upload an image');
                    result = await api.resizeImage(files[0], {
                        width,
                        height: maintainRatio ? undefined : height,
                        maintainRatio,
                        mode: resizeMode
                    });
                    break;

                case 'img-compress':
                    if (files.length === 0) throw new Error('Please upload an image');
                    result = await api.compressImage(files[0], {
                        quality: imageQuality,
                        outputFormat: imageFormat
                    });
                    break;

                // Video Tools
                case 'vid-compress': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    // Validate target size if that method is selected
                    if (compressionMethod === 'target_size' && !validateTargetSize(targetSizeMBInput)) {
                        throw new Error('Please enter a valid target size (minimum 1 MB)');
                    }
                    const finalTargetSizeMB = compressionMethod === 'target_size' ? parseFloat(targetSizeMBInput) || 50 : targetSizeMB;

                    setProcessingMessage(`Compressing ${files[0].name}...`);
                    const stopProgress = simulateProgress(30000); // Estimate 30 seconds for video

                    try {
                        result = await api.compressVideo(files[0], {
                            compressionMethod,
                            compressionLevel,
                            targetSizeMB: finalTargetSizeMB,
                            targetPercentage,
                            targetQuality,
                            targetResolution: videoPreset,
                            muteAudio
                        });
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-trim': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Trimming ${files[0].name}...`);
                    const stopProgress = simulateProgress(5000);
                    try {
                        result = await api.trimVideo(files[0], trimStart, trimEnd);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-convert': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Converting to ${videoFormat}...`);
                    const stopProgress = simulateProgress(20000);
                    try {
                        result = await api.convertVideo(files[0], videoFormat, compressionLevel);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-resize': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Resizing to ${videoPreset}...`);
                    const stopProgress = simulateProgress(25000);
                    try {
                        result = await api.resizeVideo(files[0], { preset: videoPreset });
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-to-gif': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Converting to GIF...`);
                    const stopProgress = simulateProgress(15000);
                    try {
                        result = await api.videoToGif(files[0], {
                            fps: gifFps,
                            width: gifWidth,
                            duration: gifDuration
                        });
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-extract-audio': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Extracting audio as ${audioFormat}...`);
                    const stopProgress = simulateProgress(10000);
                    try {
                        result = await api.extractAudioFromVideo(files[0], audioFormat, audioBitrate);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-speed': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Changing video speed to ${videoSpeed}x...`);
                    const stopProgress = simulateProgress(20000);
                    try {
                        result = await api.changeVideoSpeed(files[0], videoSpeed);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-rotate': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage(`Rotating video ${videoRotation}°...`);
                    const stopProgress = simulateProgress(15000);
                    try {
                        result = await api.rotateVideo(files[0], videoRotation);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-watermark': {
                    if (files.length < 2) throw new Error('Please upload video and watermark image');
                    setProcessingMessage('Adding watermark...');
                    const stopProgress = simulateProgress(25000);
                    try {
                        result = await api.addVideoWatermark(files[0], files[1], {
                            position: watermarkPosition,
                            opacity: watermarkOpacity
                        });
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-merge': {
                    if (files.length < 2) throw new Error('Please upload at least 2 videos');
                    setProcessingMessage(`Merging ${files.length} videos...`);
                    const stopProgress = simulateProgress(30000);
                    try {
                        result = await api.mergeVideos(files);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'vid-mute': {
                    if (files.length === 0) throw new Error('Please upload a video');
                    setProcessingMessage('Removing audio track...');
                    const stopProgress = simulateProgress(5000);
                    try {
                        result = await api.muteVideo(files[0]);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                // Audio Tools
                case 'aud-convert': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage(`Converting to ${audioFormat}...`);
                    const stopProgress = simulateProgress(10000);
                    try {
                        result = await api.convertAudio(files[0], audioFormat, audioBitrate);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-compress': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage('Compressing audio...');
                    const stopProgress = simulateProgress(10000);
                    try {
                        result = await api.compressAudio(files[0], audioQuality);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-trim': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage('Trimming audio...');
                    const stopProgress = simulateProgress(5000);
                    try {
                        result = await api.trimAudio(files[0], trimStart, trimEnd);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-merge': {
                    if (files.length < 2) throw new Error('Please upload at least 2 audio files');
                    setProcessingMessage(`Merging ${files.length} audio files...`);
                    const stopProgress = simulateProgress(15000);
                    try {
                        result = await api.mergeAudio(files);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-volume': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage(`Adjusting volume to ${audioVolume}x...`);
                    const stopProgress = simulateProgress(8000);
                    try {
                        result = await api.changeAudioVolume(files[0], audioVolume);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-speed': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage(`Changing speed to ${audioSpeed}x...`);
                    const stopProgress = simulateProgress(10000);
                    try {
                        result = await api.changeAudioSpeed(files[0], audioSpeed);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-fade': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage('Adding fade effects...');
                    const stopProgress = simulateProgress(8000);
                    try {
                        result = await api.addAudioFade(files[0], fadeIn, fadeOut);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                case 'aud-normalize': {
                    if (files.length === 0) throw new Error('Please upload an audio file');
                    setProcessingMessage('Normalizing audio levels...');
                    const stopProgress = simulateProgress(8000);
                    try {
                        result = await api.normalizeAudio(files[0]);
                    } finally {
                        stopProgress();
                    }
                    break;
                }

                default:
                    throw new Error('This tool is not yet implemented');
            }

            if (result.success && result.data) {
                api.downloadBlob(result.data, result.filename || 'download');
                setSuccess('Processing complete! Your file has been downloaded.');
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- UI Renderers ---
    const renderPdfMerge = () => {
        if (uploadedFiles.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload 2 or more PDF documents to merge them.
                    </p>
                </div>
            );
        }

        // Show full-screen MergeEditor when files are uploaded
        return (
            <MergeEditor
                files={uploadedFiles.map(f => f.file)}
                onClose={() => {
                    clearAllFiles();
                    navigate(-1);
                }}
            />
        );
    };

    const renderPdfSplit = () => {
        if (uploadedFiles.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload a PDF document to split it visually.
                    </p>
                </div>
            );
        }

        // Show full-screen SplitEditor when file is uploaded
        return (
            <SplitEditor
                file={uploadedFiles[0].file}
                onClose={() => {
                    clearAllFiles();
                    navigate(-1);
                }}
            />
        );
    };

    const renderPdfRotate = () => {
        if (uploadedFiles.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload a PDF document to rotate pages visually.
                    </p>
                </div>
            );
        }

        // Show full-screen OrganizeEditor when files are uploaded
        return (
            <OrganizeEditor
                files={uploadedFiles.map(f => f.file)}
                onClose={() => {
                    clearAllFiles();
                    navigate(-1);
                }}
            />
        );
    };

    const renderPdfOrganize = () => {
        if (uploadedFiles.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload a PDF document to organize, reorder, or delete pages.
                    </p>
                </div>
            );
        }

        // Show full-screen OrganizeEditor when files are uploaded
        return (
            <OrganizeEditor
                files={uploadedFiles.map(f => f.file)}
                onClose={() => {
                    clearAllFiles();
                    navigate(-1);
                }}
            />
        );
    };

    const renderPdfLayout = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Pages per Sheet (N-up)</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { val: '1', label: '1 Page' },
                        { val: '2', label: '2 Pages' },
                        { val: '4', label: '4 Pages' }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => setLayoutMode(opt.val)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${layoutMode === opt.val
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="borders"
                    checked={borders}
                    onChange={(e) => setBorders(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="borders" className="text-sm text-gray-700 dark:text-gray-300">Draw borders around pages</label>
            </div>
        </div>
    );

    const renderUrlToPdf = () => (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Website URL</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.example.com"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <p className="text-xs text-gray-500">Captures the full page layout.</p>
        </div>
    );

    const renderPdfSecurity = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to encrypt"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="aes"
                    checked={useAes}
                    onChange={(e) => setUseAes(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="aes" className="text-sm text-gray-700 dark:text-gray-300">Use AES-256 Encryption (Recommended)</label>
            </div>
        </div>
    );

    const renderPdfOcr = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Source Language</label>
                <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="hin">Hindi</option>
                    <option value="chi_sim">Chinese (Simplified)</option>
                </select>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="deskew"
                        checked={ocrDeskew}
                        onChange={(e) => setOcrDeskew(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="deskew" className="text-sm text-gray-700 dark:text-gray-300">Auto-deskew (Straighten pages)</label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="clean"
                        checked={ocrClean}
                        onChange={(e) => setOcrClean(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="clean" className="text-sm text-gray-700 dark:text-gray-300">Clean background (Remove noise)</label>
                </div>
            </div>
        </div>
    );

    const renderPdfMetadata = () => (
        <div className="space-y-4">
            {[
                { label: 'Title', value: metaTitle, setter: setMetaTitle },
                { label: 'Author', value: metaAuthor, setter: setMetaAuthor },
                { label: 'Subject', value: metaSubject, setter: setMetaSubject },
                { label: 'Keywords', value: metaKeywords, setter: setMetaKeywords },
                { label: 'Creator', value: metaCreator, setter: setMetaCreator }
            ].map((field) => (
                <div key={field.label} className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{field.label}</label>
                    <input
                        type="text"
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={`Enter ${field.label}`}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            ))}
        </div>
    );

    const renderPdfWatermark = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Watermark Text</label>
                <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Opacity</label>
                    <span className="text-xs font-bold text-primary">{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Position</label>
                <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="center">Center (Diagonal)</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                </select>
            </div>
        </div>
    );

    // PDF Sign Handler - now just updates UI state (download happens client-side in SignatureEditor)
    const handleSignPdf = useCallback(async (_signatureData: { signatures: SignatureData[] }) => {
        // SignatureEditor handles the actual signing and download client-side
        // This callback just updates the UI state
        setSuccess('PDF signed successfully!');
    }, []);

    const renderPdfSign = () => {
        if (uploadedFiles.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload a PDF document to start signing.
                    </p>
                </div>
            );
        }

        return (
            <SignatureEditor
                file={uploadedFiles[0].file}
                onSign={handleSignPdf}
                isProcessing={isProcessing}
            />
        );
    };


    const renderPdfCompress = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Compression Level</label>
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { val: 'low', label: 'Low', desc: 'Best quality' },
                        { val: 'medium', label: 'Medium', desc: 'Balanced' },
                        { val: 'high', label: 'High', desc: 'Smallest file' }
                    ] as const).map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => {
                                setCompressionQuality(opt.val);
                                setPdfTargetSizeMB(''); // Clear target size when preset is selected
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${compressionQuality === opt.val && !pdfTargetSizeMB
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <span className="text-sm font-bold">{opt.label}</span>
                            <span className="text-[10px] text-gray-400">{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-card-dark text-gray-500">OR</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Target File Size (MB)</label>
                <input
                    type="number"
                    min="1"
                    value={pdfTargetSizeMB}
                    onChange={(e) => {
                        setPdfTargetSizeMB(e.target.value);
                        // If user types here, we might visually deselect the presets if strictly exclusive
                    }}
                    placeholder="e.g. 5"
                    className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-md px-3 py-2 ${pdfTargetSizeMB
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-gray-200 dark:border-gray-700'
                        }`}
                />
                <p className="text-xs text-gray-500">
                    Try to compress below this size. Might reduce quality significantly.
                </p>
            </div>
        </div>
    );

    const renderPdfPipeline = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Processing Steps</label>
                <div className="space-y-2">
                    {pipelineSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                            </div>
                            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{step}</span>
                                <Trash2
                                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500"
                                    onClick={() => {
                                        setPipelineSteps(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                />
                            </div>
                            {idx < pipelineSteps.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                <select className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option>Select tool to add...</option>
                    <option>OCR</option>
                    <option>Watermark</option>
                    <option>Compress</option>
                    <option>Encrypt</option>
                </select>
                <button
                    onClick={() => setPipelineSteps(prev => [...prev, 'New Step'])}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Step
                </button>
            </div>
            <p className="text-xs text-gray-500">Pipeline feature coming soon. Chain multiple operations together.</p>
        </div>
    );

    const renderImageResize = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Width</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Height</label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                        disabled={maintainRatio}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="ratio"
                    checked={maintainRatio}
                    onChange={(e) => setMaintainRatio(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Maintain Aspect Ratio</label>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Resize Mode</label>
                <div className="grid grid-cols-3 gap-3">
                    {(['fit', 'fill', 'crop'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setResizeMode(mode)}
                            className={`p-2 rounded-lg border transition-all capitalize ${resizeMode === mode
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderImageCompress = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Quality</label>
                    <span className="text-xs font-bold text-primary">{imageQuality}%</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Output Format</label>
                <div className="grid grid-cols-4 gap-2">
                    {(['webp', 'avif', 'jpeg', 'png'] as const).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setImageFormat(fmt)}
                            className={`p-2 rounded-lg border transition-all uppercase text-xs font-bold ${imageFormat === fmt
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVideoCompress = () => (
        <div className="space-y-6">
            {/* Compression Method Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Compression Method</label>
                <select
                    value={compressionMethod}
                    onChange={(e) => setCompressionMethod(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white"
                >
                    <option value="preset">Preset Quality Levels</option>
                    <option value="target_size">Target a file size (MB)</option>
                    <option value="target_percentage">Target a file size (Percentage)</option>
                    <option value="target_quality">Target a video quality (CRF)</option>
                    <option value="target_resolution">Target a video resolution</option>
                    <option value="target_bitrate">Target a max bitrate</option>
                </select>
            </div>

            {/* Preset Method */}
            {compressionMethod === 'preset' && (
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Quality Level</label>
                    <p className="text-xs text-gray-400">⚡ Optimized with ultrafast preset - 10x faster!</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['low', 'medium', 'high'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setCompressionLevel(level)}
                                className={`px-4 py-3 rounded-md border text-center transition-all ${compressionLevel === level
                                    ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary font-bold shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                    }`}
                            >
                                <span className="capitalize block">{level}</span>
                                <span className="text-[10px] text-gray-400 font-normal">
                                    {level === 'low' ? 'Fast, bigger file' : level === 'medium' ? 'Balanced' : 'Smaller file'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Target Size (MB) */}
            {compressionMethod === 'target_size' && (
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Target File Size (MB)</label>
                    <input
                        type="number"
                        min="1"
                        value={targetSizeMBInput}
                        onChange={(e) => {
                            setTargetSizeMBInput(e.target.value);
                            // Clear validation error when user types
                            if (validationError) setValidationError(null);
                        }}
                        onBlur={(e) => {
                            // Validate on blur
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val < 1) {
                                setValidationError('Minimum target size is 1 MB');
                            } else {
                                setValidationError(null);
                            }
                        }}
                        className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-md px-3 py-2 ${validationError
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                    />
                    {validationError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationError}
                        </p>
                    )}
                    {!validationError && (
                        <p className="text-xs text-gray-500">Enter desired file size in megabytes (min: 1 MB)</p>
                    )}
                </div>
            )}

            {/* Target Percentage */}
            {compressionMethod === 'target_percentage' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Target Size (% of original)</label>
                        <span className="text-xs font-bold text-primary">{targetPercentage}%</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={targetPercentage}
                        onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-xs text-gray-500">E.g., 50% = 100MB file becomes 50MB</p>
                </div>
            )}

            {/* Target Quality (CRF) */}
            {compressionMethod === 'target_quality' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Quality (CRF)</label>
                        <span className="text-xs font-bold text-primary">{targetQuality}</span>
                    </div>
                    <input
                        type="range"
                        min="18"
                        max="32"
                        value={targetQuality}
                        onChange={(e) => setTargetQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>18 (Best quality)</span>
                        <span>23 (Balanced)</span>
                        <span>32 (Most compression)</span>
                    </div>
                </div>
            )}

            {/* Target Resolution */}
            {compressionMethod === 'target_resolution' && (
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Target Resolution</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['1080p', '720p', '480p', '360p'].map(res => (
                            <button
                                key={res}
                                onClick={() => setVideoPreset(res as any)}
                                className={`p-3 rounded-lg border text-center transition-all ${videoPreset === res
                                    ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary font-bold'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Target Bitrate */}
            {compressionMethod === 'target_bitrate' && (
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Max Bitrate</label>
                    <select
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                    >
                        <option value="500k">500 kbps (Low)</option>
                        <option value="1M">1 Mbps (Medium)</option>
                        <option value="2M">2 Mbps (Good)</option>
                        <option value="5M">5 Mbps (High)</option>
                        <option value="10M">10 Mbps (Very High)</option>
                    </select>
                </div>
            )}

            {/* Mute Audio Option */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="mute"
                    checked={muteAudio}
                    onChange={(e) => setMuteAudio(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="mute" className="text-sm text-gray-700 dark:text-gray-300">Remove audio track</label>
            </div>
        </div>
    );

    const renderVideoTrim = () => (
        <div className="space-y-4">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">⚡ Uses stream copy - nearly instant!</p>
            <div className="flex justify-between items-end gap-4">
                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Start Time</label>
                    <input
                        type="text"
                        value={trimStart}
                        onChange={(e) => setTrimStart(e.target.value)}
                        placeholder="00:00:00"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                    />
                </div>
                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">End Time</label>
                    <input
                        type="text"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(e.target.value)}
                        placeholder="00:00:30"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500">Format: HH:MM:SS or seconds (e.g., 30 or 00:00:30)</p>
        </div>
    );

    const renderVideoConvert = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Output Format</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['mp4', 'webm', 'avi', 'mkv', 'mov', 'gif'].map(fmt => (
                        <button
                            key={fmt}
                            onClick={() => setVideoFormat(fmt)}
                            className={`p-2 rounded-lg border uppercase text-xs font-bold transition-all ${videoFormat === fmt
                                ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVideoResize = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Resolution Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['1080p', '720p', '480p', '360p'] as const).map(preset => (
                        <button
                            key={preset}
                            onClick={() => setVideoPreset(preset)}
                            className={`p-3 rounded-lg border text-center transition-all ${videoPreset === preset
                                ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <span className="block font-bold">{preset}</span>
                            <span className="text-[10px] text-gray-400">
                                {preset === '1080p' ? '1920×1080' : preset === '720p' ? '1280×720' : preset === '480p' ? '854×480' : '640×360'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVideoToGif = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">FPS</label>
                    <input
                        type="number"
                        value={gifFps}
                        onChange={(e) => setGifFps(parseInt(e.target.value) || 15)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Width</label>
                    <input
                        type="number"
                        value={gifWidth}
                        onChange={(e) => setGifWidth(parseInt(e.target.value) || 480)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Duration (sec)</label>
                    <input
                        type="number"
                        value={gifDuration}
                        onChange={(e) => setGifDuration(parseInt(e.target.value) || 5)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500">Optimized GIF with high-quality palette generation</p>
        </div>
    );

    const renderExtractAudio = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Audio Format</label>
                <div className="grid grid-cols-5 gap-2">
                    {['mp3', 'aac', 'wav', 'ogg', 'flac'].map(fmt => (
                        <button
                            key={fmt}
                            onClick={() => setAudioFormat(fmt)}
                            className={`p-2 rounded-lg border uppercase text-xs font-bold transition-all ${audioFormat === fmt
                                ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Bitrate</label>
                <div className="grid grid-cols-4 gap-2">
                    {['128k', '192k', '256k', '320k'].map(br => (
                        <button
                            key={br}
                            onClick={() => setAudioBitrate(br)}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all ${audioBitrate === br
                                ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {br}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVideoSpeed = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Playback Speed</label>
                    <span className="text-xs font-bold text-primary">{videoSpeed}x</span>
                </div>
                <input
                    type="range"
                    min="0.25"
                    max="4"
                    step="0.25"
                    value={videoSpeed}
                    onChange={(e) => setVideoSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>0.25x (Slow)</span>
                    <span>1x (Normal)</span>
                    <span>4x (Fast)</span>
                </div>
            </div>
        </div>
    );

    const renderVideoRotate = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Rotation</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                        { value: '90', label: '90°' },
                        { value: '180', label: '180°' },
                        { value: '270', label: '270°' },
                        { value: 'hflip', label: 'H-Flip' },
                        { value: 'vflip', label: 'V-Flip' }
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setVideoRotation(opt.value)}
                            className={`p-3 rounded-lg border text-center transition-all ${videoRotation === opt.value
                                ? 'border-primary bg-teal-50 dark:bg-teal-900/20 text-primary font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Audio render functions
    const renderAudioConvert = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Output Format</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].map(fmt => (
                        <button
                            key={fmt}
                            onClick={() => setAudioFormat(fmt)}
                            className={`p-2 rounded-lg border uppercase text-xs font-bold transition-all ${audioFormat === fmt
                                ? 'border-primary bg-pink-50 dark:bg-pink-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Bitrate</label>
                <div className="grid grid-cols-4 gap-2">
                    {['128k', '192k', '256k', '320k'].map(br => (
                        <button
                            key={br}
                            onClick={() => setAudioBitrate(br)}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all ${audioBitrate === br
                                ? 'border-primary bg-pink-50 dark:bg-pink-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {br}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAudioCompress = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Quality Level</label>
                <div className="grid grid-cols-3 gap-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setAudioQuality(level)}
                            className={`px-4 py-3 rounded-md border text-center transition-all ${audioQuality === level
                                ? 'border-primary bg-pink-50 dark:bg-pink-900/20 text-primary font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <span className="capitalize block">{level}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                                {level === 'low' ? '64 kbps' : level === 'medium' ? '128 kbps' : '192 kbps'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAudioTrim = () => (
        <div className="space-y-4">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">⚡ Fast stream copy when possible</p>
            <div className="flex justify-between items-end gap-4">
                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Start Time</label>
                    <input
                        type="text"
                        value={trimStart}
                        onChange={(e) => setTrimStart(e.target.value)}
                        placeholder="00:00:00"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                    />
                </div>
                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">End Time</label>
                    <input
                        type="text"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(e.target.value)}
                        placeholder="00:00:30"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                    />
                </div>
            </div>
        </div>
    );

    const renderAudioVolume = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Volume Level</label>
                    <span className="text-xs font-bold text-primary">{(audioVolume * 100).toFixed(0)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>0% (Mute)</span>
                    <span>100% (Normal)</span>
                    <span>300% (Boost)</span>
                </div>
            </div>
        </div>
    );

    const renderAudioSpeed = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Playback Speed</label>
                    <span className="text-xs font-bold text-primary">{audioSpeed}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={audioSpeed}
                    onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>0.5x (Slow)</span>
                    <span>1x (Normal)</span>
                    <span>2x (Fast)</span>
                </div>
            </div>
        </div>
    );

    const renderAudioFade = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fade In</label>
                        <span className="text-xs font-bold text-primary">{fadeIn}s</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={fadeIn}
                        onChange={(e) => setFadeIn(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fade Out</label>
                        <span className="text-xs font-bold text-primary">{fadeOut}s</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={fadeOut}
                        onChange={(e) => setFadeOut(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        // PDF Page Ops
        if (id === 'pdf-merge') return renderPdfMerge();
        if (id === 'pdf-split') return renderPdfSplit();
        if (id === 'pdf-rotate') return renderPdfRotate();
        if (id === 'pdf-organize') return renderPdfOrganize();
        if (id === 'pdf-layout') return renderPdfLayout();

        // PDF Office
        if (id === 'url-to-pdf') return renderUrlToPdf();
        if (id === 'pdf-to-office' || id === 'file-to-pdf' || id === 'images-to-pdf') {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Upload file(s) to convert.</p>
                </div>
            );
        }

        // PDF Security
        if (id === 'pdf-password') return renderPdfSecurity();
        if (id === 'pdf-watermark') return renderPdfWatermark();
        if (id === 'pdf-sign') return renderPdfSign();

        // PDF Advanced
        if (id === 'pdf-ocr') return renderPdfOcr();
        if (id === 'pdf-compress') return renderPdfCompress();
        if (id === 'pdf-metadata') return renderPdfMetadata();
        if (id === 'pdf-pipeline') return renderPdfPipeline();

        // Images
        if (id === 'img-resize') return renderImageResize();
        if (id === 'img-compress') return renderImageCompress();

        // Video
        if (id === 'vid-compress') return renderVideoCompress();
        if (id === 'vid-trim') return renderVideoTrim();
        if (id === 'vid-convert') return renderVideoConvert();
        if (id === 'vid-resize') return renderVideoResize();
        if (id === 'vid-to-gif') return renderVideoToGif();
        if (id === 'vid-extract-audio') return renderExtractAudio();
        if (id === 'vid-speed') return renderVideoSpeed();
        if (id === 'vid-rotate') return renderVideoRotate();
        if (id === 'vid-watermark') return (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500">Upload video first, then watermark image second.</p>
            </div>
        );
        if (id === 'vid-merge') return (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500">Upload 2+ videos to merge them together.</p>
            </div>
        );
        if (id === 'vid-mute') return (
            <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">⚡ Stream copy - instant processing!</p>
                <p className="text-xs text-gray-500 mt-2">Upload a video to remove its audio track.</p>
            </div>
        );

        // Audio
        if (id === 'aud-convert') return renderAudioConvert();
        if (id === 'aud-compress') return renderAudioCompress();
        if (id === 'aud-trim') return renderAudioTrim();
        if (id === 'aud-merge') return (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500">Upload 2+ audio files to merge them together.</p>
            </div>
        );
        if (id === 'aud-volume') return renderAudioVolume();
        if (id === 'aud-speed') return renderAudioSpeed();
        if (id === 'aud-fade') return renderAudioFade();
        if (id === 'aud-normalize') return (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500">Upload an audio file to normalize its volume levels.</p>
                <p className="text-xs text-gray-400 mt-2">Uses EBU R128 loudness normalization (-16 LUFS)</p>
            </div>
        );

        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                Specific UI for <strong>{tool.title}</strong> is being prepared.
            </div>
        );
    };

    // Determine if we need file upload based on tool
    const needsFileUpload = id !== 'url-to-pdf';
    const acceptedFileTypes = (() => {
        if (id?.startsWith('pdf') || id === 'file-to-pdf') return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.html,.md,.txt';
        if (id?.startsWith('img') || id === 'images-to-pdf') return 'image/*';
        if (id?.startsWith('vid')) return 'video/*';
        if (id?.startsWith('aud')) return 'audio/*';
        return '*';
    })();

    // PDF Sign uses full-width layout like Stirling PDF
    const isFullWidthTool = id === 'pdf-sign';

    // Special full-width layout for pdf-sign
    if (isFullWidthTool && uploadedFiles.length > 0) {
        return (
            <div className="h-[calc(100vh-120px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/tools')}
                        className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-bold text-sm">Back to Toolbox</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center text-primary">
                            <tool.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{tool.title}</h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {tool.badge}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <SignatureEditor
                        file={uploadedFiles[0].file}
                        onSign={handleSignPdf}
                        isProcessing={isProcessing}
                        onClose={() => navigate('/tools')}
                    />
                </div>

                {/* Status messages */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{success}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={isFullWidthTool ? "" : "max-w-3xl mx-auto"}>
            <button
                onClick={() => navigate('/tools')}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-bold text-sm">Back to Toolbox</span>
            </button>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${tool.bgColor} ${tool.color}`}>
                            <tool.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tool.title}</h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {tool.badge}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                        </div>
                    </div>
                </div>

                {/* Workspace */}
                <div className="p-6">
                    {/* File Upload Area */}
                    {needsFileUpload && uploadedFiles.length === 0 && (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer mb-8 group"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={acceptedFileTypes}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white dark:group-hover:bg-black transition-colors">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Click to upload or drag and drop</h3>
                            <p className="text-xs text-gray-500">Max file size 1GB</p>
                        </div>
                    )}

                    {/* Add more files button when files already uploaded */}
                    {needsFileUpload && uploadedFiles.length > 0 && (
                        <div className="mb-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-primary font-bold hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add more files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={acceptedFileTypes}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Uploaded Files List - Show for all tools except PDF merge (which has its own) */}
                    {needsFileUpload && uploadedFiles.length > 0 && id !== 'pdf-merge' && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Uploaded Files ({uploadedFiles.length})
                                </h4>
                                <button
                                    onClick={clearAllFiles}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-2">
                                {uploadedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                {id?.startsWith('vid') ? (
                                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                ) : id?.startsWith('aud') ? (
                                                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                ) : id?.startsWith('img') ? (
                                                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-[300px]">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{file.size}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tool Specific Controls */}
                    <div className="mb-8">
                        {renderContent()}
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-md flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    {/* Processing Progress Bar */}
                    {isProcessing && (
                        <div className="mb-4 space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-700 dark:text-blue-300">{processingMessage || 'Processing...'}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{processingProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
                                    style={{ width: `${processingProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 mr-auto">Processed securely on server</span>
                        <button
                            onClick={clearAllFiles}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing || (needsFileUpload && uploadedFiles.length === 0 && id !== 'url-to-pdf')}
                            className="px-6 py-2 bg-primary hover:bg-red-600 text-white font-bold rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Process & Download
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetail;
