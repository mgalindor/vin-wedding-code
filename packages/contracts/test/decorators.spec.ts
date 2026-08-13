// Decorator pipeline sanity test (ARC-005 Rule 15). Locks in the
// experimentalDecorators + emitDecoratorMetadata flags before Sprint 2 DTOs.
// If the decorator pipeline is broken, the validation tests below fail;
// if it's wired, they pass.

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

class SampleDto {
  @IsString()
  name!: string;
}

describe('@wendy/contracts — decorator pipeline (ARC-005 Rule 15)', () => {
  it('validates a well-formed DTO', () => {
    const instance = plainToInstance(SampleDto, { name: 'Wendy' });
    const errors = validateSync(instance);
    expect(errors).toHaveLength(0);
  });

  it('reports an error when a required field is missing', () => {
    const instance = plainToInstance(SampleDto, { name: undefined });
    const errors = validateSync(instance);
    expect(errors[0]?.property).toBe('name');
  });

  it('reports an error when a field has the wrong type', () => {
    const instance = plainToInstance(SampleDto, { name: 123 });
    const errors = validateSync(instance);
    expect(errors[0]?.property).toBe('name');
  });
});