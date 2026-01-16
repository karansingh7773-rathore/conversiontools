import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Download, Loader2,
    Scissors, Plus, Minus, AlertCircle, CheckCircle, Maximize, Square,
    Crop, Music, Zap, Clock, Settings, Upload, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as api from '../services/api';

interface TrimRange {
    start: number;
    end: number;
}

const VideoEditor: React.FC = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Video State
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);

    // Active Tab
    const [activeTab, setActiveTab] = useState<'transform' | 'adjust' | 'audio' | 'speed' | 'time'>('transform');

    // Transform State
    const [fitMode, setFitMode] = useState<'fill' | 'fit' | 'crop'>('fit');
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // Adjust State
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);

    // Audio State
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [removeAudio, setRemoveAudio] = useState(false);

    // Speed State
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Time/Trim State
    const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });
    const [isTrimming, setIsTrimming] = useState(false);

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    // Handle file upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setError(null);
            setSuccess(null);
            // Reset all edits
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setVolume(100);
            setIsMuted(false);
            setPlaybackSpeed(1);
            setThumbnails([]);
        }
    };

    // Handle video metadata loaded
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setTrimRange({ start: 0, end: videoRef.current.duration });
            generateThumbnails();
        }
    };

    // Generate thumbnails for timeline
    const generateThumbnails = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setIsGeneratingThumbnails(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const thumbCount = 30; // Number of thumbnails
        const thumbWidth = 80;
        const thumbHeight = 45;
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        const newThumbnails: string[] = [];
        const interval = video.duration / thumbCount;

        for (let i = 0; i < thumbCount; i++) {
            const time = i * interval;
            video.currentTime = time;
            
            await new Promise<void>((resolve) => {
                const handler = () => {
                    ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);
                    newThumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
                    video.removeEventListener('seeked', handler);
                    resolve();
                };
                video.addEventListener('seeked', handler);
            });
        }

        setThumbnails(newThumbnails);
        video.currentTime = 0;
        setIsGeneratingThumbnails(false);
    };

    // Play/Pause toggle
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Time update handler
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            
            // Loop within trim range if trimming
            if (isTrimming && videoRef.current.currentTime >= trimRange.end) {
                videoRef.current.currentTime = trimRange.start;
            }
        }
    };

    // Seek to position
    const seekTo = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Timeline click handler
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        seekTo(percentage * duration);
    };

    // Skip forward/backward
    const skip = (seconds: number) => {
        seekTo(currentTime + seconds);
    };

    // Apply video transformations
    const getVideoStyle = (): React.CSSProperties => {
        const transforms: string[] = [];
        
        if (rotation !== 0) {
            transforms.push(`rotate(${rotation}deg)`);
        }
        if (flipH) {
            transforms.push('scaleX(-1)');
        }
        if (flipV) {
            transforms.push('scaleY(-1)');
        }

        return {
            transform: transforms.join(' '),
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
            objectFit: fitMode === 'fill' ? 'fill' : fitMode === 'fit' ? 'contain' : 'cover',
        };
    };

    // Update video volume
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume / 100;
        }
    }, [volume, isMuted]);

    // Update playback speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Simulate export progress
    const simulateExportProgress = () => {
        setExportProgress(5);
        let progress = 5;
        const interval = setInterval(() => {
            if (progress < 40) {
                progress += Math.random() * 8 + 2;
            } else if (progress < 70) {
                progress += Math.random() * 5 + 1;
            } else if (progress < 90) {
                progress += Math.random() * 2 + 0.5;
            } else if (progress < 95) {
                progress += Math.random() * 0.5;
            }
            progress = Math.min(progress, 95);
            setExportProgress(Math.round(progress));
        }, 500);
        
        return () => {
            clearInterval(interval);
            setExportProgress(100);
        };
    };

    // Export video with all edits
    const handleExport = async () => {
        if (!videoFile) {
            setError('Please upload a video first');
            return;
        }

        setIsExporting(true);
        setError(null);
        setSuccess(null);
        setExportMessage('Preparing video...');

        const stopProgress = simulateExportProgress();

        try {
            // Determine what operations to apply
            let result: Blob | null = null;
            let currentFile: File = videoFile;

            // Apply operations sequentially or combine into one API call
            // For now, we'll apply the most impactful operation

            if (rotation !== 0) {
                setExportMessage(`Rotating video ${rotation}°...`);
                const response = await api.rotateVideo(currentFile, rotation.toString());
                if (response.data) {
                    currentFile = new File([response.data], videoFile.name, { type: 'video/mp4' });
                    result = response.data;
                }
            }

            if (trimRange.start > 0 || trimRange.end < duration) {
                setExportMessage('Trimming video...');
                const startTime = formatTimeForFFmpeg(trimRange.start);
                const endTime = formatTimeForFFmpeg(trimRange.end);
                const response = await api.trimVideo(currentFile, startTime, endTime);
                if (response.data) {
                    currentFile = new File([response.data], videoFile.name, { type: 'video/mp4' });
                    result = response.data;
                }
            }

            if (playbackSpeed !== 1) {
                setExportMessage(`Changing speed to ${playbackSpeed}x...`);
                const response = await api.changeVideoSpeed(currentFile, playbackSpeed);
                if (response.data) {
                    currentFile = new File([response.data], videoFile.name, { type: 'video/mp4' });
                    result = response.data;
                }
            }

            if (removeAudio || volume === 0) {
                setExportMessage('Removing audio...');
                const response = await api.muteVideo(currentFile);
                if (response.data) {
                    result = response.data;
                }
            }

            // If no operations, just compress with current settings
            if (!result) {
                setExportMessage('Exporting video...');
                const response = await api.compressVideo(videoFile, {
                    compressionMethod: 'preset',
                    compressionLevel: 'medium',
                    muteAudio: removeAudio
                });
                if (response.data) {
                    result = response.data;
                }
            }

            stopProgress();

            if (!result) {
                throw new Error('Export failed - no output received');
            }

            // Download the result
            const url = URL.createObjectURL(result);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited_${videoFile.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess('Video exported successfully!');
        } catch (err: any) {
            setError(err.message || 'Export failed');
        } finally {
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
        }
    };

    // Format time for FFmpeg (HH:MM:SS)
    const formatTimeForFFmpeg = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Cleanup URL on unmount
    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'transform':
                return (
                    <div className="space-y-6">
                        {/* Fit Mode */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { mode: 'fill' as const, icon: Square, label: 'Fill' },
                                    { mode: 'fit' as const, icon: Maximize, label: 'Fit' },
                                    { mode: 'crop' as const, icon: Crop, label: 'Crop' },
                                ].map(({ mode, icon: Icon, label }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setFitMode(mode)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                                            fitMode === mode
                                            ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Flip & Rotate */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Flip & Rotate</h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFlipH(!flipH)}
                                    className={`p-3 rounded-lg border transition-all ${
                                        flipH
                                        ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                    title="Flip Horizontal"
                                >
                                    <FlipHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setFlipV(!flipV)}
                                    className={`p-3 rounded-lg border transition-all ${
                                        flipV
                                        ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                    title="Flip Vertical"
                                >
                                    <FlipVertical className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setRotation((r) => (r - 90) % 360)}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                                    title="Rotate Left"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <button
                                        onClick={() => setRotation((r) => r - 1)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-mono w-8 text-center">{rotation}°</span>
                                    <button
                                        onClick={() => setRotation((r) => r + 1)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                                    title="Rotate Right"
                                >
                                    <RotateCw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'adjust':
                return (
                    <div className="space-y-6">
                        {/* Brightness */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Brightness</label>
                                <span className="text-xs font-bold text-primary">{brightness}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={brightness}
                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Contrast</label>
                                <span className="text-xs font-bold text-primary">{contrast}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={contrast}
                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Saturation</label>
                                <span className="text-xs font-bold text-primary">{saturation}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={saturation}
                                onChange={(e) => setSaturation(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={() => {
                                setBrightness(100);
                                setContrast(100);
                                setSaturation(100);
                            }}
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            Reset to Default
                        </button>
                    </div>
                );

            case 'audio':
                return (
                    <div className="space-y-6">
                        {/* Volume Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Volume</label>
                                <span className="text-xs font-bold text-primary">{isMuted ? 'Muted' : `${volume}%`}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-2 rounded-lg border transition-all ${
                                        isMuted
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) => {
                                        setVolume(parseInt(e.target.value));
                                        if (isMuted) setIsMuted(false);
                                    }}
                                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    disabled={isMuted}
                                />
                            </div>
                        </div>

                        {/* Remove Audio Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Remove Audio Track</h4>
                                <p className="text-xs text-gray-500">Export video without any audio</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={removeAudio}
                                    onChange={(e) => setRemoveAudio(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Extract Audio Button */}
                        <button
                            onClick={async () => {
                                if (!videoFile) return;
                                setIsExporting(true);
                                setExportMessage('Extracting audio...');
                                try {
                                    const response = await api.extractAudioFromVideo(videoFile, 'mp3', '192k');
                                    if (response.data) {
                                        const url = URL.createObjectURL(response.data);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = videoFile.name.replace(/\.[^/.]+$/, '') + '.mp3';
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        setSuccess('Audio extracted successfully!');
                                    } else {
                                        throw new Error('No audio data received');
                                    }
                                } catch (err: any) {
                                    setError(err.message);
                                } finally {
                                    setIsExporting(false);
                                }
                            }}
                            disabled={!videoFile || isExporting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Music className="w-5 h-5" />
                            Extract Audio as MP3
                        </button>
                    </div>
                );

            case 'speed':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Playback Speed</label>
                                <span className="text-xs font-bold text-primary">{playbackSpeed}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.25"
                                max="4"
                                step="0.25"
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>0.25x</span>
                                <span>1x</span>
                                <span>2x</span>
                                <span>4x</span>
                            </div>
                        </div>

                        {/* Speed Presets */}
                        <div className="grid grid-cols-4 gap-2">
                            {[0.5, 1, 1.5, 2].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                                        playbackSpeed === speed
                                        ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Speed changes will be applied on export
                        </p>
                    </div>
                );

            case 'time':
                return (
                    <div className="space-y-6">
                        {/* Trim Controls */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isTrimming}
                                        onChange={(e) => setIsTrimming(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Trim</span>
                            </div>

                            {isTrimming && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-500">Start Time</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={formatTimeForFFmpeg(trimRange.start)}
                                                    readOnly
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm font-mono"
                                                />
                                                <button
                                                    onClick={() => setTrimRange({ ...trimRange, start: currentTime })}
                                                    className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                                                >
                                                    Set
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-500">End Time</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={formatTimeForFFmpeg(trimRange.end)}
                                                    readOnly
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm font-mono"
                                                />
                                                <button
                                                    onClick={() => setTrimRange({ ...trimRange, end: currentTime })}
                                                    className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                                                >
                                                    Set
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Duration: {formatTime(trimRange.end - trimRange.start)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                );
        }
    };

    // No video uploaded - show upload screen
    if (!videoUrl) {
        return (
            <div className="max-w-5xl mx-auto">
                <button 
                    onClick={() => navigate('/tools')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-bold text-sm">Back to Toolbox</span>
                </button>

                <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Editor</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Upload a video to edit. Transform, adjust colors, control audio, change speed, and trim - all in one place.
                        </p>

                        <div 
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 hover:border-primary/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white dark:group-hover:bg-black transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Click to upload or drag and drop</h3>
                            <p className="text-sm text-gray-500">MP4, WebM, MOV, AVI (Max 1GB)</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => {
                        setVideoUrl('');
                        setVideoFile(null);
                    }}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-bold text-sm">New Video</span>
                </button>

                <div className="flex items-center gap-3">
                    {videoFile && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {videoFile.name}
                        </span>
                    )}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-red-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isExporting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Export
                    </button>
                </div>
            </div>

            {/* Main Editor Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Panel - Controls */}
                <div className="lg:col-span-1 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        {[
                            { id: 'transform' as const, label: 'Transform' },
                            { id: 'adjust' as const, label: 'Adjust' },
                            { id: 'audio' as const, label: 'Audio' },
                            { id: 'speed' as const, label: 'Speed' },
                            { id: 'time' as const, label: 'Time' },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex-1 px-3 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                                    activeTab === id
                                    ? 'text-primary border-b-2 border-primary bg-red-50 dark:bg-red-900/10'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {renderTabContent()}
                    </div>
                </div>

                {/* Right Panel - Video Preview & Timeline */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Video Preview */}
                    <div className="bg-black rounded-xl overflow-hidden relative aspect-video">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            style={getVideoStyle()}
                            className="w-full h-full"
                        />
                        
                        {/* Loading Thumbnails Overlay */}
                        {isGeneratingThumbnails && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <p className="text-sm">Generating thumbnails...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Playback Controls */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-4">
                        {/* Timeline */}
                        <div 
                            ref={timelineRef}
                            className="relative h-16 bg-gray-900 rounded-lg overflow-hidden cursor-pointer mb-4"
                            onClick={handleTimelineClick}
                        >
                            {/* Thumbnails */}
                            <div className="flex h-full">
                                {thumbnails.map((thumb, i) => (
                                    <img 
                                        key={i} 
                                        src={thumb} 
                                        alt="" 
                                        className="h-full object-cover flex-shrink-0"
                                        style={{ width: `${100 / thumbnails.length}%` }}
                                    />
                                ))}
                            </div>

                            {/* Trim Range Overlay */}
                            {isTrimming && (
                                <>
                                    <div 
                                        className="absolute top-0 bottom-0 bg-black/60"
                                        style={{ 
                                            left: 0, 
                                            width: `${(trimRange.start / duration) * 100}%` 
                                        }}
                                    />
                                    <div 
                                        className="absolute top-0 bottom-0 bg-black/60"
                                        style={{ 
                                            left: `${(trimRange.end / duration) * 100}%`,
                                            right: 0
                                        }}
                                    />
                                    <div 
                                        className="absolute top-0 bottom-0 border-2 border-yellow-400"
                                        style={{
                                            left: `${(trimRange.start / duration) * 100}%`,
                                            width: `${((trimRange.end - trimRange.start) / duration) * 100}%`
                                        }}
                                    />
                                </>
                            )}

                            {/* Playhead */}
                            <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                                style={{ left: `${(currentTime / duration) * 100}%` }}
                            >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between">
                            {/* Left: Skip controls */}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => seekTo(0)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <SkipBack className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => skip(-5)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Center: Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="p-3 bg-primary text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                            </button>

                            {/* Right: Skip controls + Time */}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => skip(5)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => seekTo(duration)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 ml-4">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Export Progress */}
                    {isExporting && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{exportMessage}</span>
                                <span className="text-sm font-bold text-blue-600">{exportProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-md flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden canvas for thumbnail generation */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default VideoEditor;
