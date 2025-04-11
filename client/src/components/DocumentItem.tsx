import React from 'react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface DocumentItemProps {
  id: number;
  name: string;
  type: string;
  fileUrl: string;
  size: number;
  uploadedAt: Date | string;
  onDelete?: (id: number) => void;
  canDelete?: boolean;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  id,
  name,
  type,
  fileUrl,
  size,
  uploadedAt,
  onDelete,
  canDelete = true
}) => {
  // Determine icon based on type
  let fileIcon = 'fas fa-file text-gray-500';
  
  if (type === 'pdf' || name.toLowerCase().endsWith('.pdf')) {
    fileIcon = 'fas fa-file-pdf text-red-500';
  } else if (type === 'excel' || name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls')) {
    fileIcon = 'fas fa-file-excel text-green-500';
  } else if (type === 'word' || name.toLowerCase().endsWith('.docx') || name.toLowerCase().endsWith('.doc')) {
    fileIcon = 'fas fa-file-word text-blue-500';
  } else if (type === 'image' || name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.png')) {
    fileIcon = 'fas fa-file-image text-purple-500';
  } else if (type === 'contract' || name.toLowerCase().includes('agreement')) {
    fileIcon = 'fas fa-file-contract text-blue-500';
  }
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle download
  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };
  
  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };
  
  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className={`${fileIcon} text-xl mr-3`}></i>
          <div>
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">
              Updated {typeof uploadedAt === 'string' ? formatDate(uploadedAt) : formatDate(uploadedAt)} • {formatFileSize(size)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="default"
            className="inline-flex items-center p-2 rounded-full shadow-sm text-white bg-primary hover:bg-blue-700"
            onClick={handleDownload}
          >
            <i className="fas fa-download"></i>
          </Button>
          
          {canDelete && onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="inline-flex items-center p-2 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              onClick={handleDelete}
            >
              <i className="fas fa-trash-alt"></i>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
};

export default DocumentItem;
