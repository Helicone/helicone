// overwrite: true
// schema: "http://localhost:3000/api/graphql"
// documents: "lib/api/graphql/schema/getUsers.query.graphql"
// generates:
//   lib/api/graphql/schema/types/graphql.tsx:
//     plugins:
//       - "typescript"
//       - "typescript-operations"
//       - "typescript-react-apollo"
//   ./graphql.schema.json:
//     plugins:
//       - "introspection"
//   ./src/__generated__:
//     preset: "client"
//     plugins:
//       - "typescript"
//       - "typescript-operations"
//       - "typescript-react-apollo"
//     presetConfig:

import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:3000/api/graphql",
  documents: "./**/*.tsx",
  generates: {
    "lib/api/graphql/schema/types/graphql.tsx": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
    },

    "./graphql.schema.json": {
      plugins: ["introspection"],
    },
    "lib/api/graphql/client/": {
      preset: "client",
      plugins: [],
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
};

export default config;
