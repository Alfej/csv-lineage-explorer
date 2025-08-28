import { useState, useMemo } from 'react';
import Logo from '@/components/Logo';
import FileUpload from '@/components/FileUpload';
import CsvTable from '@/components/CsvTable';
import DataLineageGraph from '@/components/DataLineageGraph';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DataLineageFilters, { FilterState } from '@/components/DataLineageFilters';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showLineageGraph, setShowLineageGraph] = useState(false);
  const { toast } = useToast();

  // Multi-column filter state
  const [filters, setFilters] = useState<FilterState>({});

  const validateCSVStructure = (headers: string[]): boolean => {
    const expectedHeaders = [
      'childTableName',
      'childTableType',
      'relationship',
      'parentTableName',
      'parentTableType'
    ];
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));
    return expectedHeaders.every(expected =>
      normalizedHeaders.includes(expected.toLowerCase())
    );
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowResults(false);
    setCsvData([]);
    setFilters({});
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setShowResults(false);
    setShowLineageGraph(false);
    setCsvData([]);
    setFilters({});
  };

  const columns = csvData.length > 0 ? csvData[0] : [];

  // Convert CSV rows to array of objects for filter UI
  const rowObjects = useMemo(() => {
    if (csvData.length < 2) return [];
    return csvData.slice(1).map(row =>
      Object.fromEntries(columns.map((col, idx) => [col, row[idx]]))
    );
  }, [csvData, columns]);

  // Filtered CSV data for graph and table
  const filteredCsvData = useMemo(() => {
    if (csvData.length === 0) return csvData;
    const headers = csvData[0];
    return [
      headers,
      ...csvData.slice(1).filter(row =>
        Object.entries(filters).every(([col, selected]) => {
          if (!selected || selected.length === 0) return true;
          const colIdx = headers.findIndex(
            h => h.toLowerCase().replace(/\s+/g, '') === col.toLowerCase().replace(/\s+/g, '')
          );
          if (colIdx === -1) return true;
          return selected.includes(row[colIdx]);
        })
      )
    ];
  }, [csvData, filters]);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    const result: string[][] = [];
    for (const line of lines) {
      if (line.trim()) {
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

      // Validate CSV structure
      const headers = parsed[0];
      if (!validateCSVStructure(headers)) {
        toast({
          title: "CSV File not in proper format",
          description: "CSV must have minimum 5 columns: childTableName, childTableType, relationship, parentTableName, parentTableType",
          variant: "destructive",
        });
        return;
      }

      setCsvData(parsed);
      setShowResults(true);
      setShowLineageGraph(true);

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
                onClick={() => {
                  setShowResults(false);
                  setShowLineageGraph(false);
                  setFilters({});
                }}
              >
                Upload New File
              </Button>
            </div>
            <DataLineageFilters
              data={rowObjects}
              columns={columns}
              filters={filters}
              onFiltersChange={setFilters}
            />

            {showLineageGraph && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground">Data Lineage Graph</h3>
                <DataLineageGraph csvData={filteredCsvData} />
              </div>
            )}

            <CsvTable
              filePath={selectedFile?.name || 'Unknown'}
              csvData={filteredCsvData}
              fileName={selectedFile?.name || 'Unknown'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;