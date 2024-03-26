'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const stream$1 = require('stream');
const path = require('path');
const promises = require('fs/promises');
const sharp = require('sharp');
const escapeHtml = require('escape-html');
const xml2js = require('xml2js');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const sharp__default = /*#__PURE__*/_interopDefaultCompat(sharp);
const escapeHtml__default = /*#__PURE__*/_interopDefaultCompat(escapeHtml);
const xml2js__default = /*#__PURE__*/_interopDefaultCompat(xml2js);

const defaultOptions = {
  path: "/",
  appName: null,
  appShortName: null,
  appDescription: null,
  developerName: null,
  developerURL: null,
  cacheBustingQueryParam: null,
  dir: "auto",
  lang: "en-US",
  background: "#fff",
  theme_color: "#fff",
  appleStatusBarStyle: "black-translucent",
  display: "standalone",
  orientation: "any",
  start_url: "/?homescreen=1",
  version: "1.0",
  pixel_art: false,
  loadManifestWithCredentials: false,
  manifestRelativePaths: false,
  manifestMaskable: false,
  preferRelatedApplications: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    favicons: true,
    windows: true,
    yandex: true
  },
  output: {
    images: true,
    files: true,
    html: true
  }
};

const HEADER_SIZE = 6;
const DIRECTORY_SIZE = 16;
const COLOR_MODE = 0;
const BITMAP_SIZE = 40;
function createHeader(n) {
  const buf = Buffer.alloc(HEADER_SIZE);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(n, 4);
  return buf;
}
function createDirectory(image, offset) {
  const buf = Buffer.alloc(DIRECTORY_SIZE);
  const { width, height } = image.info;
  const size = width * height * 4 + BITMAP_SIZE;
  const bpp = 32;
  buf.writeUInt8(width === 256 ? 0 : width, 0);
  buf.writeUInt8(height === 256 ? 0 : height, 1);
  buf.writeUInt8(0, 2);
  buf.writeUInt8(0, 3);
  buf.writeUInt16LE(1, 4);
  buf.writeUInt16LE(bpp, 6);
  buf.writeUInt32LE(size, 8);
  buf.writeUInt32LE(offset, 12);
  return buf;
}
function createBitmap(image, compression) {
  const buf = Buffer.alloc(BITMAP_SIZE);
  const { width, height } = image.info;
  buf.writeUInt32LE(BITMAP_SIZE, 0);
  buf.writeInt32LE(width, 4);
  buf.writeInt32LE(height * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(compression, 16);
  buf.writeUInt32LE(width * height, 20);
  buf.writeInt32LE(0, 24);
  buf.writeInt32LE(0, 28);
  buf.writeUInt32LE(0, 32);
  buf.writeUInt32LE(0, 36);
  return buf;
}
function createDib(image) {
  const { width, height } = image.info;
  const imageData = image.data;
  const buf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < height; ++x) {
      const offset = (y * width + x) * 4;
      const r = imageData.readUInt8(offset);
      const g = imageData.readUInt8(offset + 1);
      const b = imageData.readUInt8(offset + 2);
      const a = imageData.readUInt8(offset + 3);
      const pos = (height - y - 1) * width + x;
      buf.writeUInt8(b, pos * 4);
      buf.writeUInt8(g, pos * 4 + 1);
      buf.writeUInt8(r, pos * 4 + 2);
      buf.writeUInt8(a, pos * 4 + 3);
    }
  }
  return buf;
}
function toIco(images) {
  const header = createHeader(images.length);
  let arr = [header];
  let offset = HEADER_SIZE + DIRECTORY_SIZE * images.length;
  const bitmaps = images.map((image) => {
    const bitmapHeader = createBitmap(image, COLOR_MODE);
    const dib = createDib(image);
    return Buffer.concat([bitmapHeader, dib]);
  });
  for (let i = 0; i < images.length; ++i) {
    const image = images[i];
    const bitmap = bitmaps[i];
    const dir = createDirectory(image, offset);
    arr.push(dir);
    offset += bitmap.length;
  }
  arr = [...arr, ...bitmaps];
  return Buffer.concat(arr);
}

