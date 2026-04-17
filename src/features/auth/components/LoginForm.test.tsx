import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm - modo login', () => {
  it('muestra errores de validación cuando se envía vacío', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="login" onSubmitLogin={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="login" onSubmitLogin={handleSubmit} />);

    fireEvent.input(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@kuneo.app' },
    });
    fireEvent.input(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Kuneo2024!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'admin@kuneo.app',
        password: 'Kuneo2024!',
        remember: false,
      });
    });
  });

  it('muestra mensaje de error proveniente del servidor', () => {
    render(<LoginForm mode="login" onSubmitLogin={vi.fn()} error="Credenciales inválidas" />);
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('deshabilita el botón cuando isLoading es true', () => {
    render(<LoginForm mode="login" onSubmitLogin={vi.fn()} isLoading={true} />);
    const button = screen.getByRole('button', { name: /ingresando/i });
    expect(button).toBeDisabled();
  });

  it('cambia a modo forgot al hacer clic en el botón de olvidó contraseña', () => {
    const handleSwitch = vi.fn();
    render(<LoginForm mode="login" onSubmitLogin={vi.fn()} onSwitchMode={handleSwitch} />);

    fireEvent.click(screen.getByRole('button', { name: /¿olvidó su contraseña\?/i }));
    expect(handleSwitch).toHaveBeenCalledWith('forgot');
  });
});

describe('LoginForm - modo forgot', () => {
  it('muestra mensaje informativo para primeros ingresos', () => {
    render(<LoginForm mode="forgot" onSubmitForgot={vi.fn()} />);
    expect(screen.getByText(/¿Es tu primera vez\?/i)).toBeInTheDocument();
  });

  it('valida que el email sea obligatorio', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="forgot" onSubmitForgot={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía el email cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="forgot" onSubmitForgot={handleSubmit} />);

    fireEvent.input(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@kuneo.app' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ email: 'user@kuneo.app' });
    });
  });

  it('muestra mensaje de éxito cuando se proporciona', () => {
    render(<LoginForm mode="forgot" onSubmitForgot={vi.fn()} successMessage="Correo enviado" />);
    expect(screen.getByText('Correo enviado')).toBeInTheDocument();
  });

  it('vuelve al login al hacer clic en volver', () => {
    const handleSwitch = vi.fn();
    render(<LoginForm mode="forgot" onSubmitForgot={vi.fn()} onSwitchMode={handleSwitch} />);

    fireEvent.click(screen.getByRole('button', { name: /volver al inicio de sesión/i }));
    expect(handleSwitch).toHaveBeenCalledWith('login');
  });
});

describe('LoginForm - modo reset', () => {
  it('muestra campos de contraseña y confirmación', () => {
    render(<LoginForm mode="reset" onSubmitReset={vi.fn()} />);
    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('valida que las contraseñas coincidan', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="reset" onSubmitReset={handleSubmit} />);

    fireEvent.input(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'password123' },
    });
    fireEvent.input(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos cuando las contraseñas coinciden', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm mode="reset" onSubmitReset={handleSubmit} />);

    fireEvent.input(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.input(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });
    });
  });
});
