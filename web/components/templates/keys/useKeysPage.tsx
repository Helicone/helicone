import { useHeliconeKeys } from "../../../services/hooks/helicone-keys";
import { useGetKeys } from "../../../services/hooks/keys";

const useKeysPage = () => {
  const {
    count,
    isLoading: isKeysLoading,
    keys,
    refetch: refetchKeys,
  } = useGetKeys();

  const {
    keys: heliconeKeys,
    isLoading: isHeliconeKeysLoading,
    refetch: refetchHeliconeKeys,
  } = useHeliconeKeys();

  const isLoading = isKeysLoading || isHeliconeKeysLoading;

  return {
    count,
    isLoading,
    keys,
    refetchKeys,
    heliconeKeys,
    refetchHeliconeKeys,
  };
};

export { useKeysPage };
