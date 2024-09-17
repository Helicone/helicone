import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../../../supabase/database.types";
import { clickhousePriceCalc } from "../../packages/cost";

export type Integration =
  Database["public"]["Tables"]["integrations"]["Row"] & {
    organization: Database["public"]["Tables"]["organization"]["Row"] & {
      integrations: Database["public"]["Tables"]["integrations"]["Row"][];
    };
  };

export type ReportMetric = {
  value: number;
  previous: number;
  requestCount?: number;
};

export class ReportStore {
  constructor(
    private supabaseClient: SupabaseClient<Database>,
    private clickhouseClient: ClickhouseClientWrapper
  ) {}

  private async getCostValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `SELECT
    ${clickhousePriceCalc("request_response_rmt")} as value,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: cost, error: costErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (costErr || !cost || cost.length === 0) {
      throw new Error(`Failed to retrieve cost: ${costErr}`);
    }

    return cost[0];
  }

  private async getNumberOfRequestsValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `SELECT
    COUNT() AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: numberOfRequests, error: numberOfRequestsErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (
      numberOfRequestsErr ||
      !numberOfRequests ||
      numberOfRequests.length === 0
    ) {
      throw new Error(
        `Failed to retrieve number of requests: ${numberOfRequestsErr}`
      );
    }

