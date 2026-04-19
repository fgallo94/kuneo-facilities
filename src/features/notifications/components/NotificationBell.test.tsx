import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';
import type { UserNotification } from '@/types';

describe('NotificationBell', () => {
  const notifications: UserNotification[] = [
    {
      id: 'n1',
      notificationId: 'n1',
      type: 'new_incidence',
      title: 'Nueva incidencia: Fuga',
      message: 'Fuga en baño',
      incidenceId: 'inc1',
      urgency: 'normal',
      read: false,
      dismissed: false,
      createdAt: { seconds: 1, nanoseconds: 0 } as unknown as UserNotification['createdAt'],
    },
    {
      id: 'n2',
      notificationId: 'n2',
      type: 'new_incidence',
      title: 'Nueva incidencia: Luz',
      message: 'Luz fallando',
      incidenceId: 'inc2',
      urgency: 'urgent',
      read: true,
      dismissed: false,
      createdAt: { seconds: 2, nanoseconds: 0 } as unknown as UserNotification['createdAt'],
    },
  ];

  it('muestra el badge con el conteo de no leídas', () => {
    render(
      <NotificationBell
        notifications={notifications}
        unreadCount={1}
        onMarkAsRead={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('abre y cierra el dropdown al hacer clic en la campana', () => {
    render(
      <NotificationBell
        notifications={notifications}
        unreadCount={1}
        onMarkAsRead={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);

    expect(screen.getByText('Nueva incidencia: Fuga')).toBeInTheDocument();
    expect(screen.getByText('Nueva incidencia: Luz')).toBeInTheDocument();

    fireEvent.click(bell);
    expect(screen.queryByText('Nueva incidencia: Fuga')).not.toBeInTheDocument();
  });

  it('marca como leída al hacer clic en una notificación no leída', () => {
    const onMarkAsRead = vi.fn();
    render(
      <NotificationBell
        notifications={notifications}
        unreadCount={1}
        onMarkAsRead={onMarkAsRead}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Notificaciones'));
    fireEvent.click(screen.getByText('Nueva incidencia: Fuga'));

    expect(onMarkAsRead).toHaveBeenCalledWith('n1');
  });

  it('llama onDismiss al hacer clic en la X', () => {
    const onDismiss = vi.fn();
    render(
      <NotificationBell
        notifications={notifications}
        unreadCount={1}
        onMarkAsRead={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText('Notificaciones'));
    const dismissButtons = screen.getAllByLabelText('Descartar');
    fireEvent.click(dismissButtons[0]);

    expect(onDismiss).toHaveBeenCalledWith('n1', 'normal');
  });

  it('muestra estado vacío cuando no hay notificaciones', () => {
    render(
      <NotificationBell
        notifications={[]}
        unreadCount={0}
        onMarkAsRead={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Notificaciones'));
    expect(screen.getByText('No hay notificaciones pendientes')).toBeInTheDocument();
  });
});
