import { useEffect, useState } from 'react';

interface LineageState {
  nodePositions: Record<string, { x: number; y: number }>;
  hiddenNodes: string[];
  csvHash: string; 
}

export const useLineageState = (csvData: string[][]) => {
  const getInitialState = (): LineageState => {
    try {
      const saved = localStorage.getItem('lineageState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // ✅ Ensure all required keys exist
        return {
          nodePositions: parsed.nodePositions || {},
          hiddenNodes: parsed.hiddenNodes || [],
          csvHash: parsed.csvHash || '',
        };
      }
    } catch (error) {
      console.error('Failed to parse saved lineage state:', error);
    }
    // ✅ Default state if no saved data
    return {
      nodePositions: {},
      hiddenNodes: [],
      csvHash: '',
    };
  };

  const [state, setState] = useState<LineageState>(getInitialState);

  // Generate a simple hash for CSV data
  const generateCsvHash = (data: string[][]): string => {
    return btoa(data.map(row => row.join(',')).join('|')).slice(0, 32);
  };

  // Update state and persist to localStorage
  const updateState = (newState: Partial<LineageState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem('lineageState', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    state,
    updateState,
    currentCsvHash: generateCsvHash(csvData),
  };
};
