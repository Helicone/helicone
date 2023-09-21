import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
};

export type AggregatedHeliconeRequest = {
  __typename?: "AggregatedHeliconeRequest";
  cache?: Maybe<Cache>;
  cost?: Maybe<Scalars["Float"]>;
  costUSD?: Maybe<Scalars["Float"]>;
  firstRequest: Scalars["String"];
  id: Scalars["ID"];
  lastRequest: Scalars["String"];
};

export type Cache = {
  __typename?: "Cache";
  hits: Scalars["Int"];
  misses: Scalars["Int"];
  savedUSD: Scalars["Float"];
};

export type DateOperators = {
  gte?: InputMaybe<Scalars["String"]>;
  lte?: InputMaybe<Scalars["String"]>;
};

export type Feedback = {
  __typename?: "Feedback";
  rating: Scalars["Boolean"];
};

export type FeedbackFilter = {
  rating?: InputMaybe<Scalars["Boolean"]>;
};

export type HeliconeRequest = {
  __typename?: "HeliconeRequest";
  cacheHits?: Maybe<Scalars["Int"]>;
  costUSD: Scalars["Float"];
  createdAt: Scalars["String"];
  feedback?: Maybe<Feedback>;
  id: Scalars["ID"];
  latency?: Maybe<Scalars["Float"]>;
  model: Scalars["String"];
  prompt?: Maybe<Scalars["String"]>;
  properties?: Maybe<Array<Maybe<Property>>>;
  requestBody?: Maybe<Scalars["JSON"]>;
  response?: Maybe<Scalars["String"]>;
  responseBody?: Maybe<Scalars["JSON"]>;
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
  __typename?: "Model";
  id: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  total_completion_tokens?: Maybe<Scalars["Int"]>;
  total_prompt_tokens?: Maybe<Scalars["Int"]>;
  total_requests?: Maybe<Scalars["Int"]>;
  total_tokens?: Maybe<Scalars["Int"]>;
};

export type NumberOperators = {
  equals?: InputMaybe<Scalars["Float"]>;
  gte?: InputMaybe<Scalars["Float"]>;
  lte?: InputMaybe<Scalars["Float"]>;
  not_equals?: InputMaybe<Scalars["Float"]>;
};

export type Property = {
  __typename?: "Property";
  name?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

export type PropertyFilter = {
  name: Scalars["String"];
  value: TextOperators;
};

export type Query = {
  __typename?: "Query";
  aggregatedHeliconeRequest?: Maybe<AggregatedHeliconeRequest>;
  heliconeRequest?: Maybe<Array<Maybe<HeliconeRequest>>>;
  user?: Maybe<Array<Maybe<User>>>;
};

export type QueryAggregatedHeliconeRequestArgs = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};

export type QueryHeliconeRequestArgs = {
  filters?: InputMaybe<Array<HeliconeRequestFilter>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryUserArgs = {
  after?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type TextOperators = {
  contains?: InputMaybe<Scalars["String"]>;
  equals?: InputMaybe<Scalars["String"]>;
  ilike?: InputMaybe<Scalars["String"]>;
  like?: InputMaybe<Scalars["String"]>;
  not_equals?: InputMaybe<Scalars["String"]>;
};

export type User = {
  __typename?: "User";
  id: Scalars["String"];
  total_completion_tokens?: Maybe<Scalars["Float"]>;
  total_prompt_tokens?: Maybe<Scalars["Float"]>;
  total_requests?: Maybe<Scalars["Int"]>;
  total_tokens?: Maybe<Scalars["Float"]>;
};

export type Value = {
  __typename?: "Value";
  name?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

export type ValueFilter = {
  name: Scalars["String"];
  value: TextOperators;
};

export type GetUserQueryVariables = Exact<{ [key: string]: never }>;

export type GetUserQuery = {
  __typename?: "Query";
  user?: Array<{ __typename?: "User"; id: string } | null> | null;
};

export const GetUserDocument = gql`
  query getUser {
    user {
      id
    }
  }
`;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetUserQuery(
  baseOptions?: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(
    GetUserDocument,
    options
  );
}
export function useGetUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(
    GetUserDocument,
    options
  );
}
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserQueryResult = Apollo.QueryResult<
  GetUserQuery,
  GetUserQueryVariables
>;
