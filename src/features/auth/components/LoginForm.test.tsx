import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('muestra errores de validación cuando se envía vacío', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.input(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@kuneo.app' },
    });
    fireEvent.input(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Kuneo2024!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        {
          email: 'admin@kuneo.app',
          password: 'Kuneo2024!',
          remember: false,
        },
        expect.anything()
      );
    });
  });

  it('muestra mensaje de error proveniente del servidor', () => {
    render(<LoginForm onSubmit={vi.fn()} error="Credenciales inválidas" />);
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('deshabilita el botón cuando isLoading es true', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={true} />);
    const button = screen.getByRole('button', { name: /ingresando/i });
    expect(button).toBeDisabled();
  });
});
