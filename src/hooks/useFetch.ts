import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export const useFetch = (
  key,
  fetcherFunction,
  params = {},
  options = { skip: false },
) => {
  const { skip } = options; // Now, skip is always defined

  if (skip) {
    return { data: null, error: null, isLoading: false }; // Return default values if skipped
  }
  const { data, error, isLoading } = useSWR(
    [key, params],
    ([_, queryParams]) => fetcherFunction(queryParams),
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading };
};

// Custom Hook for POST requests
export const usePost = (key, apiFunction) => {
  const { trigger, data, error, isMutating } = useSWRMutation(
    key,
    (_, { arg }) => apiFunction(arg),
  );
  return { trigger, data, error, isMutating };
};

// Custom Hook for PUT requests (Update)
export const useUpdate = (key, apiFunction) => {
  const { trigger, data, error, isMutating } = useSWRMutation(
    key,
    (_, { arg }) => apiFunction(arg),
  );
  return { trigger, data, error, isMutating };
};

// Custom Hook for DELETE requests
export const useDelete = (key, apiFunction) => {
  const { trigger, data, error, isMutating } = useSWRMutation(
    key,
    (_, { arg }) => apiFunction(arg),
  );
  return { trigger, data, error, isMutating };
};
