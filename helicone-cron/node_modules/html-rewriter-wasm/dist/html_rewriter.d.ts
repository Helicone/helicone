export interface ContentTypeOptions {
  html?: boolean;
}

export class Element {
  before(content: string, options?: ContentTypeOptions): this;
  after(content: string, options?: ContentTypeOptions): this;
  replace(content: string, options?: ContentTypeOptions): this;
  remove(): this;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): this;
  removeAttribute(name: string): this;
  prepend(content: string, options?: ContentTypeOptions): this;
  append(content: string, options?: ContentTypeOptions): this;
  setInnerContent(content: string, options?: ContentTypeOptions): this;
  removeAndKeepContent(): this;
  readonly attributes: IterableIterator<[string, string]>;
  readonly namespaceURI: string;
  readonly removed: boolean;
  tagName: string;
  onEndTag(handler: (this: this, endTag: EndTag) => void | Promise<void>): void;
}

export class EndTag {
  before(content: string, options?: ContentTypeOptions): this;
  after(content: string, options?: ContentTypeOptions): this;
  remove(): this;
  name: string;
}

export class Comment {
  before(content: string, options?: ContentTypeOptions): this;
  after(content: string, options?: ContentTypeOptions): this;
  replace(content: string, options?: ContentTypeOptions): this;
  remove(): this;
  readonly removed: boolean;
  text: string;
}

export class TextChunk {
  before(content: string, options?: ContentTypeOptions): this;
  after(content: string, options?: ContentTypeOptions): this;
  replace(content: string, options?: ContentTypeOptions): this;
  remove(): this;
  readonly lastInTextNode: boolean;
  readonly removed: boolean;
  readonly text: string;
}

export class Doctype {
  readonly name: string | null;
  readonly publicId: string | null;
  readonly systemId: string | null;
}

export class DocumentEnd {
  append(content: string, options?: ContentTypeOptions): this;
}

export interface ElementHandlers {
  element?(element: Element): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(text: TextChunk): void | Promise<void>;
}

export interface DocumentHandlers {
  doctype?(doctype: Doctype): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(text: TextChunk): void | Promise<void>;
  end?(end: DocumentEnd): void | Promise<void>;
}

export interface HTMLRewriterOptions {
  enableEsiTags?: boolean;
}

export class HTMLRewriter {
  constructor(
    outputSink: (chunk: Uint8Array) => void,
    options?: HTMLRewriterOptions
  );
  on(selector: string, handlers: ElementHandlers): this;
  onDocument(handlers: DocumentHandlers): this;
  write(chunk: Uint8Array): Promise<void>;
  end(): Promise<void>;
  free(): void;
}
