import { useEffect, useState } from 'react';

interface LineageState {
  nodePositions: Record<string, { x: number; y: number }>;
  hiddenNodes: string[];
  csvHash: string; // To identify if the same file is loaded
}

export const useLineageState = (csvData: string[][]) => {
  const [state, setState] = useState<LineageState>(() => {
    const saved = localStorage.getItem('lineageState');
    return saved ? JSON.parse(saved) : {
      nodePositions: {},
      hiddenNodes: [],
      csvHash: '',
    };
  });

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
