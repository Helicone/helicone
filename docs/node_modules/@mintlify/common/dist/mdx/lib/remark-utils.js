import * as acorn from 'acorn';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx';
import { mdxjsEsmFromMarkdown } from 'mdast-util-mdxjs-esm';
import { mdxJsx } from 'micromark-extension-mdx-jsx';
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm';
export const createMdxJsxAttribute = (key, value) => {
    return {
        type: 'mdxJsxAttribute',
        name: key,
        value,
    };
};
export const toMdxJsxFlowElement = (input) => {
    const tree = fromMarkdown(input, {
        extensions: [mdxJsx({ acorn: acorn, addResult: true })],
        mdastExtensions: [mdxJsxFromMarkdown()],
    });
    return tree.children[0];
};
export const getEsmNode = (input) => {
    const tree = fromMarkdown(input, {
        extensions: [mdxjsEsm({ acorn, addResult: true })],
        mdastExtensions: [mdxjsEsmFromMarkdown],
    });
    return tree.children[0];
};
export function addImportString(tree, jsx) {
    tree.children.unshift(getEsmNode(jsx));
}
export function addImport(tree, mod, name) {
    const jsx = `import { ${name} as _${name} } from '${mod}'`;
    tree.children.unshift(getEsmNode(jsx));
    return `_${name}`;
}
export function addDefaultImport(tree, mod, name) {
    const jsx = `import _${name} from '${mod}'`;
    tree.children.unshift(getEsmNode(jsx));
    return `_${name}`;
}
export function addExport(tree, name, value) {
    const jsx = `export const ${name} = ${JSON.stringify(value)}`;
    tree.children.push(getEsmNode(jsx));
}
const newlineRe = /\r\n|\r|\n/;
// Empty lines need to contain a single empty token, denoted with { empty: true }
function normalizeEmptyLines(line) {
    if (line.length === 0) {
        line.push({
            types: ['plain'],
            content: '',
            empty: true,
        });
    }
    else if (line.length === 1 && line[0].content === '') {
        line[0].empty = true;
    }
}
function appendTypes(types, add) {
    const typesSize = types.length;
    if (typesSize > 0 && types[typesSize - 1] === add) {
        return types;
    }
    return types.concat(add);
}
// Takes an array of Prism's tokens and groups them by line, turning plain
// strings into tokens as well. Tokens can become recursive in some cases,
// which means that their types are concatenated. Plain-string tokens however
// are always of type "plain".
// This is not recursive to avoid exceeding the call-stack limit, since it's unclear
// how nested Prism's tokens can become
export function normalizeTokens(tokens) {
    const typeArrStack = [[]];
    const tokenArrStack = [tokens];
    const tokenArrIndexStack = [0];
    const tokenArrSizeStack = [tokens.length];
    let i = 0;
    let stackIndex = 0;
    let currentLine = [];
    const acc = [currentLine];
    while (stackIndex > -1) {
        while ((i = tokenArrIndexStack[stackIndex]++) < tokenArrSizeStack[stackIndex]) {
            let content;
            let types = typeArrStack[stackIndex];
            const tokenArr = tokenArrStack[stackIndex];
            const token = tokenArr[i];
            // Determine content and append type to types if necessary
            if (typeof token === 'string') {
                types = stackIndex > 0 ? types : ['plain'];
                content = token;
            }
            else {
                types = appendTypes(types, token.type);
                if (token.alias) {
                    types = appendTypes(types, token.alias);
                }
                content = token.content;
            }
            // If token.content is an array, increase the stack depth and repeat this while-loop
            if (typeof content !== 'string') {
                stackIndex++;
                typeArrStack.push(types);
                tokenArrStack.push(content);
                tokenArrIndexStack.push(0);
                tokenArrSizeStack.push(content.length);
                continue;
            }
            // Split by newlines
            const splitByNewlines = content.split(newlineRe);
            const newlineCount = splitByNewlines.length;
            currentLine.push({ types, content: splitByNewlines[0] });
            // Create a new line for each string on a new line
            for (let i = 1; i < newlineCount; i++) {
                normalizeEmptyLines(currentLine);
                acc.push((currentLine = []));
                currentLine.push({ types, content: splitByNewlines[i] });
            }
        }
        // Decreate the stack depth
        stackIndex--;
        typeArrStack.pop();
        tokenArrStack.pop();
        tokenArrIndexStack.pop();
        tokenArrSizeStack.pop();
    }
    normalizeEmptyLines(currentLine);
    return acc;
}
export function simplifyToken(token) {
    if (typeof token === 'string')
        return token;
    return [
        token.type,
        Array.isArray(token.content) ? token.content.map(simplifyToken) : token.content,
    ];
}
