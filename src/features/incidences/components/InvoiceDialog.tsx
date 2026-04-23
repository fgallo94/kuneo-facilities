'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCounters } from '@/features/admin/hooks/useCounters';
import type { Incidence } from '@/types';

interface InvoiceDialogProps {
  incidence: Incidence;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    amount: number;
    concept: string;
    counterId: string;
    counterName: string;
    counterEmail: string;
  }) => void;
  isLoading?: boolean;
}

export function InvoiceDialog({
  incidence,
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: InvoiceDialogProps) {
  const { counters, loading: countersLoading } = useCounters();
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setAmount('');
    setConcept('');
    setSelectedCounterId('');
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!concept.trim()) {
      setError('El concepto es obligatorio');
      return;
    }
    if (!selectedCounterId) {
      setError('Selecciona un destinatario');
      return;
    }
    const counter = counters.find((c) => c.id === selectedCounterId);
    if (!counter) {
      setError('Contador no encontrado');
      return;
    }
    onConfirm({
      amount: amountNum,
      concept: concept.trim(),
      counterId: counter.id,
      counterName: counter.name,
      counterEmail: counter.email,
    });
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Facturar incidencia</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incidencia</p>
            <p className="mt-1 text-sm font-medium text-charcoal">{incidence.title}</p>
            <p className="text-xs text-gray-500">{incidence.description.slice(0, 100)}{incidence.description.length > 100 ? '...' : ''}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-charcoal">
              Monto <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              placeholder="0.00"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-charcoal">
              Concepto <span className="text-red-500">*</span>
            </label>
            <textarea
              value={concept}
              onChange={(e) => {
                setConcept(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej: Reparación de grifo principal"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal">
              Enviar factura a <span className="text-red-500">*</span>
            </label>
            {countersLoading ? (
              <p className="text-xs text-gray-400">Cargando contadores...</p>
            ) : counters.length === 0 ? (
              <p className="text-xs text-gray-400">No hay contadores configurados.</p>
            ) : (
              <div className="space-y-2">
                {counters.map((counter) => (
                  <label
                    key={counter.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      selectedCounterId === counter.id
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="counter"
                      value={counter.id}
                      checked={selectedCounterId === counter.id}
                      onChange={() => {
                        setSelectedCounterId(counter.id);
                        if (error) setError(null);
                      }}
                      className="h-4 w-4 text-brand focus:ring-brand"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{counter.name}</p>
                      <p className="text-xs text-gray-500">{counter.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || countersLoading || counters.length === 0}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Confirmar facturación'}
          </button>
        </div>
      </div>
    </div>
  );
}
