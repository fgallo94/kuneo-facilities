'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getClientFunctions } from '@/lib/firebase';

export interface SendInvoiceEmailPayload {
  incidenceId: string;
  counterEmail: string;
  counterName: string;
  amount: number;
  concept: string;
}

export function useSendInvoiceEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvoiceEmail = async (payload: SendInvoiceEmailPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getClientFunctions();
      const callable = httpsCallable<SendInvoiceEmailPayload, { success: boolean }>(
        functions,
        'sendInvoiceEmail'
      );
      const result = await callable(payload);
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el email de factura';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { sendInvoiceEmail, isLoading, error, clearError };
}
