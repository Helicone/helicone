import type {Position} from 'unist'

export type {Options, Space} from './lib/index.js'

export {fromParse5} from './lib/index.js'

// Register data on hast.
declare module 'hast' {
  interface ElementData {
    position: {
      /**
       * Positional info of the start tag of an element.
       *
       * Field added by `hast-util-from-parse5` (a utility used inside
       * `rehype-parse` responsible for parsing HTML), when passing
       * `verbose: true`.
       */
      opening?: Position | undefined

      /**
       * Positional info of the end tag of an element.
       *
       * Field added by `hast-util-from-parse5` (a utility used inside
       * `rehype-parse` responsible for parsing HTML), when passing
       * `verbose: true`.
       */
      closing?: Position | undefined

      /**
       * Positional info of the properties of an element.
       *
       * Field added by `hast-util-from-parse5` (a utility used inside
       * `rehype-parse` responsible for parsing HTML), when passing
       * `verbose: true`.
       */
      properties?: Record<string, Position | undefined> | undefined
    }
  }

  interface RootData {
    /**
     * Whether the document was using quirksmode.
     *
     * Field added by `hast-util-from-parse5` (a utility used inside
     * `rehype-parse` responsible for parsing HTML).
     */
    quirksMode?: boolean | undefined
  }
}
