import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type AggregatedHeliconeRequest = {
  __typename?: 'AggregatedHeliconeRequest';
  cache?: Maybe<Cache>;
  cost?: Maybe<Scalars['Float']['output']>;
  costUSD?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Int']['output'];
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
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
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
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  filters?: InputMaybe<Array<HeliconeJobFilter> | HeliconeJobFilter>;
}>;


export type FetchRunsQuery = { __typename?: 'Query', heliconeJob?: Array<{ __typename?: 'HeliconeJob', id: string, name: string, description?: string | null, status: string, created_at: string, updated_at: string, timeout_seconds: number, node_count: number, request_count: number, properties?: Array<{ __typename?: 'Property', value?: string | null, name?: string | null } | null> | null } | null> | null };

export type FetchTasksQueryVariables = Exact<{
  heliconeNodeId?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  jobId?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<Array<HeliconeNodeFilter> | HeliconeNodeFilter>;
}>;


export type FetchTasksQuery = { __typename?: 'Query', heliconeNode?: Array<{ __typename?: 'HeliconeNode', id: string, name: string, description?: string | null, created_at: string, updated_at: string, job_id: string, parent_node_ids?: Array<string> | null, properties?: Array<{ __typename?: 'Property', name?: string | null, value?: string | null } | null> | null } | null> | null };


export const FetchRunsDocument = gql`
    query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeJobFilter!]) {
  heliconeJob(filters: $filters, offset: $offset, limit: $limit) {
    id
    name
    description
    status
    created_at
    updated_at
    timeout_seconds
    node_count
    request_count
    properties {
      value
      name
    }
  }
}
    `;

/**
 * __useFetchRunsQuery__
 *
 * To run a query within a React component, call `useFetchRunsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchRunsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchRunsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      filters: // value for 'filters'
 *   },
 * });
 */
export function useFetchRunsQuery(baseOptions?: Apollo.QueryHookOptions<FetchRunsQuery, FetchRunsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchRunsQuery, FetchRunsQueryVariables>(FetchRunsDocument, options);
      }
export function useFetchRunsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchRunsQuery, FetchRunsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchRunsQuery, FetchRunsQueryVariables>(FetchRunsDocument, options);
        }
export type FetchRunsQueryHookResult = ReturnType<typeof useFetchRunsQuery>;
export type FetchRunsLazyQueryHookResult = ReturnType<typeof useFetchRunsLazyQuery>;
export type FetchRunsQueryResult = Apollo.QueryResult<FetchRunsQuery, FetchRunsQueryVariables>;
export const FetchTasksDocument = gql`
    query FetchTasks($heliconeNodeId: String, $limit: Int, $offset: Int, $jobId: String, $filters: [HeliconeNodeFilter!]) {
  heliconeNode(
    id: $heliconeNodeId
    limit: $limit
    offset: $offset
    job_id: $jobId
    filters: $filters
  ) {
    id
    name
    description
    created_at
    updated_at
    job_id
    parent_node_ids
    properties {
      name
      value
    }
  }
}
    `;

/**
 * __useFetchTasksQuery__
 *
 * To run a query within a React component, call `useFetchTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTasksQuery({
 *   variables: {
 *      heliconeNodeId: // value for 'heliconeNodeId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      jobId: // value for 'jobId'
 *      filters: // value for 'filters'
 *   },
 * });
 */
export function useFetchTasksQuery(baseOptions?: Apollo.QueryHookOptions<FetchTasksQuery, FetchTasksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchTasksQuery, FetchTasksQueryVariables>(FetchTasksDocument, options);
      }
export function useFetchTasksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchTasksQuery, FetchTasksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchTasksQuery, FetchTasksQueryVariables>(FetchTasksDocument, options);
        }
export type FetchTasksQueryHookResult = ReturnType<typeof useFetchTasksQuery>;
export type FetchTasksLazyQueryHookResult = ReturnType<typeof useFetchTasksLazyQuery>;
export type FetchTasksQueryResult = Apollo.QueryResult<FetchTasksQuery, FetchTasksQueryVariables>;