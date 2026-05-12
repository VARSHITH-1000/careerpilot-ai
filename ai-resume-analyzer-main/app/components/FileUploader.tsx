import { useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import { formatSize } from '../lib/utils';
import { UploadCloud, FileText, X } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;
        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: maxFileSize,
    });

    const file = acceptedFiles[0] || null;

    return (
        <div 
            {...getRootProps()} 
            className={`
                relative w-full overflow-hidden rounded-2xl border transition-all duration-300
                ${isDragActive 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] scale-[1.02]' 
                    : 'border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20'
                }
            `}
        >
            <input {...getInputProps()} />

            <div className="flex cursor-pointer flex-col items-center justify-center p-8 text-center sm:p-10">
                {file ? (
                    <div 
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="max-w-[200px] truncate text-sm font-semibold text-white sm:max-w-xs">
                                    {file.name}
                                </p>
                                <p className="text-xs font-medium text-slate-400">{formatSize(file.size)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(null);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 transition-transform duration-300 group-hover:scale-110">
                            <UploadCloud className={`h-8 w-8 ${isDragActive ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className="text-base font-medium text-slate-300">
                                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                PDF Document (max {formatSize(maxFileSize)})
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
