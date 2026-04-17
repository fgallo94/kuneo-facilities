import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidenceCard } from './IncidenceCard';
import type { Incidence, Installation, User } from '@/types';

describe('IncidenceCard', () => {
  const incidence: Incidence = {
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
  };

  const installation: Installation = {
    id: 'inst_1',
    groupId: 'group_1',
    name: 'Casa azul',
    address: 'Calle 123',
  };

  const reporter: User = {
    uid: 'user_1',
    email: 'reporter@test.com',
    displayName: 'Juan Pérez',
    role: 'user',
  };

  it('renderiza título, ubicación y reportante', () => {
    render(<IncidenceCard incidence={incidence} installation={installation} reporter={reporter} />);

    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.getByText('Casa azul • Calle 123')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('usa email como fallback si no hay displayName', () => {
    render(
      <IncidenceCard
        incidence={incidence}
        installation={installation}
        reporter={{ ...reporter, displayName: null }}
      />
    );
    expect(screen.getByText('reporter@test.com')).toBeInTheDocument();
  });

  it('muestra urgente cuando severity es 5', () => {
    render(
      <IncidenceCard incidence={{ ...incidence, severity: 5 }} installation={installation} reporter={reporter} />
    );
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('llama onClick al hacer clic', () => {
    const onClick = vi.fn();
    render(<IncidenceCard incidence={incidence} installation={installation} reporter={reporter} onClick={onClick} />);

    fireEvent.click(screen.getByText('Fuga en baño'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
