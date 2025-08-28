import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { FilterState } from './FilterControls';

interface CsvTableProps {
  filePath: string;
  csvData: string[][];
  fileName: string;
  filters?: FilterState;
}

const CsvTable = ({ filePath, csvData, fileName, filters }: CsvTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const { headers, rows, totalPages, filteredRowCount } = useMemo(() => {
    if (csvData.length === 0) return { headers: [], rows: [], totalPages: 0 };
    
    const headers = csvData[0] || [];
    let dataRows = csvData.slice(1);

    // Apply filters if they exist
    if (filters) {
      const headerMap = headers.reduce((map, header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
        map[normalizedHeader] = index;
        return map;
      }, {} as Record<string, number>);

      if (filters.childTableType.length > 0) {
        dataRows = dataRows.filter(row => 
          filters.childTableType.includes(row[headerMap['childtabletype']] || '')
        );
      }
      if (filters.parentTableType.length > 0) {
        dataRows = dataRows.filter(row => 
          filters.parentTableType.includes(row[headerMap['parenttabletype']] || '')
        );
      }
      if (filters.relationship.length > 0) {
        dataRows = dataRows.filter(row => 
          filters.relationship.includes(row[headerMap['relationship']] || '')
        );
      }
    }

    const filteredRowCount = dataRows.length;
    const totalPages = Math.ceil(dataRows.length / rowsPerPage);
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRows = dataRows.slice(startIndex, endIndex);
    
    return { headers, rows: paginatedRows, totalPages, filteredRowCount };
  }, [csvData, currentPage, rowsPerPage, filters]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="w-full space-y-6">
      {/* Data Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Data Preview</h3>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(rowsPerPage, rows.length)} of {filteredRowCount} rows
            {filters && Object.values(filters).some(f => f.length > 0) && (
              <span className="ml-2 text-primary">
                (filtered from {csvData.length > 0 ? csvData.length - 1 : 0} total)
              </span>
            )}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-sm font-semibold text-foreground border-r border-border/50 last:border-r-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-foreground border-r border-border/30 last:border-r-0"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CsvTable;