import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidenceDirectory } from './IncidenceDirectory';

const mockOpenDetail = vi.fn();

vi.mock('@/features/dashboard/hooks/useAllIncidences', () => ({
  useAllIncidences: () => ({
    incidences: [
      {
        id: 'inc_1',
        title: 'Fuga en baño',
        category: 'plumbing',
        propertyId: 'prop_1',
        installationId: 'inst_1',
        reportedBy: 'user_1',
        description: 'Hay una fuga',
        imageUrls: [],
        status: 'Reportada',
        severity: 3,
        createdAt: { seconds: Date.now() / 1000 - 86400 },
      },
      {
        id: 'inc_2',
        title: 'Luz rota',
        category: 'electrical',
        propertyId: 'prop_2',
        installationId: 'inst_2',
        reportedBy: 'user_1',
        description: 'No hay luz',
        imageUrls: [],
        status: 'En reparación',
        severity: 5,
        createdAt: { seconds: Date.now() / 1000 },
      },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/features/admin/hooks/useGroups', () => ({
  useGroups: () => ({
    groups: [{ id: 'group_1', name: 'Grupo A' }],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/features/admin/hooks/useInstallations', () => ({
  useInstallations: () => ({
    installations: [
      { id: 'inst_1', groupId: 'group_1', name: 'Instalación 1' },
      { id: 'inst_2', groupId: 'group_1', name: 'Instalación 2' },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/features/incidences/hooks/useProperties', () => ({
  useProperties: () => ({
    properties: [
      { id: 'prop_1', installationId: 'inst_1', name: 'Propiedad 1' },
      { id: 'prop_2', installationId: 'inst_2', name: 'Propiedad 2' },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/features/incidences/context/IncidenceDetailContext', () => ({
  useIncidenceDetailContext: () => ({ openDetail: mockOpenDetail }),
}));

describe('IncidenceDirectory', () => {
  beforeEach(() => {
    mockOpenDetail.mockClear();
  });

  it('renderiza los filtros y resultados', () => {
    render(<IncidenceDirectory />);
    expect(screen.getByText('Directorio de incidencias')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.getByText('Luz rota')).toBeInTheDocument();
  });

  it('filtra por nombre', () => {
    render(<IncidenceDirectory />);
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'fuga' } });
    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.queryByText('Luz rota')).not.toBeInTheDocument();
  });

  it('filtra por estado', () => {
    render(<IncidenceDirectory />);
    const selects = screen.getAllByRole('combobox');
    // Estado es el 3er combobox (Grupo, Instalación, Propiedad, Estado...)
    // Orden en el DOM: Estado, Tipo, Grupo, Instalación, Propiedad
    const estadoSelect = selects[0]; // Estado aparece primero en el grid
    fireEvent.change(estadoSelect, { target: { value: 'En reparación' } });
    expect(screen.queryByText('Fuga en baño')).not.toBeInTheDocument();
    expect(screen.getByText('Luz rota')).toBeInTheDocument();
  });

  it('limpiar filtros restaura todos los resultados', () => {
    render(<IncidenceDirectory />);
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'fuga' } });
    expect(screen.queryByText('Luz rota')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Limpiar filtros'));
    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.getByText('Luz rota')).toBeInTheDocument();
  });
});
