import pgPromise from 'pg-promise';
import { Env } from '../../index';

// Initialize pg-promise
const pgp = pgPromise({
  // Initialization options
  error(error, e) {
    if (e.cn) {
      // connection-related error
      console.error('Database connection error:', e.cn);
    }
    if (e.query) {
      // query-related error
      console.error('Query error:', e.query);
    }
  }
});

// Cache for database connections to avoid duplicates
const connectionCache = new Map<string, pgPromise.IDatabase<any>>();

export interface PostgresConnection {
  sql: pgPromise.IDatabase<any>;
}

export class PostgresClient {
  private db: pgPromise.IDatabase<any>;

  private static getOrCreateConnection(connectionString: string): pgPromise.IDatabase<any> {
    // Check if we already have a connection for this connection string
    const existing = connectionCache.get(connectionString);
    if (existing) {
      return existing;
    }

    // Create new database connection
    const db = pgp({
      connectionString,
      max: 10, // max pool size
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });

    // Cache it
    connectionCache.set(connectionString, db);
    return db;
  }

  constructor(private env: Env) {
    this.db = PostgresClient.getOrCreateConnection(env.POSTGRES_CONNECTION_STRING);
  }

  static eu(env: Env): PostgresClient {
    const client = new PostgresClient(env);
    client.db = PostgresClient.getOrCreateConnection((env as any).EU_POSTGRES_CONNECTION_STRING);
    return client;
  }

  get client(): pgPromise.IDatabase<any> {
    return this.db;
  }

  // Method to close all connections (for graceful shutdown)
  static async closeAll(): Promise<void> {
    for (const [_, db] of connectionCache) {
      await db.$pool.end();
    }
    connectionCache.clear();
  }
}

// Helper function to map postgres errors to Result type
export function mapPostgresError(error: any): { error: string } {
  if (error.code === '23505') {
    return { error: 'Duplicate key violation' };
  }
  if (error.code === '23503') {
    return { error: 'Foreign key violation' };
  }
  if (error.code === '23502') {
    return { error: 'Not null violation' };
  }
  if (error.code === '42P01') {
    return { error: 'Table does not exist' };
  }
  if (error.code === '42703') {
    return { error: 'Column does not exist' };
  }
  
  return { error: error.message || 'Database error' };
}