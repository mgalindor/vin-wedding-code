/**
 * TC-501b (unit / DTO): ListWeddingsQueryDto string→number coercion — US-011.
 *
 * Guards the regression where `?limit=50&offset=0` (strings as they
 * arrive on the query string) was rejected with "must be an integer"
 * because `@IsInt()` runs BEFORE the global ValidationPipe's
 * `transform: true` and the field lacked a `@Type(() => Number)`
 * decorator — class-transformer will not coerce string → number
 * automatically when a `@Min` / `@Max` validator is present.
 *
 * The test exercises the DTO through `plainToInstance` +
 * `validate` (the same path class-validator uses inside the
 * NestJS ValidationPipe). It does NOT need Docker / Postgres.
 */
import 'reflect-metadata';

import { ListWeddingsQueryDto } from '@wendy/contracts';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

async function fromQuery(input: Record<string, unknown>): Promise<{
  dto: ListWeddingsQueryDto;
  errors: import('class-validator').ValidationError[];
}> {
  // `plainToInstance` mimics what NestJS's ValidationPipe does
  // internally: instantiate the class, then run class-transformer's
  // conversion (now that @Type(...) is present) before class-validator
  // runs.
  const dto = plainToInstance(ListWeddingsQueryDto, input);
  const errors = await validate(dto as object);
  return { dto, errors };
}

describe('TC-501b: ListWeddingsQueryDto string→number coercion', () => {
  it('accepts numeric strings for limit / offset (the regression case)', async () => {
    const { dto, errors } = await fromQuery({
      search: 'sof',
      status: 'active',
      sort: 'date',
      limit: '50',
      offset: '0',
    });

    expect(errors).toHaveLength(0);
    expect(typeof dto.limit).toBe('number');
    expect(typeof dto.offset).toBe('number');
    expect(dto.limit).toBe(50);
    expect(dto.offset).toBe(0);
  });

  it('accepts a missing limit / offset (controller defaults)', async () => {
    const { errors } = await fromQuery({
      search: '',
      status: 'all',
      sort: 'date',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a limit > 100 even as a string', async () => {
    const { errors } = await fromQuery({ limit: '500' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('limit');
    // class-validator stores the `@Max(100)` message under the
    // constraint key 'max'; verify the message text instead of the
    // key so the test survives renames of the decorator's name().
    expect(errors[0]?.constraints?.max).toBe('limit must be at most 100');
  });

  it('rejects a limit < 1 even as a string', async () => {
    const { errors } = await fromQuery({ limit: '0' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('limit');
  });

  it('rejects a negative offset even as a string', async () => {
    const { errors } = await fromQuery({ offset: '-1' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('offset');
  });

  it('rejects a non-numeric limit (string that does not parse to a number)', async () => {
    const { errors } = await fromQuery({ limit: 'abc' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('limit');
    // `Number('abc')` → `NaN`; `@Min(1)` fails with the range
    // message (no `@IsNumber` decorator here, so "must be integer"
    // surfaces through the range constraint instead).
  });

  it('rejects a fractional limit', async () => {
    const { errors } = await fromQuery({ limit: '1.5' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('limit');
    // `Number('1.5')` → 1.5; `@IsInt` rejects it.
  });
});
