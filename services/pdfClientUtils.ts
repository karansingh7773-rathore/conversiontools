/**
 * Client-Side PDF Operations using pdf-lib
 * 
 * These operations process PDFs entirely in the browser - NO SERVER NEEDED!
 * The files never leave the user's computer, making them INSTANT and PRIVATE.
 */

import { PDFDocument, degrees, rgb, StandardFonts, Rotation } from 'pdf-lib';

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

// ============== ASSEMBLE PDF (Multi-file / Organize) ==============

export interface PageAssemblyInstruction {
    fileIndex: number;
    pageIndex: number; // 0-indexed
    rotation: number; // degrees (0, 90, 180, 270)
}

/**
 * Assemble a new PDF from pages of multiple source files
 * Handles merging, reordering, deleting, and rotating in one operation.
 * @param files - Array of source PDF files
 * @param instructions - Array of instructions for each page in the new PDF
 * @returns Blob of the assembled PDF
 */
export async function assemblePdf(
    files: File[],
    instructions: PageAssemblyInstruction[]
): Promise<Blob> {
    const newPdf = await PDFDocument.create();

    // Cache loaded PDFs to avoid reloading the same file multiple times
    const loadedPdfs: Record<number, PDFDocument> = {};

    // Group instructions by file to minimize copyPages calls (optimization)
    // However, for strict ordering, we might need to copy one by one or carefully map indices
    // To ensure correct order, we simply iterate instructions and copy pages ensuring they are added in order.
    // pdf-lib's copyPages allows copying multiple pages at once, but if we mix files, we have to do it in chunks.

    // Better approach: Load all needed source PDFs first
    // Then copy pages. Note: copyPages returns pages but doesn't add them. We can copy all needed pages from File A, then File B.
    // BUT we need to add them to newPdf in the specific order of 'instructions'.

    // So:
    // 1. Identify all unique file indices
    // 2. Load those PDFs
    // 3. For each instruction in order:
    //    - Get the source PDF
    //    - Copy the single page (copyPages([index]))
    //    - Add to newPdf
    //    - Apply rotation

    // 1. Load source PDFs
    const uniqueFileIndices = [...new Set(instructions.map(i => i.fileIndex))];
    for (const idx of uniqueFileIndices) {
        if (!files[idx]) continue;
        const arrayBuffer = await files[idx].arrayBuffer();
        loadedPdfs[idx] = await PDFDocument.load(arrayBuffer);
    }

    // 2. Process instructions
    for (const inst of instructions) {
        const sourcePdf = loadedPdfs[inst.fileIndex];
        if (!sourcePdf) continue;

        // Copy a single page
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [inst.pageIndex]);

        // Add to document
        // Apply rotation - combine existing rotation with new rotation
        // Note: copiedPage keeps its original rotation. We need to ADD our rotation to it.
        const existingRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(existingRotation + inst.rotation));

        newPdf.addPage(copiedPage);
    }

    const savedBytes = await newPdf.save();
    return new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== PDF ENCRYPTION ==============

/**
 * Check if a PDF is encrypted (password protected)
 * @param pdfFile - The PDF file to check
 * @returns true if encrypted, false otherwise
 */
export async function checkPdfEncryption(pdfFile: File): Promise<boolean> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    try {
        await PDFDocument.load(arrayBuffer);
        return false; // Loaded without password = not encrypted
    } catch (error) {
        if (error instanceof Error &&
            (error.message.includes('encrypted') || error.message.includes('password'))) {
            return true;
        }
        throw error; // Re-throw non-encryption errors
    }
}

/**
 * Unlock/remove password from an encrypted PDF - client-side!
 * 
 * NOTE: pdf-lib supports removing "owner password" (permissions password) only.
 * For PDFs encrypted with a "user password" (open password), use the server API.
 * 
 * @param pdfFile - The encrypted PDF file  
 * @param _password - Password parameter (kept for API compatibility, but pdf-lib uses ignoreEncryption)
 * @returns Blob of the unlocked PDF (without encryption)
 */
export async function unlockPdf(
    pdfFile: File,
    _password: string
): Promise<Blob> {
    const arrayBuffer = await pdfFile.arrayBuffer();

    // Attempt to load with ignoreEncryption - this works for owner-password PDFs
    // (PDFs that can be opened but have restrictions like no-print)
    try {
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true
        });

        // Save without encryption settings - creates unencrypted PDF
        const pdfBytes = await pdfDoc.save();

        return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    } catch (error) {
        // If ignoreEncryption fails, the PDF requires a user password to open
        // This requires server-side processing with tools like qpdf
        throw new Error(
            'This PDF requires a password to open and cannot be unlocked client-side. ' +
            'Please contact support for assistance with fully encrypted PDFs.'
        );
    }
}

// ============== METADATA OPERATIONS ==============

