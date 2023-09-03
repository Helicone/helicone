/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeRunFilter!]) {\n    heliconeRun(filters: $filters, offset: $offset, limit: $limit) {\n      id\n      name\n      description\n      status\n      created_at\n      updated_at\n      timeout_seconds\n      task_count\n      request_count\n      properties {\n        value\n        name\n      }\n    }\n  }\n": types.FetchRunsDocument,
    "\n  query FetchTasks(\n    $heliconeTaskId: String\n    $limit: Int\n    $offset: Int\n    $runId: String\n    $filters: [HeliconeTaskFilter!]\n  ) {\n    heliconeTask(\n      id: $heliconeTaskId\n      limit: $limit\n      offset: $offset\n      run_id: $runId\n      filters: $filters\n    ) {\n      id\n      name\n      description\n      created_at\n      updated_at\n      run_id\n      parent_id\n      properties {\n        name\n        value\n      }\n    }\n  }\n": types.FetchTasksDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeRunFilter!]) {\n    heliconeRun(filters: $filters, offset: $offset, limit: $limit) {\n      id\n      name\n      description\n      status\n      created_at\n      updated_at\n      timeout_seconds\n      task_count\n      request_count\n      properties {\n        value\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeRunFilter!]) {\n    heliconeRun(filters: $filters, offset: $offset, limit: $limit) {\n      id\n      name\n      description\n      status\n      created_at\n      updated_at\n      timeout_seconds\n      task_count\n      request_count\n      properties {\n        value\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query FetchTasks(\n    $heliconeTaskId: String\n    $limit: Int\n    $offset: Int\n    $runId: String\n    $filters: [HeliconeTaskFilter!]\n  ) {\n    heliconeTask(\n      id: $heliconeTaskId\n      limit: $limit\n      offset: $offset\n      run_id: $runId\n      filters: $filters\n    ) {\n      id\n      name\n      description\n      created_at\n      updated_at\n      run_id\n      parent_id\n      properties {\n        name\n        value\n      }\n    }\n  }\n"): (typeof documents)["\n  query FetchTasks(\n    $heliconeTaskId: String\n    $limit: Int\n    $offset: Int\n    $runId: String\n    $filters: [HeliconeTaskFilter!]\n  ) {\n    heliconeTask(\n      id: $heliconeTaskId\n      limit: $limit\n      offset: $offset\n      run_id: $runId\n      filters: $filters\n    ) {\n      id\n      name\n      description\n      created_at\n      updated_at\n      run_id\n      parent_id\n      properties {\n        name\n        value\n      }\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;