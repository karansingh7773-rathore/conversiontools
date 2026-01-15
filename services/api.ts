/**
 * API Service for CampusHub Tool Conversion
 * Handles all communication with the backend
 */

// Base URL - Update this when deploying
// For HF Spaces, the API is at the root of your Space URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD 
        ? 'https://karansinghrathore820-myvirtualmachine.hf.space' 
        : 'http://localhost:7860');

interface ApiResponse {
    success: boolean;
    data?: Blob;
    error?: string;
    filename?: string;
}

/**
 * Generic file upload helper
 */
async function uploadFiles(
    endpoint: string,
    files: File[],
    additionalData?: Record<string, string | number | boolean>,
    fileFieldName: string = 'files'
): Promise<ApiResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
        formData.append(fileFieldName, file);
    });
    
    // Add additional form data
    if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
            if (match) filename = match[1];
        }
        
        return { success: true, data: blob, filename };
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Download blob as file
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

// ============== PDF PAGE OPS ==============

export async function mergePDFs(files: File[]): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/merge', files, undefined, 'files');
}

export async function splitPDF(
    file: File,
    mode: 'ranges' | 'groups' | 'size',
    options: { ranges?: string; groupSize?: number; maxSizeMb?: number }
): Promise<ApiResponse> {
    const formData: Record<string, string | number | boolean> = { mode };
    
    if (options.ranges) formData.ranges = options.ranges;
    if (options.groupSize) formData.group_size = options.groupSize;
    if (options.maxSizeMb) formData.max_size_mb = options.maxSizeMb;
    
    return uploadFiles('/api/pdf/split', [file], formData, 'file');
}

export async function rotatePDF(
    file: File,
    rotations: Record<number, number> | string
): Promise<ApiResponse> {
    const rotationsStr = typeof rotations === 'string' 
        ? rotations 
        : JSON.stringify(rotations);
    
    return uploadFiles('/api/pdf/rotate', [file], { rotations: rotationsStr }, 'file');
}

export async function organizePDF(
    file: File,
    pageOrder: number[],
    deletePages?: number[]
): Promise<ApiResponse> {
    const data: Record<string, string> = {
        page_order: pageOrder.join(',')
    };
    
    if (deletePages && deletePages.length > 0) {
        data.delete_pages = deletePages.join(',');
    }
    
    return uploadFiles('/api/pdf/organize', [file], data, 'file');
}

export async function createPDFLayout(
    file: File,
    pagesPerSheet: number,
    borders: boolean = true
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/layout', [file], {
        pages_per_sheet: pagesPerSheet,
        borders
    }, 'file');
}

// ============== PDF SECURITY ==============

export async function addPDFPassword(
    file: File,
    password: string,
    useAes: boolean = true
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/password/add', [file], {
        password,
        use_aes: useAes
    }, 'file');
}

export async function removePDFPassword(
    file: File,
    password: string
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/password/remove', [file], { password }, 'file');
}

export async function addPDFWatermark(
    file: File,
    options: {
        text?: string;
        watermarkImage?: File;
        opacity?: number;
        position?: string;
    }
): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.text) formData.append('text', options.text);
    if (options.opacity) formData.append('opacity', String(options.opacity));
    if (options.position) formData.append('position', options.position);
    if (options.watermarkImage) formData.append('watermark_image', options.watermarkImage);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/pdf/watermark`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const blob = await response.blob();
        return { success: true, data: blob, filename: 'watermarked.pdf' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function editPDFMetadata(
    file: File,
    metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creator?: string;
    }
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/metadata', [file], metadata as Record<string, string>, 'file');
}

// ============== PDF CONVERSION (Stirling) ==============

export async function ocrPDF(
    file: File,
    options: {
        language?: string;
        deskew?: boolean;
        clean?: boolean;
    } = {}
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/ocr', [file], {
        language: options.language || 'eng',
        deskew: options.deskew ?? true,
        clean: options.clean ?? false
    }, 'file');
}

export async function pdfToOffice(
    file: File,
    outputFormat: 'docx' | 'xlsx' | 'pptx' = 'docx'
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/to-office', [file], { output_format: outputFormat }, 'file');
}

export async function fileToPDF(file: File): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/from-file', [file], undefined, 'file');
}

export async function urlToPDF(url: string): Promise<ApiResponse> {
    try {
        const formData = new FormData();
        formData.append('url', url);
        
        const response = await fetch(`${API_BASE_URL}/api/pdf/url-to-pdf`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const blob = await response.blob();
        return { success: true, data: blob, filename: 'webpage.pdf' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function compressPDF(
    file: File,
    quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/compress', [file], { quality }, 'file');
}

export async function repairPDF(file: File): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/repair', [file], undefined, 'file');
}

export async function imagesToPDF(
    files: File[],
    pageSize: 'A4' | 'Letter' | 'fit' = 'A4'
): Promise<ApiResponse> {
    return uploadFiles('/api/pdf/images-to-pdf', files, { page_size: pageSize }, 'files');
}

export async function comparePDFs(file1: File, file2: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/pdf/compare`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const blob = await response.blob();
        return { success: true, data: blob, filename: 'comparison.pdf' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============== IMAGE PROCESSING ==============

export async function resizeImage(
    file: File,
    options: {
        width: number;
        height?: number;
        maintainRatio?: boolean;
        mode?: 'fit' | 'fill' | 'crop';
    }
): Promise<ApiResponse> {
    return uploadFiles('/api/image/resize', [file], {
        width: options.width,
        height: options.height || 0,
        maintain_ratio: options.maintainRatio ?? true,
        mode: options.mode || 'fit'
    }, 'file');
}

export async function compressImage(
    file: File,
    options: {
        quality?: number;
        outputFormat?: 'webp' | 'avif' | 'jpeg' | 'png';
    } = {}
): Promise<ApiResponse> {
    return uploadFiles('/api/image/compress', [file], {
        quality: options.quality || 80,
        output_format: options.outputFormat || 'webp'
    }, 'file');
}

// ============== VIDEO PROCESSING ==============

export async function compressVideo(
    file: File,
    options: {
        compressionLevel?: 'low' | 'medium' | 'high';
        muteAudio?: boolean;
    } = {}
): Promise<ApiResponse> {
    return uploadFiles('/api/video/compress', [file], {
        compression_level: options.compressionLevel || 'medium',
        mute_audio: options.muteAudio ?? false
    }, 'file');
}

export async function trimVideo(
    file: File,
    startTime: string,
    endTime: string
): Promise<ApiResponse> {
    return uploadFiles('/api/video/trim', [file], {
        start_time: startTime,
        end_time: endTime
    }, 'file');
}

// ============== HEALTH CHECK ==============

export async function checkHealth(): Promise<{
    status: string;
    services: Record<string, string>;
}> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return await response.json();
    } catch {
        return { status: 'error', services: {} };
    }
}