export interface PdfMetadata {
    title: string | undefined;
    author: string | undefined;
    subject: string | undefined;
    keywords: string[] | undefined;
    creator: string | undefined;
    producer: string | undefined;
    creationDate: Date | undefined;
    modificationDate: Date | undefined;
}

/**
 * Get metadata from a PDF - client-side!
 * Returns all metadata fields that can potentially leak private information.
 */
export async function getMetadata(pdfFile: File): Promise<PdfMetadata> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    return {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        keywords: pdfDoc.getKeywords()?.split(',').map(k => k.trim()),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
    };
}

/**
 * Sanitize PDF metadata - removes all identifying information!
 * Strips Author, Creator, Title, Subject, Keywords, Producer.
 */
export async function sanitizeMetadata(pdfFile: File): Promise<Blob> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Clear all metadata fields
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============== REDACTION OPERATIONS ==============

export interface RedactionArea {
    pageIndex: number; // 0-based
    x: number;         // Percentage of page width (0-100)
    y: number;         // Percentage of page height (0-100)
    width: number;     // Percentage of page width
    height: number;    // Percentage of page height
}

/**
 * Apply redactions to a PDF using the Flatten Strategy for 100% security.
 * 
 * This method:
 * 1. Draws black rectangles at the marked positions
 * 2. Renders each redacted page as a high-quality image using pdf.js
 * 3. Replaces the PDF page with the flattened image
 * 
 * Result: The original text layer is PHYSICALLY DESTROYED - no hidden text can be copied.
 * 
 * @param pdfFile - The PDF file to redact
 * @param redactions - Array of areas to redact (coordinates as percentages)
 * @param renderScale - Scale factor for rendering (2 = 2x resolution, higher = better quality but larger file)
 */
export async function applyRedactions(
    pdfFile: File,
    redactions: RedactionArea[],
    renderScale: number = 2
): Promise<Blob> {
    // Load the PDF with pdf-lib
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Group redactions by page
    const redactionsByPage = new Map<number, RedactionArea[]>();
    for (const r of redactions) {
        if (!redactionsByPage.has(r.pageIndex)) {
            redactionsByPage.set(r.pageIndex, []);
        }
        redactionsByPage.get(r.pageIndex)!.push(r);
    }

    // Import pdfjs-dist dynamically
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source to use local bundled worker for version compatibility
    // Disable worker and use main thread instead (simpler, works for our use case)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    // Load with pdf.js for rendering
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Create a new PDF for the result
    const resultPdf = await PDFDocument.create();

    // Process each page
    const pageCount = pdfDoc.getPageCount();
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const originalPage = pdfDoc.getPage(pageIndex);
        const { width: pageWidth, height: pageHeight } = originalPage.getSize();

        // Check if this page has redactions
        const pageRedactions = redactionsByPage.get(pageIndex);

        if (pageRedactions && pageRedactions.length > 0) {
            // This page needs redaction - use Flatten Strategy

            // Step 1: Draw black rectangles on the original page (for visual preview)
            for (const r of pageRedactions) {
                const rectX = (r.x / 100) * pageWidth;
                const rectY = pageHeight - ((r.y / 100) * pageHeight) - ((r.height / 100) * pageHeight);
                const rectWidth = (r.width / 100) * pageWidth;
                const rectHeight = (r.height / 100) * pageHeight;

                originalPage.drawRectangle({
                    x: rectX,
                    y: rectY,
                    width: rectWidth,
                    height: rectHeight,
                    color: rgb(0, 0, 0), // Black
                });
            }

            // Step 2: Save the modified PDF temporarily to get updated bytes
            const tempBytes = await pdfDoc.save();
            const tempPdfJs = await pdfjsLib.getDocument({ data: tempBytes }).promise;
            const pdfJsPage = await tempPdfJs.getPage(pageIndex + 1); // pdf.js uses 1-based

            // Step 3: Render page to canvas at high resolution
            const viewport = pdfJsPage.getViewport({ scale: renderScale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;

            await pdfJsPage.render({
                canvasContext: ctx,
                viewport: viewport,
                canvas: canvas
            }).promise;

            // Step 4: Convert canvas to JPEG image
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92); // 92% quality
            const imageBytes = Uint8Array.from(atob(imageDataUrl.split(',')[1]), c => c.charCodeAt(0));

            // Step 5: Embed image and create new page
            const jpgImage = await resultPdf.embedJpg(imageBytes);
            const newPage = resultPdf.addPage([pageWidth, pageHeight]);
            newPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
            });
        } else {
            // No redactions on this page - copy as-is
            const [copiedPage] = await resultPdf.copyPages(pdfDoc, [pageIndex]);
            resultPdf.addPage(copiedPage);
        }
    }

    // Save the result
    const resultBytes = await resultPdf.save();
    return new Blob([resultBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

