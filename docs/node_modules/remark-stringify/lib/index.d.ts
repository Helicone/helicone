export default function remarkStringify(
  this:
    | import('unified').Processor<
        void,
        import('mdast').Paragraph,
        import('mdast').Paragraph,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Heading,
        import('mdast').Heading,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').ThematicBreak,
        import('mdast').ThematicBreak,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Blockquote,
        import('mdast').Blockquote,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').List,
        import('mdast').List,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Table,
        import('mdast').Table,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').HTML,
        import('mdast').HTML,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Code,
        import('mdast').Code,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').YAML,
        import('mdast').YAML,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Definition,
        import('mdast').Definition,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').FootnoteDefinition,
        import('mdast').FootnoteDefinition,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Text,
        import('mdast').Text,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Emphasis,
        import('mdast').Emphasis,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Strong,
        import('mdast').Strong,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Delete,
        import('mdast').Delete,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').InlineCode,
        import('mdast').InlineCode,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Break,
        import('mdast').Break,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Image,
        import('mdast').Image,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').ImageReference,
        import('mdast').ImageReference,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Footnote,
        import('mdast').Footnote,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').FootnoteReference,
        import('mdast').FootnoteReference,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Link,
        import('mdast').Link,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').LinkReference,
        import('mdast').LinkReference,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').ListItem,
        import('mdast').ListItem,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').TableRow,
        import('mdast').TableRow,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').TableCell,
        import('mdast').TableCell,
        string
      >
    | import('unified').Processor<
        void,
        import('mdast').Root,
        import('mdast').Root,
        string
      >,
  ...settings: void[] | [Options?]
): void
export type Node = import('mdast').Root | import('mdast').Content
export type ToMarkdownOptions = import('mdast-util-to-markdown').Options
export type Options = Omit<ToMarkdownOptions, 'extensions'>
