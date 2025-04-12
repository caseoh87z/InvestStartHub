import React, { useState } from 'react';
import { DragDropFileUpload } from './DragDropFileUpload';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export type DocumentType = 'Pitch Deck' | 'Financial Report' | 'Investor Agreement' | 'Risk Disclosure' | 'Other';

interface DocumentUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, documentType: DocumentType) => Promise<void>;
}

export function DocumentUploader({ open, onOpenChange, onUpload }: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('Pitch Deck');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(selectedFile, documentType);
      onOpenChange(false);
      setSelectedFile(null);
      setDocumentType('Pitch Deck');
      toast({
        title: "Document uploaded",
        description: `Your ${documentType} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setDocumentType('Pitch Deck');
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload documents to share with potential investors.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="document-type" className="block text-sm font-medium mb-3">
              Document Type
            </Label>
            <RadioGroup
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pitch Deck" id="pitch-deck" />
                <Label htmlFor="pitch-deck">Pitch Deck</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Financial Report" id="financial-report" />
                <Label htmlFor="financial-report">Financial Report</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Investor Agreement" id="investor-agreement" />
                <Label htmlFor="investor-agreement">Investor Agreement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Risk Disclosure" id="risk-disclosure" />
                <Label htmlFor="risk-disclosure">Risk Disclosure (Optional)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other">Other Document</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="document" className="block text-sm font-medium mb-3">
              Upload Document
            </Label>
            <DragDropFileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              maxSize={25}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-2">
                Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}