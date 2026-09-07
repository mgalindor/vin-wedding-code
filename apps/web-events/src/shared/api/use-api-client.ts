import { useMemo } from 'react';

import { ApiClient } from './client';

/**
 * React-friendly handle to the singleton {@link ApiClient}. The class
 * itself reads the persisted access token at call time so consumers
 * don't have to wire it through props; this hook is here for parity
 * with the blueprint and to keep call sites uniform with React Query.
 *
 * The returned instance is referentially stable across renders so it's
 * safe to depend on inside `useEffect` deps arrays and `queryKey`s.
 */
export function useApiClient(): ApiClient {
  return useMemo(() => new ApiClient(), []);
}
