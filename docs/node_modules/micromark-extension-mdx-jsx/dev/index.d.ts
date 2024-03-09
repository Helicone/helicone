import type {Program} from 'estree'

export {mdxJsx, type Options} from './lib/syntax.js'

declare module 'micromark-util-types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Token {
    estree?: Program
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface TokenTypeMap {
    esWhitespace: 'esWhitespace'

    mdxJsxFlowTag: 'mdxJsxFlowTag'
    mdxJsxFlowTagMarker: 'mdxJsxFlowTagMarker'
    mdxJsxFlowTagClosingMarker: 'mdxJsxFlowTagClosingMarker'
    mdxJsxFlowTagSelfClosingMarker: 'mdxJsxFlowTagSelfClosingMarker'
    mdxJsxFlowTagName: 'mdxJsxFlowTagName'
    mdxJsxFlowTagNamePrimary: 'mdxJsxFlowTagNamePrimary'
    mdxJsxFlowTagNameMemberMarker: 'mdxJsxFlowTagNameMemberMarker'
    mdxJsxFlowTagNameMember: 'mdxJsxFlowTagNameMember'
    mdxJsxFlowTagNamePrefixMarker: 'mdxJsxFlowTagNamePrefixMarker'
    mdxJsxFlowTagNameLocal: 'mdxJsxFlowTagNameLocal'
    mdxJsxFlowTagExpressionAttribute: 'mdxJsxFlowTagExpressionAttribute'
    mdxJsxFlowTagExpressionAttributeMarker: 'mdxJsxFlowTagExpressionAttributeMarker'
    mdxJsxFlowTagExpressionAttributeValue: 'mdxJsxFlowTagExpressionAttributeValue'
    mdxJsxFlowTagAttribute: 'mdxJsxFlowTagAttribute'
    mdxJsxFlowTagAttributeName: 'mdxJsxFlowTagAttributeName'
    mdxJsxFlowTagAttributeNamePrimary: 'mdxJsxFlowTagAttributeNamePrimary'
    mdxJsxFlowTagAttributeNamePrefixMarker: 'mdxJsxFlowTagAttributeNamePrefixMarker'
    mdxJsxFlowTagAttributeNameLocal: 'mdxJsxFlowTagAttributeNameLocal'
    mdxJsxFlowTagAttributeInitializerMarker: 'mdxJsxFlowTagAttributeInitializerMarker'
    mdxJsxFlowTagAttributeValueLiteral: 'mdxJsxFlowTagAttributeValueLiteral'
    mdxJsxFlowTagAttributeValueLiteralMarker: 'mdxJsxFlowTagAttributeValueLiteralMarker'
    mdxJsxFlowTagAttributeValueLiteralValue: 'mdxJsxFlowTagAttributeValueLiteralValue'
    mdxJsxFlowTagAttributeValueExpression: 'mdxJsxFlowTagAttributeValueExpression'
    mdxJsxFlowTagAttributeValueExpressionMarker: 'mdxJsxFlowTagAttributeValueExpressionMarker'
    mdxJsxFlowTagAttributeValueExpressionValue: 'mdxJsxFlowTagAttributeValueExpressionValue'

    mdxJsxTextTag: 'mdxJsxTextTag'
    mdxJsxTextTagMarker: 'mdxJsxTextTagMarker'
    mdxJsxTextTagClosingMarker: 'mdxJsxTextTagClosingMarker'
    mdxJsxTextTagSelfClosingMarker: 'mdxJsxTextTagSelfClosingMarker'
    mdxJsxTextTagName: 'mdxJsxTextTagName'
    mdxJsxTextTagNamePrimary: 'mdxJsxTextTagNamePrimary'
    mdxJsxTextTagNameMemberMarker: 'mdxJsxTextTagNameMemberMarker'
    mdxJsxTextTagNameMember: 'mdxJsxTextTagNameMember'
    mdxJsxTextTagNamePrefixMarker: 'mdxJsxTextTagNamePrefixMarker'
    mdxJsxTextTagNameLocal: 'mdxJsxTextTagNameLocal'
    mdxJsxTextTagExpressionAttribute: 'mdxJsxTextTagExpressionAttribute'
    mdxJsxTextTagExpressionAttributeMarker: 'mdxJsxTextTagExpressionAttributeMarker'
    mdxJsxTextTagExpressionAttributeValue: 'mdxJsxTextTagExpressionAttributeValue'
    mdxJsxTextTagAttribute: 'mdxJsxTextTagAttribute'
    mdxJsxTextTagAttributeName: 'mdxJsxTextTagAttributeName'
    mdxJsxTextTagAttributeNamePrimary: 'mdxJsxTextTagAttributeNamePrimary'
    mdxJsxTextTagAttributeNamePrefixMarker: 'mdxJsxTextTagAttributeNamePrefixMarker'
    mdxJsxTextTagAttributeNameLocal: 'mdxJsxTextTagAttributeNameLocal'
    mdxJsxTextTagAttributeInitializerMarker: 'mdxJsxTextTagAttributeInitializerMarker'
    mdxJsxTextTagAttributeValueLiteral: 'mdxJsxTextTagAttributeValueLiteral'
    mdxJsxTextTagAttributeValueLiteralMarker: 'mdxJsxTextTagAttributeValueLiteralMarker'
    mdxJsxTextTagAttributeValueLiteralValue: 'mdxJsxTextTagAttributeValueLiteralValue'
    mdxJsxTextTagAttributeValueExpression: 'mdxJsxTextTagAttributeValueExpression'
    mdxJsxTextTagAttributeValueExpressionMarker: 'mdxJsxTextTagAttributeValueExpressionMarker'
    mdxJsxTextTagAttributeValueExpressionValue: 'mdxJsxTextTagAttributeValueExpressionValue'
  }
}
