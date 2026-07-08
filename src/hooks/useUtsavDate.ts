import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useCallback } from 'react';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores';

const fetchUtsavs = ({ cardno }: { cardno: string }): Promise<any[]> =>
  apiClient
    .get<{ data: any[] }>('/travel/events', { params: { cardno }, allowToast: false })
    .then((res) => (Array.isArray(res.data) ? res.data : []));

export const useUtsavDate = () => {
  const user = useAuthStore((state) => state.user);

  const { data: utsavData } = useQuery({
    queryKey: ['travel-events', user.cardno],
    queryFn: () => fetchUtsavs({ cardno: user.cardno }),
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!user.cardno,
  });

  const isUtsavDate = useCallback(
    (selectedDate: string) => {
      if (!utsavData || !selectedDate) return false;

      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

      return utsavData.some((utsav: any) =>
        moment(formattedDate).isBetween(
          moment(utsav.start_date, 'YYYY-MM-DD'),
          moment(utsav.end_date, 'YYYY-MM-DD'),
          undefined,
          '[]'
        )
      );
    },
    [utsavData]
  );

  return { isUtsavDate, utsavData };
};
