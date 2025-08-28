import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface FilterControlsProps {
  csvData: string[][];
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  childTableType: string[];
  parentTableType: string[];
  relationship: string[];
}

const FilterControls = ({ csvData, onFiltersChange }: FilterControlsProps) => {
  const [filters, setFilters] = useState<FilterState>({
    childTableType: [],
    parentTableType: [],
    relationship: [],
  });

  // Extract unique values for each filter category
  const getUniqueValues = (columnIndex: number): string[] => {
    if (csvData.length <= 1) return [];
    
    const values = csvData.slice(1)
      .map(row => row[columnIndex])
      .filter(value => value && value.trim() !== '');
    
    return [...new Set(values)].sort();
  };

  // Map header names to their indexes
  const headerMap = csvData.length > 0 ? csvData[0].reduce((map, header, index) => {
    const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
    map[normalizedHeader] = index;
    return map;
  }, {} as Record<string, number>) : {};

  const childTableTypes = getUniqueValues(headerMap['childtabletype'] || 1);
  const parentTableTypes = getUniqueValues(headerMap['parenttabletype'] || 4);
  const relationships = getUniqueValues(headerMap['relationship'] || 2);

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter(v => v !== value)
        : [...filters[filterType], value]
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (filterType: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType].filter(v => v !== value)
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      childTableType: [],
      parentTableType: [],
      relationship: [],
    };
    
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(filterArray => filterArray.length > 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Child Table Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Child Table Type</label>
            <Select onValueChange={(value) => handleFilterChange('childTableType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {childTableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Table Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Table Type</label>
            <Select onValueChange={(value) => handleFilterChange('parentTableType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {parentTableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship</label>
            <Select onValueChange={(value) => handleFilterChange('relationship', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship..." />
              </SelectTrigger>
              <SelectContent>
                {relationships.map(rel => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Filters:</label>
            <div className="flex flex-wrap gap-2">
              {filters.childTableType.map(value => (
                <Badge key={`child-${value}`} variant="secondary" className="gap-1">
                  Child: {value}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFilter('childTableType', value)}
                  />
                </Badge>
              ))}
              {filters.parentTableType.map(value => (
                <Badge key={`parent-${value}`} variant="secondary" className="gap-1">
                  Parent: {value}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFilter('parentTableType', value)}
                  />
                </Badge>
              ))}
              {filters.relationship.map(value => (
                <Badge key={`rel-${value}`} variant="secondary" className="gap-1">
                  Rel: {value}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFilter('relationship', value)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterControls;