/**
 * Turn serialized HTML into a hast tree.
 *
 * @param {VFile | Value} value
 *   Serialized HTML to parse.
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Root}
 *   Tree.
 */
export function fromHtml(value: VFile | Value, options?: Readonly<Options> | null | undefined): Root;
export type Root = import('hast').Root;
export type ParserError = import('parse5').ParserError;
export type Value = import('vfile').Value;
/**
 * Known names of parse errors.
 */
export type ErrorCode = keyof {
    abandonedHeadElementChild: import("./errors.js").ErrorInfo;
    abruptClosingOfEmptyComment: import("./errors.js").ErrorInfo;
    abruptDoctypePublicIdentifier: import("./errors.js").ErrorInfo;
    abruptDoctypeSystemIdentifier: import("./errors.js").ErrorInfo;
    absenceOfDigitsInNumericCharacterReference: import("./errors.js").ErrorInfo;
    cdataInHtmlContent: import("./errors.js").ErrorInfo;
    characterReferenceOutsideUnicodeRange: import("./errors.js").ErrorInfo;
    closingOfElementWithOpenChildElements: import("./errors.js").ErrorInfo;
    controlCharacterInInputStream: import("./errors.js").ErrorInfo;
    controlCharacterReference: import("./errors.js").ErrorInfo;
    disallowedContentInNoscriptInHead: import("./errors.js").ErrorInfo;
    duplicateAttribute: import("./errors.js").ErrorInfo;
    endTagWithAttributes: import("./errors.js").ErrorInfo;
    endTagWithTrailingSolidus: import("./errors.js").ErrorInfo;
    endTagWithoutMatchingOpenElement: import("./errors.js").ErrorInfo;
    eofBeforeTagName: import("./errors.js").ErrorInfo;
    eofInCdata: import("./errors.js").ErrorInfo;
    eofInComment: import("./errors.js").ErrorInfo;
    eofInDoctype: import("./errors.js").ErrorInfo;
    eofInElementThatCanContainOnlyText: import("./errors.js").ErrorInfo;
    eofInScriptHtmlCommentLikeText: import("./errors.js").ErrorInfo;
    eofInTag: import("./errors.js").ErrorInfo;
    incorrectlyClosedComment: import("./errors.js").ErrorInfo;
    incorrectlyOpenedComment: import("./errors.js").ErrorInfo;
    invalidCharacterSequenceAfterDoctypeName: import("./errors.js").ErrorInfo;
    invalidFirstCharacterOfTagName: import("./errors.js").ErrorInfo;
    misplacedDoctype: import("./errors.js").ErrorInfo;
    misplacedStartTagForHeadElement: import("./errors.js").ErrorInfo;
    missingAttributeValue: import("./errors.js").ErrorInfo;
    missingDoctype: import("./errors.js").ErrorInfo;
    missingDoctypeName: import("./errors.js").ErrorInfo;
    missingDoctypePublicIdentifier: import("./errors.js").ErrorInfo;
    missingDoctypeSystemIdentifier: import("./errors.js").ErrorInfo;
    missingEndTagName: import("./errors.js").ErrorInfo;
    missingQuoteBeforeDoctypePublicIdentifier: import("./errors.js").ErrorInfo;
    missingQuoteBeforeDoctypeSystemIdentifier: import("./errors.js").ErrorInfo;
    missingSemicolonAfterCharacterReference: import("./errors.js").ErrorInfo;
    missingWhitespaceAfterDoctypePublicKeyword: import("./errors.js").ErrorInfo;
    missingWhitespaceAfterDoctypeSystemKeyword: import("./errors.js").ErrorInfo;
    missingWhitespaceBeforeDoctypeName: import("./errors.js").ErrorInfo;
    missingWhitespaceBetweenAttributes: import("./errors.js").ErrorInfo;
    missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers: import("./errors.js").ErrorInfo;
    nestedComment: import("./errors.js").ErrorInfo;
    nestedNoscriptInHead: import("./errors.js").ErrorInfo;
    nonConformingDoctype: import("./errors.js").ErrorInfo;
    nonVoidHtmlElementStartTagWithTrailingSolidus: import("./errors.js").ErrorInfo;
    noncharacterCharacterReference: import("./errors.js").ErrorInfo;
    noncharacterInInputStream: import("./errors.js").ErrorInfo;
    nullCharacterReference: import("./errors.js").ErrorInfo;
    openElementsLeftAfterEof: import("./errors.js").ErrorInfo;
    surrogateCharacterReference: import("./errors.js").ErrorInfo;
    surrogateInInputStream: import("./errors.js").ErrorInfo;
    unexpectedCharacterAfterDoctypeSystemIdentifier: import("./errors.js").ErrorInfo;
    unexpectedCharacterInAttributeName: import("./errors.js").ErrorInfo;
    unexpectedCharacterInUnquotedAttributeValue: import("./errors.js").ErrorInfo;
    unexpectedEqualsSignBeforeAttributeName: import("./errors.js").ErrorInfo;
    unexpectedNullCharacter: import("./errors.js").ErrorInfo;
    unexpectedQuestionMarkInsteadOfTagName: import("./errors.js").ErrorInfo;
    unexpectedSolidusInTag: import("./errors.js").ErrorInfo;
    unknownNamedCharacterReference: import("./errors.js").ErrorInfo;
};
/**
 * Options that define the severity of errors.
 */
export type ErrorOptions = Partial<Record<ErrorCode, ErrorSeverity | null | undefined>>;
/**
 * Error severity:
 *
 * * `0` or `false`
 * — turn the parse error off
 * * `1` or `true`
 * — turn the parse error into a warning
 * * `2`
 * — turn the parse error into an actual error: processing stops.
 */
export type ErrorSeverity = boolean | 0 | 1 | 2;
/**
 * Options that define how to parse HTML.
 */
export type ExtraOptions = {
    /**
     * Specify whether to parse a fragment, instead of a complete document
     * (default: `false`).
     *
     * In document mode, unopened `html`, `head`, and `body` elements are opened
     * in just the right places.
     */
    fragment?: boolean | null | undefined;
    /**
     * Call `onerror` with parse errors while parsing (optional).
     *
     * > 👉 **Note**: parse errors are currently being added to HTML.
     * > Not all errors emitted by parse5 (or us) are specced yet.
     * > Some documentation may still be missing.
     *
     * Specific rules can be turned off by setting them to `false` (or `0`).
     * The default, when `emitParseErrors: true`, is `true` (or `1`), and means
     * that rules emit as warnings.
     * Rules can also be configured with `2`, to turn them into fatal errors.
     */
    onerror?: OnError | null | undefined;
};
/**
 * Options that can be passed through to `hast-util-from-parse5`.
 */
export type FromParse5Options = Omit<import('hast-util-from-parse5').Options, 'file'>;
/**
 * Handle parse errors.
 */
export type OnError = (error: VFileMessage) => undefined | void;
/**
 * Configuration.
 */
export type Options = FromParse5Options & ErrorOptions & ExtraOptions;
import { VFile } from 'vfile';
import { VFileMessage } from 'vfile-message';
