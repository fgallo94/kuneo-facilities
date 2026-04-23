'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CountersManager } from '@/features/admin/components/CountersManager';
import { Calculator } from 'lucide-react';

const settingsSections = [
  { id: 'counters', label: 'Contadores', icon: Calculator },
];

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeSection, setActiveSection] = useState('counters');

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Configuraciones</h1>
          <p className="text-sm text-gray-500">Gestiona las preferencias y datos del sistema.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Settings Menu */}
          <div className="space-y-1 md:col-span-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand/10 text-charcoal'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeSection === 'counters' && <CountersManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
