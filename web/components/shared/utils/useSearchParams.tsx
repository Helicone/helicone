import { NextRouter, useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";

const useSearchParams = () => {
  const router = useRouter();

  const searchParams = new SearchParams(router);

  return searchParams;
};

class SearchParams {
  router: NextRouter;
  query: ParsedUrlQuery;

  constructor(router: NextRouter) {
    this.router = router;
    this.query = router.query;
  }

  has(key: string) {
    return this.query.hasOwnProperty(key);
  }

  get(key: string) {
    if (this.has(key)) {
      return (this.query[key] as string) || "";
    }
    return null;
  }

  set(key: string, value: string) {
    this.router.push({ query: { ...this.query, [key]: value } });
  }

  getAll() {
    return this.query;
  }

  keys() {
    return Object.keys(this.query);
  }

  values() {
    return Object.values(this.query);
  }

  toString() {
    return JSON.stringify(this.query);
  }
}

export default useSearchParams;
