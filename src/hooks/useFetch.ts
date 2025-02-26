import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, poster } from '@/services/apiService';

// Custom Hook for GET requests
export const useFetch = (endpoint) => {
  const { data, error, isLoading } = useSWR(endpoint, fetcher);

  return { data, error, isLoading };
};

// Custom Hook for POST requests
export const usePost = (key, apiFunction) => {
  const { trigger, data, error, isMutating } = useSWRMutation(key, (_, { arg }) => apiFunction(arg));

  return { trigger, data, error, isMutating };
};

