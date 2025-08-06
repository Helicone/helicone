/* eslint-disable @typescript-eslint/no-explicit-any */
import pgPromise from "pg-promise";
import { Database } from "../../../supabase/database.types";
import { getResponse } from "../managers/FeedbackManager";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../util/loggers/DBQueryTimer";
import { Result } from "../util/results";
import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { Valhalla } from "./valhalla";

export interface RequestPayload {
  request: Database["public"]["Tables"]["request"]["Insert"];
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
  responseId: string;
}

export interface ResponsePayload {
  responseId: string;
  requestId: string;
  response: Database["public"]["Tables"]["response"]["Update"];
}

export class RequestResponseStore {
  constructor(
    private sql: pgPromise.IDatabase<any>,
    private queryTimer: DBQueryTimer,
    private valhalla: Valhalla,
    private clickhouseWrapper: ClickhouseClientWrapper,
    public fallBackQueue: Queue,
    public responseAndResponseQueueKV: KVNamespace
  ) {}

  async updateResponsePostgres(
    responsePayload: ResponsePayload
  ): Promise<Result<null, string>> {
    const { responseId, requestId, response } = responsePayload;
    if (!responseId) {
      return { data: null, error: "Missing responseId" };
    }
    
    try {
      // Build dynamic update query
      const setClause = Object.keys(response)
        .map((key, i) => `${key} = $${i + 3}`)
        .join(', ');
      
      await this.sql.none(
        `UPDATE response SET ${setClause} WHERE id = $1 AND request = $2`,
        [responseId, requestId, ...Object.values(response)]
      );
      
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: (error as any).message || "Update failed" };
    }
  }

  async addRequestNodeRelationship(
    job_id: string,
    node_id: string,
    request_id: string
  ): Promise<Result<null, string>> {
    try {
      await this.sql.none(
        `INSERT INTO job_node_request (job_id, node_id, request_id)
         VALUES ($1, $2, $3)`,
        [job_id, node_id, request_id]
      );
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: JSON.stringify(error) };
    }
  }

  async addJob(
    run: Database["public"]["Tables"]["job"]["Insert"]
  ): Promise<Result<null, string>> {
    try {
      const columns = Object.keys(run).join(', ');
      const valuePlaceholders = Object.keys(run).map((_, i) => `$${i + 1}`).join(', ');
      
      await this.sql.none(
        `INSERT INTO job (${columns}) VALUES (${valuePlaceholders})`,
        Object.values(run)
      );
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: JSON.stringify(error) };
    }
  }

  async updateJobStatus(
    jobId: string,
    status: NonNullable<Database["public"]["Tables"]["job"]["Insert"]["status"]>
  ): Promise<Result<null, string>> {
    try {
      await this.sql.none(
        `UPDATE job
         SET 
           status = $1,
           updated_at = $2
         WHERE id = $3`,
        [status, new Date().toISOString(), jobId]
      );
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: JSON.stringify(error) };
    }
  }
  async updateNodeStatus(
    nodeId: string,
    status: NonNullable<Database["public"]["Tables"]["job_node"]["Insert"]["status"]>
  ): Promise<Result<null, string>> {
    try {
      await this.sql.none(
        `UPDATE job_node
         SET 
           status = $1,
           updated_at = $2
         WHERE id = $3`,
        [status, new Date().toISOString(), nodeId]
      );
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: JSON.stringify(error) };
    }
  }

  async addNode(
    node: Database["public"]["Tables"]["job_node"]["Insert"],
    options: { parent_job_id?: string }
  ): Promise<Result<null, string>> {
    try {
      const columns = Object.keys(node).join(', ');
      const valuePlaceholders = Object.keys(node).map((_, i) => `$${i + 1}`).join(', ');
      
      await this.sql.none(
        `INSERT INTO job_node (${columns}) VALUES (${valuePlaceholders})`,
        Object.values(node)
      );
      
      if (options.parent_job_id && node.id && node.job) {
        await this.sql.none(
          `INSERT INTO job_node_relationships (node_id, parent_node_id, job_id)
           VALUES ($1, $2, $3)`,
          [node.id, options.parent_job_id, node.job]
        );
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: JSON.stringify(error) };
    }
  }
}
