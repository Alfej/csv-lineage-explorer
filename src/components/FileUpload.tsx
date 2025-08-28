import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

const FileUpload = ({ onFileSelect, selectedFile, onClearFile }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      onFileSelect(csvFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed transition-all duration-200 cursor-pointer hover:shadow-md ${
            isDragOver
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="p-12 text-center">
            <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <Button variant="outline" className="pointer-events-none">
              Choose File
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border border-primary/20 bg-gradient-to-r from-card to-primary/5">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;