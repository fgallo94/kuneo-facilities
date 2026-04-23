'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useContractors } from '../hooks/useContractors';
import { useManageContractors } from '../hooks/useManageContractors';
import { CONTRACTOR_TYPES } from '@/types';
import type { Contractor, ContractorType } from '@/types';

export function ContractorsManager() {
  const { contractors, loading } = useContractors();
  const { createContractor, updateContractor, removeContractor, isLoading, error } = useManageContractors();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; type: ContractorType }>({ name: '', email: '', phone: '', type: CONTRACTOR_TYPES[0] });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    if (editingId) {
      await updateContractor(editingId, form);
    } else {
      await createContractor(form);
    }
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', type: CONTRACTOR_TYPES[0] });
  };

  const startEdit = (contractor: Contractor) => {
    setEditingId(contractor.id);
    setForm({
      name: contractor.name,
      email: contractor.email,
      phone: contractor.phone,
      type: contractor.type,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charcoal">Gestión de contratistas</h2>
        <p className="text-sm text-gray-500">Administra los contratistas por especialidad.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del contratista"
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
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+34 600 000 000"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Especialidad</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof CONTRACTOR_TYPES[number] }))}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              {CONTRACTOR_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', email: '', phone: '', type: CONTRACTOR_TYPES[0] });
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim() || !form.email.trim() || !form.phone.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal-light disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {editingId ? 'Guardar cambios' : 'Agregar contratista'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contratistas existentes</p>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : contractors.length === 0 ? (
          <p className="text-sm text-gray-400">No hay contratistas configurados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-charcoal">{contractor.name}</p>
                  <p className="text-xs text-gray-500">{contractor.email}</p>
                  <p className="text-xs text-gray-500">{contractor.phone}</p>
                  <span className="mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-charcoal">
                    {contractor.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(contractor)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-charcoal"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('¿Eliminar este contratista?')) {
                        await removeContractor(contractor.id);
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
