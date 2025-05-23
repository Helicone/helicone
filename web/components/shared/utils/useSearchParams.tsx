import {
  useSearchParams as useReactRouterSearchParams,
  useNavigate,
} from "react-router";

const useSearchParams = () => {
  const [searchParams, setSearchParams] = useReactRouterSearchParams();
  const navigate = useNavigate();

  return new SearchParams(searchParams, setSearchParams, navigate);
};

export class SearchParams {
  private searchParams: URLSearchParams;
  private setSearchParams: (params: URLSearchParams) => void;
  private navigate: ReturnType<typeof useNavigate>;

  constructor(
    searchParams: URLSearchParams,
    setSearchParams: (params: URLSearchParams) => void,
    navigate: ReturnType<typeof useNavigate>
  ) {
    this.searchParams = searchParams;
    this.setSearchParams = setSearchParams;
    this.navigate = navigate;
  }

  has(key: string) {
    return this.searchParams.has(key);
  }

  get(key: string) {
    return this.searchParams.get(key);
  }

  set(key: string, value: string) {
    const newParams = new URLSearchParams(this.searchParams);
    newParams.set(key, value);
    this.setSearchParams(newParams);
  }

  delete(key: string) {
    const newParams = new URLSearchParams(this.searchParams);
    newParams.delete(key);
    this.setSearchParams(newParams);
  }

  getAll() {
    const result: Record<string, string> = {};
    this.searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  keys() {
    return Array.from(this.searchParams.keys());
  }

  values() {
    return Array.from(this.searchParams.values());
  }

  toString() {
    return this.searchParams.toString();
  }
}

export default useSearchParams;
