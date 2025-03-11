# Helicone Common Package

This package contains common utilities and types shared across Helicone services.

## Usage

Import components from this package in your code:

```typescript
import { SomeUtility } from "@helicone/common";
```

## Development

When making changes to this package, use the copy-packages.sh script to propagate changes to dependent services:

```bash
cd packages
bash copy-packages.sh -p common
```
