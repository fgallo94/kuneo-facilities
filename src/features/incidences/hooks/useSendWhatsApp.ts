'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getClientFunctions } from '@/lib/firebase';

export interface SendWhatsAppPayload {
  to: string;
  body: string;
  templateSid?: string;
}

export function useSendWhatsApp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendWhatsApp = async (payload: SendWhatsAppPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getClientFunctions();
      const callable = httpsCallable<SendWhatsAppPayload, { success: boolean; messageSid: string }>(
        functions,
        'sendWhatsAppMessage'
      );
      const result = await callable(payload);
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar mensaje de WhatsApp';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { sendWhatsApp, isLoading, error, clearError };
}
