'use client';

import { useState } from 'react';
import { X, Mail, Phone, ImageIcon } from 'lucide-react';
import { useContractors } from '@/features/admin/hooks/useContractors';
import type { Incidence } from '@/types';

interface SendToContractorModalProps {
  incidence: Incidence;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    contractorId: string;
    contractorName: string;
    contractorEmail: string;
    contractorPhone: string;
    contactMethod: 'email' | 'whatsapp';
    extraContext: string;
    includeImages: boolean;
  }) => void;
  isLoading?: boolean;
}

export function SendToContractorModal({
  incidence,
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: SendToContractorModalProps) {
  const { contractors, loading: contractorsLoading } = useContractors();
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [extraContext, setExtraContext] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedContractorId('');
    setContactMethod('email');
    setExtraContext('');
    setIncludeImages(true);
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedContractorId) {
      setError('Selecciona un contratista');
      return;
    }
    const contractor = contractors.find((c) => c.id === selectedContractorId);
    if (!contractor) {
      setError('Contratista no encontrado');
      return;
    }
    if (contactMethod === 'whatsapp' && !contractor.phone) {
      setError('El contratista seleccionado no tiene teléfono configurado');
      return;
    }
    onConfirm({
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractorEmail: contractor.email,
      contractorPhone: contractor.phone,
      contactMethod,
      extraContext: extraContext.trim(),
      includeImages,
    });
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Enviar a contratista</h3>
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
            <p className="text-xs text-gray-500">
              {incidence.description.slice(0, 100)}
              {incidence.description.length > 100 ? '...' : ''}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal">
              Contratista <span className="text-red-500">*</span>
            </label>
            {contractorsLoading ? (
              <p className="text-xs text-gray-400">Cargando contratistas...</p>
            ) : contractors.length === 0 ? (
              <p className="text-xs text-gray-400">No hay contratistas configurados. Agrégalos en Configuración.</p>
            ) : (
              <div className="space-y-2">
                {contractors.map((contractor) => (
                  <label
                    key={contractor.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      selectedContractorId === contractor.id
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contractor"
                      value={contractor.id}
                      checked={selectedContractorId === contractor.id}
                      onChange={() => {
                        setSelectedContractorId(contractor.id);
                        if (error) setError(null);
                      }}
                      className="h-4 w-4 text-brand focus:ring-brand"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{contractor.name}</p>
                      <p className="text-xs text-gray-500">
                        {contractor.type} · {contractor.email}
                        {contractor.phone && ` · ${contractor.phone}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal">
              Método de contacto <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  contactMethod === 'email'
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('whatsapp')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  contactMethod === 'whatsapp'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-charcoal">
              Contexto adicional
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Añade instrucciones o detalles extra para el contratista..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {incidence.imageUrls.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                Incluir {incidence.imageUrls.length} evidencia{incidence.imageUrls.length > 1 ? 's' : ''} visual{incidence.imageUrls.length > 1 ? 'es' : ''} en el mensaje
              </span>
            </label>
          )}
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
            disabled={isLoading || contractorsLoading || contractors.length === 0}
            className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Confirmar envío'}
          </button>
        </div>
      </div>
    </div>
  );
}
