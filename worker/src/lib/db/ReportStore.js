import { err, ok } from "../util/results";
import { clickhousePriceCalc } from "@helicone-package/cost";
export class ReportStore {
    supabaseClient;
    clickhouseClient;
    constructor(supabaseClient, clickhouseClient) {
        this.supabaseClient = supabaseClient;
        this.clickhouseClient = clickhouseClient;
    }
    async getCostValue(organizationId, timeWindowMs) {
        const query = `SELECT
    ${clickhousePriceCalc("request_response_rmt")} as value,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE
    organization_id = {val_0: UUID} AND
    request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: cost, error: costErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (costErr || !cost || cost.length === 0) {
            throw new Error(`Failed to retrieve cost: ${costErr}`);
        }
        return cost[0];
    }
    async getNumberOfRequestsValue(organizationId, timeWindowMs) {
        const query = `SELECT
    COUNT() AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: numberOfRequests, error: numberOfRequestsErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (numberOfRequestsErr ||
            !numberOfRequests ||
            numberOfRequests.length === 0) {
            throw new Error(`Failed to retrieve number of requests: ${numberOfRequestsErr}`);
        }
        return numberOfRequests[0];
    }
    async getErrorsValue(organizationId, timeWindowMs) {
        const query = `SELECT
    COUNTIf(status BETWEEN 400 AND 599) AS value,
    COUNT() AS requestCount
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: errorRate, error: errorRateErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (errorRateErr || !errorRate || errorRate.length === 0) {
            throw new Error(`Failed to retrieve error rate: ${errorRateErr}`);
        }
        return errorRate[0];
    }
    async getNumberOfUsersValue(organizationId, timeWindowMs) {
        const query = `SELECT
    COUNT(DISTINCT user_id) AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: numberOfUsers, error: numberOfUsersErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (numberOfUsersErr || !numberOfUsers || numberOfUsers.length === 0) {
            throw new Error(`Failed to retrieve number of users: ${numberOfUsersErr}`);
        }
        return numberOfUsers[0];
    }
    async getNumberOfSessionsValue(organizationId, timeWindowMs) {
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
        const { data: numberOfSessions, error: numberOfSessionsErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (numberOfSessionsErr ||
            !numberOfSessions ||
            numberOfSessions.length === 0) {
            throw new Error(`Failed to retrieve number of sessions: ${numberOfSessionsErr}`);
        }
        return numberOfSessions[0];
    }
    async getAvgCostOfSessionsValue(organizationId, timeWindowMs) {
        const numberOfSessions = await this.getNumberOfSessionsValue(organizationId, timeWindowMs);
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
        const { data: costOfSessions, error: costOfSessionsErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (costOfSessionsErr || !costOfSessions || costOfSessions.length === 0) {
            throw new Error(`Failed to retrieve avg cost of sessions: ${costOfSessionsErr}`);
        }
        const avgCostOfSessions = costOfSessions[0].value / numberOfSessions.value;
        return {
            value: avgCostOfSessions,
            previous: 0,
            requestCount: costOfSessions[0].requestCount,
        };
    }
    async getReports() {
        const { data: reports, error: reportsErr } = await this.supabaseClient
            .from("integrations")
            .select("*, organization (integrations (id, integration_name, settings, active))")
            .eq("integration_name", "report")
            .eq("active", true);
        if (reportsErr) {
            return err(`Failed to retrieve all reports: ${reportsErr}`);
        }
        return ok(reports);
    }
    async getNumberOfThreatsValue(organizationId, timeWindowMs) {
        const query = `SELECT
    COUNT(threat) AS value
    FROM request_response_rmt
    WHERE organization_id = {val_0: UUID} AND request_created_at >= toDateTime64(now(), 3) - INTERVAL {val_1: Int64} MILLISECOND`;
        const { data: numberOfThreats, error: numberOfThreatsErr } = await this.clickhouseClient.dbQuery(query, [
            organizationId,
            timeWindowMs,
        ]);
        if (numberOfThreatsErr ||
            !numberOfThreats ||
            numberOfThreats.length === 0) {
            throw new Error(`Failed to retrieve number of threats: ${numberOfThreatsErr}`);
        }
        return numberOfThreats[0];
    }
    async getCost(organizationId, timeWindowMs) {
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
        }
        catch (e) {
            return err(`Failed to retrieve cost: ${e}`);
        }
    }
    async getNumberOfRequests(organizationId, timeWindowMs) {
        try {
            const [thisWeekNumberOfRequests, prevTwoWeeksNumberOfRequests] = await Promise.all([
                this.getNumberOfRequestsValue(organizationId, timeWindowMs),
                this.getNumberOfRequestsValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekNumberOfRequests = prevTwoWeeksNumberOfRequests.value - thisWeekNumberOfRequests.value;
            return ok({
                ...thisWeekNumberOfRequests,
                previous: prevWeekNumberOfRequests,
            });
        }
        catch (e) {
            return err(`Failed to retrieve number of requests: ${e}`);
        }
    }
    async getErrorRate(organizationId, timeWindowMs) {
        try {
            const [thisWeekErrors, prevTwoWeeksErrors] = await Promise.all([
                this.getErrorsValue(organizationId, timeWindowMs),
                this.getErrorsValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekErrors = prevTwoWeeksErrors.value - thisWeekErrors.value;
            return ok({
                value: (thisWeekErrors.value / (thisWeekErrors.requestCount || 1)) * 100,
                previous: (prevWeekErrors /
                    ((prevTwoWeeksErrors.requestCount || 1) -
                        (thisWeekErrors.requestCount || 1))) *
                    100,
            });
        }
        catch (e) {
            return err(`Failed to retrieve errors: ${e}`);
        }
    }
    async getNumberOfUsers(organizationId, timeWindowMs) {
        try {
            const [thisWeekNumberOfUsers, prevTwoWeeksNumberOfUsers] = await Promise.all([
                this.getNumberOfUsersValue(organizationId, timeWindowMs),
                this.getNumberOfUsersValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekNumberOfUsers = prevTwoWeeksNumberOfUsers.value - thisWeekNumberOfUsers.value;
            return ok({
                ...thisWeekNumberOfUsers,
                previous: prevWeekNumberOfUsers,
            });
        }
        catch (e) {
            return err(`Failed to retrieve number of users: ${e}`);
        }
    }
    async getNumberOfThreats(organizationId, timeWindowMs) {
        try {
            const [thisWeekNumberOfThreats, prevTwoWeeksNumberOfThreats] = await Promise.all([
                this.getNumberOfThreatsValue(organizationId, timeWindowMs),
                this.getNumberOfThreatsValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekNumberOfThreats = prevTwoWeeksNumberOfThreats.value - thisWeekNumberOfThreats.value;
            return ok({
                ...thisWeekNumberOfThreats,
                previous: prevWeekNumberOfThreats,
            });
        }
        catch (e) {
            return err(`Failed to retrieve number of threats: ${e}`);
        }
    }
    async getNumberOfSessions(organizationId, timeWindowMs) {
        try {
            const [thisWeekNumberOfSessions, prevTwoWeeksNumberOfSessions] = await Promise.all([
                this.getNumberOfSessionsValue(organizationId, timeWindowMs),
                this.getNumberOfSessionsValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekNumberOfSessions = prevTwoWeeksNumberOfSessions.value - thisWeekNumberOfSessions.value;
            return ok({
                ...thisWeekNumberOfSessions,
                previous: prevWeekNumberOfSessions,
            });
        }
        catch (e) {
            return err(`Failed to retrieve number of sessions: ${e}`);
        }
    }
    async getAvgCostOfSessions(organizationId, timeWindowMs) {
        try {
            const [thisWeekAvgCostOfSessions, prevTwoWeeksAvgCostOfSessions] = await Promise.all([
                this.getAvgCostOfSessionsValue(organizationId, timeWindowMs),
                this.getAvgCostOfSessionsValue(organizationId, timeWindowMs * 2),
            ]);
            const prevWeekAvgCostOfSessions = prevTwoWeeksAvgCostOfSessions.value - thisWeekAvgCostOfSessions.value;
            return ok({
                ...thisWeekAvgCostOfSessions,
                previous: prevWeekAvgCostOfSessions,
            });
        }
        catch (e) {
            return err(`Failed to retrieve avg cost of sessions: ${e}`);
        }
    }
}
