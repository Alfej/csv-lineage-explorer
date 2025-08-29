import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Search, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  [columnName: string]: string[];
}

interface DataLineageFiltersProps {
  data: Record<string, any>[];
  columns: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  hiddenNodes: Set<string>;
  onHiddenNodesChange: (hiddenNodes: Set<string>) => void;
}

const DataLineageFilters: React.FC<DataLineageFiltersProps> = ({
  data,
  columns,
  filters,
  onFiltersChange,
  hiddenNodes,
  onHiddenNodesChange,
}) => {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [selectedHiddenNode, setSelectedHiddenNode] = useState<string>('');

  // Get filtered data based on current filter selections
  const getFilteredData = (excludeColumn?: string) => {
    return data.filter(row => {
      return Object.entries(filters).every(([col, selectedValues]) => {
        if (col === excludeColumn) return true;
        if (selectedValues.length === 0) return true;
        return selectedValues.includes(String(row[col]));
      });
    });
  };

  // Get available values for a column based on current filters
  const getAvailableValues = (columnName: string) => {
    const filteredData = getFilteredData(columnName);
    const values = [...new Set(filteredData.map(row => String(row[columnName])))];
    return values.sort();
  };

  // Get filtered values based on search term
  const getFilteredValues = (columnName: string, values: string[]) => {
    const searchTerm = searchTerms[columnName]?.toLowerCase() || '';
    return values.filter(value => value.toLowerCase().includes(searchTerm));
  };

  const handleValueToggle = (columnName: string, value: string) => {
    const currentSelected = filters[columnName] || [];
    const newSelected = currentSelected.includes(value)
      ? currentSelected.filter(v => v !== value)
      : [...currentSelected, value];
    
    onFiltersChange({
      ...filters,
      [columnName]: newSelected
    });
  };

  const handleSelectAll = (columnName: string) => {
    const availableValues = getAvailableValues(columnName);
    const currentSelected = filters[columnName] || [];
    const isAllSelected = currentSelected.length === availableValues.length;
    
    onFiltersChange({
      ...filters,
      [columnName]: isAllSelected ? [] : availableValues
    });
  };

  const getDisplayText = (columnName: string) => {
    const selectedValues = filters[columnName] || [];
    const availableValues = getAvailableValues(columnName);
    
    if (selectedValues.length === 0) {
      return `Select ${columnName}`;
    } else if (selectedValues.length === availableValues.length) {
      return 'All selected';
    } else {
      return `${selectedValues.length} selected`;
    }
  };

  const togglePopover = (columnName: string) => {
    setOpenPopovers(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const handleShowHiddenNode = () => {
    if (selectedHiddenNode) {
      const newHiddenNodes = new Set(hiddenNodes);
      newHiddenNodes.delete(selectedHiddenNode);
      onHiddenNodesChange(newHiddenNodes);
      setSelectedHiddenNode('');
    }
  };

  // Get all table names from data for hidden nodes dropdown
  const allTableNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(row => {
      if (row.childTableName) names.add(row.childTableName);
      if (row.parentTableName) names.add(row.parentTableName);
    });
    return Array.from(names).sort();
  }, [data]);

  const hiddenNodesArray = Array.from(hiddenNodes);

  return (
    <div className="p-4 border-b bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Data Filters</h3>
      
      {/* Hidden Nodes Controls */}
      {hiddenNodesArray.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-3 text-foreground">Hidden Nodes ({hiddenNodesArray.length})</h4>
          <div className="flex items-center gap-2">
            <Select value={selectedHiddenNode} onValueChange={setSelectedHiddenNode}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select hidden node" />
              </SelectTrigger>
              <SelectContent>
                {hiddenNodesArray.map(nodeName => (
                  <SelectItem key={nodeName} value={nodeName}>
                    {nodeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleShowHiddenNode}
              disabled={!selectedHiddenNode}
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Show Node
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4">
        {columns.map(columnName => {
          const availableValues = getAvailableValues(columnName);
          const filteredValues = getFilteredValues(columnName, availableValues);
          const selectedValues = filters[columnName] || [];
          const isAllSelected = selectedValues.length === availableValues.length;

          return (
            <Popover 
              key={columnName}
              open={openPopovers[columnName]}
              onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [columnName]: open }))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[200px] justify-between text-left font-normal",
                    selectedValues.length > 0 && "border-primary"
                  )}
                  onClick={() => togglePopover(columnName)}
                >
                  <span className="truncate">{getDisplayText(columnName)}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${columnName}...`}
                      value={searchTerms[columnName] || ''}
                      onChange={(e) => setSearchTerms(prev => ({
                        ...prev,
                        [columnName]: e.target.value
                      }))}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`select-all-${columnName}`}
                      checked={isAllSelected}
                      onCheckedChange={() => handleSelectAll(columnName)}
                    />
                    <label
                      htmlFor={`select-all-${columnName}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All
                    </label>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-3">
                  {filteredValues.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No values found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredValues.map(value => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${columnName}-${value}`}
                            checked={selectedValues.includes(value)}
                            onCheckedChange={() => handleValueToggle(columnName, value)}
                          />
                          <label
                            htmlFor={`${columnName}-${value}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                          >
                            {value}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
};

export default DataLineageFilters;