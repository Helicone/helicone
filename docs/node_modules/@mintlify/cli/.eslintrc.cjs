module.exports = {
  extends: ['@mintlify/eslint-config-typescript'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  ignorePatterns: ['.eslintrc.cjs', 'bin'],
};
