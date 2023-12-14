import { NextRouter, useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";

/**
 * Custom hook that returns the search parameters from the current router.
 * @returns {SearchParams} The search parameters object.
 */
const useSearchParams = () => {
  const router = useRouter();

  const searchParams = new SearchParams(router);

  return searchParams;
};

/**
 * Represents a utility class for managing search parameters in Next.js router.
 */
class SearchParams {
  router: NextRouter;
  query: ParsedUrlQuery;

  /**
   * Constructs a new instance of the SearchParams class.
   * @param router - The Next.js router object.
   */
  constructor(router: NextRouter) {
    this.router = router;
    this.query = router.query;
  }

  /**
   * Checks if the specified key exists in the search parameters.
   * @param key - The key to check.
   * @returns A boolean indicating whether the key exists.
   */
  has(key: string) {
    return this.query.hasOwnProperty(key);
  }

  /**
   * Gets the value of the specified key from the search parameters.
   * @param key - The key to get the value for.
   * @returns The value of the key, or null if the key does not exist.
   */
  get(key: string) {
    if (this.has(key)) {
      return (this.query[key] as string) || "";
    }
    return null;
  }

  /**
   * Sets the value of the specified key in the search parameters.
   * @param key - The key to set the value for.
   * @param value - The value to set.
   */
  set(key: string, value: string) {
    this.router.replace(
      {
        query: { ...this.router.query, [key]: value },
      },
      undefined,
      { shallow: true }
    );
  }

  /**
   * Deletes the specified key from the search parameters.
   * @param key - The key to delete.
   */
  delete(key: string) {
    const { [key]: _, ...rest } = this.query;
    this.router.replace(
      {
        query: rest,
      },
      undefined,
      { shallow: true }
    );
  }

  /**
   * Gets all the search parameters as an object.
   * @returns An object containing all the search parameters.
   */
  getAll() {
    return this.query;
  }

  /**
   * Gets an array of all the keys in the search parameters.
   * @returns An array of keys.
   */
  keys() {
    return Object.keys(this.query);
  }

  /**
   * Gets an array of all the values in the search parameters.
   * @returns An array of values.
   */
  values() {
    return Object.values(this.query);
  }

  /**
   * Converts the search parameters to a JSON string.
   * @returns A JSON string representation of the search parameters.
   */
  toString() {
    return JSON.stringify(this.query);
  }
}

export default useSearchParams;
