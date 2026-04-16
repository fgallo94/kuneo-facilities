import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OnboardEntityModal } from './OnboardEntityModal';
import type { User } from '@/types';

vi.mock('@/lib/firebase', () => ({
  getClientStorage: () => ({}),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn().mockResolvedValue(undefined),
  getDownloadURL: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}));

const mockUsers: User[] = [
  { uid: 'u1', email: 'admin@kuneo.app', displayName: 'Admin User', role: 'admin' },
  { uid: 'u2', email: 'user@kuneo.app', displayName: 'Normal User', role: 'user' },
  { uid: 'u3', email: 'user2@kuneo.app', displayName: 'Second User', role: 'user' },
];

describe('OnboardEntityModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <OnboardEntityModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        users={mockUsers}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el formulario cuando está abierto', () => {
    render(
      <OnboardEntityModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        users={mockUsers}
        title="Crear Nuevo Grupo"
        submitLabel="Crear Grupo"
      />
    );
    expect(screen.getByText('Crear Nuevo Grupo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear grupo/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('p. ej., Torre Residencial Apex')).toBeInTheDocument();
  });

  it('llama a onSubmit con los datos ingresados', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <OnboardEntityModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        users={mockUsers}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('p. ej., Torre Residencial Apex'), {
      target: { value: 'Torre Norte' },
    });
    fireEvent.change(screen.getByPlaceholderText('Av. Principal 123, Oficina 400...'), {
      target: { value: 'Av. Principal 123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear propiedad/i }));
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Torre Norte',
          address: 'Av. Principal 123',
          assignedUserIds: [],
          imageUrl: '',
        })
      )
    );
  });

  it('solo muestra usuarios (no admins) en el desplegable y permite seleccionar', async () => {
    render(
      <OnboardEntityModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        users={mockUsers}
      />
    );

    const select = screen.getByRole('listbox') as HTMLSelectElement;
    const options = Array.from(select.options) as HTMLOptionElement[];

    // No debe mostrar al admin
    expect(options.some((o) => o.text.includes('Admin User'))).toBe(false);
    // Debe mostrar los usuarios normales
    expect(options.some((o) => o.text.includes('Normal User'))).toBe(true);
    expect(options.some((o) => o.text.includes('Second User'))).toBe(true);

    // Seleccionar uno
    options[0].selected = true;
    fireEvent.change(select);

    expect(options[0].selected).toBe(true);
  });

  it('llama a onClose al hacer clic en cancelar', () => {
    const onClose = vi.fn();
    render(
      <OnboardEntityModal
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        users={mockUsers}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('precarga defaultValues cuando se usa en modo edición', () => {
    render(
      <OnboardEntityModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        users={mockUsers}
        title="Editar Grupo"
        submitLabel="Guardar Cambios"
        defaultValues={{
          name: 'Grupo Existente',
          address: 'Av. Siempre Viva 742',
          description: 'Descripción previa',
          assignedUserIds: ['u2'],
          imageUrl: 'https://example.com/img.jpg',
        }}
      />
    );

    expect(screen.getByDisplayValue('Grupo Existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Av. Siempre Viva 742')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Descripción previa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });
});
