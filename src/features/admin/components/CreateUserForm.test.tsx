import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateUserForm } from './CreateUserForm';

describe('CreateUserForm', () => {
  it('muestra errores de validación cuando se envía vacío', async () => {
    const handleSubmit = vi.fn();
    render(<CreateUserForm onSubmit={handleSubmit} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(<CreateUserForm onSubmit={handleSubmit} onClose={vi.fn()} />);

    fireEvent.input(screen.getByLabelText(/nombre/i), {
      target: { value: 'Elias' },
    });
    fireEvent.input(screen.getByLabelText(/apellido/i), {
      target: { value: 'Vance' },
    });
    fireEvent.input(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'elias@kuneo.app' },
    });

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Elias',
          lastName: 'Vance',
          email: 'elias@kuneo.app',
          role: 'user',
          password: 'elias123456',
        })
      );
    });
  });

  it('muestra mensaje de error del servidor', () => {
    render(
      <CreateUserForm
        onSubmit={vi.fn()}
        onClose={vi.fn()}
        serverError="Error al crear usuario"
      />
    );
    expect(screen.getByText('Error al crear usuario')).toBeInTheDocument();
  });

  it('deshabilita el botón cuando isLoading es true', () => {
    render(
      <CreateUserForm onSubmit={vi.fn()} onClose={vi.fn()} isLoading={true} />
    );
    const button = screen.getByRole('button', { name: /crear usuario/i });
    expect(button).toBeDisabled();
  });

  it('llama a onClose al hacer clic en cerrar', () => {
    const onClose = vi.fn();
    render(<CreateUserForm onSubmit={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/cerrar/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
