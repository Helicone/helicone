import { useHeliconeKeys } from "../../../services/hooks/helicone-keys";

const useKeysPage = () => {
  const {
    keys: heliconeKeys,
    isLoading: isHeliconeKeysLoading,
    refetch: refetchHeliconeKeys,
  } = useHeliconeKeys();

  const isLoading = isHeliconeKeysLoading;

  return {
    isLoading,

    heliconeKeys,
    refetchHeliconeKeys,
  };
};

export { useKeysPage };
