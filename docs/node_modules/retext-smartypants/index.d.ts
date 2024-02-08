/**
 * Plugin to replace dumb/straight/typewriter punctuation marks with smart/curly
 * punctuation marks.
 *
 * @type {import('unified').Plugin<[Options?]|[], Root>}
 */
export default function retextSmartypants(
  options?: Options | undefined
):
  | void
  | import('unified').Transformer<import('nlcst').Root, import('nlcst').Root>
export type Root = import('nlcst').Root
export type Sentence = import('nlcst').Sentence
export type Word = import('nlcst').Word
export type Symbol = import('nlcst').Symbol
export type Punctuation = import('nlcst').Punctuation
export type SentenceContent = import('nlcst').SentenceContent
/**
 * Quote characters.
 */
export type QuoteCharacterMap = {
  /**
   * Character to use for double quotes.
   */
  double: string
  /**
   * Character to use for single quotes.
   */
  single: string
}
/**
 * Configuration.
 */
export type Options = {
  /**
   * Create smart quotes.
   *
   * Converts straight double and single quotes to smart double or single
   * quotes.
   */
  quotes?: boolean | undefined
  /**
   * Characters to use for opening double and single quotes.
   */
  openingQuotes?: QuoteCharacterMap | undefined
  /**
   * Characters to use for closing double and single quotes.
   */
  closingQuotes?: QuoteCharacterMap | undefined
  /**
   * Create smart ellipses.
   *
   * Converts triple dot characters (with or without spaces between) into a
   * single Unicode ellipsis character.
   */
  ellipses?: boolean | undefined
  /**
   * Create smart quotes from backticks.
   *
   * When `true`, converts double back-ticks into an opening double quote, and
   * double straight single quotes into a closing double quote.
   *
   * When `'all'`: does the preceding and converts single back-ticks into an
   * opening single quote, and a straight single quote into a closing single
   * smart quote.
   *
   * Note: Quotes can not be `true` when `backticks` is `'all'`;
   */
  backticks?: boolean | 'all' | undefined
  /**
   * Create smart dashes.
   *
   * When `true`, converts two dashes into an em-dash character.
   *
   * When `'oldschool'`, converts two dashes into an en-dash, and three dashes
   * into an em-dash.
   *
   * When `'inverted'`, converts two dashes into an em-dash, and three dashes
   * into an en-dash.
   */
  dashes?: boolean | 'oldschool' | 'inverted' | undefined
}
export type Method = (
  node: Punctuation | Symbol,
  index: number,
  parent: Word | Sentence
) => void
