import { useState } from 'react';
import Logo from '@/components/Logo';
import FileUpload from '@/components/FileUpload';
import CsvTable from '@/components/CsvTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowResults(false);
    setCsvData([]);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setShowResults(false);
    setCsvData([]);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - splits by comma
        // In production, you'd want a more robust CSV parser
        const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
        result.push(values);
      }
    }
    
    return result;
  };

  const handleGenerateLineage = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast({
          title: "Empty file",
          description: "The selected file appears to be empty.",
          variant: "destructive",
        });
        return;
      }

      setCsvData(parsed);
      setShowResults(true);
      
      toast({
        title: "File processed successfully",
        description: `Loaded ${parsed.length - 1} data rows from ${selectedFile.name}`,
      });
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "There was an error reading the CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo className="justify-center mb-6" size="lg" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your CSV files and visualize the data lineage to understand your data flow and relationships.
          </p>
        </div>

        {!showResults ? (
          /* Upload Section */
          <div className="space-y-8">
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClearFile={handleClearFile}
            />
            
            {selectedFile && (
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateLineage}
                  disabled={isProcessing}
                  size="lg"
                  className="px-8"
                >
                  {isProcessing ? 'Processing...' : 'Generate Lineage'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Data Lineage Results</h2>
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
              >
                Upload New File
              </Button>
            </div>
            
            <CsvTable
              filePath={selectedFile?.name || 'Unknown'}
              csvData={csvData}
              fileName={selectedFile?.name || 'Unknown'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
