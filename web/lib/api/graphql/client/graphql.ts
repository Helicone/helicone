/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type AggregatedHeliconeRequest = {
  __typename?: 'AggregatedHeliconeRequest';
  cache?: Maybe<Cache>;
  cost?: Maybe<Scalars['Float']['output']>;
  costUSD?: Maybe<Scalars['Float']['output']>;
  firstRequest: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastRequest: Scalars['String']['output'];
};

export type Cache = {
  __typename?: 'Cache';
  hits: Scalars['Int']['output'];
  misses: Scalars['Int']['output'];
  savedUSD: Scalars['Float']['output'];
};

export type DateOperators = {
  gte?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
};

export type Feedback = {
  __typename?: 'Feedback';
  rating: Scalars['Boolean']['output'];
};

export type FeedbackFilter = {
  rating?: InputMaybe<Scalars['Boolean']['input']>;
};

export type HeliconeJob = {
  __typename?: 'HeliconeJob';
  created_at: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  node_count: Scalars['Int']['output'];
  properties?: Maybe<Array<Maybe<Property>>>;
  request_count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  timeout_seconds: Scalars['Int']['output'];
  updated_at: Scalars['String']['output'];
};

export type HeliconeJobFilter = {
  created_at?: InputMaybe<DateOperators>;
  description?: InputMaybe<TextOperators>;
  id?: InputMaybe<TextOperators>;
  name?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  updated_at?: InputMaybe<DateOperators>;
};

export type HeliconeNode = {
  __typename?: 'HeliconeNode';
  created_at: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  job_id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parent_node_ids?: Maybe<Array<Scalars['String']['output']>>;
  properties?: Maybe<Array<Maybe<Property>>>;
  updated_at: Scalars['String']['output'];
};

export type HeliconeNodeFilter = {
  created_at?: InputMaybe<DateOperators>;
  description?: InputMaybe<TextOperators>;
  id?: InputMaybe<TextOperators>;
  name?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  updated_at?: InputMaybe<DateOperators>;
};

export type HeliconeRequest = {
  __typename?: 'HeliconeRequest';
  cacheHits?: Maybe<Scalars['Int']['output']>;
  costUSD: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  feedback?: Maybe<Feedback>;
  id: Scalars['ID']['output'];
  latency?: Maybe<Scalars['Float']['output']>;
  model: Scalars['String']['output'];
  prompt?: Maybe<Scalars['String']['output']>;
  properties?: Maybe<Array<Maybe<Property>>>;
  requestBody?: Maybe<Scalars['JSON']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  responseBody?: Maybe<Scalars['JSON']['output']>;
  user?: Maybe<User>;
  values?: Maybe<Array<Maybe<Value>>>;
};

export type HeliconeRequestFilter = {
  createdAt?: InputMaybe<DateOperators>;
  feedback?: InputMaybe<FeedbackFilter>;
  id?: InputMaybe<NumberOperators>;
  prompt?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  requestId?: InputMaybe<TextOperators>;
  response?: InputMaybe<TextOperators>;
  user?: InputMaybe<TextOperators>;
};

export type Model = {
  __typename?: 'Model';
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  total_completion_tokens?: Maybe<Scalars['Int']['output']>;
  total_prompt_tokens?: Maybe<Scalars['Int']['output']>;
  total_requests?: Maybe<Scalars['Int']['output']>;
  total_tokens?: Maybe<Scalars['Int']['output']>;
};

export type NumberOperators = {
  equals?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  not_equals?: InputMaybe<Scalars['Float']['input']>;
};

export type Property = {
  __typename?: 'Property';
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type PropertyFilter = {
  name: Scalars['String']['input'];
  value: TextOperators;
};

export type Query = {
  __typename?: 'Query';
  aggregatedHeliconeRequest?: Maybe<AggregatedHeliconeRequest>;
  heliconeJob?: Maybe<Array<Maybe<HeliconeJob>>>;
  heliconeNode?: Maybe<Array<Maybe<HeliconeNode>>>;
  heliconeRequest?: Maybe<Array<Maybe<HeliconeRequest>>>;
  user?: Maybe<Array<Maybe<User>>>;
};


export type QueryAggregatedHeliconeRequestArgs = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};


export type QueryHeliconeJobArgs = {
  filters?: InputMaybe<Array<HeliconeJobFilter>>;
  id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHeliconeNodeArgs = {
  filters?: InputMaybe<Array<HeliconeNodeFilter>>;
  id?: InputMaybe<Scalars['String']['input']>;
  job_id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHeliconeRequestArgs = {
  filters?: InputMaybe<Array<HeliconeRequestFilter>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserArgs = {
  after?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type TextOperators = {
  contains?: InputMaybe<Scalars['String']['input']>;
  equals?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  not_equals?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['String']['output'];
  total_completion_tokens?: Maybe<Scalars['Float']['output']>;
  total_prompt_tokens?: Maybe<Scalars['Float']['output']>;
  total_requests?: Maybe<Scalars['Int']['output']>;
  total_tokens?: Maybe<Scalars['Float']['output']>;
};

export type Value = {
  __typename?: 'Value';
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ValueFilter = {
  name: Scalars['String']['input'];
  value: TextOperators;
};

export type FetchRunsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  filters?: InputMaybe<Array<HeliconeJobFilter> | HeliconeJobFilter>;
}>;


export type FetchRunsQuery = { __typename?: 'Query', heliconeJob?: Array<{ __typename?: 'HeliconeJob', id: string, name: string, description?: string | null, status: string, created_at: string, updated_at: string, timeout_seconds: number, node_count: number, request_count: number, properties?: Array<{ __typename?: 'Property', value?: string | null, name?: string | null } | null> | null } | null> | null };

export type FetchTasksQueryVariables = Exact<{
  heliconeNodeId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  jobId?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Array<HeliconeNodeFilter> | HeliconeNodeFilter>;
}>;


export type FetchTasksQuery = { __typename?: 'Query', heliconeNode?: Array<{ __typename?: 'HeliconeNode', id: string, name: string, description?: string | null, created_at: string, updated_at: string, job_id: string, parent_node_ids?: Array<string> | null, properties?: Array<{ __typename?: 'Property', name?: string | null, value?: string | null } | null> | null } | null> | null };


export const FetchRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FetchRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HeliconeJobFilter"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heliconeJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"timeout_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"node_count"}},{"kind":"Field","name":{"kind":"Name","value":"request_count"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<FetchRunsQuery, FetchRunsQueryVariables>;
export const FetchTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FetchTasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"heliconeNodeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jobId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HeliconeNodeFilter"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heliconeNode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"heliconeNodeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"job_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jobId"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"job_id"}},{"kind":"Field","name":{"kind":"Name","value":"parent_node_ids"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<FetchTasksQuery, FetchTasksQueryVariables>;