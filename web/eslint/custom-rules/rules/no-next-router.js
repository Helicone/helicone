module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow usage of next/router",
      category: "Best Practices",
      recommended: true,
    },
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        if (node.source.value === "next/router") {
          context.report({
            node,
            message: "Do not use next/router",
          });
        }
      },
    };
  },
};
