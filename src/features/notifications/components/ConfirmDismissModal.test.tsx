import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDismissModal } from './ConfirmDismissModal';

describe('ConfirmDismissModal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(
      <ConfirmDismissModal
        open={false}
        notificationTitle="Fuga grave"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra el título y mensaje de confirmación cuando está abierto', () => {
    render(
      <ConfirmDismissModal
        open
        notificationTitle="Fuga grave"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Confirmar descarte')).toBeInTheDocument();
    expect(screen.getByText('Fuga grave')).toBeInTheDocument();
    expect(
      screen.getByText(/¿Está seguro de que desea descartarla/)
    ).toBeInTheDocument();
  });

  it('llama onCancel al hacer clic en Cancelar', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDismissModal
        open
        notificationTitle="Fuga grave"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('llama onConfirm al hacer clic en Descartar alerta', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDismissModal
        open
        notificationTitle="Fuga grave"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Descartar alerta'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deshabilita botones cuando isLoading es true', () => {
    render(
      <ConfirmDismissModal
        open
        notificationTitle="Fuga grave"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isLoading
      />
    );

    expect(screen.getByText('Descartando...')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});
