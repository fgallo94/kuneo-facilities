import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UrgentAlertBanner } from './UrgentAlertBanner';
import type { UserNotification } from '@/types';

describe('UrgentAlertBanner', () => {
  const alerts: UserNotification[] = [
    {
      id: 'u1',
      notificationId: 'u1',
      type: 'new_incidence',
      title: 'Nueva incidencia: Fuga grave',
      message: 'Fuga grave en azotea',
      incidenceId: 'inc1',
      urgency: 'urgent',
      read: false,
      dismissed: false,
      createdAt: { seconds: 1, nanoseconds: 0 } as unknown as UserNotification['createdAt'],
    },
  ];

  it('renderiza alertas urgentes', () => {
    render(<UrgentAlertBanner alerts={alerts} onDismiss={vi.fn()} />);

    expect(screen.getByText('Nueva incidencia: Fuga grave')).toBeInTheDocument();
    expect(screen.getByText('Fuga grave en azotea')).toBeInTheDocument();
  });

  it('no renderiza nada si no hay alertas', () => {
    const { container } = render(<UrgentAlertBanner alerts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('llama onDismiss al hacer clic en la X', () => {
    const onDismiss = vi.fn();
    render(<UrgentAlertBanner alerts={alerts} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText('Descartar alerta urgente'));
    expect(onDismiss).toHaveBeenCalledWith('u1');
  });
});
