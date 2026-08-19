import {
  type OnboardWeddingPlannerDto,
  type OnboardWeddingPlannerResponseDto,
  type WeddingPlannerSummaryDto,
} from '@wendy/contracts';

import { useApiClient } from '@/shared/api-client';

export function useWeddingPlannersService() {
  const api = useApiClient();

  return {
    listWeddingPlanners() {
      return api.get<WeddingPlannerSummaryDto[]>('/wedding-planners');
    },
    onboardWeddingPlanner(dto: OnboardWeddingPlannerDto) {
      return api.post<OnboardWeddingPlannerResponseDto>(
        '/wedding-planners',
        dto,
      );
    },
  };
}