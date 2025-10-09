import { GetUserUsagesRequest } from '../@types/api-publication';
import useAdminApi from './useAdminApi';

const useUserUsagesForAdmin = (params: GetUserUsagesRequest) => {
  const { listUserUsages } = useAdminApi();

  const { data, isLoading, mutate } = listUserUsages(params);

  return {
    userUsages: data,
    isLoading,
    mutate,
  };
};

export default useUserUsagesForAdmin;
