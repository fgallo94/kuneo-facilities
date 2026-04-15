import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoUploader } from './PhotoUploader';

// Mock useMediaQuery
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}));

import { useMediaQuery } from '@/hooks/useMediaQuery';

const mockedUseMediaQuery = vi.mocked(useMediaQuery);

describe('PhotoUploader', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
    mockedUseMediaQuery.mockClear();
  });

  it('renders desktop drag & drop area when isDesktop is true', () => {
    mockedUseMediaQuery.mockReturnValue(true);
    render(<PhotoUploader photos={[]} onChange={onChange} />);

    expect(
      screen.getByText('Sube fotos de la incidencia')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /seleccionar archivos/i })
    ).toBeInTheDocument();
  });

  it('renders mobile camera buttons when isDesktop is false', () => {
    mockedUseMediaQuery.mockReturnValue(false);
    render(<PhotoUploader photos={[]} onChange={onChange} />);

    expect(
      screen.getByText('Capturar evidencia')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cámara/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /archivos/i })
    ).toBeInTheDocument();
  });

  it('calls onChange when files are selected via input', async () => {
    mockedUseMediaQuery.mockReturnValue(true);
    render(<PhotoUploader photos={[]} onChange={onChange} />);

    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([file]);
    });
  });

  it('shows previews and allows removing a photo', () => {
    mockedUseMediaQuery.mockReturnValue(true);
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    render(<PhotoUploader photos={[file]} onChange={onChange} />);

    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Eliminar foto 1');
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('respects maxPhotos limit', async () => {
    mockedUseMediaQuery.mockReturnValue(true);
    render(<PhotoUploader photos={[]} onChange={onChange} maxPhotos={2} />);

    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.png', { type: 'image/png' });
    const file3 = new File(['c'], 'c.png', { type: 'image/png' });

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [file1, file2, file3] },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([file1, file2]);
    });
  });

  it('displays error message when provided', () => {
    mockedUseMediaQuery.mockReturnValue(true);
    render(
      <PhotoUploader photos={[]} onChange={onChange} error="Máximo excedido" />
    );

    expect(screen.getByText('Máximo excedido')).toBeInTheDocument();
  });
});
