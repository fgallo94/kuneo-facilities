import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from './useNotifications';

const mockOnSnapshot = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
  getClientAuth: () => ({ currentUser: { uid: 'admin_1' } }),
}));

describe('useNotifications', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock = vi.fn();
    mockWhere.mockImplementation((...args) => ['where', args]);
    mockOrderBy.mockImplementation((...args) => ['orderBy', args]);
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve notificaciones en tiempo real y separa urgentes', async () => {
    const fakeDocs = [
      {
        id: 'notif_1',
        data: () => ({
          notificationId: 'notif_1',
          type: 'new_incidence',
          title: 'Nueva incidencia: Fuga',
          message: 'Hay una fuga',
          incidenceId: 'inc_1',
          urgency: 'urgent',
          read: false,
          dismissed: false,
          createdAt: { seconds: 1, nanoseconds: 0 },
        }),
      },
      {
        id: 'notif_2',
        data: () => ({
          notificationId: 'notif_2',
          type: 'new_incidence',
          title: 'Nueva incidencia: Luz',
          message: 'Problema de luz',
          incidenceId: 'inc_2',
          urgency: 'normal',
          read: true,
          dismissed: false,
          createdAt: { seconds: 2, nanoseconds: 0 },
        }),
      },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({
        forEach: (cb: (doc: typeof fakeDocs[0]) => void) => fakeDocs.forEach(cb),
      });
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useNotifications('admin_1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.urgentAlerts).toHaveLength(1);
    expect(result.current.urgentAlerts[0].id).toBe('notif_1');
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('llama a unsubscribe al desmontar', () => {
    mockOnSnapshot.mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useNotifications('admin_1'));
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('no suscribe si no hay userId', () => {
    renderHook(() => useNotifications(undefined));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('markAsRead actualiza el documento', async () => {
    mockOnSnapshot.mockReturnValue(unsubscribeMock);
    mockDoc.mockReturnValue('docRef');

    const { result } = renderHook(() => useNotifications('admin_1'));
    await result.current.markAsRead('notif_1');

    expect(mockDoc).toHaveBeenCalledWith({}, 'userNotifications', 'admin_1', 'inbox', 'notif_1');
    expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { read: true });
  });
});
