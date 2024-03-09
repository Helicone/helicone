export {visitChildren} from './lib/index.js'
export type Visitor<
  Kind extends import('unist').Parent<
    import('unist').Node<import('unist').Data>,
    import('unist').Data
  >
> = import('./lib/index.js').Visitor<Kind>
export type Visit<
  Kind extends import('unist').Parent<
    import('unist').Node<import('unist').Data>,
    import('unist').Data
  >
> = import('./lib/index.js').Visit<Kind>
