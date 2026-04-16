'use client';

import React, { useState } from 'react';
import { Building2, ChevronRight, Plus } from 'lucide-react';
import { useGroups } from '@/features/admin/hooks/useGroups';
import { useInstallations } from '@/features/admin/hooks/useInstallations';
import { useAdminProperties } from '@/features/admin/hooks/useAdminProperties';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { useCreateUser } from '@/features/admin/hooks/useCreateUser';
import { CreateUserForm } from './CreateUserForm';
import { UserDirectory } from './UserDirectory';
import { EntityCard, type Entity } from './EntityCard';
import { AssignUserModal } from './AssignUserModal';
import { OnboardEntityModal } from './OnboardEntityModal';
import type { CreateUserFormData } from '@/features/admin/schemas/createUserSchema';
import type { OnboardEntityFormData } from '@/features/admin/schemas/onboardEntitySchema';
import type { Group, Installation } from '@/types';

type ViewLevel = 'groups' | 'installations' | 'properties';

type OnboardTarget =
  | { level: 'group'; parentId?: null }
  | { level: 'installation'; parentId: string }
  | { level: 'property'; parentId: string };

function entityToFormData(entity: Entity): OnboardEntityFormData {
  return {
    name: entity.name,
    address: entity.address ?? '',
    description: entity.description ?? '',
    assignedUserIds: entity.assignedUserIds ?? [],
    imageUrl: entity.imageUrl ?? '',
  };
}

