import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCard } from './EntityCard';
import type { User } from '@/types';

const mockUsers: User[] = [
  { uid: 'u1', email: 'a@kuneo.app', displayName: 'Alice', role: 'admin' },
  { uid: 'u2', email: 'b@kuneo.app', displayName: 'Bob', role: 'user' },
];

describe('EntityCard', () => {
  it('renderiza el nombre y badge de tipo', () => {
    render(
      <EntityCard
        entity={{ id: 'g1', name: 'Grupo A', isActive: true, type: 'group' }}
        users={mockUsers}
        onAssign={vi.fn()}
      />
    );
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('Grupo')).toBeInTheDocument();
  });

  it('muestra la dirección cuando existe', () => {
    render(
      <EntityCard
        entity={{
          id: 'i1',
          name: 'Instalación 1',
          groupId: 'g1',
          address: '123 Corporate Blvd',
          type: 'installation',
        }}
        users={mockUsers}
        onAssign={vi.fn()}
      />
    );
    expect(screen.getByText('123 Corporate Blvd')).toBeInTheDocument();
  });

  it('muestra avatares de usuarios asignados y llama a onAssign', () => {
    const onAssign = vi.fn();
    render(
      <EntityCard
        entity={{
          id: 'i1',
          name: 'Instalación 1',
          groupId: 'g1',
          assignedUserIds: ['u1', 'u2'],
          type: 'installation',
        }}
        users={mockUsers}
        onAssign={onAssign}
      />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /asignar/i }));
    expect(onAssign).toHaveBeenCalledTimes(1);
  });

  it('navega al hacer click en la tarjeta', () => {
    const onClick = vi.fn();
    render(
      <EntityCard
        entity={{ id: 'g1', name: 'Grupo A', isActive: true, type: 'group' }}
        users={mockUsers}
        onAssign={vi.fn()}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('Grupo A').closest('div')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('llama a onEdit al hacer clic en el botón de editar', () => {
    const onEdit = vi.fn();
    render(
      <EntityCard
        entity={{ id: 'g1', name: 'Grupo A', isActive: true, type: 'group' }}
        users={mockUsers}
        onAssign={vi.fn()}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
