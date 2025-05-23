module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow usage of next/link in favor of react-router NavLink",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
  },
  create: function (context) {
    return {
      JSXOpeningElement: (node) => {
        if (
          node.name.name === "Link" ||
          (node.name.type === "JSXIdentifier" && node.name.name === "Link")
        ) {
          context.report({
            node,
            message:
              "Do not use Link component from next/link. Use NavLink from react-router instead.",
          });
        }
      },
    };
  },
};
