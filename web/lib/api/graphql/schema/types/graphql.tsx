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

export type DateOperators = {
  gte?: InputMaybe<Scalars["String"]>;
  lte?: InputMaybe<Scalars["String"]>;
};

export type HeliconeRequest = {
  __typename?: "HeliconeRequest";
  cacheHits?: Maybe<Scalars["Int"]>;
  createdAt: Scalars["String"];
  id: Scalars["ID"];
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
  id?: InputMaybe<NumberOperators>;
  prompt?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  response?: InputMaybe<TextOperators>;
  user?: InputMaybe<TextOperators>;
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
  heliconeRequest?: Maybe<Array<Maybe<HeliconeRequest>>>;
  user?: Maybe<User>;
};

export type QueryHeliconeRequestArgs = {
  after?: InputMaybe<Scalars["Int"]>;
  filters?: InputMaybe<Array<HeliconeRequestFilter>>;
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
  user?: { __typename?: "User"; id: string } | null;
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
