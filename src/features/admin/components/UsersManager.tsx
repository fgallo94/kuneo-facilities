'use client';

import { useState } from 'react';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useCreateUser } from '../hooks/useCreateUser';
import { UserDirectory } from './UserDirectory';
import { CreateUserForm } from './CreateUserForm';
import type { CreateUserFormData } from '@/features/admin/schemas/createUserSchema';

export function UsersManager() {
  const { users, loading } = useUsers();
  const { createUser, isLoading: creatingUser, error: createUserError, clearError } = useCreateUser();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateUser = async (data: CreateUserFormData & { password: string }) => {
    try {
      await createUser({
        email: data.email,
        password: data.password,
        displayName: `${data.firstName} ${data.lastName}`,
        role: data.role,
        phone: data.phone,
      });
      setShowCreateForm(false);
    } catch {
      // error queda en el hook
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charcoal">Gestión de usuarios</h2>
        <p className="text-sm text-gray-500">Administra el directorio de usuarios del sistema.</p>
      </div>

      {showCreateForm ? (
        <CreateUserForm
          onSubmit={handleCreateUser}
          onClose={() => {
            setShowCreateForm(false);
            clearError();
          }}
          isLoading={creatingUser}
          serverError={createUserError}
        />
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal-light"
        >
          + Crear Usuario
        </button>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando usuarios...</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <UserDirectory users={users} onCreateUserClick={() => setShowCreateForm(true)} />
        </div>
      )}
    </div>
  );
}
