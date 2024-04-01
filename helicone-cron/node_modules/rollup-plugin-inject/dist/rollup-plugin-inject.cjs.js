'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginutils = require('rollup-pluginutils');
var path = require('path');
var estreeWalker = require('estree-walker');
var MagicString = _interopDefault(require('magic-string'));

const escape = str => {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
};

const isReference = (node, parent) => {
  if (node.type === "MemberExpression") {
    return !node.computed && isReference(node.object, node);
  }

  if (node.type === "Identifier") {
    // TODO is this right?
    if (parent.type === "MemberExpression") return parent.computed || node === parent.object;

    // disregard the `bar` in { bar: foo }
    if (parent.type === "Property" && node !== parent.value) return false;

    // disregard the `bar` in `class Foo { bar () {...} }`
    if (parent.type === "MethodDefinition") return false;

    // disregard the `bar` in `export { foo as bar }`
    if (parent.type === "ExportSpecifier" && node !== parent.local) return;

    return true;
  }
};

const flatten = node => {
  const parts = [];

  while (node.type === "MemberExpression") {
    parts.unshift(node.property.name);
    node = node.object;
  }

  const name = node.name;
  parts.unshift(name);

  return { name, keypath: parts.join(".") };
};

function inject(options) {
  if (!options) throw new Error("Missing options");

  const filter = rollupPluginutils.createFilter(options.include, options.exclude);

  let modules = options.modules;

  if (!modules) {
    modules = Object.assign({}, options);
    delete modules.include;
    delete modules.exclude;
    delete modules.sourceMap;
    delete modules.sourcemap;
  }

  const modulesMap = new Map(Object.entries(modules));

  // Fix paths on Windows
  if (path.sep !== "/") {
    modulesMap.forEach((mod, key) => {
      modulesMap.set(
        key,
        Array.isArray(mod) ? [mod[0].split(path.sep).join("/"), mod[1]] : mod.split(path.sep).join("/")
      );
    });
  }

  const firstpass = new RegExp(
    `(?:${Array.from(modulesMap.keys())
      .map(escape)
      .join("|")})`,
    "g"
  );
  const sourceMap = options.sourceMap !== false && options.sourcemap !== false;

  return {
    name: "inject",

    transform(code, id) {
      if (!filter(id)) return null;
      if (code.search(firstpass) === -1) return null;

      if (path.sep !== "/") id = id.split(path.sep).join("/");

      let ast = null;
      try {
        ast = this.parse(code);
      } catch (err) {
        this.warn({
          code: "PARSE_ERROR",
          message: `rollup-plugin-inject: failed to parse ${id}. Consider restricting the plugin to particular files via options.include`
        });
      }
      if (!ast) {
        return null;
      }

      // analyse scopes
      let scope = rollupPluginutils.attachScopes(ast, "scope");

      const imports = new Set();
      ast.body.forEach(node => {
        if (node.type === "ImportDeclaration") {
          node.specifiers.forEach(specifier => {
            imports.add(specifier.local.name);
          });
        }
      });

      const magicString = new MagicString(code);

      const newImports = new Map();

      function handleReference(node, name, keypath) {
        let mod = modulesMap.get(keypath);
        if (mod && !imports.has(name) && !scope.contains(name)) {
          if (typeof mod === "string") mod = [mod, "default"];

          // prevent module from importing itself
          if (mod[0] === id) return;

          const hash = `${keypath}:${mod[0]}:${mod[1]}`;

          const importLocalName =
            name === keypath ? name : rollupPluginutils.makeLegalIdentifier(`$inject_${keypath}`);

          if (!newImports.has(hash)) {
            if (mod[1] === "*") {
              newImports.set(hash, `import * as ${importLocalName} from '${mod[0]}';`);
            } else {
              newImports.set(hash, `import { ${mod[1]} as ${importLocalName} } from '${mod[0]}';`);
            }
          }

          if (name !== keypath) {
            magicString.overwrite(node.start, node.end, importLocalName, {
              storeName: true
            });
          }

          return true;
        }
      }

      estreeWalker.walk(ast, {
        enter(node, parent) {
          if (sourceMap) {
            magicString.addSourcemapLocation(node.start);
            magicString.addSourcemapLocation(node.end);
          }

          if (node.scope) scope = node.scope;

          // special case – shorthand properties. because node.key === node.value,
          // we can't differentiate once we've descended into the node
          if (node.type === "Property" && node.shorthand) {
            const name = node.key.name;
            handleReference(node, name, name);
            return this.skip();
          }

          if (isReference(node, parent)) {
            const { name, keypath } = flatten(node);
            const handled = handleReference(node, name, keypath);
            if (handled) return this.skip();
          }
        },
        leave(node) {
          if (node.scope) scope = scope.parent;
        }
      });

      if (newImports.size === 0) {
        return {
          code,
          ast,
          map: sourceMap ? magicString.generateMap({ hires: true }) : null
        };
      }
      const importBlock = Array.from(newImports.values()).join("\n\n");

      magicString.prepend(importBlock + "\n\n");

      return {
        code: magicString.toString(),
        map: sourceMap ? magicString.generateMap({ hires: true }) : null
      };
    }
  };
}

module.exports = inject;
