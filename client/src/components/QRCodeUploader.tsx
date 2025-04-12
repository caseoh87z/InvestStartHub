import React, { useState } from 'react';
import { DragDropFileUpload } from './DragDropFileUpload';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface QRCodeUploaderProps {
  initialImage?: string;
  onImageUpload: (imageUrl: string) => void;
  className?: string;
}

export function QRCodeUploader({ initialImage, onImageUpload, className }: QRCodeUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImage);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file for the QR code.",
        variant: "destructive"
      });
      return;
    }

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Send the image URL to the parent component
    onImageUpload(objectUrl);
    
    toast({
      title: "QR Code uploaded",
      description: "Your UPI QR code has been uploaded successfully."
    });
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(undefined);
    onImageUpload('');
  };
  
  return (
    <div className={cn("relative", className)}>
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="UPI QR Code"
            className="max-w-full h-auto max-h-48 mx-auto rounded-lg border border-gray-200"
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={removeImage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Click to change QR code
          </p>
        </div>
      ) : (
        <DragDropFileUpload
          onFileSelect={handleFileSelect}
          accept=".jpg,.jpeg,.png"
          maxSize={5}
          label="Upload UPI QR Code"
          description="Drag and drop or click to browse"
        />
      )}
    </div>
  );
}