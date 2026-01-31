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
        description: 'Encrypt with AES-256 or unlock PDFs with the correct password.',
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




    // --- Video Tools (FFmpeg) ---
    {
        id: 'video-editor',
        title: 'Video Editor',
        description: 'All-in-one editor: trim, rotate, adjust, speed, audio - with live preview & timeline.',
        icon: Video,
        color: 'text-teal-600',
        bgColor: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30',
        badge: 'NEW',
        ctaText: 'Open Editor',
        category: 'Video Tools'
    },
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



];

export const POSTS: Post[] = [];
export const COMMUNITIES: Community[] = [];
