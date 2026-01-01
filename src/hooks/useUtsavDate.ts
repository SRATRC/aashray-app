import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';

const fetchUtsavs = async ({ cardno }: { cardno: string }): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/travel/events',
      {
        cardno,
      },
      null,
      (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      () => reject(new Error('Failed to fetch utsavs'))
    );
  });
};

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
        )
    },
    [utsavData]
  );

  return { isUtsavDate, utsavData };
};
