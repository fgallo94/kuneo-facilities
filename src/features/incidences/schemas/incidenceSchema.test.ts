import { describe, it, expect } from 'vitest';
import { incidenceSchema } from './incidenceSchema';

describe('incidenceSchema', () => {
  it('returns category error for empty string', () => {
    const result = incidenceSchema.safeParse({
      title: '',
      category: '',
      propertyId: '',
      urgency: 'normal',
      description: '',
      photos: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const categoryError = result.error.issues.find(
        (e) => e.path[0] === 'category'
      );
      expect(categoryError).toBeDefined();
      expect(categoryError?.message).toBe('Selecciona una categoría válida');
    }
  });

  it('returns propertyId error when empty', () => {
    const result = incidenceSchema.safeParse({
      title: 'Fuga',
      category: 'plumbing',
      propertyId: '',
      urgency: 'normal',
      description: 'Descripción suficientemente larga.',
      photos: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const propertyError = result.error.issues.find(
        (e) => e.path[0] === 'propertyId'
      );
      expect(propertyError).toBeDefined();
      expect(propertyError?.message).toBe('Selecciona una propiedad');
    }
  });

  it('passes with a valid payload', () => {
    const result = incidenceSchema.safeParse({
      title: 'Fuga',
      category: 'plumbing',
      propertyId: 'prop_01',
      urgency: 'high',
      description: 'Hay una fuga de agua en la cocina.',
      photos: [],
    });

    expect(result.success).toBe(true);
  });
});
