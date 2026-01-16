import { 
    FileText, 
    Calculator, 
    Image as ImageIcon, 
    Video, 
    File,
    Wrench,
    GraduationCap,
    Scissors,
    Layers,
    Lock,
    EyeOff,
    Type,
    Music,
    RefreshCw,
    Minimize2,
    RotateCw,
    Trash2,
    Grid,
    Globe,
    Shield,
    FileSignature,
    Eraser,
    ScanText,
    Settings,
    Workflow,
    FileCode,
    Search
} from 'lucide-react';
import { Tool, Post, Community } from './types';

export const TOOLS: Tool[] = [
    // --- 1. Daily Driver Tools (Page Ops) ---
    {
        id: 'pdf-merge',
        title: 'Merge PDF',
        description: 'Combine multiple PDF files into a single document. Reorder pages easily.',
        icon: Layers,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        badge: 'Stirling',
        ctaText: 'Merge Files',
        category: 'PDF Page Ops'
    },
    {
        id: 'pdf-split',
        title: 'Split PDF',
        description: 'Split by page ranges, groups of pages, or file size.',
        icon: Scissors,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        badge: 'Stirling',
        ctaText: 'Split File',
        category: 'PDF Page Ops'
    },
    {
        id: 'pdf-rotate',
        title: 'Rotate Pages',
        description: 'Rotate specific pages (0, 90, 180, 270) permanently.',
        icon: RotateCw,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        badge: 'Stirling',
        ctaText: 'Rotate',
        category: 'PDF Page Ops'
    },
    {
        id: 'pdf-organize',
        title: 'Reorganize Pages',
        description: 'Drag-and-drop page ordering or delete specific pages.',
        icon: Grid,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        badge: 'Stirling',
        ctaText: 'Organize',
        category: 'PDF Page Ops'
    },
    {
        id: 'pdf-layout',
        title: 'Multi-Page Layout',
        description: 'Put multiple pages on one sheet (e.g., 2-up or 4-up printing).',
        icon: Grid,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        badge: 'Stirling',
        ctaText: 'Format',
        category: 'PDF Page Ops'
    },

    // --- 2. Office & Conversion Tools ---
    {
        id: 'pdf-to-office',
        title: 'PDF to Word/Excel',
        description: 'Convert PDF documents to editable Word, Excel, or PowerPoint files.',
        icon: FileText,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        badge: 'LibreOffice',
        ctaText: 'Convert',
        category: 'PDF Office'
    },
    {
        id: 'file-to-pdf',
        title: 'File to PDF',
        description: 'Convert Docx, PPTx, XLSX, ODT, HTML, or Markdown into PDF.',
        icon: File,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        badge: 'LibreOffice',
        ctaText: 'Convert',
        category: 'PDF Office'
    },
    {
        id: 'url-to-pdf',
        title: 'URL to PDF',
        description: 'Capture a website URL and convert it into a PDF document.',
        icon: Globe,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        badge: 'Puppeteer',
        ctaText: 'Capture',
        category: 'PDF Office'
    },
    {
        id: 'images-to-pdf',
        title: 'Images to PDF',
        description: 'Combine JPG/PNG images into a single PDF document.',
        icon: ImageIcon,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        badge: 'Stirling',
        ctaText: 'Combine',
        category: 'PDF Office'
    },

    // --- 3. Security & Privacy Tools ---
    {
        id: 'pdf-password',
        title: 'Add/Remove Password',
        description: 'Encrypt with AES-256 or unlock PDFs if you know the password.',
        icon: Lock,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        badge: 'Security',
        ctaText: 'Secure',
        category: 'PDF Security'
    },
    {
        id: 'pdf-sign',
        title: 'Sign & Certify',
        description: 'Add a digital signature (PFX/P12) or a visual signature.',
        icon: FileSignature,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        badge: 'Security',
        ctaText: 'Sign',
        category: 'PDF Security'
    },
    {
        id: 'pdf-watermark',
        title: 'Watermark PDF',
        description: 'Overlay text or images on every page for copyright protection.',
        icon: Type,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        badge: 'Stirling',
        ctaText: 'Watermark',
        category: 'PDF Security'
    },
    {
        id: 'pdf-redact',
        title: 'Redact & Sanitize',
        description: 'Black out sensitive text or remove metadata and hidden layers.',
        icon: Eraser,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        badge: 'Privacy',
        ctaText: 'Redact',
        category: 'PDF Security'
    },

    // --- 4. Advanced / AI Tools ---
    {
        id: 'pdf-ocr',
        title: 'OCR Searchable Text',
        description: 'Add a searchable text layer to scanned documents using Tesseract.',
        icon: ScanText,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        badge: 'Tesseract',
        ctaText: 'OCR',
        category: 'PDF Advanced'
    },
    {
        id: 'pdf-compress',
        title: 'Compress PDF',
        description: 'Reduce file size by optimizing DPI and image quality.',
        icon: Minimize2,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        badge: 'Ghostscript',
        ctaText: 'Compress',
        category: 'PDF Advanced'
    },
    {
        id: 'pdf-repair',
        title: 'Repair PDF',
        description: 'Attempt to fix broken headers and corrupted files.',
        icon: Wrench,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        badge: 'Ghostscript',
        ctaText: 'Fix',
        category: 'PDF Advanced'
    },
    {
        id: 'pdf-compare',
        title: 'Compare PDFs',
        description: 'Overlay two PDFs to highlight visual differences.',
        icon: Search,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        badge: 'Diff',
        ctaText: 'Compare',
        category: 'PDF Advanced'
    },
    {
        id: 'pdf-metadata',
        title: 'Edit Metadata',
        description: 'Change Author, Title, Creator, and Subject fields.',
        icon: FileCode,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        badge: 'Utils',
        ctaText: 'Edit',
        category: 'PDF Advanced'
    },
    {
        id: 'pdf-pipeline',
        title: 'Pipeline Workflow',
        description: 'Chain multiple tools together (e.g., Merge -> OCR -> Watermark).',
        icon: Workflow,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        badge: 'Developer',
        ctaText: 'Build',
        category: 'PDF Advanced'
    },
    
    // --- Image Tools (ImgProxy) ---
    {
        id: 'img-resize',
        title: 'Resize & Crop',
        description: 'Change dimensions, fit, fill, or crop images.',
        icon: Minimize2,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        badge: 'ImgProxy',
        ctaText: 'Edit',
        category: 'Image Tools'
    },
    {
        id: 'img-compress',
        title: 'Convert & Compress',
        description: 'Optimize images for web (WEBP/AVIF).',
        icon: RefreshCw,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        badge: 'ImgProxy',
        ctaText: 'Compress',
        category: 'Image Tools'
    },

    // --- Video Tools (FFmpeg) ---
    {
        id: 'vid-compress',
        title: 'Video Compressor',
        description: 'Squash large video files for upload.',
        icon: Minimize2,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Compress',
        category: 'Video Tools'
    },
    {
        id: 'vid-trim',
        title: 'Video Trimmer',
        description: 'Cut the start or end of a video.',
        icon: Scissors,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Trim',
        category: 'Video Tools'
    },
    {
        id: 'vid-convert',
        title: 'Video Converter',
        description: 'Convert videos to MP4, WebM, AVI, MKV, MOV formats.',
        icon: RefreshCw,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Convert',
        category: 'Video Tools'
    },
    {
        id: 'vid-resize',
        title: 'Video Resize',
        description: 'Change resolution to 1080p, 720p, 480p, or custom size.',
        icon: Minimize2,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Resize',
        category: 'Video Tools'
    },
    {
        id: 'vid-to-gif',
        title: 'Video to GIF',
        description: 'Convert video clips to optimized animated GIFs.',
        icon: ImageIcon,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Create GIF',
        category: 'Video Tools'
    },
    {
        id: 'vid-extract-audio',
        title: 'Extract Audio',
        description: 'Extract audio track from video as MP3, AAC, or WAV.',
        icon: Music,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Extract',
        category: 'Video Tools'
    },
    {
        id: 'vid-speed',
        title: 'Video Speed',
        description: 'Speed up or slow down video playback.',
        icon: RefreshCw,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Change Speed',
        category: 'Video Tools'
    },
    {
        id: 'vid-rotate',
        title: 'Rotate Video',
        description: 'Rotate 90°, 180°, 270° or flip horizontally/vertically.',
        icon: RotateCw,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Rotate',
        category: 'Video Tools'
    },
    {
        id: 'vid-watermark',
        title: 'Video Watermark',
        description: 'Add image watermark overlay to videos.',
        icon: Type,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Watermark',
        category: 'Video Tools'
    },
    {
        id: 'vid-merge',
        title: 'Merge Videos',
        description: 'Combine multiple videos into one file.',
        icon: Layers,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Merge',
        category: 'Video Tools'
    },
    {
        id: 'vid-mute',
        title: 'Mute Video',
        description: 'Remove audio track from video.',
        icon: EyeOff,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        badge: 'FFmpeg',
        ctaText: 'Mute',
        category: 'Video Tools'
    },

    // --- Audio Tools (FFmpeg) ---
    {
        id: 'aud-convert',
        title: 'Audio Converter',
        description: 'Convert audio to MP3, WAV, AAC, OGG, FLAC, M4A.',
        icon: Music,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Convert',
        category: 'Audio Tools'
    },
    {
        id: 'aud-compress',
        title: 'Audio Compressor',
        description: 'Reduce audio file size with quality control.',
        icon: Minimize2,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Compress',
        category: 'Audio Tools'
    },
    {
        id: 'aud-trim',
        title: 'Audio Trimmer',
        description: 'Cut audio by start and end time.',
        icon: Scissors,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Trim',
        category: 'Audio Tools'
    },
    {
        id: 'aud-merge',
        title: 'Merge Audio',
        description: 'Combine multiple audio files into one.',
        icon: Layers,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Merge',
        category: 'Audio Tools'
    },
    {
        id: 'aud-volume',
        title: 'Volume Changer',
        description: 'Increase or decrease audio volume.',
        icon: Music,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Adjust',
        category: 'Audio Tools'
    },
    {
        id: 'aud-speed',
        title: 'Audio Speed',
        description: 'Speed up or slow down audio playback.',
        icon: RefreshCw,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Change Speed',
        category: 'Audio Tools'
    },
    {
        id: 'aud-fade',
        title: 'Audio Fade',
        description: 'Add fade in and fade out effects.',
        icon: Music,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Add Fade',
        category: 'Audio Tools'
    },
    {
        id: 'aud-normalize',
        title: 'Normalize Audio',
        description: 'Balance audio levels for consistent volume.',
        icon: Settings,
        color: 'text-pink-500',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        badge: 'FFmpeg',
        ctaText: 'Normalize',
        category: 'Audio Tools'
    }
];

export const POSTS: Post[] = [];
export const COMMUNITIES: Community[] = [];
