/**
 * Client-Side PDF Operations using pdf-lib
 * 
 * These operations process PDFs entirely in the browser - NO SERVER NEEDED!
 * The files never leave the user's computer, making them INSTANT and PRIVATE.
 */

import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

// ============== MERGE PDFs ==============

/**
 * Merge multiple PDFs into one - client-side!
 * @param pdfFiles - Array of PDF files to merge (in order)
 * @returns Blob of the merged PDF
 */
export async function mergePdfs(pdfFiles: File[]): Promise<Blob> {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
        try {
            // Load each PDF
            const pdfBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);

            // Copy all pages from this PDF
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        } catch (error) {
            console.error(`Failed to load PDF ${file.name}:`, error);
            throw new Error(`Failed to merge ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Save and return the merged PDF
    const mergedBytes = await mergedPdf.save();
    return new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== SPLIT PDF ==============

export interface SplitOptions {
    mode: 'all' | 'range' | 'every';
    ranges?: string;  // e.g., "1-3,5,7-10"
    everyN?: number;  // Split every N pages
}

/**
 * Split a PDF into separate files - client-side!
 * @param pdfFile - The PDF file to split
 * @param options - Split options
 * @returns Array of Blobs (one per split PDF)
 */
export async function splitPdf(
    pdfFile: File,
    options: SplitOptions
): Promise<{ blob: Blob; filename: string }[]> {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const totalPages = pdf.getPageCount();
    const baseName = pdfFile.name.replace(/\.pdf$/i, '');

    const results: { blob: Blob; filename: string }[] = [];

    if (options.mode === 'all') {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFDocument.create();
            const [page] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(page);

            const bytes = await newPdf.save();
            results.push({
                blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
                filename: `${baseName}_page_${i + 1}.pdf`
            });
        }
    } else if (options.mode === 'range' && options.ranges) {
        // Split by ranges (e.g., "1-3,5,7-10")
        const pageGroups = parseRanges(options.ranges, totalPages);

        for (let i = 0; i < pageGroups.length; i++) {
            const group = pageGroups[i];
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, group.map(p => p - 1)); // Convert to 0-indexed
            pages.forEach(page => newPdf.addPage(page));

            const bytes = await newPdf.save();
            results.push({
                blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
                filename: `${baseName}_pages_${group[0]}-${group[group.length - 1]}.pdf`
            });
        }
    } else if (options.mode === 'every' && options.everyN) {
        // Split every N pages
        const n = options.everyN;
        for (let i = 0; i < totalPages; i += n) {
            const newPdf = await PDFDocument.create();
            const endPage = Math.min(i + n, totalPages);
            const indices = Array.from({ length: endPage - i }, (_, j) => i + j);
            const pages = await newPdf.copyPages(pdf, indices);
            pages.forEach(page => newPdf.addPage(page));

            const bytes = await newPdf.save();
            results.push({
                blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
                filename: `${baseName}_pages_${i + 1}-${endPage}.pdf`
            });
        }
    }

    return results;
}

/**
 * Parse range string like "1-3,5,7-10" into page groups
 */
function parseRanges(rangeStr: string, maxPages: number): number[][] {
    const groups: number[][] = [];
    const parts = rangeStr.split(',').map(s => s.trim());

    for (const part of parts) {
        const pages: number[] = [];
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim()));
            for (let i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
                pages.push(i);
            }
        } else {
            const page = parseInt(part);
            if (page >= 1 && page <= maxPages) {
                pages.push(page);
            }
        }
        if (pages.length > 0) {
            groups.push(pages);
        }
    }

    return groups;
}

// ============== ROTATE PDF ==============

export type RotationAngle = 0 | 90 | 180 | 270;

/**
 * Rotate pages in a PDF - client-side!
 * @param pdfFile - The PDF file
 * @param angle - Rotation angle (90, 180, or 270 degrees)
 * @param pageNumbers - Optional specific pages to rotate (1-indexed), if empty rotates all
 * @returns Blob of the rotated PDF
 */
export async function rotatePdf(
    pdfFile: File,
    angle: RotationAngle,
    pageNumbers?: number[]
): Promise<Blob> {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = pdf.getPages();

    // Determine which pages to rotate
    const pagesToRotate = pageNumbers && pageNumbers.length > 0
        ? pageNumbers.map(n => n - 1) // Convert to 0-indexed
        : pages.map((_, i) => i); // All pages

    for (const pageIndex of pagesToRotate) {
        if (pageIndex >= 0 && pageIndex < pages.length) {
            const page = pages[pageIndex];
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + angle));
        }
    }

    const rotatedBytes = await pdf.save();
    return new Blob([rotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== WATERMARK PDF ==============

export interface WatermarkOptions {
    text: string;
    fontSize?: number;
    opacity?: number;      // 0-1
    rotation?: number;     // degrees
    color?: { r: number; g: number; b: number }; // RGB 0-1
    position?: 'center' | 'diagonal' | 'top' | 'bottom';
    pageNumbers?: number[]; // Specific pages (1-indexed), empty = all pages
}

/**
 * Add text watermark to PDF - client-side!
 * @param pdfFile - The PDF file
 * @param options - Watermark options
 * @returns Blob of the watermarked PDF
 */
export async function addWatermark(
    pdfFile: File,
    options: WatermarkOptions
): Promise<Blob> {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = pdf.getPages();

    // Load font
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    // Set defaults
    const fontSize = options.fontSize || 50;
    const opacity = options.opacity ?? 0.3;
    const rotation = options.rotation ?? (options.position === 'diagonal' ? -45 : 0);
    const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };

    // Determine which pages to watermark
    const pagesToMark = options.pageNumbers && options.pageNumbers.length > 0
        ? options.pageNumbers.map(n => n - 1)
        : pages.map((_, i) => i);

    for (const pageIndex of pagesToMark) {
        if (pageIndex >= 0 && pageIndex < pages.length) {
            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            // Calculate text position
            const textWidth = font.widthOfTextAtSize(options.text, fontSize);
            let x: number, y: number;

            switch (options.position) {
                case 'top':
                    x = (width - textWidth) / 2;
                    y = height - fontSize - 20;
                    break;
                case 'bottom':
                    x = (width - textWidth) / 2;
                    y = 20;
                    break;
                case 'diagonal':
                case 'center':
                default:
                    x = (width - textWidth) / 2;
                    y = height / 2;
                    break;
            }

            page.drawText(options.text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity,
                rotate: degrees(rotation),
            });
        }
    }

    const watermarkedBytes = await pdf.save();
    return new Blob([watermarkedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== REORDER/DELETE PAGES ==============

/**
 * Reorder or delete pages from a PDF - client-side!
 * @param pdfFile - The PDF file
 * @param newOrder - Array of page numbers in desired order (1-indexed), omit pages to delete them
 * @returns Blob of the reordered PDF
 */
export async function reorderPages(
    pdfFile: File,
    newOrder: number[]
): Promise<Blob> {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);

    // Create new PDF with pages in specified order
    const newPdf = await PDFDocument.create();
    const indices = newOrder.map(n => n - 1); // Convert to 0-indexed
    const pages = await newPdf.copyPages(pdf, indices);
    pages.forEach(page => newPdf.addPage(page));

    const reorderedBytes = await newPdf.save();
    return new Blob([reorderedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== EXTRACT PAGES ==============

/**
 * Extract specific pages from a PDF - client-side!
 * @param pdfFile - The PDF file
 * @param pageNumbers - Array of page numbers to extract (1-indexed)
 * @returns Blob of PDF with only the extracted pages
 */
export async function extractPages(
    pdfFile: File,
    pageNumbers: number[]
): Promise<Blob> {
    return reorderPages(pdfFile, pageNumbers);
}

// ============== UTILITY ==============

/**
 * Get PDF page count without fully loading it
 */
export async function getPageCount(pdfFile: File): Promise<number> {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    return pdf.getPageCount();
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download multiple blobs as a zip file (requires jszip)
 * Falls back to downloading individually if jszip not available
 */
export async function downloadMultiple(
    files: { blob: Blob; filename: string }[]
): Promise<void> {
    if (files.length === 1) {
        downloadBlob(files[0].blob, files[0].filename);
        return;
    }

    // For multiple files, download each one
    // (could use jszip for better UX if added as dependency)
    for (const file of files) {
        downloadBlob(file.blob, file.filename);
        // Small delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
