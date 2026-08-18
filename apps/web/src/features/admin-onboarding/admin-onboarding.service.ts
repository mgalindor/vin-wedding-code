import {
  type OnboardWeddingPlannerDto,
  type OnboardWeddingPlannerResponseDto,
} from '@wendy/contracts';

import { useApiClient } from '@/shared/api-client';

export function useAdminOnboardingService() {
  const api = useApiClient();

  return {
    onboardWeddingPlanner(dto: OnboardWeddingPlannerDto) {
      return api.post<OnboardWeddingPlannerResponseDto>(
        '/wedding-planners',
        dto,
      );
    },
  };
}