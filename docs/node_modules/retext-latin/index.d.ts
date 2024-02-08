// This wrapper exists because JS in TS can’t export a `@type` of a function.
import type {Root} from 'nlcst'
import type {Plugin, ParserClass} from 'unified'

export const Parser: ParserClass<Root>

declare const retextLatin: Plugin<void[], string, Root>
export default retextLatin
