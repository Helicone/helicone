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

export type HeliconeRequest = {
  __typename?: "HeliconeRequest";
  id: Scalars["ID"];
  prompt?: Maybe<Scalars["String"]>;
  response?: Maybe<Scalars["String"]>;
  responseBody?: Maybe<Scalars["JSON"]>;
};

export type Query = {
  __typename?: "Query";
  heliconeRequest?: Maybe<Array<Maybe<HeliconeRequest>>>;
  user?: Maybe<User>;
};

export type QueryHeliconeRequestArgs = {
  after?: InputMaybe<Scalars["Int"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<RequestWhereInput>;
};

export type RequestWhereInput = {
  userId?: InputMaybe<Scalars["String"]>;
};

export type User = {
  __typename?: "User";
  id: Scalars["ID"];
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
