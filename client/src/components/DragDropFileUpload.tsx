import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type FileUploadProps = {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  description?: string;
};

export function DragDropFileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png',
  maxSize = 10, // 10MB by default
  className = '',
  label = 'Drag and drop your file here',
  description = 'or click to browse'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const validateFile = (file: File): boolean => {
    // Check file type
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    const acceptTypes = accept.split(',');
    const isValidType = acceptTypes.some(type => {
      // Handle mime types (e.g., 'image/png') and extensions (e.g., '.png')
      return type.startsWith('.') 
        ? fileExtension === type 
        : fileType.match(new RegExp(type.replace('*', '.*')));
    });
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file with one of these formats: ${accept}`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check file size
    const fileSize = file.size / (1024 * 1024); // Convert to MB
    if (fileSize > maxSize) {
      toast({
        title: "File too large",
        description: `File size should not exceed ${maxSize}MB`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, accept, maxSize, toast]);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);
  
  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
        isDragging ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary hover:bg-gray-50",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        id="fileInput"
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileInput}
      />
      <div className="space-y-2">
        <div className="flex justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700">{label}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        <p className="text-xs text-gray-400">
          Accepted formats: {accept} (Max {maxSize}MB)
        </p>
      </div>
    </div>
  );
}