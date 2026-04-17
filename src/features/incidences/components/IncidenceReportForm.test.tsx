import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IncidenceReportForm } from './IncidenceReportForm';

// Mock useMediaQuery to always render desktop layout
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}));

// Mock useProperties to return test properties without touching Firestore
vi.mock('@/features/incidences/hooks/useProperties', () => ({
  useProperties: vi.fn(),
}));

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useProperties } from '@/features/incidences/hooks/useProperties';

const mockedUseMediaQuery = vi.mocked(useMediaQuery);
const mockedUseProperties = vi.mocked(useProperties);

describe('IncidenceReportForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    mockedUseMediaQuery.mockReturnValue(true);
    mockedUseProperties.mockReturnValue({
      properties: [
        { id: 'prop_01', installationId: 'inst_01', name: 'Piso 4A' },
        { id: 'prop_02', installationId: 'inst_02', name: 'Local 1B' },
      ],
      loading: false,
      error: null,
    });
  });

  it('renders all form fields and sidebar info', () => {
    render(<IncidenceReportForm onSubmit={onSubmit} />);

    expect(
      screen.getByRole('heading', { name: /reportar incidencia/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/título de la incidencia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/propiedad/i)).toBeInTheDocument();
    expect(screen.getByText(/nivel de urgencia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción detallada/i)).toBeInTheDocument();
    expect(screen.getByText(/guía de reporte/i)).toBeInTheDocument();
  });

  it('shows "No hay incidencias abiertas" when there are no open incidences', () => {
    render(<IncidenceReportForm onSubmit={onSubmit} openIncidences={[]} />);
    expect(screen.getByText('No hay incidencias abiertas')).toBeInTheDocument();
  });

  it('shows loading text while open incidences are loading', () => {
    render(
      <IncidenceReportForm onSubmit={onSubmit} openIncidencesLoading={true} />
    );
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders open incidences list in the sidebar', () => {
    const incidences = [
      {
        id: 'inc_1',
        title: 'Fuga en baño',
        status: 'Reportada',
        createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 },
      },
      {
        id: 'inc_2',
        title: 'Luz parpadeante',
        status: 'En reparación',
        createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 },
      },
    ] as import('@/types').Incidence[];

    render(<IncidenceReportForm onSubmit={onSubmit} openIncidences={incidences} />);

    expect(screen.getByText('Fuga en baño')).toBeInTheDocument();
    expect(screen.getByText('Reportada • hace 1 día')).toBeInTheDocument();
    expect(screen.getByText('Luz parpadeante')).toBeInTheDocument();
    expect(screen.getByText(/En reparación • hace/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<IncidenceReportForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/el título debe tener al menos 3 caracteres/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/selecciona una categoría válida/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/selecciona una propiedad/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/la descripción debe tener al menos 10 caracteres/i)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data with installationId', async () => {
    render(<IncidenceReportForm onSubmit={onSubmit} />);

    fireEvent.input(screen.getByLabelText(/título de la incidencia/i), {
      target: { value: 'Fuga de agua' },
    });

    fireEvent.change(screen.getByLabelText(/categoría/i), {
      target: { value: 'plumbing' },
    });

    fireEvent.change(screen.getByLabelText(/propiedad/i), {
      target: { value: 'prop_01' },
    });

    fireEvent.input(screen.getByLabelText(/descripción detallada/i), {
      target: {
        value:
          'Hay una fuga de agua importante bajo el fregadero de la cocina.',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.title).toBe('Fuga de agua');
    expect(submitted.category).toBe('plumbing');
    expect(submitted.propertyId).toBe('prop_01');
    expect(submitted.installationId).toBe('inst_01');
    expect(submitted.urgency).toBe('normal');
    expect(submitted.description).toContain('fregadero');
    expect(submitted.photos).toEqual([]);
  });

  it('changes urgency when clicking urgency buttons', async () => {
    render(<IncidenceReportForm onSubmit={onSubmit} />);

    const urgentBtn = screen.getByRole('button', { name: /^urgente$/i });
    fireEvent.click(urgentBtn);

    fireEvent.input(screen.getByLabelText(/título de la incidencia/i), {
      target: { value: 'Fuga de agua' },
    });
    fireEvent.change(screen.getByLabelText(/categoría/i), {
      target: { value: 'plumbing' },
    });
    fireEvent.change(screen.getByLabelText(/propiedad/i), {
      target: { value: 'prop_02' },
    });
    fireEvent.input(screen.getByLabelText(/descripción detallada/i), {
      target: { value: 'Descripción larga suficiente para pasar validación.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0][0].urgency).toBe('urgent');
    expect(onSubmit.mock.calls[0][0].installationId).toBe('inst_02');
  });

  it('shows loading state when isLoading is true', () => {
    render(<IncidenceReportForm onSubmit={onSubmit} isLoading={true} />);

    const submitBtn = screen.getByRole('button', { name: /enviar reporte/i });
    expect(submitBtn).toBeDisabled();
  });
});
