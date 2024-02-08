/**
 * @this {TokenizeContext}
 * @param {Effects} effects
 * @param {State} ok
 * @param {State} nok
 * @param {Acorn | undefined} acorn
 * @param {AcornOptions | undefined} acornOptions
 * @param {boolean | undefined} addResult
 * @param {boolean | undefined} allowLazy
 * @param {TokenType} tagType
 * @param {TokenType} tagMarkerType
 * @param {TokenType} tagClosingMarkerType
 * @param {TokenType} tagSelfClosingMarker
 * @param {TokenType} tagNameType
 * @param {TokenType} tagNamePrimaryType
 * @param {TokenType} tagNameMemberMarkerType
 * @param {TokenType} tagNameMemberType
 * @param {TokenType} tagNamePrefixMarkerType
 * @param {TokenType} tagNameLocalType
 * @param {TokenType} tagExpressionAttributeType
 * @param {TokenType} tagExpressionAttributeMarkerType
 * @param {TokenType} tagExpressionAttributeValueType
 * @param {TokenType} tagAttributeType
 * @param {TokenType} tagAttributeNameType
 * @param {TokenType} tagAttributeNamePrimaryType
 * @param {TokenType} tagAttributeNamePrefixMarkerType
 * @param {TokenType} tagAttributeNameLocalType
 * @param {TokenType} tagAttributeInitializerMarkerType
 * @param {TokenType} tagAttributeValueLiteralType
 * @param {TokenType} tagAttributeValueLiteralMarkerType
 * @param {TokenType} tagAttributeValueLiteralValueType
 * @param {TokenType} tagAttributeValueExpressionType
 * @param {TokenType} tagAttributeValueExpressionMarkerType
 * @param {TokenType} tagAttributeValueExpressionValueType
 */
export function factoryTag(
  this: import('micromark-util-types').TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
  acorn: Acorn | undefined,
  acornOptions: AcornOptions | undefined,
  addResult: boolean | undefined,
  allowLazy: boolean | undefined,
  tagType: TokenType,
  tagMarkerType: TokenType,
  tagClosingMarkerType: TokenType,
  tagSelfClosingMarker: TokenType,
  tagNameType: TokenType,
  tagNamePrimaryType: TokenType,
  tagNameMemberMarkerType: TokenType,
  tagNameMemberType: TokenType,
  tagNamePrefixMarkerType: TokenType,
  tagNameLocalType: TokenType,
  tagExpressionAttributeType: TokenType,
  tagExpressionAttributeMarkerType: TokenType,
  tagExpressionAttributeValueType: TokenType,
  tagAttributeType: TokenType,
  tagAttributeNameType: TokenType,
  tagAttributeNamePrimaryType: TokenType,
  tagAttributeNamePrefixMarkerType: TokenType,
  tagAttributeNameLocalType: TokenType,
  tagAttributeInitializerMarkerType: TokenType,
  tagAttributeValueLiteralType: TokenType,
  tagAttributeValueLiteralMarkerType: TokenType,
  tagAttributeValueLiteralValueType: TokenType,
  tagAttributeValueExpressionType: TokenType,
  tagAttributeValueExpressionMarkerType: TokenType,
  tagAttributeValueExpressionValueType: TokenType
): (
  code: import('micromark-util-types').Code
) => void | import('micromark-util-types').State
export type Acorn = import('micromark-factory-mdx-expression').Acorn
export type AcornOptions =
  import('micromark-factory-mdx-expression').AcornOptions
export type Code = import('micromark-util-types').Code
export type Effects = import('micromark-util-types').Effects
export type State = import('micromark-util-types').State
export type TokenizeContext = import('micromark-util-types').TokenizeContext
export type TokenType = import('micromark-util-types').TokenType
