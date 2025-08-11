import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import moment from 'moment';
import handleAPICall from '@/utils/HandleApiCall';

const fetchUtsavs = async ({ pageParam = 1, cardno }: { pageParam?: number; cardno: string }) => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/utsav/upcoming',
      {
        cardno,
        page: pageParam,
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
    queryKey: ['utsavs', user.cardno],
    queryFn: () => fetchUtsavs({ pageParam: 1, cardno: user.cardno }),
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!user.cardno,
  });

  const isUtsavDate = useCallback(
    (selectedDate: string) => {
      if (!utsavData || !selectedDate) return false;

      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

      return utsavData.some((monthData: any) =>
        monthData.data.some((utsav: any) =>
          moment(formattedDate).isBetween(
            moment(utsav.utsav_start, 'YYYY-MM-DD'),
            moment(utsav.utsav_end, 'YYYY-MM-DD'),
            undefined,
            '[]'
          )
        )
      );
    },
    [utsavData]
  );

  return { isUtsavDate, utsavData };
};
