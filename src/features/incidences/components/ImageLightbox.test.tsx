import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageLightbox } from './ImageLightbox';

describe('ImageLightbox', () => {
  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(
      <ImageLightbox src="https://example.com/photo.jpg" open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra la imagen cuando está abierto', () => {
    render(<ImageLightbox src="https://example.com/photo.jpg" open onClose={vi.fn()} />);
    expect(screen.getByAltText('Imagen')).toBeInTheDocument();
  });

  it('llama a onClose al hacer clic en el overlay', () => {
    const onClose = vi.fn();
    render(<ImageLightbox src="https://example.com/photo.jpg" open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al presionar Escape', () => {
    const onClose = vi.fn();
    render(<ImageLightbox src="https://example.com/photo.jpg" open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
