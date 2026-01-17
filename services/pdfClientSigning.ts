/**
 * Client-Side PDF Signing using pdf-lib
 * 
 * This processes the PDF entirely in the browser - NO SERVER NEEDED!
 * The file never leaves the user's computer, making it INSTANT.
 */

import { PDFDocument } from 'pdf-lib';

export interface SignatureData {
    signatureImage: string;  // base64 data URL
    page: number;            // 1-indexed page number
    positionX: number;       // percentage 0-100 from left
    positionY: number;       // percentage 0-100 from top
    width: number;           // percentage of page width
    height: number;          // percentage of page height
}

/**
 * Sign a PDF with multiple signatures - entirely client-side!
 * @param pdfFile - The PDF file to sign
 * @param signatures - Array of signature data
 * @returns Blob of the signed PDF
 */
export async function signPdfClientSide(
    pdfFile: File,
    signatures: SignatureData[]
): Promise<Blob> {
    // Read the PDF file into memory
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();

    // Group signatures by page for efficient processing
    const sigsByPage = new Map<number, SignatureData[]>();
    for (const sig of signatures) {
        const pageIndex = sig.page - 1; // Convert to 0-indexed
        if (!sigsByPage.has(pageIndex)) {
            sigsByPage.set(pageIndex, []);
        }
        sigsByPage.get(pageIndex)!.push(sig);
    }

    // Process each page with signatures
    for (const [pageIndex, pageSigs] of sigsByPage.entries()) {
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        for (const sig of pageSigs) {
            try {
                // Extract base64 data from data URL
                const base64Data = sig.signatureImage.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                // Embed the image - detect format from data URL
                let image;
                if (sig.signatureImage.includes('image/png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else if (sig.signatureImage.includes('image/jpeg') || sig.signatureImage.includes('image/jpg')) {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else {
                    // Default to PNG for canvas-generated images
                    image = await pdfDoc.embedPng(imageBytes);
                }

                // Calculate position and size in points (from percentages)
                const sigWidth = (sig.width / 100) * pageWidth;
                const sigHeight = (sig.height / 100) * pageHeight;
                const x = (sig.positionX / 100) * pageWidth;
                // PDF coordinates start from bottom-left, so invert Y
                const y = pageHeight - ((sig.positionY / 100) * pageHeight) - sigHeight;

                // Draw the signature image on the page
                page.drawImage(image, {
                    x,
                    y,
                    width: sigWidth,
                    height: sigHeight,
                });
            } catch (error) {
                console.error(`Failed to add signature on page ${pageIndex + 1}:`, error);
            }
        }
    }

    // Save and return the modified PDF
    const signedPdfBytes = await pdfDoc.save();
    return new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
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
