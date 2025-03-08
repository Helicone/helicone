## Making DB changes

```
bash prod_push.sh
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Development Performance Optimization

This project includes several optimized development scripts that significantly improve local development performance:

### Development Scripts

- `yarn dev:local` - Standard Next.js development server
- `yarn dev` - Standard development server with environment variables from Vercel
- `yarn dev:fast` - Faster development server with Turbopack and increased memory allocation
- `yarn dev:turbo` - Optimized Turbopack configuration with warning suppression
- `yarn dev:ultra` - High-performance Turbopack configuration with maximum memory allocation
- `yarn dev:webpack` - Standard webpack-based development server with increased memory
- `yarn dev:webpack-ultra` - Optimized webpack configuration with Babel optimizations
- `yarn dev:optimized` - Highly optimized webpack configuration for faster development
- `yarn dev:super` - Super fast development server with TypeScript checking disabled
- `yarn dev:max-perf` - Maximum performance configuration that ignores TypeScript errors
- `yarn dev:ultimate` - Ultimate performance configuration combining all optimizations
- `yarn dev:stable` - Most stable optimized configuration, avoids CSS optimization issues

### Performance Metrics

In our tests, we've seen dramatic performance improvements:

| Script               | Initial Page Load | Cached Page Load |
| -------------------- | ----------------- | ---------------- |
| `yarn dev:local`     | ~10-15s           | ~1-2s            |
| `yarn dev:optimized` | ~7s               | ~0.02s           |
| `yarn dev:max-perf`  | ~7s               | ~0.02s           |
| `yarn dev:stable`    | ~7s               | ~0.02s           |

### Recommended Usage

For the best development experience:

1. Use `yarn dev:stable` for reliable, fast performance (recommended for most cases)
2. Use `yarn dev:ultimate` for maximum performance when working on UI or non-critical code
3. Use `yarn dev:local` when you need the most accurate type checking

### Troubleshooting

If you encounter errors related to missing modules (e.g., "Cannot find module 'critters'"), install the required dependency:

```bash
yarn add critters
```

Note: The optimized scripts may bypass some type checking and other safety features, so it's recommended to run `yarn build` before committing to ensure everything works correctly.
