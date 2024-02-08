// This wrapper exists because JS in TS can’t export a `@type` of a function.
import type {Root} from 'nlcst'
import type {Plugin} from 'unified'

declare const retextStringify: Plugin<void[], Root, string>
export default retextStringify
