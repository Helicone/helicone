import { useHeliconeKeys } from "../../../services/hooks/helicone-keys";

const useKeysPage = () => {
  const {
    keys: heliconeKeys,
    isLoading: isHeliconeKeysLoading,
    refetch: refetchHeliconeKeys,
  } = useHeliconeKeys();

  const isLoading = isHeliconeKeysLoading;
  heliconeKeys?.data?.sort((a, b) => {
    const aDate = new Date(a.created_at);
    const bDate = new Date(b.created_at);

    if (aDate > bDate) {
      return 1;
    } else if (bDate > aDate) {
      return -1;
    } else {
      return 0;
    }
  });

  return {
    isLoading,
    heliconeKeys,
    refetchHeliconeKeys,
  };
};

export { useKeysPage };
