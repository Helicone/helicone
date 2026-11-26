import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { defaultRehypePlugins, type StreamdownProps } from "streamdown";

const requestMarkdownSchema = {
  ...defaultSchema,
  // remark-rehype already prefixes generated footnote IDs. Keep them aligned
  // with their links, while rejecting unprefixed IDs from raw HTML.
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []).filter((attribute) => {
        const name = Array.isArray(attribute) ? attribute[0] : attribute;
        return name !== "id" && name !== "name";
      }),
      ["id", /^user-content-/],
      ["name", /^user-content-/],
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", "math-inline", "math-display"],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []).filter((attribute) => {
        const name = Array.isArray(attribute) ? attribute[0] : attribute;
        return name !== "src";
      }),
      ["src", /^(?!data:)|^data:image\/(?:png|jpeg|gif|webp|avif);base64,/i],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "data"],
  },
};

// KaTeX generates MathML and styles; sanitize the source before it runs.
export const requestMarkdownRehypePlugins: NonNullable<
  StreamdownProps["rehypePlugins"]
> = [
  defaultRehypePlugins.raw,
  [rehypeSanitize, requestMarkdownSchema],
  defaultRehypePlugins.katex,
  defaultRehypePlugins.harden,
];
