'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useGroups } from '@/features/admin/hooks/useGroups';
import { useInstallations } from '@/features/admin/hooks/useInstallations';
import { useProperties } from '@/features/incidences/hooks/useProperties';

export function SidebarIncidencesNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isIncidencesBase = pathname === '/dashboard/incidences';

  const { groups, loading: groupsLoading } = useGroups();
  const { installations, loading: installationsLoading } = useInstallations();
  const { properties, loading: propertiesLoading } = useProperties();

  const [incidencesExpanded, setIncidencesExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedInstallations, setExpandedInstallations] = useState<Set<string>>(new Set());

  const loading = groupsLoading || installationsLoading || propertiesLoading;

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInstallation = (id: string) => {
    setExpandedInstallations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupInstallations = (groupId: string) =>
    installations.filter((i) => i.groupId === groupId);

  const installationProperties = (installationId: string) =>
    properties.filter((p) => p.installationId === installationId);

  const isActive = (params: Record<string, string>) => {
    if (!isIncidencesBase) return false;
    for (const [key, value] of Object.entries(params)) {
      if (searchParams.get(key) !== value) return false;
    }
    // Ensure no extra params are present beyond what's expected
    const expectedKeys = Object.keys(params);
    const actualKeys = Array.from(searchParams.keys());
    if (actualKeys.length !== expectedKeys.length) return false;
    return true;
  };

  const buildHref = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => sp.set(k, v));
    return `/dashboard/incidences?${sp.toString()}`;
  };

  const parentActive = isActive({});

  return (
    <div>
      {/* Parent row: text navigates, chevron toggles */}
      <div
        className={[
          'flex items-center rounded-lg transition-colors',
          parentActive ? 'bg-brand/10' : 'hover:bg-gray-50',
        ].join(' ')}
      >
        <Link
          href="/dashboard/incidences"
          className={[
            'flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
            parentActive ? 'text-charcoal' : 'text-gray-600 hover:text-gray-900',
          ].join(' ')}
        >
          <FileText className="h-5 w-5" />
          <span className="truncate">Incidencias</span>
        </Link>
        <button
          onClick={() => setIncidencesExpanded((v) => !v)}
          className="px-3 py-2.5 text-gray-400 hover:text-gray-600"
          aria-label={incidencesExpanded ? 'Colapsar' : 'Expandir'}
        >
          {incidencesExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {incidencesExpanded && (
        <div className="mt-0.5 space-y-0.5 pl-4">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Cargando...</div>
          ) : (
            groups.map((group) => {
              const groupExpanded = expandedGroups.has(group.id);
              const gInstallations = groupInstallations(group.id);
              const groupActive = isActive({ groupId: group.id });

              return (
                <div key={group.id}>
                  {/* Group row: text navigates, chevron toggles */}
                  <div
                    className={[
                      'flex items-center rounded-md transition-colors',
                      groupActive ? 'bg-brand/10' : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="px-2 py-2 text-gray-400 hover:text-gray-600"
                      aria-label={groupExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      {groupExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <Link
                      href={buildHref({ groupId: group.id })}
                      className={[
                        'flex-1 truncate px-2 py-2 text-sm font-medium transition-colors',
                        groupActive ? 'text-charcoal' : 'text-gray-600 hover:text-gray-900',
                      ].join(' ')}
                    >
                      {group.name}
                    </Link>
                  </div>

                  {groupExpanded && (
                    <div className="space-y-0.5 pl-5">
                      {gInstallations.map((inst) => {
                        const instExpanded = expandedInstallations.has(inst.id);
                        const instProperties = installationProperties(inst.id);
                        const instActive = isActive({ groupId: group.id, installationId: inst.id });

                        return (
                          <div key={inst.id}>
                            {/* Installation row: text navigates, chevron toggles */}
                            <div
                              className={[
                                'flex items-center rounded-md transition-colors',
                                instActive ? 'bg-brand/10' : 'hover:bg-gray-50',
                              ].join(' ')}
                            >
                              <button
                                onClick={() => toggleInstallation(inst.id)}
                                className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
                                aria-label={instExpanded ? 'Colapsar' : 'Expandir'}
                              >
                                {instExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              <Link
                                href={buildHref({ groupId: group.id, installationId: inst.id })}
                                className={[
                                  'flex-1 truncate px-2 py-1.5 text-sm transition-colors',
                                  instActive ? 'font-medium text-charcoal' : 'text-gray-600 hover:text-gray-900',
                                ].join(' ')}
                              >
                                {inst.name}
                              </Link>
                            </div>

                            {instExpanded && (
                              <div className="space-y-0.5 pl-4">
                                {instProperties.map((prop) => (
                                  <Link
                                    key={prop.id}
                                    href={buildHref({
                                      groupId: group.id,
                                      installationId: inst.id,
                                      propertyId: prop.id,
                                    })}
                                    className={[
                                      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                                      isActive({
                                        groupId: group.id,
                                        installationId: inst.id,
                                        propertyId: prop.id,
                                      })
                                        ? 'bg-brand/10 font-medium text-charcoal'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    ].join(' ')}
                                  >
                                    <span className="truncate">{prop.name}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
