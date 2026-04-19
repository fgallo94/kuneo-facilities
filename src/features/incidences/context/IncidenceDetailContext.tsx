'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface IncidenceDetailContextValue {
  incidenceId: string | null;
  isOpen: boolean;
  openDetail: (incidenceId: string) => void;
  closeDetail: () => void;
}

const IncidenceDetailContext = createContext<IncidenceDetailContextValue | null>(null);

export function IncidenceDetailProvider({ children }: { children: React.ReactNode }) {
  const [incidenceId, setIncidenceId] = useState<string | null>(null);

  const openDetail = useCallback((id: string) => {
    setIncidenceId(id);
  }, []);

  const closeDetail = useCallback(() => {
    setIncidenceId(null);
  }, []);

  return (
    <IncidenceDetailContext.Provider
      value={{ incidenceId, isOpen: !!incidenceId, openDetail, closeDetail }}
    >
      {children}
    </IncidenceDetailContext.Provider>
  );
}

export function useIncidenceDetailContext() {
  const ctx = useContext(IncidenceDetailContext);
  if (!ctx) {
    throw new Error(
      'useIncidenceDetailContext must be used within IncidenceDetailProvider'
    );
  }
  return ctx;
}
