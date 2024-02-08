# Favicons

[![NPM version](https://img.shields.io/npm/v/favicons.svg)](https://www.npmjs.org/package/favicons)
[![Build Status](https://github.com/itgalaxy/favicons/actions/workflows/ci.yml/badge.svg)](https://github.com/itgalaxy/favicons/actions/workflows/ci.yml)

A **Node.js module** for generating favicons and their associated files. Originally built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Installed through NPM with:

```
npm install favicons
```

## Usage

To use Favicons, require the appropriate module and call it, optionally specifying configuration and callback objects. A sample is shown on the right. The full list of options can be found on GitHub.

Favicons generates its icons locally using pure Javascript with no external dependencies.

Please note: Favicons is tested on Node 14 and above.

```js
import { favicons } from "favicons";

const source = "test/logo.png"; // Source image(s). `string`, `buffer` or array of `string`

const configuration = {
  path: "/", // Path for overriding default icons path. `string`
  appName: null, // Your application's name. `string`
  appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
  appDescription: null, // Your application's description. `string`
  developerName: null, // Your (or your developer's) name. `string`
  developerURL: null, // Your (or your developer's) URL. `string`
  cacheBustingQueryParam: null, // Query parameter added to all URLs that acts as a cache busting system. `string | null`
  dir: "auto", // Primary text direction for name, short_name, and description
  lang: "en-US", // Primary language for name and short_name
  background: "#fff", // Background colour for flattened icons. `string`
  theme_color: "#fff", // Theme color user for example in Android's task switcher. `string`
  appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
  display: "standalone", // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
  orientation: "any", // Default orientation: "any", "natural", "portrait" or "landscape". `string`
  scope: "/", // set of URLs that the browser considers within your app
  start_url: "/?homescreen=1", // Start URL when launching the application from a device. `string`
  preferRelatedApplications: false, // Should the browser prompt the user to install the native companion app. `boolean`
  relatedApplications: undefined, // Information about the native companion apps. This will only be used if `preferRelatedApplications` is `true`. `Array<{ id: string, url: string, platform: string }>`
  version: "1.0", // Your application's version string. `string`
  pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
  loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
  manifestMaskable: false, // Maskable source image(s) for manifest.json. "true" to use default source. More information at https://web.dev/maskable-icon/. `boolean`, `string`, `buffer` or array of `string`
  icons: {
    // Platform Options:
    // - offset - offset in percentage
    // - background:
    //   * false - use default
    //   * true - force use default, e.g. set background for Android icons
    //   * color - set background for the specified icons
    //
    android: true, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
    appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
    appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
    favicons: true, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
    windows: true, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
    yandex: true, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
  },
  shortcuts: [
    // Your applications's Shortcuts (see: https://developer.mozilla.org/docs/Web/Manifest/shortcuts)
    // Array of shortcut objects:
    {
      name: "View your Inbox", // The name of the shortcut. `string`
      short_name: "inbox", // optionally, falls back to name. `string`
      description: "View your inbox messages", // optionally, not used in any implemention yet. `string`
      url: "/inbox", // The URL this shortcut should lead to. `string`
      icon: "test/inbox_shortcut.png", // source image(s) for that shortcut. `string`, `buffer` or array of `string`
    },
    // more shortcuts objects
  ],
};

try {
  const response = await favicons(source, configuration);

  console.log(response.images); // Array of { name: string, contents: <buffer> }
  console.log(response.files); // Array of { name: string, contents: <string> }
  console.log(response.html); // Array of strings (html elements)
} catch (error) {
  console.log(error.message); // Error description e.g. "An unknown error has occurred"
}
```

The default sources are as follow (groupped by platform):

```javascript
{
  "android": [
    "android-chrome-144x144.png",
    "android-chrome-192x192.png",
    "android-chrome-256x256.png",
    "android-chrome-36x36.png",
    "android-chrome-384x384.png",
    "android-chrome-48x48.png",
    "android-chrome-512x512.png",
    "android-chrome-72x72.png",
    "android-chrome-96x96.png"
  ],
  "appleIcon": [
    "apple-touch-icon-1024x1024.png",
    "apple-touch-icon-114x114.png",
    "apple-touch-icon-120x120.png",
    "apple-touch-icon-144x144.png",
    "apple-touch-icon-152x152.png",
    "apple-touch-icon-167x167.png",
    "apple-touch-icon-180x180.png",
    "apple-touch-icon-57x57.png",
    "apple-touch-icon-60x60.png",
    "apple-touch-icon-72x72.png",
    "apple-touch-icon-76x76.png",
    "apple-touch-icon-precomposed.png",
    "apple-touch-icon.png"
  ],
  "appleStartup": [
    "apple-touch-startup-image-1125x2436.png",
    "apple-touch-startup-image-1136x640.png",
    "apple-touch-startup-image-1242x2208.png",
    "apple-touch-startup-image-1242x2688.png",
    "apple-touch-startup-image-1334x750.png",
    "apple-touch-startup-image-1536x2048.png",
    "apple-touch-startup-image-1620x2160.png",
    "apple-touch-startup-image-1668x2224.png",
    "apple-touch-startup-image-1668x2388.png",
    "apple-touch-startup-image-1792x828.png",
    "apple-touch-startup-image-2048x1536.png",
    "apple-touch-startup-image-2048x2732.png",
    "apple-touch-startup-image-2160x1620.png",
    "apple-touch-startup-image-2208x1242.png",
    "apple-touch-startup-image-2224x1668.png",
    "apple-touch-startup-image-2388x1668.png",
    "apple-touch-startup-image-2436x1125.png",
    "apple-touch-startup-image-2688x1242.png",
    "apple-touch-startup-image-2732x2048.png",
    "apple-touch-startup-image-640x1136.png",
    "apple-touch-startup-image-750x1334.png",
    "apple-touch-startup-image-828x1792.png"
  ],
  "favicons": [
    "favicon-16x16.png",
    "favicon-32x32.png",
    "favicon-48x48.png",
    "favicon.ico"
  ],
  "windows": [
    "mstile-144x144.png",
    "mstile-150x150.png",
    "mstile-310x150.png",
    "mstile-310x310.png",
    "mstile-70x70.png"
  ],
  "yandex": [
    "yandex-browser-50x50.png"
  ]
}

```

You can programmatically access Favicons configuration (icon filenames, HTML, manifest files, etc) with:

```js
import { config } from "favicons";
```

Below you will find a simple working example to generate an output. Amend the `src`, `dest`, `htmlBasename` and `configuration` constants to suit your own needs.

```js
import favicons from "favicons";
import fs from "fs/promises";
import path from "path";

const src = "./icon.svg"; // Icon source file path.
const dest = "./favicons"; // Output directory path.
const htmlBasename = "index.html"; // HTML file basename.

// Configuration (see above in the README file).
const configuration = {
  path: "/favicons",
  appName: "My Great App",
  appShortName: "Great App",
  appDescription: "A great application to test itgalaxy/favicons.",
  // Extra options...
};

// Below is the processing.
const response = await favicons(src, configuration);
await fs.mkdir(dest, { recursive: true });
await Promise.all(
  response.images.map(
    async (image) =>
      await fs.writeFile(path.join(dest, image.name), image.contents),
  ),
);
await Promise.all(
  response.files.map(
    async (file) =>
      await fs.writeFile(path.join(dest, file.name), file.contents),
  ),
);
await fs.writeFile(path.join(dest, htmlBasename), response.html.join("\n"));
```

## Questions

> Why are you missing certain favicons?

Because pure Javascript modules aren't available at the moment. For example, the [El Capitan SVG favicon](https://github.com/haydenbleasel/favicons/issues/61) and the [Windows tile silhouette ability](https://github.com/haydenbleasel/favicons/issues/58) both require [SVG support](https://github.com/haydenbleasel/favicons/issues/53). If modules for these task begin to appear, please jump on the appropriate issue and we'll get on it ASAP.

## Thank you

- [@haydenbleasel](https://github.com/haydenbleasel) for this great project.
- [@phbernard](https://github.com/phbernard) for all the work we did together to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

When testing, don't forget to update snapshots whenever you edit them: `npm test -- -u`.

## [License](LICENSE)