export function AdminManagementPage() {
  const { users, refetch: refetchUsers } = useAdminUsers();
  const { groups, createGroup, assignUsers: assignGroupUsers, updateGroup, refetch: refetchGroups } = useGroups();
  const {
    installations,
    createInstallation,
    assignUsers: assignInstallationUsers,
    updateInstallation,
    refetch: refetchInstallations,
  } = useInstallations();
  const {
    properties,
    createProperty,
    assignUsers: assignPropertyUsers,
    updateProperty,
    refetch: refetchProperties,
  } = useAdminProperties();
  const { createUser, isLoading: creatingUser, error: createUserError, clearError } = useCreateUser();

  const [view, setView] = useState<ViewLevel>('groups');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [assignModal, setAssignModal] = useState<{ entity: Entity } | null>(null);
  const [onboardTarget, setOnboardTarget] = useState<OnboardTarget | null>(null);
  const [editTarget, setEditTarget] = useState<{ level: Entity['type']; entity: Entity } | null>(null);

  const handleCreateUser = async (data: CreateUserFormData & { password: string }) => {
    try {
      await createUser({
        email: data.email,
        password: data.password,
        displayName: `${data.firstName} ${data.lastName}`,
        role: data.role,
      });
      setShowCreateUser(false);
      await refetchUsers();
    } catch {
      // error ya queda en el estado
    }
  };

  const handleAssign = async (userIds: string[]) => {
    if (!assignModal) return;
    const { entity } = assignModal;
    try {
      if (entity.type === 'group') {
        await assignGroupUsers(entity.id, userIds);
      } else if (entity.type === 'installation') {
        await assignInstallationUsers(entity.id, userIds);
      } else {
        await assignPropertyUsers(entity.id, userIds);
      }
    } finally {
      setAssignModal(null);
    }
  };

  const navigateToGroup = (group: Group) => {
    setSelectedGroup(group);
    setView('installations');
  };

  const navigateToInstallation = (installation: Installation) => {
    setSelectedInstallation(installation);
    setView('properties');
  };

  const goBack = () => {
    if (view === 'properties') {
      setView('installations');
      setSelectedInstallation(null);
    } else if (view === 'installations') {
      setView('groups');
      setSelectedGroup(null);
    }
  };

  const handleOnboardSubmit = async (data: OnboardEntityFormData) => {
    if (!onboardTarget) return;
    if (onboardTarget.level === 'group') {
      await createGroup(data);
      await refetchGroups();
    } else if (onboardTarget.level === 'installation' && onboardTarget.parentId) {
      await createInstallation({ ...data, groupId: onboardTarget.parentId });
      await refetchInstallations();
    } else if (onboardTarget.level === 'property' && onboardTarget.parentId) {
      await createProperty({ ...data, installationId: onboardTarget.parentId });
      await refetchProperties();
    }
    setOnboardTarget(null);
  };

  const handleEditSubmit = async (data: OnboardEntityFormData) => {
    if (!editTarget) return;
    const { entity, level } = editTarget;
    if (level === 'group') {
      await updateGroup(entity.id, data);
      await refetchGroups();
    } else if (level === 'installation') {
      await updateInstallation(entity.id, data);
      await refetchInstallations();
    } else if (level === 'property') {
      await updateProperty(entity.id, data);
      await refetchProperties();
    }
    setEditTarget(null);
  };

  const activePortfolios = groups.length + installations.length + properties.length;

  const renderBreadcrumb = () => {
    if (view === 'groups') {
      return <span className="text-sm text-slate-500">Grupos</span>;
    }
    if (view === 'installations' && selectedGroup) {
      return (
        <button onClick={goBack} className="text-sm text-slate-500 hover:text-blue-900 hover:underline">
          Grupos
        </button>
      );
    }
    if (view === 'properties' && selectedGroup && selectedInstallation) {
      return (
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <button
            onClick={() => {
              setView('groups');
              setSelectedGroup(null);
              setSelectedInstallation(null);
            }}
            className="hover:text-blue-900 hover:underline"
          >
            Grupos
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={goBack} className="hover:text-blue-900 hover:underline">
            {selectedGroup.name}
          </button>
        </div>
      );
    }
    return null;
  };

  const renderGrid = () => {
    if (view === 'groups') {
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <EntityCard
                key={group.id}
                entity={{ ...group, type: 'group' }}
                users={users}
                onAssign={(e) => setAssignModal({ entity: e })}
                onEdit={(e) => setEditTarget({ level: 'group', entity: e })}
                onClick={(e) => navigateToGroup(e as Group & { type: 'group' })}
              />
            ))}
          </div>
          <button
            onClick={() => setOnboardTarget({ level: 'group' })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Grupo
          </button>
          {groups.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay grupos creados aún.
            </div>
          )}
        </>
      );
    }

    if (view === 'installations' && selectedGroup) {
      const groupInstallations = installations.filter((i) => i.groupId === selectedGroup.id);
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupInstallations.map((installation) => (
              <EntityCard
                key={installation.id}
                entity={{ ...installation, type: 'installation' }}
                users={users}
                onAssign={(e) => setAssignModal({ entity: e })}
                onEdit={(e) => setEditTarget({ level: 'installation', entity: e })}
                onClick={(e) => navigateToInstallation(e as Installation & { type: 'installation' })}
              />
            ))}
          </div>
          <button
            onClick={() => setOnboardTarget({ level: 'installation', parentId: selectedGroup.id })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
          >
            <Plus className="h-4 w-4" />
            Crear Nueva Instalación
          </button>
          {groupInstallations.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay instalaciones en este grupo.
            </div>
          )}
        </>
      );
    }

    if (view === 'properties' && selectedInstallation) {
      const installationProperties = properties.filter((p) => p.installationId === selectedInstallation.id);
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {installationProperties.map((property) => (
              <EntityCard
                key={property.id}
                entity={{ ...property, type: 'property' }}
                users={users}
                onAssign={(e) => setAssignModal({ entity: e })}
                onEdit={(e) => setEditTarget({ level: 'property', entity: e })}
              />
            ))}
          </div>
          <button
            onClick={() => setOnboardTarget({ level: 'property', parentId: selectedInstallation.id })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
          >
            <Plus className="h-4 w-4" />
            Crear Nueva Propiedad
          </button>
          {installationProperties.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay propiedades en esta instalación.
            </div>
          )}
        </>
      );
    }

    return null;
  };

  const getModalTitle = () => {
    if (editTarget) {
      if (editTarget.level === 'group') return 'Editar Grupo';
      if (editTarget.level === 'installation') return 'Editar Instalación';
      return 'Editar Propiedad';
    }
    if (!onboardTarget) return 'Crear';
    if (onboardTarget.level === 'group') return 'Crear Nuevo Grupo';
    if (onboardTarget.level === 'installation') return 'Crear Nueva Instalación';
    return 'Crear Nueva Propiedad';
  };

  const getModalLabel = () => {
    if (editTarget) return 'Guardar Cambios';
    if (!onboardTarget) return 'Crear';
    if (onboardTarget.level === 'group') return 'Crear Grupo';
    if (onboardTarget.level === 'installation') return 'Crear Instalación';
    return 'Crear Propiedad';
  };

  const isModalOpen = !!onboardTarget || !!editTarget;
  const modalDefaultValues = editTarget ? entityToFormData(editTarget.entity) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Administración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona tu portfolio arquitectónico y controla el acceso del equipo de administración de propiedades.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main content - 3/4 */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Building2 className="h-5 w-5 text-blue-900" />
                Gestión de Propiedades
              </h2>
              {view !== 'groups' && (
                <>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                  {renderBreadcrumb()}
                </>
              )}
            </div>
            <span className="text-xs text-slate-500">{activePortfolios} Portafolios Activos</span>
          </div>

          <div className="space-y-4">{renderGrid()}</div>
        </div>

        {/* Sidebar - 1/4 */}
        <aside className="space-y-5">
          {showCreateUser ? (
            <CreateUserForm
              onSubmit={handleCreateUser}
              onClose={() => {
                setShowCreateUser(false);
                clearError();
              }}
              isLoading={creatingUser}
              serverError={createUserError}
            />
          ) : (
            <UserDirectory users={users} onCreateUserClick={() => setShowCreateUser(true)} />
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{users.length}</p>
              <p className="text-[10px] font-medium uppercase text-slate-400">Personal Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{properties.length}</p>
              <p className="text-[10px] font-medium uppercase text-slate-400">Unidades Gest.</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">0</p>
              <p className="text-[10px] font-medium uppercase text-slate-400">Incid. Abiertas</p>
            </div>
          </div>
        </aside>
      </div>

      {assignModal && (
        <AssignUserModal
          isOpen
          onClose={() => setAssignModal(null)}
          users={users}
          selectedUserIds={assignModal.entity.assignedUserIds ?? []}
          onAssign={handleAssign}
          title={`Asignar usuarios a ${assignModal.entity.name}`}
        />
      )}

      <OnboardEntityModal
        isOpen={isModalOpen}
        onClose={() => {
          setOnboardTarget(null);
          setEditTarget(null);
        }}
        onSubmit={editTarget ? handleEditSubmit : handleOnboardSubmit}
        users={users}
        title={getModalTitle()}
        submitLabel={getModalLabel()}
        defaultValues={modalDefaultValues}
      />
    </div>
  );
}
