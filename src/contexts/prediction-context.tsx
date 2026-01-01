'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PredictionContextType {
  isPredicting: boolean;
  setIsPredicting: (value: boolean) => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export function PredictionProvider({ children }: { children: ReactNode }) {
  const [isPredicting, setIsPredicting] = useState(false);

  return (
    <PredictionContext.Provider value={{ isPredicting, setIsPredicting }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}
