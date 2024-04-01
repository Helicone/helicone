# `@miniflare/watcher`

File-system watcher module for
[Miniflare](https://github.com/cloudflare/miniflare): a fun, full-featured,
fully-local simulator for Cloudflare Workers.

## Example

```js
import { Watcher } from "@miniflare/watcher";

const watcher = new Watcher((changedPath) => {
  console.log(changedPath); // Absolute path logged on create, change, delete
});

// Add recursive directory watcher
watcher.watch("./dir");

// Add file watchers
watcher.watch(/* any iterable */ ["./file1.txt", "./file2.txt"]);

// Remove watchers
watcher.unwatch("./file1.txt");

// Remove all watchers
watcher.dispose();
```
