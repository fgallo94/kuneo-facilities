import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCommentCreated } from './onCommentCreated';

const mockSetDoc = vi.fn(() => Promise.resolve());
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatch = vi.fn(() => ({ set: mockBatchSet, commit: mockBatchCommit }));
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockWhere = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockSendEachForMulticast = vi.fn();
const mockGetMessaging = vi.fn(() => ({ sendEachForMulticast: mockSendEachForMulticast }));
const mockGetFirestore = vi.fn(() => ({ collection: mockCollection, doc: mockDoc, batch: mockBatch }));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    arrayRemove: (...tokens: string[]) => tokens,
  },
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: () => mockGetMessaging(),
}));

function createMockEvent(
  commentData: Record<string, unknown> | undefined,
  incidenceId: string,
  commentId: string
): {
  data?: { data: () => Record<string, unknown> | undefined };
  params: { incidenceId: string; commentId: string };
} {
  return {
    data: commentData
      ? {
          data: () => commentData,
        }
      : undefined,
    params: { incidenceId, commentId },
  };
}

describe('handleCommentCreated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
    mockSendEachForMulticast.mockResolvedValue({ failureCount: 0, responses: [] });
    mockBatchCommit.mockResolvedValue(undefined);
    mockDoc.mockImplementation((...args: string[]) => ({
      id: 'generated_id',
      path: args.join('/'),
      get: mockGet,
      collection: () => ({ doc: mockDoc }),
      set: mockSetDoc,
    }));
    mockCollection.mockImplementation((path: string) => {
      if (path === 'users') {
        return { where: mockWhere, doc: mockDoc };
      }
      return { doc: mockDoc };
    });
  });

  it('no procesa si no hay snapshot', async () => {
    await handleCommentCreated({ data: undefined, params: { incidenceId: 'inc1', commentId: 'c1' } });
    expect(mockGetFirestore).not.toHaveBeenCalled();
  });

  it('notifica a admins cuando el reportador comenta', async () => {
    const fakeAdminDoc = {
      id: 'admin_1',
      data: () => ({ fcmTokens: ['token_a'] }),
      ref: { update: mockUpdate },
    };

    mockWhere.mockReturnValue({ get: mockGet });
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ title: 'Fuga', reportedBy: 'user_1', urgency: 'normal' }) })
      .mockResolvedValueOnce({ empty: false, docs: [fakeAdminDoc] })
      .mockResolvedValueOnce({ data: () => ({ fcmTokens: ['token_1'] }) });

    await handleCommentCreated(
      createMockEvent(
        { authorId: 'user_1', authorName: 'Juan', text: 'Sigue goteando', createdAt: 'SERVER_TIMESTAMP' },
        'inc_1',
        'c1'
      )
    );

    expect(mockBatchSet).toHaveBeenCalled();
    const setCall = mockBatchSet.mock.calls[0];
    expect(setCall[1]).toMatchObject({
      type: 'comment',
      title: expect.stringContaining('Nuevo comentario'),
      message: expect.stringContaining('Juan'),
    });
  });

  it('notifica al reportador cuando un admin comenta', async () => {
    mockWhere.mockReturnValue({ get: mockGet });
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ title: 'Fuga', reportedBy: 'user_1', urgency: 'normal' }) })
      .mockResolvedValueOnce({ data: () => ({ fcmTokens: ['token_1'] }) });

    await handleCommentCreated(
      createMockEvent(
        { authorId: 'admin_1', authorName: 'Admin', text: 'Ya vamos a revisar', createdAt: 'SERVER_TIMESTAMP' },
        'inc_1',
        'c1'
      )
    );

    expect(mockSetDoc).toHaveBeenCalled();
    const setCall = mockSetDoc.mock.calls[0];
    expect(setCall[0]).toMatchObject({
      type: 'comment',
      title: expect.stringContaining('Nuevo comentario en tu incidencia'),
    });
  });
});
