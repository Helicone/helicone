/**
 * @typedef {import('./core.js').RefractorRoot} RefractorRoot
 * @typedef {import('./core.js').RefractorElement} RefractorElement
 * @typedef {import('./core.js').Text} Text
 * @typedef {import('./core.js').Grammar} Grammar
 * @typedef {import('./core.js').Syntax} Syntax
 */
import clike from '../lang/clike.js'
import c from '../lang/c.js'
import cpp from '../lang/cpp.js'
import arduino from '../lang/arduino.js'
import bash from '../lang/bash.js'
import csharp from '../lang/csharp.js'
import markup from '../lang/markup.js'
import css from '../lang/css.js'
import diff from '../lang/diff.js'
import go from '../lang/go.js'
import ini from '../lang/ini.js'
import java from '../lang/java.js'
import regex from '../lang/regex.js'
import javascript from '../lang/javascript.js'
import json from '../lang/json.js'
import kotlin from '../lang/kotlin.js'
import less from '../lang/less.js'
import lua from '../lang/lua.js'
import makefile from '../lang/makefile.js'
import yaml from '../lang/yaml.js'
import markdown from '../lang/markdown.js'
import objectivec from '../lang/objectivec.js'
import perl from '../lang/perl.js'
import markupTemplating from '../lang/markup-templating.js'
import php from '../lang/php.js'
import python from '../lang/python.js'
import r from '../lang/r.js'
import ruby from '../lang/ruby.js'
import rust from '../lang/rust.js'
import sass from '../lang/sass.js'
import scss from '../lang/scss.js'
import sql from '../lang/sql.js'
import swift from '../lang/swift.js'
import typescript from '../lang/typescript.js'
import basic from '../lang/basic.js'
import vbnet from '../lang/vbnet.js'
import {refractor} from './core.js'

refractor.register(clike)
refractor.register(c)
refractor.register(cpp)
refractor.register(arduino)
refractor.register(bash)
refractor.register(csharp)
refractor.register(markup)
refractor.register(css)
refractor.register(diff)
refractor.register(go)
refractor.register(ini)
refractor.register(java)
refractor.register(regex)
refractor.register(javascript)
refractor.register(json)
refractor.register(kotlin)
refractor.register(less)
refractor.register(lua)
refractor.register(makefile)
refractor.register(yaml)
refractor.register(markdown)
refractor.register(objectivec)
refractor.register(perl)
refractor.register(markupTemplating)
refractor.register(php)
refractor.register(python)
refractor.register(r)
refractor.register(ruby)
refractor.register(rust)
refractor.register(sass)
refractor.register(scss)
refractor.register(sql)
refractor.register(swift)
refractor.register(typescript)
refractor.register(basic)
refractor.register(vbnet)

export {refractor} from './core.js'
