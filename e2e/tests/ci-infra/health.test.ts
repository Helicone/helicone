/**
 * Comprehensive system health check tests
 * Verifies all Helicone services are running and accessible
 */

import axios from "axios";
import {
  AI_GATEWAY_URL,
  WORKER_API_URL,
  JAWN_URL,
  CLICKHOUSE_URL,
  POSTGRES_URL,
  GATEWAY_ENDPOINTS,
  JAWN_ENDPOINTS,
} from "../../lib/constants";
import { retry } from "../../lib/test-helpers";

describe("System Health Checks", () => {
  describe("AI Gateway (Port 8793)", () => {
    it("should be running and respond to healthcheck", async () => {
      const response = await retry(
        () =>
          axios.get(`${AI_GATEWAY_URL}${GATEWAY_ENDPOINTS.HEALTHCHECK}`, {
            validateStatus: () => true,
          }),
        { maxAttempts: 3, delayMs: 2000 }
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Worker API (Port 8788)", () => {
    it("should be running and respond to healthcheck", async () => {
      const response = await retry(
        () =>
          axios.get(`${WORKER_API_URL}${GATEWAY_ENDPOINTS.HEALTHCHECK}`, {
            validateStatus: () => true,
          }),
        { maxAttempts: 3, delayMs: 2000 }
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Jawn API (Port 8585)", () => {
    it("should be running and respond to healthcheck", async () => {
      const response = await retry(
        () =>
          axios.get(`${JAWN_URL}${JAWN_ENDPOINTS.HEALTHCHECK}`, {
            validateStatus: () => true,
          }),
        { maxAttempts: 3, delayMs: 2000 }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status");
    });
  });

  describe("PostgreSQL Database", () => {
    it("should be accessible via Jawn", async () => {
      // We verify Postgres is working by checking if Jawn can connect
      // Jawn healthcheck implicitly verifies database connectivity
      const response = await axios.get(
        `${JAWN_URL}${JAWN_ENDPOINTS.HEALTHCHECK}`,
        {
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(200);
    });
  });

  describe("ClickHouse Database", () => {
    it("should be accessible and responding", async () => {
      const response = await retry(
        () =>
          axios.get(`${CLICKHOUSE_URL}/ping`, {
            validateStatus: () => true,
          }),
        { maxAttempts: 3, delayMs: 2000 }
      );

      // ClickHouse returns 200 OK with "Ok." body on ping
      expect(response.status).toBe(200);
      expect(response.data).toBe("Ok.\n");
    });
  });

  describe("All Services", () => {
    it("should have all critical services running", async () => {
      const healthChecks = await Promise.allSettled([
        axios.get(`${AI_GATEWAY_URL}${GATEWAY_ENDPOINTS.HEALTHCHECK}`, {
          validateStatus: () => true,
        }),
        axios.get(`${WORKER_API_URL}${GATEWAY_ENDPOINTS.HEALTHCHECK}`, {
          validateStatus: () => true,
        }),
        axios.get(`${JAWN_URL}${JAWN_ENDPOINTS.HEALTHCHECK}`, {
          validateStatus: () => true,
        }),
        axios.get(`${CLICKHOUSE_URL}/ping`, {
          validateStatus: () => true,
        }),
      ]);

      const results = healthChecks.map((result, index) => {
        const services = ["AI Gateway", "Worker API", "Jawn", "ClickHouse"];
        return {
          service: services[index],
          status: result.status,
          healthy:
            result.status === "fulfilled" &&
            (result.value as any).status === 200,
        };
      });

      // Log all service statuses
      console.log("\nService Health Status:");
      results.forEach((r) => {
        console.log(
          `  ${r.service}: ${r.healthy ? "✓ Healthy" : "✗ Unhealthy"}`
        );
      });

      // All services should be healthy
      const allHealthy = results.every((r) => r.healthy);
      expect(allHealthy).toBe(true);
    });
  });
});
