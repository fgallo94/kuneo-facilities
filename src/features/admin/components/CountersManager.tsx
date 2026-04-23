'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useCounters } from '../hooks/useCounters';
import { useManageCounters } from '../hooks/useManageCounters';
import type { Counter } from '@/types';

export function CountersManager() {
  const { counters, loading } = useCounters();
  const { createCounter, updateCounter, removeCounter, isLoading, error } = useManageCounters();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '' });

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charcoal">Gestión de contadores</h2>
        <p className="text-sm text-gray-500">Administra los contactos de facturación disponibles.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del contador"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
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
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contadores existentes</p>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : counters.length === 0 ? (
          <p className="text-sm text-gray-400">No hay contadores configurados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {counters.map((counter) => (
              <div
                key={counter.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