function svgDensity(metadata, width, height) {
  if (!metadata.width || !metadata.height) {
    return void 0;
  }
  const currentDensity = metadata.density ?? 72;
  return Math.min(
    Math.max(
      1,
      currentDensity,
      currentDensity * width / metadata.width,
      currentDensity * height / metadata.height
    ),
    1e5
  );
}

function arrayComparator(a, b) {
  const aArr = [a].flat(Infinity);
  const bArr = [b].flat(Infinity);
  for (let i = 0; i < Math.max(aArr.length, bArr.length); ++i) {
    if (i >= aArr.length)
      return -1;
    if (i >= bArr.length)
      return 1;
    if (aArr[i] !== bArr[i]) {
      return aArr[i] < bArr[i] ? -1 : 1;
    }
  }
  return 0;
}
function minBy(array, comparator) {
  return array.reduce((acc, cur) => comparator(acc, cur) < 0 ? acc : cur);
}
function minByKey(array, keyFn) {
  return minBy(array, (a, b) => arrayComparator(keyFn(a), keyFn(b)));
}
function asString(arg) {
  return typeof arg === "string" || arg instanceof String ? arg.toString() : void 0;
}
async function sourceImages(src) {
  if (Buffer.isBuffer(src)) {
    try {
      return [
        {
          data: src,
          metadata: await sharp__default(src).metadata()
        }
      ];
    } catch (error) {
      return Promise.reject(new Error("Invalid image buffer"));
    }
  } else if (typeof src === "string") {
    const buffer = await promises.readFile(src);
    return await sourceImages(buffer);
  } else if (Array.isArray(src) && !src.some(Array.isArray)) {
    if (!src.length) {
      throw new Error("No source provided");
    }
    const images = await Promise.all(src.map(sourceImages));
    return images.flat();
  } else {
    throw new Error("Invalid source type provided");
  }
}
function flattenIconOptions(iconOptions) {
  return iconOptions.sizes.map((size) => ({
    ...size,
    offset: iconOptions.offset ?? 0,
    pixelArt: iconOptions.pixelArt ?? false,
    background: asString(iconOptions.background),
    transparent: iconOptions.transparent,
    rotate: iconOptions.rotate
  }));
}
function relativeTo(base, path) {
  if (!base) {
    return path;
  }
  const directory = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(path, new URL(directory, "resolve://"));
  return url.protocol === "resolve:" ? url.pathname : url.toString();
}
function bestSource(sourceset, width, height) {
  const sideSize = Math.max(width, height);
  return minByKey(sourceset, (icon) => {
    const iconSideSize = Math.max(icon.metadata.width, icon.metadata.height);
    return [
      icon.metadata.format === "svg" ? 0 : 1,
      // prefer SVG
      iconSideSize >= sideSize ? 0 : 1,
      // prefer downscale
      Math.abs(iconSideSize - sideSize)
      // prefer closest size
    ];
  });
}
async function resize(source, width, height, pixelArt) {
  if (source.metadata.format === "svg") {
    const options = {
      density: svgDensity(source.metadata, width, height)
    };
    return await sharp__default(source.data, options).resize({
      width,
      height,
      fit: sharp__default.fit.contain,
      background: "#00000000"
    }).toBuffer();
  } else {
    return await sharp__default(source.data).ensureAlpha().resize({
      width,
      height,
      fit: sharp__default.fit.contain,
      background: "#00000000",
      kernel: pixelArt && width >= source.metadata.width && height >= source.metadata.height ? "nearest" : "lanczos3"
    }).toBuffer();
  }
}
function createBlankImage(width, height, background) {
  const transparent = !background || background === "transparent";
  let image = sharp__default({
    create: {
      width,
      height,
      channels: transparent ? 4 : 3,
      background: transparent ? "#00000000" : background
    }
  });
  if (transparent) {
    image = image.ensureAlpha();
  }
  return image;
}
async function createPlane(sourceset, options) {
  const offset = Math.round(
    Math.max(options.width, options.height) * options.offset / 100
  ) || 0;
  const width = options.width - offset * 2;
  const height = options.height - offset * 2;
  const source = bestSource(sourceset, width, height);
  const image = await resize(source, width, height, options.pixelArt);
  let pipeline = createBlankImage(
    options.width,
    options.height,
    options.background
  ).composite([{ input: image, left: offset, top: offset }]);
  if (options.rotate) {
    const degrees = 90;
    pipeline = pipeline.rotate(degrees);
  }
  return pipeline;
}
function toRawImage(pipeline) {
  return pipeline.toColorspace("srgb").raw({ depth: "uchar" }).toBuffer({ resolveWithObject: true });
}
function toPng(pipeline) {
  return pipeline.png().toBuffer();
}
async function createSvg(sourceset, options) {
  const { width, height } = options;
  const source = bestSource(sourceset, width, height);
  if (source.metadata.format === "svg") {
    return source.data;
  } else {
    const pipeline = await createPlane(sourceset, options);
    const png = await toPng(pipeline);
    const encodedPng = png.toString("base64");
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${encodedPng}"/>
</svg>`
    );
  }
}
async function createFavicon(sourceset, name, iconOptions) {
  const properties = flattenIconOptions(iconOptions);
  const ext = path.extname(name);
  if (ext === ".ico" || properties.length !== 1) {
    const images = await Promise.all(
      properties.map((props) => createPlane(sourceset, props).then(toRawImage))
    );
    const contents = toIco(images);
    return { name, contents };
  } else if (ext === ".svg") {
    const contents = await createSvg(sourceset, properties[0]);
    return { name, contents };
  } else {
    const contents = await createPlane(sourceset, properties[0]).then(toPng);
    return { name, contents };
  }
}

function transparentIcon(width, height) {
  return {
    sizes: [{ width, height: height ?? width }],
    offset: 0,
    background: false,
    transparent: true,
    rotate: false
  };
}
function transparentIcons(...sizes) {
  return {
    sizes: sizes.map((size) => ({ width: size, height: size })),
    offset: 0,
    background: false,
    transparent: true,
    rotate: false
  };
}
function opaqueIcon(width, height) {
  return {
    sizes: [{ width, height: height ?? width }],
    offset: 0,
    background: true,
    transparent: false,
    rotate: false
  };
}
function maskable(options) {
  return { ...options, purpose: "maskable" };
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function uniformIconOptions(options, iconsChoice, platformConfig) {
  let result = [];
  if (Array.isArray(iconsChoice)) {
    const iconsChoices = Object.fromEntries(
      iconsChoice.map(
        (choice) => typeof choice === "object" ? [choice.name, choice] : [choice, { name: choice }]
      )
    );
    result = platformConfig.filter((iconOptions) => iconOptions.name in iconsChoices).map((iconOptions) => ({
      ...iconOptions,
      ...iconsChoices[iconOptions.name]
    }));
  } else if (typeof iconsChoice === "object") {
    result = platformConfig.filter((iconOptions) => !iconOptions.optional).map((iconOptions) => ({
      ...iconOptions,
      ...iconsChoice
    }));
  } else {
    result = platformConfig.filter((iconOptions) => !iconOptions.optional);
  }
  return result.map((iconOptions) => ({
    pixelArt: options.pixel_art,
    ...iconOptions,
    background: iconOptions.background === true ? options.background : asString(iconOptions.background)
  }));
}
class Platform {
  constructor(options, iconOptions) {
    __publicField(this, "options");
    __publicField(this, "iconOptions");
    this.options = options;
    this.iconOptions = iconOptions;
  }
  async create(sourceset) {
    const { output } = this.options;
    return {
      images: output.images ? await this.createImages(sourceset) : [],
      files: output.files ? await this.createFiles() : [],
      html: output.html ? await this.createHtml() : []
    };
  }
  async createImages(sourceset) {
    return await Promise.all(
      this.iconOptions.map(
        (iconOption) => createFavicon(sourceset, iconOption.name, iconOption)
      )
    );
  }
  async createFiles() {
    return [];
  }
  async createHtml() {
    return [];
  }
  relative(path) {
    return relativeTo(this.options.path, path);
  }
  cacheBusting(path) {
    if (typeof this.options.cacheBustingQueryParam !== "string") {
      return path;
    }
    const paramParts = this.options.cacheBustingQueryParam.split("=");
    if (paramParts.length === 1) {
      return path;
    }
    const url = new URL(path, "https://cache.busting");
    url.searchParams.set(paramParts[0], paramParts.slice(1).join("="));
    return url.origin === "https://cache.busting" ? url.pathname + url.search : url.toString();
  }
}

const ICONS_OPTIONS$5 = [
  { name: "android-chrome-36x36.png", ...transparentIcon(36) },
  { name: "android-chrome-48x48.png", ...transparentIcon(48) },
  { name: "android-chrome-72x72.png", ...transparentIcon(72) },
  { name: "android-chrome-96x96.png", ...transparentIcon(96) },
  { name: "android-chrome-144x144.png", ...transparentIcon(144) },
  { name: "android-chrome-192x192.png", ...transparentIcon(192) },
  { name: "android-chrome-256x256.png", ...transparentIcon(256) },
  { name: "android-chrome-384x384.png", ...transparentIcon(384) },
  { name: "android-chrome-512x512.png", ...transparentIcon(512) }
];
const ICONS_OPTIONS_MASKABLE = [
  {
    name: "android-chrome-maskable-36x36.png",
    ...maskable(transparentIcon(36))
  },
  {
    name: "android-chrome-maskable-48x48.png",
    ...maskable(transparentIcon(48))
  },
  {
    name: "android-chrome-maskable-72x72.png",
    ...maskable(transparentIcon(72))
  },
  {
    name: "android-chrome-maskable-96x96.png",
    ...maskable(transparentIcon(96))
  },
  {
    name: "android-chrome-maskable-144x144.png",
    ...maskable(transparentIcon(144))
  },
  {
    name: "android-chrome-maskable-192x192.png",
    ...maskable(transparentIcon(192))
  },
  {
    name: "android-chrome-maskable-256x256.png",
    ...maskable(transparentIcon(256))
  },
  {
    name: "android-chrome-maskable-384x384.png",
    ...maskable(transparentIcon(384))
  },
  {
    name: "android-chrome-maskable-512x512.png",
    ...maskable(transparentIcon(512))
  }
];
const SHORTCUT_ICONS_OPTIONS = {
  "36x36.png": transparentIcon(36),
  "48x48.png": transparentIcon(48),
  "72x72.png": transparentIcon(72),
  "96x96.png": transparentIcon(96),
  "144x144.png": transparentIcon(144),
  "192x192.png": transparentIcon(192)
};
class AndroidPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.android, ICONS_OPTIONS$5)
    );
  }
  async createImages(sourceset) {
    let icons = await Promise.all(
      this.iconOptions.map(
        (iconOption) => createFavicon(sourceset, iconOption.name, iconOption)
      )
    );
    if (this.options.manifestMaskable && typeof this.options.manifestMaskable !== "boolean") {
      const maskableSourceset = await sourceImages(
        this.options.manifestMaskable
      );
      const maskableIcons = await Promise.all(
        ICONS_OPTIONS_MASKABLE.map(
          (iconOption) => createFavicon(maskableSourceset, iconOption.name, iconOption)
        )
      );
      icons = [...icons, ...maskableIcons];
    }
    if (Array.isArray(this.options.shortcuts) && this.options.shortcuts.length > 0) {
      icons = [...icons, ...await this.shortcutIcons()];
    }
    return icons;
  }
  async createFiles() {
    return [this.manifest()];
  }
  async createHtml() {
    return [
      this.options.loadManifestWithCredentials ? `<link rel="manifest" href="${this.cacheBusting(this.relative(this.manifestFileName()))}" crossOrigin="use-credentials">` : `<link rel="manifest" href="${this.cacheBusting(this.relative(this.manifestFileName()))}">`,
      `<meta name="mobile-web-app-capable" content="yes">`,
      `<meta name="theme-color" content="${this.options.theme_color || this.options.background}">`,
      this.options.appName ? `<meta name="application-name" content="${escapeHtml__default(this.options.appName)}">` : `<meta name="application-name">`
    ];
  }
  async shortcutIcons() {
    const icons = await Promise.all(
      this.options.shortcuts.map(async (shortcut, index) => {
        if (!shortcut.name || !shortcut.url || !shortcut.icon)
          return null;
        const shortcutSourceset = await sourceImages(shortcut.icon);
        return Promise.all(
          Object.entries(SHORTCUT_ICONS_OPTIONS).map(
            ([shortcutName, option]) => createFavicon(
              shortcutSourceset,
              `shortcut${index + 1}-${shortcutName}`,
              option
            )
          )
        );
      })
    );
    return icons.flat();
  }
  manifestFileName() {
    return this.options.files?.android?.manifestFileName ?? "manifest.webmanifest";
  }
  manifest() {
    const { options } = this;
    const basePath = options.manifestRelativePaths ? null : options.path;
    const properties = {
      name: options.appName,
      short_name: options.appShortName || options.appName,
      description: options.appDescription,
      dir: options.dir,
      lang: options.lang,
      display: options.display,
      orientation: options.orientation,
      scope: options.scope,
      start_url: options.start_url,
      background_color: options.background,
      theme_color: options.theme_color
    };
    if (options.preferRelatedApplications) {
      properties.prefer_related_applications = options.preferRelatedApplications;
    }
    if (Array.isArray(options.relatedApplications) && options.relatedApplications.length > 0) {
      properties.related_applications = options.relatedApplications;
    }
    let icons = this.iconOptions;
    if (options.manifestMaskable && typeof options.manifestMaskable !== "boolean") {
      icons = [...icons, ...ICONS_OPTIONS_MASKABLE];
    }
    const defaultPurpose = options.manifestMaskable === true ? "any maskable" : "any";
    properties.icons = icons.map((iconOptions) => {
      const { width, height } = iconOptions.sizes[0];
      return {
        src: this.cacheBusting(relativeTo(basePath, iconOptions.name)),
        sizes: `${width}x${height}`,
        type: "image/png",
        purpose: iconOptions.purpose ?? defaultPurpose
      };
    });
    if (Array.isArray(options.shortcuts) && options.shortcuts.length > 0) {
      properties.shortcuts = this.manifestShortcuts(basePath);
    }
    return {
      name: this.manifestFileName(),
      contents: JSON.stringify(properties, null, 2)
    };
  }
  manifestShortcuts(basePath) {
    return this.options.shortcuts.map((shortcut, index) => {
      if (!shortcut.name || !shortcut.url)
        return null;
      return {
        name: shortcut.name,
        short_name: shortcut.short_name || shortcut.name,
        // fallback to name
        description: shortcut.description,
        // optional
        url: shortcut.url,
        icons: shortcut.icon ? Object.entries(SHORTCUT_ICONS_OPTIONS).map(
          ([shortcutName, option]) => {
            const { width, height } = option.sizes[0];
            return {
              src: this.cacheBusting(
                relativeTo(
                  basePath,
                  `shortcut${index + 1}-${shortcutName}`
                )
              ),
              sizes: `${width}x${height}`,
              type: "image/png"
            };
          }
        ) : void 0
      };
    }).filter((x) => x !== null);
  }
}

const ICONS_OPTIONS$4 = [
  { name: "apple-touch-icon-57x57.png", ...opaqueIcon(57) },
  { name: "apple-touch-icon-60x60.png", ...opaqueIcon(60) },
  { name: "apple-touch-icon-72x72.png", ...opaqueIcon(72) },
  { name: "apple-touch-icon-76x76.png", ...opaqueIcon(76) },
  { name: "apple-touch-icon-114x114.png", ...opaqueIcon(114) },
  { name: "apple-touch-icon-120x120.png", ...opaqueIcon(120) },
  { name: "apple-touch-icon-144x144.png", ...opaqueIcon(144) },
  { name: "apple-touch-icon-152x152.png", ...opaqueIcon(152) },
  { name: "apple-touch-icon-167x167.png", ...opaqueIcon(167) },
  { name: "apple-touch-icon-180x180.png", ...opaqueIcon(180) },
  { name: "apple-touch-icon-1024x1024.png", ...opaqueIcon(1024) },
  { name: "apple-touch-icon.png", ...opaqueIcon(180) },
  { name: "apple-touch-icon-precomposed.png", ...opaqueIcon(180) }
];
class AppleIconPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleIcon, ICONS_OPTIONS$4)
    );
  }
  async createHtml() {
    const icons = this.iconOptions.filter(({ name: name2 }) => /\d/.test(name2)).map((options) => {
      const { width, height } = options.sizes[0];
      return `<link rel="apple-touch-icon" sizes="${width}x${height}" href="${this.cacheBusting(this.relative(options.name))}">`;
    });
    const name = this.options.appShortName || this.options.appName;
    return [
      ...icons,
      `<meta name="apple-mobile-web-app-capable" content="yes">`,
      `<meta name="apple-mobile-web-app-status-bar-style" content="${this.options.appleStatusBarStyle}">`,
      name ? `<meta name="apple-mobile-web-app-title" content="${escapeHtml__default(name)}">` : `<meta name="apple-mobile-web-app-title">`
    ];
  }
}

const SCREEN_SIZES = [
  { deviceWidth: 320, deviceHeight: 568, pixelRatio: 2 },
  // 4" iPhone SE, iPod touch 5th generation and later
  { deviceWidth: 375, deviceHeight: 667, pixelRatio: 2 },
  // iPhone 8, iPhone 7, iPhone 6s, iPhone 6, 4.7" iPhone SE
  { deviceWidth: 375, deviceHeight: 812, pixelRatio: 3 },
  // iPhone 12 mini, iPhone 11 Pro, iPhone XS, iPhone X
  { deviceWidth: 390, deviceHeight: 844, pixelRatio: 3 },
  // iPhone 12, iPhone 12 Pro
  { deviceWidth: 393, deviceHeight: 852, pixelRatio: 3 },
  // iPhone 14 Pro, iPhone 15 Pro, iPhone 15
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 2 },
  // iPhone 11, iPhone XR
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 3 },
  // iPhone 11 Pro Max, iPhone XS Max
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 },
  // iPhone 8 Plus, iPhone 7 Plus
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 },
  // iPhone 6 Plus, iPhone 6s Plus
  { deviceWidth: 428, deviceHeight: 926, pixelRatio: 3 },
  // iPhone 12 Pro Max, iPhone 13 Pro Max, iPhone 14 Plus
  { deviceWidth: 430, deviceHeight: 932, pixelRatio: 3 },
  // iPhone 14 Pro Max, iPhone 15 Pro Max, iPhone 15 Plus
  { deviceWidth: 744, deviceHeight: 1133, pixelRatio: 2 },
  // 8.3" iPad Mini
  { deviceWidth: 768, deviceHeight: 1024, pixelRatio: 2 },
  // 9.7" iPad Pro. 7.9" iPad mini, 9.7" iPad Air, 9.7" iPad
  { deviceWidth: 810, deviceHeight: 1080, pixelRatio: 2 },
  // 10.2" iPad
  { deviceWidth: 820, deviceHeight: 1080, pixelRatio: 2 },
  // 10.9" iPad Air
  { deviceWidth: 834, deviceHeight: 1194, pixelRatio: 2 },
  // 11" iPad Pro, 10.5" iPad Pro
  { deviceWidth: 834, deviceHeight: 1112, pixelRatio: 2 },
  // 10.5" iPad Air
  { deviceWidth: 1024, deviceHeight: 1366, pixelRatio: 2 }
  // 12.9" iPad Pro
];
function iconOptions() {
  const result = {};
  for (const size of SCREEN_SIZES) {
    const pixelWidth = size.deviceWidth * size.pixelRatio;
    const pixelHeight = size.deviceHeight * size.pixelRatio;
    const namePortrait = `apple-touch-startup-image-${pixelWidth}x${pixelHeight}.png`;
    result[namePortrait] = {
      name: namePortrait,
      ...opaqueIcon(pixelWidth, pixelHeight),
      ...size,
      orientation: "portrait"
    };
    const nameLandscape = `apple-touch-startup-image-${pixelHeight}x${pixelWidth}.png`;
    result[nameLandscape] = {
      name: nameLandscape,
      ...opaqueIcon(pixelHeight, pixelWidth),
      ...size,
      orientation: "landscape"
    };
  }
  return Object.values(result);
}
const ICONS_OPTIONS$3 = iconOptions();
class AppleStartupPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleStartup, ICONS_OPTIONS$3)
    );
  }
  async createHtml() {
    return this.iconOptions.map(
      (item) => `<link rel="apple-touch-startup-image" media="(device-width: ${item.deviceWidth}px) and (device-height: ${item.deviceHeight}px) and (-webkit-device-pixel-ratio: ${item.pixelRatio}) and (orientation: ${item.orientation})" href="${this.cacheBusting(this.relative(item.name))}">`
    );
  }
}

const ICONS_OPTIONS$2 = [
  { name: "favicon.ico", ...transparentIcons(16, 24, 32, 48, 64) },
  { name: "favicon-16x16.png", ...transparentIcon(16) },
  { name: "favicon-32x32.png", ...transparentIcon(32) },
  { name: "favicon-48x48.png", ...transparentIcon(48) },
  { name: "favicon.svg", ...transparentIcon(1024), optional: true }
  // arbitrary size. if more than one svg source is given, the closest to this size will be picked.
];
class FaviconsPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.favicons, ICONS_OPTIONS$2)
    );
  }
  async createHtml() {
    return this.iconOptions.map(({ name, ...options }) => {
      if (name.endsWith(".ico")) {
        return `<link rel="icon" type="image/x-icon" href="${this.cacheBusting(this.relative(name))}">`;
      } else if (name.endsWith(".svg")) {
        return `<link rel="icon" type="image/svg+xml" href="${this.cacheBusting(this.relative(name))}">`;
      }
      const { width, height } = options.sizes[0];
      return `<link rel="icon" type="image/png" sizes="${width}x${height}" href="${this.cacheBusting(this.relative(name))}">`;
    });
  }
}

const ICONS_OPTIONS$1 = [
  { name: "mstile-70x70.png", ...transparentIcon(70) },
  { name: "mstile-144x144.png", ...transparentIcon(144) },
  { name: "mstile-150x150.png", ...transparentIcon(150) },
  { name: "mstile-310x150.png", ...transparentIcon(310, 150) },
  { name: "mstile-310x310.png", ...transparentIcon(310) }
];
const SUPPORTED_TILES = [
  { name: "square70x70logo", width: 70, height: 70 },
  { name: "square150x150logo", width: 150, height: 150 },
  { name: "wide310x150logo", width: 310, height: 150 },
  { name: "square310x310logo", width: 310, height: 310 }
];
function hasSize(size, icon) {
  return icon.sizes.length === 1 && icon.sizes[0].width === size.width && icon.sizes[0].height === size.height;
}
class WindowsPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.windows, ICONS_OPTIONS$1)
    );
    if (!this.options.background) {
      throw new Error("`background` is required for Windows icons");
    }
  }
  async createFiles() {
    return [this.browserConfig()];
  }
  async createHtml() {
    const tile = "mstile-144x144.png";
    return [
      `<meta name="msapplication-TileColor" content="${this.options.background}">`,
      this.iconOptions.find((iconOption) => iconOption.name === tile) ? `<meta name="msapplication-TileImage" content="${this.cacheBusting(this.relative(tile))}">` : "",
      `<meta name="msapplication-config" content="${this.cacheBusting(this.relative(this.manifestFileName()))}">`
    ];
  }
  manifestFileName() {
    return this.options.files?.windows?.manifestFileName ?? "browserconfig.xml";
  }
  browserConfig() {
    const basePath = this.options.manifestRelativePaths ? null : this.options.path;
    const tile = {};
    for (const { name, ...size } of SUPPORTED_TILES) {
      const icon = this.iconOptions.find(
        (iconOption) => hasSize(size, iconOption)
      );
      if (icon) {
        tile[name] = {
          $: { src: this.cacheBusting(relativeTo(basePath, icon.name)) }
        };
      }
    }
    const browserconfig = {
      browserconfig: {
        msapplication: {
          tile: { ...tile, TileColor: { _: this.options.background } }
        }
      }
    };
    const contents = new xml2js__default.Builder({
      xmldec: { version: "1.0", encoding: "utf-8", standalone: null }
    }).buildObject(browserconfig);
    return { name: this.manifestFileName(), contents };
  }
}

const ICONS_OPTIONS = [
  { name: "yandex-browser-50x50.png", ...transparentIcon(50) }
];
class YandexPlatform extends Platform {
  constructor(options) {
    super(
      options,
      uniformIconOptions(options, options.icons.yandex, ICONS_OPTIONS)
    );
  }
  async createFiles() {
    return [this.manifest()];
  }
  async createHtml() {
    return [
      `<link rel="yandex-tableau-widget" href="${this.cacheBusting(this.relative(this.manifestFileName()))}">`
    ];
  }
  manifestFileName() {
    return this.options.files?.yandex?.manifestFileName ?? "yandex-browser-manifest.json";
  }
  manifest() {
    const basePath = this.options.manifestRelativePaths ? null : this.options.path;
    const logo = this.iconOptions[0].name;
    const properties = {
      version: this.options.version,
      api_version: 1,
      layout: {
        logo: this.cacheBusting(relativeTo(basePath, logo)),
        color: this.options.background,
        show_title: true
      }
    };
    return {
      name: this.manifestFileName(),
      contents: JSON.stringify(properties, null, 2)
    };
  }
}

function getPlatform(name, options) {
  switch (name) {
    case "android":
      return new AndroidPlatform(options);
    case "appleIcon":
      return new AppleIconPlatform(options);
    case "appleStartup":
      return new AppleStartupPlatform(options);
    case "favicons":
      return new FaviconsPlatform(options);
    case "windows":
      return new WindowsPlatform(options);
    case "yandex":
      return new YandexPlatform(options);
    default:
      throw new Error(`Unsupported platform ${name}`);
  }
}

var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _options, _handleHTML, _convertContent, convertContent_fn;
const config = {
  defaults: defaultOptions
};
async function favicons(source, options = {}) {
  options = {
    ...defaultOptions,
    ...options,
    icons: { ...defaultOptions.icons, ...options.icons },
    output: { ...defaultOptions.output, ...options.output }
  };
  const sourceset = await sourceImages(source);
  const platforms = Object.keys(options.icons).filter((platform) => options.icons[platform]).sort((a, b) => {
    if (a === "favicons")
      return -1;
    if (b === "favicons")
      return 1;
    return a.localeCompare(b);
  });
  const responses = [];
  for (const platformName of platforms) {
    const platform = getPlatform(platformName, options);
    responses.push(await platform.create(sourceset));
  }
  return {
    images: responses.flatMap((r) => r.images),
    files: responses.flatMap((r) => r.files),
    html: responses.flatMap((r) => r.html)
  };
}
class FaviconStream extends stream$1.Transform {
  constructor(options, handleHTML) {
    super({ objectMode: true });
    __privateAdd(this, _convertContent);
    __privateAdd(this, _options, void 0);
    __privateAdd(this, _handleHTML, void 0);
    __privateSet(this, _options, options);
    __privateSet(this, _handleHTML, handleHTML);
  }
  _transform(file, _encoding, callback) {
    const { html: htmlPath, pipeHTML, ...options } = __privateGet(this, _options);
    favicons(file, options).then(({ images, files, html }) => {
      for (const { name, contents } of [...images, ...files]) {
        this.push({
          name,
          contents: __privateMethod(this, _convertContent, convertContent_fn).call(this, contents)
        });
      }
      if (__privateGet(this, _handleHTML)) {
        __privateGet(this, _handleHTML).call(this, html);
      }
      if (pipeHTML) {
        this.push({
          name: htmlPath,
          contents: __privateMethod(this, _convertContent, convertContent_fn).call(this, html.join("\n"))
        });
      }
      callback(null);
    }).catch(callback);
  }
}
_options = new WeakMap();
_handleHTML = new WeakMap();
_convertContent = new WeakSet();
convertContent_fn = function(contents) {
  return (__privateGet(this, _options).emitBuffers ?? true) && !Buffer.isBuffer(contents) ? Buffer.from(contents) : contents;
};
function stream(options, handleHTML) {
  return new FaviconStream(options, handleHTML);
}

exports.config = config;
exports.default = favicons;
exports.favicons = favicons;
exports.stream = stream;
