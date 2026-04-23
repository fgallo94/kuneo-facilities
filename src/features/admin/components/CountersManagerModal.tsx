'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Pencil } from 'lucide-react';
import { useCounters } from '../hooks/useCounters';
import { useManageCounters } from '../hooks/useManageCounters';
import type { Counter } from '@/types';

interface CountersManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export function CountersManagerModal({ open, onClose }: CountersManagerModalProps) {
  const { counters, loading } = useCounters();
  const { createCounter, updateCounter, removeCounter, isLoading, error, clearError } = useManageCounters();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '' });

  const handleClose = () => {
    setEditingId(null);
    setForm({ name: '', email: '' });
    clearError();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId) {
      await updateCounter(editingId, form);
    } else {
      await createCounter(form);
    }
    setEditingId(null);
    setForm({ name: '', email: '' });
  };

  const startEdit = (counter: Counter) => {
    setEditingId(counter.id);
    setForm({ name: counter.name, email: counter.email });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Gestión de contadores</h3>
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

          {/* Form */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del contador"
                className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: '', email: '' });
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !form.name.trim() || !form.email.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal-light disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {editingId ? 'Guardar cambios' : 'Agregar contador'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contadores existentes</p>
            {loading ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : counters.length === 0 ? (
              <p className="text-xs text-gray-400">No hay contadores configurados.</p>
            ) : (
              <ul className="space-y-2">
                {counters.map((counter) => (
                  <li
                    key={counter.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-charcoal">{counter.name}</p>
                      <p className="text-xs text-gray-500">{counter.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(counter)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-charcoal"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('¿Eliminar este contador?')) {
                            await removeCounter(counter.id);
                          }
                        }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
