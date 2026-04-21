'use client';

import React from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { Group, Installation, Property, User } from '@/types';

export type Entity =
  | (Group & { type: 'group' })
  | (Installation & { type: 'installation' })
  | (Property & { type: 'property' });

interface EntityCardProps {
  entity: Entity;
  users: User[];
  onAssign: (entity: Entity) => void;
  onEdit?: (entity: Entity) => void;
  onClick?: (entity: Entity) => void;
}

function getEntityLabel(entity: Entity) {
  if (entity.type === 'group') return 'Grupo';
  if (entity.type === 'installation') return 'Instalación';
  return 'Propiedad';
}

function getAssignedUserIds(entity: Entity) {
  return entity.assignedUserIds ?? [];
}

export function EntityCard({ entity, users, onAssign, onEdit, onClick }: EntityCardProps) {
  const assignedIds = getAssignedUserIds(entity);
  const avatars = assignedIds
    .map((id) => users.find((u) => u.uid === id))
    .filter(Boolean) as User[];
  const remaining = avatars.length > 3 ? avatars.length - 3 : 0;

  const handleCardClick = () => {
    onClick?.(entity);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full bg-gray-100">
        {entity.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.imageUrl}
            alt={entity.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <span className="text-4xl font-light">🏢</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded bg-charcoal/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {getEntityLabel(entity)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="truncate text-base font-semibold text-gray-900">{entity.name}</h4>
        <p className="truncate text-sm text-gray-500">
          {entity.address || entity.description || 'Sin dirección'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {avatars.slice(0, 3).map((user, idx) => (
                <div
                  key={user.uid + idx}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand/15 text-[10px] font-bold text-charcoal"
                  title={user.displayName || user.email || ''}
                >
                  {user.displayName?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase() ||
                    '?'}
                </div>
              ))}
              {remaining > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600">
                  +{remaining}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(entity);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal text-white hover:bg-charcoal-light"
              aria-label="Asignar usuarios"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(entity);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
