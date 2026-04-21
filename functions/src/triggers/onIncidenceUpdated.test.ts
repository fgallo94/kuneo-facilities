import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleIncidenceUpdated } from './onIncidenceUpdated';

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
  beforeData: Record<string, unknown> | undefined,
  afterData: Record<string, unknown> | undefined,
  incidenceId: string
): {
  data?: {
    before: { data: () => Record<string, unknown> | undefined };
    after: { data: () => Record<string, unknown> | undefined };
  };
  params: { incidenceId: string };
} {
  return {
    data:
      beforeData && afterData
        ? {
            before: { data: () => beforeData },
            after: { data: () => afterData },
          }
        : undefined,
    params: { incidenceId },
  };
}

describe('handleIncidenceUpdated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEachForMulticast.mockResolvedValue({ failureCount: 0, responses: [] });
    mockBatchCommit.mockResolvedValue(undefined);
    mockDoc.mockImplementation((...args: string[]) => ({
      id: 'generated_id',
      path: args.join('/'),
      collection: () => ({ doc: mockDoc }),
      set: mockSetDoc,
      get: async () => Promise.resolve({ data: () => ({ fcmTokens: ['token_1'] }) }),
    }));
    mockCollection.mockImplementation((path: string) => {
      if (path === 'users') {
        return { where: mockWhere, doc: mockDoc };
      }
      return { doc: mockDoc };
    });
  });

  it('no procesa si no hay change data', async () => {
    await handleIncidenceUpdated({ data: undefined, params: { incidenceId: 'inc1' } });
    expect(mockGetFirestore).not.toHaveBeenCalled();
  });

  it('notifica conformity_request cuando admin pasa En reparación → Reparado', async () => {
    const fakeUserDoc = {
      id: 'user_1',
      data: () => ({ fcmTokens: ['token_1'] }),
      ref: { update: mockUpdate },
    };

    mockWhere.mockReturnValue({ get: mockGet });
    mockGet.mockResolvedValue({ empty: false, docs: [fakeUserDoc] });

    await handleIncidenceUpdated(
      createMockEvent(
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'En reparación',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
        },
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'Reparado',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          updatedBy: 'admin_1',
        },
        'inc_1'
      )
    );

    expect(mockSetDoc).toHaveBeenCalled();
    const setCall = mockSetDoc.mock.calls[0];
    expect(setCall[0]).toMatchObject({
      type: 'conformity_request',
      title: expect.stringContaining('Reparación completada'),
    });
  });

  it('notifica status_change al usuario cuando admin cambia otro estado', async () => {
    const fakeUserDoc = {
      id: 'user_1',
      data: () => ({ fcmTokens: ['token_1'] }),
      ref: { update: mockUpdate },
    };

    mockWhere.mockReturnValue({ get: mockGet });
    mockGet.mockResolvedValue({ empty: false, docs: [fakeUserDoc] });

    await handleIncidenceUpdated(
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
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'En reparación',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          updatedBy: 'admin_1',
        },
        'inc_1'
      )
    );

    expect(mockSetDoc).toHaveBeenCalled();
    const setCall = mockSetDoc.mock.calls[0];
    expect(setCall[0]).toMatchObject({
      type: 'status_change',
      message: expect.stringContaining('Reportada'),
    });
  });

  it('notifica conformity_accepted a admins cuando usuario acepta', async () => {
    const fakeAdminDoc = {
      id: 'admin_1',
      data: () => ({ fcmTokens: ['token_a'] }),
      ref: { update: mockUpdate },
    };

    mockWhere.mockReturnValue({ get: mockGet });
    mockGet.mockResolvedValue({ empty: false, docs: [fakeAdminDoc] });

    await handleIncidenceUpdated(
      createMockEvent(
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'Reparado',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          conformityStatus: 'pending',
        },
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'A facturar',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          conformityStatus: 'accepted',
          updatedBy: 'user_1',
        },
        'inc_1'
      )
    );

    expect(mockBatchSet).toHaveBeenCalled();
    const setCall = mockBatchSet.mock.calls[0];
    expect(setCall[1]).toMatchObject({
      type: 'conformity_accepted',
      title: expect.stringContaining('Conformidad aceptada'),
    });
  });

  it('notifica conformity_rejected a admins cuando usuario rechaza', async () => {
    const fakeAdminDoc = {
      id: 'admin_1',
      data: () => ({ fcmTokens: ['token_a'] }),
      ref: { update: mockUpdate },
    };

    mockWhere.mockReturnValue({ get: mockGet });
    mockGet.mockResolvedValue({ empty: false, docs: [fakeAdminDoc] });

    await handleIncidenceUpdated(
      createMockEvent(
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'Reparado',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          conformityStatus: 'pending',
        },
        {
          title: 'Fuga',
          description: 'Fuga',
          reportedBy: 'user_1',
          urgency: 'normal',
          propertyId: 'prop_1',
          installationId: 'inst_1',
          category: 'plumbing',
          status: 'En reparación',
          severity: 2,
          billTo: 'Propietario',
          imageUrls: [],
          conformityStatus: 'rejected',
          conformityReason: 'No quedó bien',
          updatedBy: 'user_1',
        },
        'inc_1'
      )
    );

    expect(mockBatchSet).toHaveBeenCalled();
    const setCall = mockBatchSet.mock.calls[0];
    expect(setCall[1]).toMatchObject({
      type: 'conformity_rejected',
      message: expect.stringContaining('No quedó bien'),
    });
  });
});
