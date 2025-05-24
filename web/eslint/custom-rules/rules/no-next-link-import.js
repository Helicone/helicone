module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow importing from next/link",
      category: "Best Practices",
      recommended: true,
    },
    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration: (node) => {
        if (node.source.value === "next/link") {
          context.report({
            node,
            message:
              "Do not import Link from next/link. Use NavLink from react-router instead.",
          });
        }
      },
    };
  },
};
