import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QuickCreateForm } from './QuickCreateForm';

describe('QuickCreateForm', () => {
  it('renderiza el label y el input', () => {
    render(<QuickCreateForm label="Añadir Grupo" placeholder="Nombre del grupo" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Nombre del grupo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /añadir/i })).toBeInTheDocument();
  });

  it('no llama a onSubmit si el input está vacío', async () => {
    const onSubmit = vi.fn();
    render(<QuickCreateForm label="Añadir" onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByRole('button', { name: /añadir/i }).closest('form')!);
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it('llama a onSubmit y limpia el input cuando se envía un valor válido', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuickCreateForm label="Añadir" onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  Nuevo Grupo  ' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Nuevo Grupo'));
    expect(input).toHaveValue('');
  });

  it('muestra loading mientras onSubmit es asíncrono', async () => {
    let resolveSubmit: () => void;
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      })
    );

    render(<QuickCreateForm label="Añadir" onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Grupo' } });

    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });

    expect(screen.getByRole('button', { name: /añadir/i })).toBeDisabled();
    await act(async () => {
      resolveSubmit!();
    });
  });
});
