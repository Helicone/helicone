/* eslint-disable */
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

export type HeliconeRequest = {
  __typename?: 'HeliconeRequest';
  cacheHits?: Maybe<Scalars['Int']['output']>;
  costUSD: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
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
  id?: InputMaybe<NumberOperators>;
  prompt?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  requestId?: InputMaybe<TextOperators>;
  response?: InputMaybe<TextOperators>;
  user?: InputMaybe<TextOperators>;
};

export type HeliconeRun = {
  __typename?: 'HeliconeRun';
  created_at: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  properties?: Maybe<Array<Maybe<Property>>>;
  request_count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  task_count: Scalars['Int']['output'];
  timeout_seconds: Scalars['Int']['output'];
  updated_at: Scalars['String']['output'];
};

export type HeliconeRunFilter = {
  created_at?: InputMaybe<DateOperators>;
  description?: InputMaybe<TextOperators>;
  id?: InputMaybe<TextOperators>;
  name?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  updated_at?: InputMaybe<DateOperators>;
};

export type HeliconeTask = {
  __typename?: 'HeliconeTask';
  created_at: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parent_id?: Maybe<Scalars['String']['output']>;
  properties?: Maybe<Array<Maybe<Property>>>;
  run_id: Scalars['String']['output'];
  updated_at: Scalars['String']['output'];
};

export type HeliconeTaskFilter = {
  created_at?: InputMaybe<DateOperators>;
  description?: InputMaybe<TextOperators>;
  id?: InputMaybe<TextOperators>;
  name?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  updated_at?: InputMaybe<DateOperators>;
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
  heliconeRequest?: Maybe<Array<Maybe<HeliconeRequest>>>;
  heliconeRun?: Maybe<Array<Maybe<HeliconeRun>>>;
  heliconeTask?: Maybe<Array<Maybe<HeliconeTask>>>;
  user?: Maybe<Array<Maybe<User>>>;
};


export type QueryAggregatedHeliconeRequestArgs = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};


export type QueryHeliconeRequestArgs = {
  filters?: InputMaybe<Array<HeliconeRequestFilter>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHeliconeRunArgs = {
  filters?: InputMaybe<Array<HeliconeRunFilter>>;
  id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHeliconeTaskArgs = {
  filters?: InputMaybe<Array<HeliconeTaskFilter>>;
  id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  run_id?: InputMaybe<Scalars['String']['input']>;
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
