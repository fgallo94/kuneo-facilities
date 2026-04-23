'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getClientFunctions } from '@/lib/firebase';

export interface SendToContractorPayload {
  incidenceId: string;
  contractorId: string;
  contractorEmail: string;
  contractorName: string;
  contractorPhone?: string;
  extraContext?: string;
  imageUrls?: string[];
}

export function useSendToContractor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendContractorEmail = async (payload: SendToContractorPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getClientFunctions();
      const callable = httpsCallable<SendToContractorPayload, { success: boolean }>(
        functions,
        'sendContractorEmail'
      );
      const result = await callable(payload);
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el email al contratista';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { sendContractorEmail, isLoading, error, clearError };
}
