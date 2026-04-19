/**
 * Test unitario de la lógica del trigger onIncidenceCreated.
 * Nota: Este test requiere un runner (jest/vitest) configurado en functions/
 * o puede ejecutarse desde el root si se resuelven las dependencias.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleIncidenceCreated } from './onIncidenceCreated';

const mocks = vi.hoisted(() => ({
  mockBatchSet: vi.fn(),
  mockBatchCommit: vi.fn(),
  mockBatch: vi.fn(),
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockWhere: vi.fn(),
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockSendEachForMulticast: vi.fn(),
  mockGetMessaging: vi.fn(),
  mockGetFirestore: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: mocks.mockGetFirestore,
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    arrayRemove: (...tokens: string[]) => tokens,
  },
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: mocks.mockGetMessaging,
}));

function createMockEvent(
  data: Record<string, unknown> | undefined,
  incidenceId: string
): {
  data?: { data: () => Record<string, unknown> | undefined };
  params: { incidenceId: string };
} {
  return {
    data: data
      ? {
          data: () => data,
        }
      : undefined,
    params: { incidenceId },
  };
}

describe('handleIncidenceCreated', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockBatch.mockReturnValue({
      set: mocks.mockBatchSet,
      commit: mocks.mockBatchCommit,
    });
    mocks.mockGetFirestore.mockReturnValue({
      batch: mocks.mockBatch,
      collection: mocks.mockCollection,
      doc: mocks.mockDoc,
    });
    mocks.mockGetMessaging.mockReturnValue({
      sendEachForMulticast: mocks.mockSendEachForMulticast,
    });
    mocks.mockDoc.mockImplementation((...args: string[]) => ({
      id: 'generated_id',
      path: args.join('/'),
    }));
  });

  it('no procesa si no hay snapshot', async () => {
    await handleIncidenceCreated(createMockEvent(undefined, 'inc1'));
    expect(mocks.mockGetFirestore).not.toHaveBeenCalled();
  });

  it('fan-out: crea notificaciones para cada admin y envía FCM', async () => {
    const fakeAdmins = [
      { id: 'admin_1', data: () => ({ fcmTokens: ['token_a', 'token_b'] }), ref: { update: mocks.mockUpdate } },
      { id: 'admin_2', data: () => ({ fcmTokens: ['token_c'] }), ref: { update: mocks.mockUpdate } },
    ];

    mocks.mockCollection.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ get: mocks.mockGet });
    mocks.mockGet.mockResolvedValue({ empty: false, docs: fakeAdmins });
    mocks.mockSendEachForMulticast.mockResolvedValue({ failureCount: 0, responses: [] });
    mocks.mockBatchCommit.mockResolvedValue(undefined);

    await handleIncidenceCreated(
      createMockEvent(
        {
          title: 'Fuga',
          description: 'Fuga grave',
          reportedBy: 'user_1',
          urgency: 'urgent',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'Reportada',
          severity: 5,
          billTo: 'Propietario',
          imageUrls: [],
        },
        'inc_1'
      )
    );

    // Debe haber creado 2 notificaciones (una por admin)
    expect(mocks.mockBatchSet).toHaveBeenCalledTimes(2);
    expect(mocks.mockBatchCommit).toHaveBeenCalled();

    // Debe haber enviado FCM a ambos admins
    expect(mocks.mockSendEachForMulticast).toHaveBeenCalledTimes(2);
  });

  it('limpia tokens inválidos cuando FCM falla con token no registrado', async () => {
    const fakeAdmins = [
      {
        id: 'admin_1',
        data: () => ({ fcmTokens: ['bad_token'] }),
        ref: { update: mocks.mockUpdate },
      },
    ];

    mocks.mockCollection.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ get: mocks.mockGet });
    mocks.mockGet.mockResolvedValue({ empty: false, docs: fakeAdmins });
    mocks.mockBatchCommit.mockResolvedValue(undefined);
    mocks.mockSendEachForMulticast.mockResolvedValue({
      failureCount: 1,
      responses: [
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      ],
    });

    await handleIncidenceCreated(
      createMockEvent(
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'Reportada',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
        },
        'inc_2'
      )
    );

    expect(mocks.mockUpdate).toHaveBeenCalledWith({
      fcmTokens: ['bad_token'],
    });
  });
});
