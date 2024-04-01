let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { awaitPromise, setWasmExports, wrap } = require(String.raw`./asyncify.js`);
const { TextDecoder, TextEncoder } = require(String.raw`util`);

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let stack_pointer = 32;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
/**
*/
class Comment {

    static __wrap(ptr) {
        const obj = Object.create(Comment.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_comment_free(ptr);
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    before(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.comment_before(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    after(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.comment_after(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    replace(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.comment_replace(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    */
    remove() {
        wasm.comment_remove(this.ptr);
        return this;
    }
    /**
    * @returns {boolean}
    */
    get removed() {
        var ret = wasm.comment_removed(this.ptr);
        return ret !== 0;
    }
    /**
    * @returns {string}
    */
    get text() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.comment_text(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @param {string} text
    */
    set text(text) {
        var ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.comment_set_text(this.ptr, ptr0, len0);
    }
}
module.exports.Comment = Comment;
/**
*/
class Doctype {

    static __wrap(ptr) {
        const obj = Object.create(Doctype.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_doctype_free(ptr);
    }
    /**
    * @returns {any}
    */
    get name() {
        var ret = wasm.doctype_name(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get publicId() {
        var ret = wasm.doctype_public_id(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get systemId() {
        var ret = wasm.doctype_system_id(this.ptr);
        return takeObject(ret);
    }
}
module.exports.Doctype = Doctype;
/**
*/
class DocumentEnd {

    static __wrap(ptr) {
        const obj = Object.create(DocumentEnd.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_documentend_free(ptr);
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    append(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.documentend_append(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
}
module.exports.DocumentEnd = DocumentEnd;
/**
*/
class Element {

    static __wrap(ptr) {
        const obj = Object.create(Element.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_element_free(ptr);
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    before(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_before(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    after(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_after(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    replace(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_replace(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    */
    remove() {
        wasm.element_remove(this.ptr);
        return this;
    }
    /**
    * @returns {boolean}
    */
    get removed() {
        var ret = wasm.element_removed(this.ptr);
        return ret !== 0;
    }
    /**
    * @returns {string}
    */
    get tagName() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.element_tag_name(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @param {string} name
    */
    set tagName(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_set_tag_name(this.ptr, ptr0, len0);
    }
    /**
    * @returns {any}
    */
    get namespaceURI() {
        var ret = wasm.element_namespace_uri(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get attributes() {
        var ret = wasm.element_attributes(this.ptr);
        return takeObject(ret)[Symbol.iterator]();
    }
    /**
    * @param {string} name
    * @returns {any}
    */
    getAttribute(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.element_getAttribute(this.ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} name
    * @returns {boolean}
    */
    hasAttribute(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.element_hasAttribute(this.ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
    * @param {string} name
    * @param {string} value
    */
    setAttribute(name, value) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.element_setAttribute(this.ptr, ptr0, len0, ptr1, len1);
        return this;
    }
    /**
    * @param {string} name
    */
    removeAttribute(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_removeAttribute(this.ptr, ptr0, len0);
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    prepend(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_prepend(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    append(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_append(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    setInnerContent(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.element_setInnerContent(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    */
    removeAndKeepContent() {
        wasm.element_removeAndKeepContent(this.ptr);
        return this;
    }
    /**
    * @param {any} handler
    */
    onEndTag(handler) {
        wasm.element_onEndTag(this.ptr, addHeapObject(handler.bind(this)));
    }
}
module.exports.Element = Element;
/**
*/
class EndTag {

    static __wrap(ptr) {
        const obj = Object.create(EndTag.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_endtag_free(ptr);
    }
    /**
    * @returns {string}
    */
    get name() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.endtag_name(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @param {string} name
    */
    set name(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.endtag_set_name(this.ptr, ptr0, len0);
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    before(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.endtag_before(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    after(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.endtag_after(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    */
    remove() {
        wasm.endtag_remove(this.ptr);
        return this;
    }
}
module.exports.EndTag = EndTag;
/**
*/
class HTMLRewriter {

    static __wrap(ptr) {
        const obj = Object.create(HTMLRewriter.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_htmlrewriter_free(ptr);
    }
    /**
    * @param {any} output_sink
    * @param {any | undefined} options
    */
    constructor(output_sink, options) {
        try {
            var ret = wasm.htmlrewriter_new(addBorrowedObject(output_sink), isLikeNone(options) ? 0 : addHeapObject(options));
            return HTMLRewriter.__wrap(ret);
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @param {string} selector
    * @param {any} handlers
    */
    on(selector, handlers) {
        var ptr0 = passStringToWasm0(selector, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.htmlrewriter_on(this.ptr, ptr0, len0, addHeapObject(handlers));
        return this;
    }
    /**
    * @param {any} handlers
    */
    onDocument(handlers) {
        wasm.htmlrewriter_onDocument(this.ptr, addHeapObject(handlers));
        return this;
    }
    /**
    * @param {Uint8Array} chunk
    */
    async write(chunk) {
        var ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        await wrap(this, wasm.htmlrewriter_write, this.ptr, ptr0, len0);
    }
    /**
    */
    async end() {
        await wrap(this, wasm.htmlrewriter_end, this.ptr);
    }
    /**
    * @returns {number}
    */
    get asyncifyStackPtr() {
        var ret = wasm.htmlrewriter_asyncify_stack_ptr(this.ptr);
        return ret;
    }
}
module.exports.HTMLRewriter = HTMLRewriter;
/**
*/
class TextChunk {

    static __wrap(ptr) {
        const obj = Object.create(TextChunk.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_textchunk_free(ptr);
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    before(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.textchunk_before(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    after(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.textchunk_after(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    * @param {string} content
    * @param {any | undefined} content_type
    */
    replace(content, content_type) {
        var ptr0 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.textchunk_replace(this.ptr, ptr0, len0, isLikeNone(content_type) ? 0 : addHeapObject(content_type));
        return this;
    }
    /**
    */
    remove() {
        wasm.textchunk_remove(this.ptr);
        return this;
    }
    /**
    * @returns {boolean}
    */
    get removed() {
        var ret = wasm.textchunk_removed(this.ptr);
        return ret !== 0;
    }
    /**
    * @returns {string}
    */
    get text() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.textchunk_text(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @returns {boolean}
    */
    get lastInTextNode() {
        var ret = wasm.textchunk_last_in_text_node(this.ptr);
        return ret !== 0;
    }
}
module.exports.TextChunk = TextChunk;

module.exports.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

module.exports.__wbg_html_cd9a0f328493678b = function(arg0) {
    var ret = getObject(arg0).html;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

module.exports.__wbindgen_string_new = function(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

module.exports.__wbg_documentend_new = function(arg0) {
    var ret = DocumentEnd.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_awaitPromise_39a1101fd8518869 = function(arg0, arg1) {
    awaitPromise(arg0, getObject(arg1));
};

module.exports.__wbindgen_object_clone_ref = function(arg0) {
    var ret = getObject(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_element_c38470ed972aea27 = function(arg0) {
    var ret = getObject(arg0).element;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_comments_ba86bc03331d9378 = function(arg0) {
    var ret = getObject(arg0).comments;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_text_7800bf26cb443911 = function(arg0) {
    var ret = getObject(arg0).text;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_element_new = function(arg0) {
    var ret = Element.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_comment_new = function(arg0) {
    var ret = Comment.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_textchunk_new = function(arg0) {
    var ret = TextChunk.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_doctype_ac58c0964a59b61b = function(arg0) {
    var ret = getObject(arg0).doctype;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_comments_94d876f6c0502e82 = function(arg0) {
    var ret = getObject(arg0).comments;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_text_4606a16c30e4ae91 = function(arg0) {
    var ret = getObject(arg0).text;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_end_34efb9402eac8a4e = function(arg0) {
    var ret = getObject(arg0).end;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

module.exports.__wbg_doctype_new = function(arg0) {
    var ret = Doctype.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_endtag_new = function(arg0) {
    var ret = EndTag.__wrap(arg0);
    return addHeapObject(ret);
};

module.exports.__wbg_enableEsiTags_de6b91cc61a25874 = function(arg0) {
    var ret = getObject(arg0).enableEsiTags;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

module.exports.__wbg_String_60c4ba333b5ca1c6 = function(arg0, arg1) {
    var ret = String(getObject(arg1));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

module.exports.__wbg_new_4fee7e2900033464 = function() {
    var ret = new Array();
    return addHeapObject(ret);
};

module.exports.__wbg_push_ba9b5e3c25cff8f9 = function(arg0, arg1) {
    var ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

module.exports.__wbg_call_6c4ea719458624eb = function() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

module.exports.__wbg_new_917809a3e20a4b00 = function(arg0, arg1) {
    var ret = new TypeError(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

module.exports.__wbg_instanceof_Promise_c6535fc791fcc4d2 = function(arg0) {
    var obj = getObject(arg0);
    var ret = (obj instanceof Promise) || (Object.prototype.toString.call(obj) === '[object Promise]');
    return ret;
};

module.exports.__wbg_buffer_89a8560ab6a3d9c6 = function(arg0) {
    var ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

module.exports.__wbg_newwithbyteoffsetandlength_e45d8b33c02dc3b5 = function(arg0, arg1, arg2) {
    var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

module.exports.__wbg_new_bd2e1d010adb8a1a = function(arg0) {
    var ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

module.exports.__wbindgen_debug_string = function(arg0, arg1) {
    var ret = debugString(getObject(arg1));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

module.exports.__wbindgen_rethrow = function(arg0) {
    throw takeObject(arg0);
};

module.exports.__wbindgen_memory = function() {
    var ret = wasm.memory;
    return addHeapObject(ret);
};

const path = require('path').join(__dirname, 'html_rewriter_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
setWasmExports(wasm);
module.exports.__wasm = wasm;

