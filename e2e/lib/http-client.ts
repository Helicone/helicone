/**
 * HTTP client for making requests to the Helicone Gateway
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AI_GATEWAY_URL, TEST_HEADERS, DEFAULT_TIMEOUT } from "./constants";

export class GatewayClient {
  private client: AxiosInstance;

  constructor(baseURL: string = AI_GATEWAY_URL) {
    this.client = axios.create({
      baseURL,
      timeout: DEFAULT_TIMEOUT,
      headers: TEST_HEADERS,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Make a POST request to the gateway
   */
  async post<T = any>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(endpoint, data, config);
  }

  /**
   * Make a GET request to the gateway
   */
  async get<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(endpoint, config);
  }

  /**
   * Set custom headers for the next request
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Reset headers to default
   */
  resetHeaders(): void {
    this.client.defaults.headers = {
      ...this.client.defaults.headers,
      ...TEST_HEADERS,
    } as any;
  }
}

// Export a singleton instance
export const gatewayClient = new GatewayClient();
