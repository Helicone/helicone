# ![MDAST](https://cdn.rawgit.com/wooorm/mdast/master/logo.svg)

> :warning:
>
> **mdast**, the pluggable markdown parser, was recently
> separated from this project and given a new name:
> **remark**.  See its documentation to read more about
> [what changed and how to migrate »](https://github.com/wooorm/remark/releases/tag/3.0.0)

**M**ark**d**own **A**bstract **S**yntax **T**ree format.

***

**MDAST** discloses markdown as an abstract syntax tree.  _Abstract_
means not all information is stored in this tree and an exact replica
of the original document cannot be re-created.  _Syntax Tree_ means syntax
**is** present in the tree, thus an exact syntactic document can be
re-created.

## AST

### Node

Node represents any unit in MDAST hierarchy.

```idl
interface Node {
    type: string;
    data: Data | null;
    position: Location?;
}
```

### Location

**Node** can have a reference to its original location, if applicable.
Start determines the line and column at which the original location starts;
end, respectively; and indent the column at which further lines start.

```idl
interface Location {
    start: Position;
    end: Position;
    indent: [uint32 >= 1]
}
```

### Position

A position contains a column and a line.  Both start at `1`.

```idl
interface Position {
    line: uint32 >= 1;
    column: uint32 >= 1;
}
```

### Data

Data represents data associated with any node.  Data is a scope for plug-ins
to store any information.  Its only limitation being that each property should
by `stringify`able: not throw when passed to `JSON.stringify()`.

```idl
interface Data { }
```

### Parent

Most nodes inherit the **Parent** ([**Node**](#node)) interface: nodes which
accept other nodes as children.

```idl
interface Parent <: Node {
    children: [Node];
}
```

### Text

Most others inherit **Text** ([**Node**](#node)): nodes which accept a value.

```idl
interface Text <: Node {
    value: string;
}
```

### Root

**Root** ([**Parent**](#parent)) houses all nodes.

```idl
interface Root <: Parent {
    type: "root";
}
```

### Paragraph

**Paragraph** ([**Parent**](#parent)) represents a unit of discourse dealing
with a particular point or idea.

```idl
interface Paragraph <: Parent {
    type: "paragraph";
}
```

### Blockquote

**Blockquote** ([**Parent**](#parent)) represents a quote.

```idl
interface Blockquote <: Parent {
    type: "blockquote";
}
```

### Heading

**Heading** ([**Parent**](#parent)), just like with HTML, with a level greater
than or equal to 1, lower than or equal to 6.

```idl
interface Heading <: Parent {
    type: "heading";
    depth: 1 <= uint32 <= 6;
}
```

### Code

**Code** ([**Text**](#text)) occurs at block level (see **InlineCode** for
code spans).  **Code** sports a language tag (when using GitHub Flavoured
Markdown fences with a flag, `null` otherwise).

```idl
interface Code <: Text {
    type: "code";
    lang: string | null;
}
```

### InlineCode

**InlineCode** ([**Text**](#text)) occurs inline (see **Code** for blocks).
Inline code does not sport a `lang` attribute.

```idl
interface InlineCode <: Text {
    type: "inlineCode";
}
```

### YAML

**YAML** ([**Text**](#text)) can occur at the start of a document, and
contains embedded YAML data.

```idl
interface YAML <: Text {
    type: "yaml";
}
```

### HTML

**HTML** ([**Text**](#text)) contains embedded HTML.

```idl
interface HTML <: Text {
    type: "html";
}
```

### List

**List** ([**Parent**](#parent)) contains **ListItem**’s.

The `start` property contains the starting number of the list when
`ordered: true`; `null` otherwise.

When all list items have `loose: false`, the list’s `loose` property is also
`false`.  Otherwise, `loose: true`.

```idl
interface List <: Parent {
    type: "list";
    loose: true | false;
    start: uint32 | null;
    ordered: true | false;
}
```

### ListItem

**ListItem** ([**Parent**](#parent)) is a child of a **List**.

Loose **ListItem**’s often contain more than one block-level elements.

When in `gfm: true` mode, a checked property exists on **ListItem**’s,
either set to `true` (when checked), `false` (when unchecked), or `null`
(when not containing a checkbox).  See
[Task Lists on GitHub](https://help.github.com/articles/writing-on-github/#task-lists)
for information.

```idl
interface ListItem <: Parent {
    type: "listItem";
    loose: true | false;
    checked: true | false | null | undefined;
}
```

### Table

**Table** ([**Parent**](#parent)) represents tabular data, with alignment.
Its children are either **TableHeader** (the first child), or **TableRow**
(all other children).

`table.align` represents the alignment of columns.

```idl
interface Table <: Parent {
    type: "table";
    align: [alignType];
}
```

```idl
enum alignType {
    "left" | "right" | "center" | null;
}
```

### TableHeader

**TableHeader** ([**Parent**](#parent)).  Its children are always **TableCell**.

```idl
interface TableHeader <: Parent {
    type: "tableHeader";
}
```

### TableRow

**TableRow** ([**Parent**](#parent)).  Its children are always **TableCell**.

```idl
interface TableRow <: Parent {
    type: "tableRow";
}
```

### TableCell

**TableCell** ([**Parent**](#parent)).  Contains a single tabular field.

```idl
interface TableCell <: Parent {
    type: "tableCell";
}
```

### HorizontalRule

Just a **HorizontalRule** ([**Node**](#node)).

```idl
interface HorizontalRule <: Node {
    type: "horizontalRule";
}
```

### Break

**Break** ([**Node**](#node)) represents an explicit line break.

```idl
interface Break <: Node {
    type: "break";
}
```

### Emphasis

**Emphasis** ([**Parent**](#parent)) represents slightly important text.

```idl
interface Emphasis <: Parent {
    type: "emphasis";
}
```

### Strong

**Strong** ([**Parent**](#parent)) represents super important text.

```idl
interface Strong <: Parent {
    type: "strong";
}
```

### Delete

**Delete** ([**Parent**](#parent)) represents text ready for removal.

```idl
interface Delete <: Parent {
    type: "delete";
}
```

### Link

**Link** ([**Parent**](#parent)) represents the humble hyperlink.

```idl
interface Link <: Parent {
    type: "link";
    title: string | null;
    href: string;
}
```

### Image

**Image** ([**Node**](#node)) represents the figurative figure.

```idl
interface Image <: Node {
    type: "image";
    title: string | null;
    alt: string | null;
    src: string;
}
```

### Footnote

**Footnote** ([**Parent**](#parent)) represents an inline marker, whose
content relates to the document but is outside its flow.

```idl
interface Footnote <: Parent {
    type: "footnote";
}
```

### LinkReference

**Link** ([**Parent**](#parent)) represents a humble hyperlink, its `href`
and `title` defined somewhere else in the document by a **Definition**.

```idl
interface LinkReference <: Parent {
    type: "linkReference";
    identifier: string;
}
```

### ImageReference

**Link** ([**Node**](#node)) represents a figurative figure, its `src` and
`title` defined somewhere else in the document by a **Definition**.

```idl
interface ImageReference <: Node {
    type: "imageReference";
    alt: string | null;
    identifier: string;
}
```

### FootnoteReference

**FootnoteReference** ([**Node**](#node)) is like **Footnote**, but its
content is already outside the documents flow: placed in a
**FootnoteDefinition**.

```idl
interface FootnoteReference <: Node {
    type: "footnoteReference";
    identifier: string;
}
```

### Definition

**Definition** ([**Node**](#node)) represents the definition (i.e., location
and title) of a **LinkReference** or an **ImageReference**.

```idl
interface Definition <: Node {
    type: "definition";
    identifier: string;
    title: string | null;
    link: string;
}
```

### FootnoteDefinition

**FootnoteDefinition** ([**Parent**](#parent)) represents the definition
(i.e., content) of a **FootnoteReference**.

```idl
interface FootnoteDefinition <: Parent {
    type: "footnoteDefinition";
    identifier: string;
}
```

### TextNode

**TextNode** ([**Text**](#text)) represents everything that is just text.
Note that its `type` property is `text`, but it is different from **Text**.

```idl
interface TextNode <: Text {
    type: "text";
}
```

## Related

*   [remark](https://github.com/wooorm/remark)
*   [unist](https://github.com/wooorm/unist)
*   [nlcst](https://github.com/wooorm/nlcst)
*   [vfile](https://github.com/wooorm/vfile)

### License

MIT © [Titus Wormer](http://wooorm.com)
