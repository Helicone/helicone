export {modifyChildren} from './lib/index.js'
export type Modifier<
  Kind extends import('unist').Parent<
    import('unist').Node<import('unist').Data>,
    import('unist').Data
  >
> = import('./lib/index.js').Modifier<Kind>
export type Modify<
  Kind extends import('unist').Parent<
    import('unist').Node<import('unist').Data>,
    import('unist').Data
  >
> = import('./lib/index.js').Modify<Kind>
