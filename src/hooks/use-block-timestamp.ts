import { useQuery } from '@tanstack/react-query';
import { fetchBlockTimestamp, isBlockchainConfigured } from '@/lib/blockchain';

export function useBlockTimestamp(): number | undefined {
  const { data } = useQuery({
    queryKey: ['block-timestamp'],
    queryFn: fetchBlockTimestamp,
    enabled: isBlockchainConfigured(),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
  return data;
}
