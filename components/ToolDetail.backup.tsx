import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Upload, Download, Sliders, Monitor, Lock, Type, 
    Image as ImageIcon, Video, Scissors, RefreshCw, Music, Plus, 
    Trash2, GripVertical, FileText, ArrowRight, RotateCw, 
    LayoutTemplate, Grid3x3, MoveLeft, MoveRight, X, CheckCircle
} from 'lucide-react';
import { TOOLS } from '../constants';

const ToolDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const tool = TOOLS.find(t => t.id === id);

    // --- PDF States ---
    const [mockFiles, setMockFiles] = useState([
        { id: 1, name: 'Lecture_Notes_Week1.pdf', size: '2.4 MB', pages: 12 },
        { id: 2, name: 'Assignment_Brief.pdf', size: '0.8 MB', pages: 3 },
        { id: 3, name: 'Lab_Report_Template.pdf', size: '1.2 MB', pages: 5 }
    ]);
    
    // Mock Pages for Rotate/Organize
    const [mockPages, setMockPages] = useState(
        Array.from({ length: 8 }, (_, i) => ({ id: i, num: i + 1, rot: 0 }))
    );

    // Split State
    const [splitMode, setSplitMode] = useState<'ranges' | 'groups' | 'size'>('ranges');
    const [splitRanges, setSplitRanges] = useState('');
    const [splitGroupSize, setSplitGroupSize] = useState('');
    const [splitFileSize, setSplitFileSize] = useState('');

    // Layout State
    const [layoutMode, setLayoutMode] = useState('1');

    // Security/Advanced State
    const [ocrLanguage, setOcrLanguage] = useState('eng');
    const [pipelineSteps, setPipelineSteps] = useState<string[]>(['Merge Files']);
    
    // --- Image/Video States ---
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [maintainRatio, setMaintainRatio] = useState(true);
    const [resizeMode, setResizeMode] = useState('fit');
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState('webp');
    const [compressionLevel, setCompressionLevel] = useState('medium');
    const [muteAudio, setMuteAudio] = useState(false);
    const [trimStart, setTrimStart] = useState("00:00");
    const [trimEnd, setTrimEnd] = useState("00:30");

    if (!tool) return <div>Tool not found</div>;

    // --- Helper Functions ---
    const removeFile = (id: number) => {
        setMockFiles(mockFiles.filter(f => f.id !== id));
    };

    const rotatePage = (id: number, dir: 'cw' | 'ccw' = 'cw') => {
        setMockPages(mockPages.map(p => {
            if (p.id === id) {
                const delta = dir === 'cw' ? 90 : -90;
                return { ...p, rot: (p.rot + delta) % 360 };
            }
            return p;
        }));
    };

    const rotateAll = () => {
         setMockPages(mockPages.map(p => ({ ...p, rot: (p.rot + 90) % 360 })));
    };

    const deletePage = (id: number) => {
        setMockPages(mockPages.filter(p => p.id !== id));
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

    // --- PDF Renderers ---

    const renderPdfMerge = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Files to Merge</label>
                    <button 
                        onClick={() => setMockFiles([])}
                        className="text-xs text-primary font-bold hover:underline"
                    >
                        Clear All
                    </button>
                </div>
                <div className="space-y-2">
                    {mockFiles.map((file, idx) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center text-red-500">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.pages} pages • {file.size}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeFile(file.id)}
                                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {mockFiles.length === 0 && (
                        <div className="text-sm text-gray-500 italic text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                            No files selected. Add files to begin.
                        </div>
                    )}
                </div>
            </div>
            {mockFiles.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Merged file will contain {mockFiles.reduce((acc, f) => acc + f.pages, 0)} pages total.
                </div>
            )}
        </div>
    );

    const renderPdfSplit = () => (
        <div className="space-y-6">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                {['ranges', 'groups', 'size'].map((m) => (
                    <button 
                        key={m}
                        onClick={() => setSplitMode(m as any)}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                            splitMode === m 
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        By {m}
                    </button>
                ))}
            </div>

            {splitMode === 'ranges' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Page Ranges</label>
                    <input 
                        type="text" 
                        value={splitRanges}
                        onChange={(e) => setSplitRanges(e.target.value)}
                        placeholder="e.g. 1-5, 8, 11-13" 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                    <p className="text-xs text-gray-500">Separates selected pages into a new PDF. Comma separated.</p>
                </div>
            )}
             {splitMode === 'groups' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Split every X pages</label>
                    <input 
                        type="number" 
                        value={splitGroupSize}
                        onChange={(e) => setSplitGroupSize(e.target.value)}
                        placeholder="10" 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                    <p className="text-xs text-gray-500">Creates multiple PDFs, each containing this number of pages.</p>
                </div>
            )}
             {splitMode === 'size' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Max File Size (MB)</label>
                    <input 
                        type="number" 
                        value={splitFileSize}
                        onChange={(e) => setSplitFileSize(e.target.value)}
                        placeholder="10" 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                    <p className="text-xs text-gray-500">Splits the PDF into multiple files, each smaller than the limit.</p>
                </div>
            )}
        </div>
    );

    const renderPdfRotate = () => (
        <div className="space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Page Preview</h3>
                <button onClick={rotateAll} className="text-xs font-bold text-primary hover:bg-red-50 dark:hover:bg-red-900/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Rotate All
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-2 border border-gray-100 dark:border-gray-800 rounded-lg">
                 {mockPages.map((page) => (
                     <div key={page.id} className="relative group">
                         <div 
                            className="bg-white border shadow-sm rounded-md flex flex-col items-center justify-center aspect-[3/4] transition-transform duration-300"
                            style={{ transform: `rotate(${page.rot}deg)` }}
                         >
                            <span className="text-2xl font-bold text-gray-200 select-none">{page.num}</span>
                         </div>
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                             <button 
                                onClick={() => rotatePage(page.id, 'cw')}
                                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-md hover:scale-110 transition-transform"
                            >
                                <RotateCw className="w-4 h-4" />
                             </button>
                         </div>
                         <div className="text-center mt-1 text-xs text-gray-500">Page {page.num}</div>
                     </div>
                 ))}
            </div>
            <p className="text-xs text-gray-500 text-center">Click hover icons to rotate individual pages.</p>
        </div>
    );

    const renderPdfOrganize = () => (
        <div className="space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Drag & Drop Simulation</h3>
                <span className="text-xs text-gray-500">{mockPages.length} pages total</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                 {mockPages.map((page, index) => (
                     <div key={page.id} className="relative group bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                         <div className="bg-white border shadow-sm rounded flex flex-col items-center justify-center aspect-[3/4] mb-2">
                            <span className="text-2xl font-bold text-gray-200 select-none">{page.num}</span>
                         </div>
                         
                         {/* Action Overlay */}
                         <div className="flex justify-between items-center px-1">
                             <button 
                                onClick={() => movePage(index, 'left')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                             >
                                <MoveLeft className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => deletePage(page.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => movePage(index, 'right')}
                                disabled={index === mockPages.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                             >
                                <MoveRight className="w-4 h-4" />
                             </button>
                         </div>
                     </div>
                 ))}
            </div>
        </div>
    );

    const renderPdfLayout = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Pages per Sheet (N-up)</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { val: '1', label: '1 Page', icon: <div className="w-6 h-8 border-2 border-current rounded-sm"/> },
                        { val: '2', label: '2 Pages', icon: <div className="w-6 h-8 border-2 border-current rounded-sm flex flex-col"><div className="h-1/2 border-b-2 border-current"/></div> },
                        { val: '4', label: '4 Pages', icon: <div className="w-6 h-8 border-2 border-current rounded-sm grid grid-cols-2 grid-rows-2 gap-px bg-current"><div className="bg-white dark:bg-gray-800"/><div className="bg-white dark:bg-gray-800"/><div className="bg-white dark:bg-gray-800"/><div className="bg-white dark:bg-gray-800"/></div> }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => setLayoutMode(opt.val)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                layoutMode === opt.val
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <div className="mb-2">{opt.icon}</div>
                            <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <input type="checkbox" id="borders" className="rounded text-primary focus:ring-primary" defaultChecked />
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
                    placeholder="https://www.example.com" 
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
            </div>
            <p className="text-xs text-gray-500">Powered by Puppeteer. Captures the full page layout.</p>
        </div>
    );

    const renderPdfSecurity = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Password</label>
                <input 
                    type="password" 
                    placeholder="Enter password to encrypt" 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
            </div>
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Confirm Password</label>
                <input 
                    type="password" 
                    placeholder="Confirm password" 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="aes" className="rounded text-primary focus:ring-primary" defaultChecked />
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
                </select>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="deskew" className="rounded text-primary focus:ring-primary" defaultChecked />
                    <label htmlFor="deskew" className="text-sm text-gray-700 dark:text-gray-300">Auto-deskew (Straighten pages)</label>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="clean" className="rounded text-primary focus:ring-primary" />
                    <label htmlFor="clean" className="text-sm text-gray-700 dark:text-gray-300">Clean background (Remove noise)</label>
                </div>
            </div>
        </div>
    );

    const renderPdfMetadata = () => (
        <div className="space-y-4">
            {['Title', 'Author', 'Subject', 'Keywords', 'Creator'].map((field) => (
                <div key={field} className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{field}</label>
                    <input 
                        type="text" 
                        placeholder={`Enter ${field}`}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                </div>
            ))}
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
                                <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" onClick={() => {
                                    const newSteps = [...pipelineSteps];
                                    newSteps.splice(idx, 1);
                                    setPipelineSteps(newSteps);
                                }} />
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
                    onClick={() => setPipelineSteps([...pipelineSteps, 'New Step'])}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Step
                </button>
            </div>
        </div>
    );

    // --- Image / Video Renderers (Reused) ---
    // ... (Keeping previous image/video implementations same for brevity but included in output if needed, but context implies focus on PDF)
    const renderImageResize = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Width</label>
                    <input 
                        type="number" 
                        value={width} 
                        onChange={(e) => setWidth(parseInt(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Height</label>
                    <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(parseInt(e.target.value))}
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
        </div>
    );

    const renderImageCompress = () => (
         <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Quality / File Size</label>
                    <span className="text-xs font-bold text-primary">{quality}%</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={quality} 
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
        </div>
    );
    
    const renderVideoCompress = () => (
        <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Compression Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['low', 'medium', 'high'].map(level => (
                        <button
                            key={level}
                            onClick={() => setCompressionLevel(level)}
                            className={`px-4 py-3 rounded-md border text-center transition-all ${
                                compressionLevel === level 
                                ? 'border-primary bg-red-50 dark:bg-red-900/20 text-primary font-bold shadow-sm' 
                                : 'border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                            }`}
                        >
                            <span className="capitalize block">{level}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                                {level === 'low' ? 'Fast, bigger file' : level === 'medium' ? 'Balanced' : 'Slow, tiny file'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderVideoTrim = () => (
         <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Start Time</label>
                        <input 
                            type="text" 
                            value={trimStart}
                            onChange={(e) => setTrimStart(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm text-center w-20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">End Time</label>
                        <input 
                            type="text" 
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm text-center w-20"
                        />
                    </div>
                 </div>
                 <input 
                    type="range" 
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
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
                     <p className="text-sm text-gray-500">Simple file conversion. Upload file to start.</p>
                </div>
            );
        }

        // PDF Security
        if (id === 'pdf-password') return renderPdfSecurity();
        if (id === 'pdf-watermark') return renderImageResize(); // Reusing generic controls for now
        
        // PDF Advanced
        if (id === 'pdf-ocr') return renderPdfOcr();
        if (id === 'pdf-metadata') return renderPdfMetadata();
        if (id === 'pdf-pipeline') return renderPdfPipeline();

        // Images
        if (id === 'img-resize') return renderImageResize();
        if (id === 'img-compress') return renderImageCompress();
        
        // Video
        if (id === 'vid-compress') return renderVideoCompress();
        if (id === 'vid-trim') return renderVideoTrim();

        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                Specific UI for <strong>{tool.title}</strong> is being generated.
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
            <button 
                onClick={() => navigate('/tools')}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-bold text-sm">Back to Toolbox</span>
            </button>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
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
                    {id !== 'url-to-pdf' && mockFiles.length === 0 && (
                        <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-xl p-8 text-center hover:border-primary/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer mb-8 group">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white dark:group-hover:bg-black transition-colors">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Click to upload or drag and drop</h3>
                            <p className="text-xs text-gray-500">Max file size 1GB</p>
                        </div>
                    )}

                    {/* Tool Specific Controls */}
                    <div className="mb-8">
                        {renderContent()}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark">
                        <span className="text-xs text-gray-500 mr-auto">Processed securely on device</span>
                        <button className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                            Reset
                        </button>
                        <button className="px-6 py-2 bg-primary hover:bg-red-600 text-white font-bold rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Process & Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetail;
