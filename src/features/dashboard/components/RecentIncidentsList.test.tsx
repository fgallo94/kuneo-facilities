import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentIncidentsList } from './RecentIncidentsList';
import type { Incidence, Property } from '@/types';

describe('RecentIncidentsList', () => {
  const properties: Property[] = [
    { id: 'prop_1', installationId: 'inst_1', name: 'Casa azul' },
    { id: 'prop_2', installationId: 'inst_2', name: 'Piso 4B' },
  ];

  const incidences: Incidence[] = [
    {
      id: 'inc_1',
      title: 'Fuga en baño',
      category: 'plumbing',
      propertyId: 'prop_1',
      installationId: 'inst_1',
      reportedBy: 'user_1',
      description: 'desc',
      imageUrls: [],
      status: 'Reportada',
      severity: 1,
      billTo: 'Propietario',
      createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
    },
    {
      id: 'inc_2',
      title: 'Luz parpadeante',
      category: 'electrical',
      propertyId: 'prop_2',
      installationId: 'inst_2',
      reportedBy: 'user_1',
      description: 'desc',
      imageUrls: [],
      status: 'En reparación',
      severity: 3,
      billTo: 'Propietario',
      createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
    },
  ];

  it('muestra estado de carga', () => {
    render(<RecentIncidentsList incidences={[]} properties={[]} loading={true} />);
    expect(screen.getByText('Cargando incidencias...')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay incidencias', () => {
    render(<RecentIncidentsList incidences={[]} properties={[]} loading={false} />);
    expect(screen.getByText('No hay incidencias recientes')).toBeInTheDocument();
  });

  it('renderiza incidencias con propiedad y estado', () => {
    render(<RecentIncidentsList incidences={incidences} properties={properties} loading={false} />);

    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Casa azul'))).toBeInTheDocument();
    expect(screen.getByText('Reportada')).toBeInTheDocument();

    expect(screen.getByText('Luz parpadeante')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Piso 4B'))).toBeInTheDocument();
    expect(screen.getByText('En reparación')).toBeInTheDocument();

    // Tipo de categoría
    expect(screen.getByText('Plomería')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
  });
});
