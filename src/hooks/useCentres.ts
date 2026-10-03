import { useQuery } from '@tanstack/react-query';

import handleAPICall from '../utils/HandleApiCall';

export const fetchCentres = () =>
  new Promise<any[]>((resolve, reject) => {
    handleAPICall(
      'GET',
      '/location/centres',
      null,
      null,
      (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      () => reject(new Error('Failed to fetch centres'))
    );
  });

/** Centre list for the pickers, with the trailing "Other" option. */
export const useCentres = () => {
  const { data, isLoading }: any = useQuery({
    queryKey: ['centres'],
    queryFn: fetchCentres,
    staleTime: 1000 * 60 * 30,
  });
  const centresWithOptions = data ? [...data, { key: 'Other', value: 'Other' }] : [];
  return { centresWithOptions, isCentresLoading: isLoading };
};
