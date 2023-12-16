import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
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
  JSON: { input: any; output: any; }
};

export type AggregatedHeliconeRequest = {
  __typename?: 'AggregatedHeliconeRequest';
  cost?: Maybe<Scalars['Float']['output']>;
  costUSD?: Maybe<Scalars['Float']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  firstRequest: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastRequest: Scalars['String']['output'];
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

export type HeliconeJobFilter = {
  created_at?: InputMaybe<DateOperators>;
  description?: InputMaybe<TextOperators>;
  id?: InputMaybe<TextOperators>;
  name?: InputMaybe<TextOperators>;
  property?: InputMaybe<PropertyFilter>;
  updated_at?: InputMaybe<DateOperators>;
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
};


export type QueryAggregatedHeliconeRequestArgs = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};


export type QueryHeliconeRequestArgs = {
  filters?: InputMaybe<Array<HeliconeRequestFilter>>;
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

export type Value = {
  __typename?: 'Value';
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ValueFilter = {
  name: Scalars['String']['input'];
  value: TextOperators;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AggregatedHeliconeRequest: ResolverTypeWrapper<AggregatedHeliconeRequest>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateOperators: DateOperators;
  Feedback: ResolverTypeWrapper<Feedback>;
  FeedbackFilter: FeedbackFilter;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  HeliconeJobFilter: HeliconeJobFilter;
  HeliconeNodeFilter: HeliconeNodeFilter;
  HeliconeRequest: ResolverTypeWrapper<HeliconeRequest>;
  HeliconeRequestFilter: HeliconeRequestFilter;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  NumberOperators: NumberOperators;
  Property: ResolverTypeWrapper<Property>;
  PropertyFilter: PropertyFilter;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  TextOperators: TextOperators;
  Value: ResolverTypeWrapper<Value>;
  ValueFilter: ValueFilter;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AggregatedHeliconeRequest: AggregatedHeliconeRequest;
  Boolean: Scalars['Boolean']['output'];
  DateOperators: DateOperators;
  Feedback: Feedback;
  FeedbackFilter: FeedbackFilter;
  Float: Scalars['Float']['output'];
  HeliconeJobFilter: HeliconeJobFilter;
  HeliconeNodeFilter: HeliconeNodeFilter;
  HeliconeRequest: HeliconeRequest;
  HeliconeRequestFilter: HeliconeRequestFilter;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  NumberOperators: NumberOperators;
  Property: Property;
  PropertyFilter: PropertyFilter;
  Query: {};
  String: Scalars['String']['output'];
  TextOperators: TextOperators;
  Value: Value;
  ValueFilter: ValueFilter;
};

export type AggregatedHeliconeRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['AggregatedHeliconeRequest'] = ResolversParentTypes['AggregatedHeliconeRequest']> = {
  cost?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  costUSD?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  firstRequest?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastRequest?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeedbackResolvers<ContextType = any, ParentType extends ResolversParentTypes['Feedback'] = ResolversParentTypes['Feedback']> = {
  rating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HeliconeRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['HeliconeRequest'] = ResolversParentTypes['HeliconeRequest']> = {
  cacheHits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  costUSD?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  feedback?: Resolver<Maybe<ResolversTypes['Feedback']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latency?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prompt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  properties?: Resolver<Maybe<Array<Maybe<ResolversTypes['Property']>>>, ParentType, ContextType>;
  requestBody?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  response?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  responseBody?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  values?: Resolver<Maybe<Array<Maybe<ResolversTypes['Value']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type PropertyResolvers<ContextType = any, ParentType extends ResolversParentTypes['Property'] = ResolversParentTypes['Property']> = {
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  aggregatedHeliconeRequest?: Resolver<Maybe<ResolversTypes['AggregatedHeliconeRequest']>, ParentType, ContextType, Partial<QueryAggregatedHeliconeRequestArgs>>;
  heliconeRequest?: Resolver<Maybe<Array<Maybe<ResolversTypes['HeliconeRequest']>>>, ParentType, ContextType, Partial<QueryHeliconeRequestArgs>>;
};

export type ValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Value'] = ResolversParentTypes['Value']> = {
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AggregatedHeliconeRequest?: AggregatedHeliconeRequestResolvers<ContextType>;
  Feedback?: FeedbackResolvers<ContextType>;
  HeliconeRequest?: HeliconeRequestResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Property?: PropertyResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Value?: ValueResolvers<ContextType>;
};

