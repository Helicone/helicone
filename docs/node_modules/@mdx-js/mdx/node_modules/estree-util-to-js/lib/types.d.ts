export type Node = import('estree-jsx').Node
export type Mapping = import('source-map').Mapping
export type State = {
  output: string
  write: (code: string, node?: Node) => void
  writeComments: boolean
  indent: string
  lineEnd: string
  indentLevel: number
  line?: number | undefined
  column?: number | undefined
  lineEndSize?: number | undefined
  mapping?: Mapping | undefined
}
export type Generator = Record<Node['type'], Handler>
/**
 * Handlers for different nodes.
 */
export type Handlers = Partial<Generator>
/**
 * Handle a particular node.
 */
export type Handler = (this: Generator, node: any, state: State) => void
