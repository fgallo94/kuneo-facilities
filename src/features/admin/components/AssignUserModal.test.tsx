import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignUserModal } from './AssignUserModal';
import type { User } from '@/types';

const mockUsers: User[] = [
  { uid: 'u1', email: 'admin@kuneo.app', displayName: 'Admin User', role: 'admin' },
  { uid: 'u2', email: 'user@kuneo.app', displayName: 'Normal User', role: 'user' },
  { uid: 'u3', email: 'user2@kuneo.app', displayName: 'Second User', role: 'user' },
];

describe('AssignUserModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <AssignUserModal
        isOpen={false}
        onClose={vi.fn()}
        users={mockUsers}
        selectedUserIds={[]}
        onAssign={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza solo usuarios (no admins) cuando está abierto', () => {
    render(
      <AssignUserModal
        isOpen={true}
        onClose={vi.fn()}
        users={mockUsers}
        selectedUserIds={[]}
        onAssign={vi.fn()}
      />
    );
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    expect(screen.getByText('Normal User')).toBeInTheDocument();
    expect(screen.getByText('Second User')).toBeInTheDocument();
  });

  it('preselecciona los usuarios ya asignados', () => {
    render(
      <AssignUserModal
        isOpen={true}
        onClose={vi.fn()}
        users={mockUsers}
        selectedUserIds={['u2']}
        onAssign={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('llama a onAssign con los userIds seleccionados al guardar', async () => {
    const onAssign = vi.fn();
    render(
      <AssignUserModal
        isOpen={true}
        onClose={vi.fn()}
        users={mockUsers}
        selectedUserIds={[]}
        onAssign={onAssign}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Second User

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith(['u3']);
    });
  });

  it('llama a onClose al hacer clic en cancelar', () => {
    const onClose = vi.fn();
    render(
      <AssignUserModal
        isOpen={true}
        onClose={onClose}
        users={mockUsers}
        selectedUserIds={[]}
        onAssign={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