    return numberOfRequests[0];
  }

  private async getErrorsValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `SELECT
    COUNTIf(status BETWEEN 400 AND 599) AS value,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: errorRate, error: errorRateErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (errorRateErr || !errorRate || errorRate.length === 0) {
      throw new Error(`Failed to retrieve error rate: ${errorRateErr}`);
    }

    return errorRate[0];
  }

  private async getNumberOfUsersValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `SELECT
    COUNT(DISTINCT user_id) AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: numberOfUsers, error: numberOfUsersErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (numberOfUsersErr || !numberOfUsers || numberOfUsers.length === 0) {
      throw new Error(
        `Failed to retrieve number of users: ${numberOfUsersErr}`
      );
    }

    return numberOfUsers[0];
  }

  private async getNumberOfSessionsValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `
    SELECT
      COUNT(DISTINCT properties['Helicone-Session-Id']) AS value,
      COUNT(*) AS requestCount
    FROM request_response_rmt
    WHERE
      organization_id = {val_0: UUID} AND
      request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND AND
      has(properties, 'Helicone-Session-Id')
    `;

    const { data: numberOfSessions, error: numberOfSessionsErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (
      numberOfSessionsErr ||
      !numberOfSessions ||
      numberOfSessions.length === 0
    ) {
      throw new Error(
        `Failed to retrieve number of sessions: ${numberOfSessionsErr}`
      );
    }

    return numberOfSessions[0];
  }

  private async getAvgCostOfSessionsValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const numberOfSessions = await this.getNumberOfSessionsValue(
      organizationId,
      timeWindowMs
    );

    if (numberOfSessions.value === 0) {
      return {
        value: 0,
        previous: 0,
        requestCount: numberOfSessions.requestCount,
      };
    }

    const query = `SELECT
    ${clickhousePriceCalc("request_response_rmt")} as value,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND AND
    has(properties, 'Helicone-Session-Id')`;

    const { data: costOfSessions, error: costOfSessionsErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (costOfSessionsErr || !costOfSessions || costOfSessions.length === 0) {
      throw new Error(
        `Failed to retrieve avg cost of sessions: ${costOfSessionsErr}`
      );
    }

    const avgCostOfSessions = costOfSessions[0].value / numberOfSessions.value;

    return {
      value: avgCostOfSessions,
      previous: 0,
      requestCount: costOfSessions[0].requestCount,
    };
  }

  public async getReports(): Promise<Result<Integration[], string>> {
    const { data: reports, error: reportsErr } = await this.supabaseClient
      .from("integrations")
      .select(
        "*, organization (integrations (id, integration_name, settings, active))"
      )
      .eq("integration_name", "report")
      .eq("active", true);

    if (reportsErr) {
      return err(`Failed to retrieve all reports: ${reportsErr}`);
    }

    return ok(reports as Integration[]);
  }

  private async getNumberOfThreatsValue(
    organizationId: string,
    timeWindowMs: number
  ): Promise<ReportMetric> {
    const query = `SELECT
    COUNT(threat) AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;

    const { data: numberOfThreats, error: numberOfThreatsErr } =
      await this.clickhouseClient.dbQuery<ReportMetric>(query, [
        organizationId,
        timeWindowMs,
      ]);

    if (
      numberOfThreatsErr ||
      !numberOfThreats ||
      numberOfThreats.length === 0
    ) {
      throw new Error(
        `Failed to retrieve number of threats: ${numberOfThreatsErr}`
      );
    }

    return numberOfThreats[0];
  }

  public async getCost(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekCost, prevTwoWeeksCost] = await Promise.all([
        this.getCostValue(organizationId, timeWindowMs),
        this.getCostValue(organizationId, timeWindowMs * 2),
      ]);
      const prevWeekCost = prevTwoWeeksCost.value - thisWeekCost.value;

      return ok({
        ...thisWeekCost,
        previous: prevWeekCost,
      });
    } catch (e) {
      return err(`Failed to retrieve cost: ${e}`);
    }
  }

  public async getNumberOfRequests(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekNumberOfRequests, prevTwoWeeksNumberOfRequests] =
        await Promise.all([
          this.getNumberOfRequestsValue(organizationId, timeWindowMs),
          this.getNumberOfRequestsValue(organizationId, timeWindowMs * 2),
        ]);
      const prevWeekNumberOfRequests =
        prevTwoWeeksNumberOfRequests.value - thisWeekNumberOfRequests.value;

      return ok({
        ...thisWeekNumberOfRequests,
        previous: prevWeekNumberOfRequests,
      });
    } catch (e) {
      return err(`Failed to retrieve number of requests: ${e}`);
    }
  }

  public async getErrorRate(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekErrors, prevTwoWeeksErrors] = await Promise.all([
        this.getErrorsValue(organizationId, timeWindowMs),
        this.getErrorsValue(organizationId, timeWindowMs * 2),
      ]);
      const prevWeekErrors = prevTwoWeeksErrors.value - thisWeekErrors.value;

      return ok({
        value:
          (thisWeekErrors.value / (thisWeekErrors.requestCount || 1)) * 100,
        previous:
          (prevWeekErrors /
            ((prevTwoWeeksErrors.requestCount || 1) -
              (thisWeekErrors.requestCount || 1))) *
          100,
      });
    } catch (e) {
      return err(`Failed to retrieve errors: ${e}`);
    }
  }

  public async getNumberOfUsers(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekNumberOfUsers, prevTwoWeeksNumberOfUsers] =
        await Promise.all([
          this.getNumberOfUsersValue(organizationId, timeWindowMs),
          this.getNumberOfUsersValue(organizationId, timeWindowMs * 2),
        ]);
      const prevWeekNumberOfUsers =
        prevTwoWeeksNumberOfUsers.value - thisWeekNumberOfUsers.value;

      return ok({
        ...thisWeekNumberOfUsers,
        previous: prevWeekNumberOfUsers,
      });
    } catch (e) {
      return err(`Failed to retrieve number of users: ${e}`);
    }
  }

  public async getNumberOfThreats(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekNumberOfThreats, prevTwoWeeksNumberOfThreats] =
        await Promise.all([
          this.getNumberOfThreatsValue(organizationId, timeWindowMs),
          this.getNumberOfThreatsValue(organizationId, timeWindowMs * 2),
        ]);
      const prevWeekNumberOfThreats =
        prevTwoWeeksNumberOfThreats.value - thisWeekNumberOfThreats.value;

      return ok({
        ...thisWeekNumberOfThreats,
        previous: prevWeekNumberOfThreats,
      });
    } catch (e) {
      return err(`Failed to retrieve number of threats: ${e}`);
    }
  }

  public async getNumberOfSessions(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekNumberOfSessions, prevTwoWeeksNumberOfSessions] =
        await Promise.all([
          this.getNumberOfSessionsValue(organizationId, timeWindowMs),
          this.getNumberOfSessionsValue(organizationId, timeWindowMs * 2),
        ]);
      const prevWeekNumberOfSessions =
        prevTwoWeeksNumberOfSessions.value - thisWeekNumberOfSessions.value;

      return ok({
        ...thisWeekNumberOfSessions,
        previous: prevWeekNumberOfSessions,
      });
    } catch (e) {
      return err(`Failed to retrieve number of sessions: ${e}`);
    }
  }

  public async getAvgCostOfSessions(
    organizationId: string,
    timeWindowMs: number
  ): Promise<Result<ReportMetric, string>> {
    try {
      const [thisWeekAvgCostOfSessions, prevTwoWeeksAvgCostOfSessions] =
        await Promise.all([
          this.getAvgCostOfSessionsValue(organizationId, timeWindowMs),
          this.getAvgCostOfSessionsValue(organizationId, timeWindowMs * 2),
        ]);
      const prevWeekAvgCostOfSessions =
        prevTwoWeeksAvgCostOfSessions.value - thisWeekAvgCostOfSessions.value;

      return ok({
        ...thisWeekAvgCostOfSessions,
        previous: prevWeekAvgCostOfSessions,
      });
    } catch (e) {
      return err(`Failed to retrieve avg cost of sessions: ${e}`);
    }
  }
}
