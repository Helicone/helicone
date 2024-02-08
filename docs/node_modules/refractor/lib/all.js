/**
 * @typedef {import('./core.js').RefractorRoot} RefractorRoot
 * @typedef {import('./core.js').RefractorElement} RefractorElement
 * @typedef {import('./core.js').Text} Text
 * @typedef {import('./core.js').Grammar} Grammar
 * @typedef {import('./core.js').Syntax} Syntax
 */
import markup from '../lang/markup.js'
import css from '../lang/css.js'
import clike from '../lang/clike.js'
import regex from '../lang/regex.js'
import javascript from '../lang/javascript.js'
import abap from '../lang/abap.js'
import abnf from '../lang/abnf.js'
import actionscript from '../lang/actionscript.js'
import ada from '../lang/ada.js'
import agda from '../lang/agda.js'
import al from '../lang/al.js'
import antlr4 from '../lang/antlr4.js'
import apacheconf from '../lang/apacheconf.js'
import sql from '../lang/sql.js'
import apex from '../lang/apex.js'
import apl from '../lang/apl.js'
import applescript from '../lang/applescript.js'
import aql from '../lang/aql.js'
import c from '../lang/c.js'
import cpp from '../lang/cpp.js'
import arduino from '../lang/arduino.js'
import arff from '../lang/arff.js'
import armasm from '../lang/armasm.js'
import bash from '../lang/bash.js'
import yaml from '../lang/yaml.js'
import markdown from '../lang/markdown.js'
import arturo from '../lang/arturo.js'
import asciidoc from '../lang/asciidoc.js'
import csharp from '../lang/csharp.js'
import aspnet from '../lang/aspnet.js'
import asm6502 from '../lang/asm6502.js'
import asmatmel from '../lang/asmatmel.js'
import autohotkey from '../lang/autohotkey.js'
import autoit from '../lang/autoit.js'
import avisynth from '../lang/avisynth.js'
import avroIdl from '../lang/avro-idl.js'
import awk from '../lang/awk.js'
import basic from '../lang/basic.js'
import batch from '../lang/batch.js'
import bbcode from '../lang/bbcode.js'
import bbj from '../lang/bbj.js'
import bicep from '../lang/bicep.js'
import birb from '../lang/birb.js'
import bison from '../lang/bison.js'
import bnf from '../lang/bnf.js'
import bqn from '../lang/bqn.js'
import brainfuck from '../lang/brainfuck.js'
import brightscript from '../lang/brightscript.js'
import bro from '../lang/bro.js'
import bsl from '../lang/bsl.js'
import cfscript from '../lang/cfscript.js'
import chaiscript from '../lang/chaiscript.js'
import cil from '../lang/cil.js'
import cilkc from '../lang/cilkc.js'
import cilkcpp from '../lang/cilkcpp.js'
import clojure from '../lang/clojure.js'
import cmake from '../lang/cmake.js'
import cobol from '../lang/cobol.js'
import coffeescript from '../lang/coffeescript.js'
import concurnas from '../lang/concurnas.js'
import csp from '../lang/csp.js'
import cooklang from '../lang/cooklang.js'
import coq from '../lang/coq.js'
import ruby from '../lang/ruby.js'
import crystal from '../lang/crystal.js'
import cssExtras from '../lang/css-extras.js'
import csv from '../lang/csv.js'
import cue from '../lang/cue.js'
import cypher from '../lang/cypher.js'
import d from '../lang/d.js'
import dart from '../lang/dart.js'
import dataweave from '../lang/dataweave.js'
import dax from '../lang/dax.js'
import dhall from '../lang/dhall.js'
import diff from '../lang/diff.js'
import markupTemplating from '../lang/markup-templating.js'
import django from '../lang/django.js'
import dnsZoneFile from '../lang/dns-zone-file.js'
import docker from '../lang/docker.js'
import dot from '../lang/dot.js'
import ebnf from '../lang/ebnf.js'
import editorconfig from '../lang/editorconfig.js'
import eiffel from '../lang/eiffel.js'
import ejs from '../lang/ejs.js'
import elixir from '../lang/elixir.js'
import elm from '../lang/elm.js'
import lua from '../lang/lua.js'
import etlua from '../lang/etlua.js'
import erb from '../lang/erb.js'
import erlang from '../lang/erlang.js'
import excelFormula from '../lang/excel-formula.js'
import fsharp from '../lang/fsharp.js'
import factor from '../lang/factor.js'
import $false from '../lang/false.js'
import firestoreSecurityRules from '../lang/firestore-security-rules.js'
import flow from '../lang/flow.js'
import fortran from '../lang/fortran.js'
import ftl from '../lang/ftl.js'
import gml from '../lang/gml.js'
import gap from '../lang/gap.js'
import gcode from '../lang/gcode.js'
import gdscript from '../lang/gdscript.js'
import gedcom from '../lang/gedcom.js'
import gettext from '../lang/gettext.js'
import gherkin from '../lang/gherkin.js'
import git from '../lang/git.js'
import glsl from '../lang/glsl.js'
import gn from '../lang/gn.js'
import linkerScript from '../lang/linker-script.js'
import go from '../lang/go.js'
import goModule from '../lang/go-module.js'
import gradle from '../lang/gradle.js'
import graphql from '../lang/graphql.js'
import groovy from '../lang/groovy.js'
import less from '../lang/less.js'
import scss from '../lang/scss.js'
import textile from '../lang/textile.js'
import haml from '../lang/haml.js'
import handlebars from '../lang/handlebars.js'
import haskell from '../lang/haskell.js'
import haxe from '../lang/haxe.js'
import hcl from '../lang/hcl.js'
import hlsl from '../lang/hlsl.js'
import hoon from '../lang/hoon.js'
import hpkp from '../lang/hpkp.js'
import hsts from '../lang/hsts.js'
import json from '../lang/json.js'
import uri from '../lang/uri.js'
import http from '../lang/http.js'
import ichigojam from '../lang/ichigojam.js'
import icon from '../lang/icon.js'
import icuMessageFormat from '../lang/icu-message-format.js'
import idris from '../lang/idris.js'
import ignore from '../lang/ignore.js'
import inform7 from '../lang/inform7.js'
import ini from '../lang/ini.js'
import io from '../lang/io.js'
import j from '../lang/j.js'
import java from '../lang/java.js'
import php from '../lang/php.js'
import javadoclike from '../lang/javadoclike.js'
import scala from '../lang/scala.js'
import javadoc from '../lang/javadoc.js'
import javastacktrace from '../lang/javastacktrace.js'
import jexl from '../lang/jexl.js'
import jolie from '../lang/jolie.js'
import jq from '../lang/jq.js'
import jsTemplates from '../lang/js-templates.js'
import typescript from '../lang/typescript.js'
import jsdoc from '../lang/jsdoc.js'
import n4js from '../lang/n4js.js'
import jsExtras from '../lang/js-extras.js'
import json5 from '../lang/json5.js'
import jsonp from '../lang/jsonp.js'
import jsstacktrace from '../lang/jsstacktrace.js'
import julia from '../lang/julia.js'
import keepalived from '../lang/keepalived.js'
import keyman from '../lang/keyman.js'
import kotlin from '../lang/kotlin.js'
import kumir from '../lang/kumir.js'
import kusto from '../lang/kusto.js'
import latex from '../lang/latex.js'
import latte from '../lang/latte.js'
import scheme from '../lang/scheme.js'
import lilypond from '../lang/lilypond.js'
import liquid from '../lang/liquid.js'
import lisp from '../lang/lisp.js'
import livescript from '../lang/livescript.js'
import llvm from '../lang/llvm.js'
import log from '../lang/log.js'
import lolcode from '../lang/lolcode.js'
import magma from '../lang/magma.js'
import makefile from '../lang/makefile.js'
import mata from '../lang/mata.js'
import matlab from '../lang/matlab.js'
import maxscript from '../lang/maxscript.js'
import mel from '../lang/mel.js'
import mermaid from '../lang/mermaid.js'
import metafont from '../lang/metafont.js'
import mizar from '../lang/mizar.js'
import mongodb from '../lang/mongodb.js'
import monkey from '../lang/monkey.js'
import moonscript from '../lang/moonscript.js'
import n1ql from '../lang/n1ql.js'
import nand2tetrisHdl from '../lang/nand2tetris-hdl.js'
import naniscript from '../lang/naniscript.js'
import nasm from '../lang/nasm.js'
import neon from '../lang/neon.js'
import nevod from '../lang/nevod.js'
import nginx from '../lang/nginx.js'
import nim from '../lang/nim.js'
import nix from '../lang/nix.js'
import nsis from '../lang/nsis.js'
import objectivec from '../lang/objectivec.js'
import ocaml from '../lang/ocaml.js'
import odin from '../lang/odin.js'
import opencl from '../lang/opencl.js'
import openqasm from '../lang/openqasm.js'
import oz from '../lang/oz.js'
import parigp from '../lang/parigp.js'
import parser from '../lang/parser.js'
import pascal from '../lang/pascal.js'
import pascaligo from '../lang/pascaligo.js'
import psl from '../lang/psl.js'
import pcaxis from '../lang/pcaxis.js'
import peoplecode from '../lang/peoplecode.js'
import perl from '../lang/perl.js'
import phpdoc from '../lang/phpdoc.js'
import phpExtras from '../lang/php-extras.js'
import plantUml from '../lang/plant-uml.js'
import plsql from '../lang/plsql.js'
import powerquery from '../lang/powerquery.js'
import powershell from '../lang/powershell.js'
import processing from '../lang/processing.js'
import prolog from '../lang/prolog.js'
import promql from '../lang/promql.js'
import properties from '../lang/properties.js'
import protobuf from '../lang/protobuf.js'
import stylus from '../lang/stylus.js'
import twig from '../lang/twig.js'
import pug from '../lang/pug.js'
import puppet from '../lang/puppet.js'
import pure from '../lang/pure.js'
import purebasic from '../lang/purebasic.js'
import purescript from '../lang/purescript.js'
import python from '../lang/python.js'
import qsharp from '../lang/qsharp.js'
import q from '../lang/q.js'
import qml from '../lang/qml.js'
import qore from '../lang/qore.js'
import r from '../lang/r.js'
import racket from '../lang/racket.js'
import cshtml from '../lang/cshtml.js'
import jsx from '../lang/jsx.js'
import tsx from '../lang/tsx.js'
import reason from '../lang/reason.js'
import rego from '../lang/rego.js'
import renpy from '../lang/renpy.js'
import rescript from '../lang/rescript.js'
import rest from '../lang/rest.js'
import rip from '../lang/rip.js'
import roboconf from '../lang/roboconf.js'
import robotframework from '../lang/robotframework.js'
import rust from '../lang/rust.js'
import sas from '../lang/sas.js'
import sass from '../lang/sass.js'
import shellSession from '../lang/shell-session.js'
import smali from '../lang/smali.js'
import smalltalk from '../lang/smalltalk.js'
import smarty from '../lang/smarty.js'
import sml from '../lang/sml.js'
import solidity from '../lang/solidity.js'
import solutionFile from '../lang/solution-file.js'
import soy from '../lang/soy.js'
import turtle from '../lang/turtle.js'
import sparql from '../lang/sparql.js'
import splunkSpl from '../lang/splunk-spl.js'
import sqf from '../lang/sqf.js'
import squirrel from '../lang/squirrel.js'
import stan from '../lang/stan.js'
import stata from '../lang/stata.js'
import iecst from '../lang/iecst.js'
import supercollider from '../lang/supercollider.js'
import swift from '../lang/swift.js'
import systemd from '../lang/systemd.js'
import t4Templating from '../lang/t4-templating.js'
import t4Cs from '../lang/t4-cs.js'
import vbnet from '../lang/vbnet.js'
import t4Vb from '../lang/t4-vb.js'
import tap from '../lang/tap.js'
import tcl from '../lang/tcl.js'
import tt2 from '../lang/tt2.js'
import toml from '../lang/toml.js'
import tremor from '../lang/tremor.js'
import typoscript from '../lang/typoscript.js'
import unrealscript from '../lang/unrealscript.js'
import uorazor from '../lang/uorazor.js'
import v from '../lang/v.js'
import vala from '../lang/vala.js'
import velocity from '../lang/velocity.js'
import verilog from '../lang/verilog.js'
import vhdl from '../lang/vhdl.js'
import vim from '../lang/vim.js'
import visualBasic from '../lang/visual-basic.js'
import warpscript from '../lang/warpscript.js'
import wasm from '../lang/wasm.js'
import webIdl from '../lang/web-idl.js'
import wgsl from '../lang/wgsl.js'
import wiki from '../lang/wiki.js'
import wolfram from '../lang/wolfram.js'
import wren from '../lang/wren.js'
import xeora from '../lang/xeora.js'
import xmlDoc from '../lang/xml-doc.js'
import xojo from '../lang/xojo.js'
import xquery from '../lang/xquery.js'
import yang from '../lang/yang.js'
import zig from '../lang/zig.js'
import {refractor} from './core.js'

refractor.register(markup)
refractor.register(css)
refractor.register(clike)
refractor.register(regex)
refractor.register(javascript)
refractor.register(abap)
refractor.register(abnf)
refractor.register(actionscript)
refractor.register(ada)
refractor.register(agda)
refractor.register(al)
refractor.register(antlr4)
refractor.register(apacheconf)
refractor.register(sql)
refractor.register(apex)
refractor.register(apl)
refractor.register(applescript)
refractor.register(aql)
refractor.register(c)
refractor.register(cpp)
refractor.register(arduino)
refractor.register(arff)
refractor.register(armasm)
refractor.register(bash)
refractor.register(yaml)
refractor.register(markdown)
refractor.register(arturo)
refractor.register(asciidoc)
refractor.register(csharp)
refractor.register(aspnet)
refractor.register(asm6502)
refractor.register(asmatmel)
refractor.register(autohotkey)
refractor.register(autoit)
refractor.register(avisynth)
refractor.register(avroIdl)
refractor.register(awk)
refractor.register(basic)
refractor.register(batch)
refractor.register(bbcode)
refractor.register(bbj)
refractor.register(bicep)
refractor.register(birb)
refractor.register(bison)
refractor.register(bnf)
refractor.register(bqn)
refractor.register(brainfuck)
refractor.register(brightscript)
refractor.register(bro)
refractor.register(bsl)
refractor.register(cfscript)
refractor.register(chaiscript)
refractor.register(cil)
refractor.register(cilkc)
refractor.register(cilkcpp)
refractor.register(clojure)
refractor.register(cmake)
refractor.register(cobol)
refractor.register(coffeescript)
refractor.register(concurnas)
refractor.register(csp)
refractor.register(cooklang)
refractor.register(coq)
refractor.register(ruby)
refractor.register(crystal)
refractor.register(cssExtras)
refractor.register(csv)
refractor.register(cue)
refractor.register(cypher)
refractor.register(d)
refractor.register(dart)
refractor.register(dataweave)
refractor.register(dax)
refractor.register(dhall)
refractor.register(diff)
refractor.register(markupTemplating)
refractor.register(django)
refractor.register(dnsZoneFile)
refractor.register(docker)
refractor.register(dot)
refractor.register(ebnf)
refractor.register(editorconfig)
refractor.register(eiffel)
refractor.register(ejs)
refractor.register(elixir)
refractor.register(elm)
refractor.register(lua)
refractor.register(etlua)
refractor.register(erb)
refractor.register(erlang)
refractor.register(excelFormula)
refractor.register(fsharp)
refractor.register(factor)
refractor.register($false)
refractor.register(firestoreSecurityRules)
refractor.register(flow)
refractor.register(fortran)
refractor.register(ftl)
refractor.register(gml)
refractor.register(gap)
refractor.register(gcode)
refractor.register(gdscript)
refractor.register(gedcom)
refractor.register(gettext)
refractor.register(gherkin)
refractor.register(git)
refractor.register(glsl)
refractor.register(gn)
refractor.register(linkerScript)
refractor.register(go)
refractor.register(goModule)
refractor.register(gradle)
refractor.register(graphql)
refractor.register(groovy)
refractor.register(less)
refractor.register(scss)
refractor.register(textile)
refractor.register(haml)
refractor.register(handlebars)
refractor.register(haskell)
refractor.register(haxe)
refractor.register(hcl)
refractor.register(hlsl)
refractor.register(hoon)
refractor.register(hpkp)
refractor.register(hsts)
refractor.register(json)
refractor.register(uri)
refractor.register(http)
refractor.register(ichigojam)
refractor.register(icon)
refractor.register(icuMessageFormat)
refractor.register(idris)
refractor.register(ignore)
refractor.register(inform7)
refractor.register(ini)
refractor.register(io)
refractor.register(j)
refractor.register(java)
refractor.register(php)
refractor.register(javadoclike)
refractor.register(scala)
refractor.register(javadoc)
refractor.register(javastacktrace)
refractor.register(jexl)
refractor.register(jolie)
refractor.register(jq)
refractor.register(jsTemplates)
refractor.register(typescript)
refractor.register(jsdoc)
refractor.register(n4js)
refractor.register(jsExtras)
refractor.register(json5)
refractor.register(jsonp)
refractor.register(jsstacktrace)
refractor.register(julia)
refractor.register(keepalived)
refractor.register(keyman)
refractor.register(kotlin)
refractor.register(kumir)
refractor.register(kusto)
refractor.register(latex)
refractor.register(latte)
refractor.register(scheme)
refractor.register(lilypond)
refractor.register(liquid)
refractor.register(lisp)
refractor.register(livescript)
refractor.register(llvm)
refractor.register(log)
refractor.register(lolcode)
refractor.register(magma)
refractor.register(makefile)
refractor.register(mata)
refractor.register(matlab)
refractor.register(maxscript)
refractor.register(mel)
refractor.register(mermaid)
refractor.register(metafont)
refractor.register(mizar)
refractor.register(mongodb)
refractor.register(monkey)
refractor.register(moonscript)
refractor.register(n1ql)
refractor.register(nand2tetrisHdl)
refractor.register(naniscript)
refractor.register(nasm)
refractor.register(neon)
refractor.register(nevod)
refractor.register(nginx)
refractor.register(nim)
refractor.register(nix)
refractor.register(nsis)
refractor.register(objectivec)
refractor.register(ocaml)
refractor.register(odin)
refractor.register(opencl)
refractor.register(openqasm)
refractor.register(oz)
refractor.register(parigp)
refractor.register(parser)
refractor.register(pascal)
refractor.register(pascaligo)
refractor.register(psl)
refractor.register(pcaxis)
refractor.register(peoplecode)
refractor.register(perl)
refractor.register(phpdoc)
refractor.register(phpExtras)
refractor.register(plantUml)
refractor.register(plsql)
refractor.register(powerquery)
refractor.register(powershell)
refractor.register(processing)
refractor.register(prolog)
refractor.register(promql)
refractor.register(properties)
refractor.register(protobuf)
refractor.register(stylus)
refractor.register(twig)
refractor.register(pug)
refractor.register(puppet)
refractor.register(pure)
refractor.register(purebasic)
refractor.register(purescript)
refractor.register(python)
refractor.register(qsharp)
refractor.register(q)
refractor.register(qml)
refractor.register(qore)
refractor.register(r)
refractor.register(racket)
refractor.register(cshtml)
refractor.register(jsx)
refractor.register(tsx)
refractor.register(reason)
refractor.register(rego)
refractor.register(renpy)
refractor.register(rescript)
refractor.register(rest)
refractor.register(rip)
refractor.register(roboconf)
refractor.register(robotframework)
refractor.register(rust)
refractor.register(sas)
refractor.register(sass)
refractor.register(shellSession)
refractor.register(smali)
refractor.register(smalltalk)
refractor.register(smarty)
refractor.register(sml)
refractor.register(solidity)
refractor.register(solutionFile)
refractor.register(soy)
refractor.register(turtle)
refractor.register(sparql)
refractor.register(splunkSpl)
refractor.register(sqf)
refractor.register(squirrel)
refractor.register(stan)
refractor.register(stata)
refractor.register(iecst)
refractor.register(supercollider)
refractor.register(swift)
refractor.register(systemd)
refractor.register(t4Templating)
refractor.register(t4Cs)
refractor.register(vbnet)
refractor.register(t4Vb)
refractor.register(tap)
refractor.register(tcl)
refractor.register(tt2)
refractor.register(toml)
refractor.register(tremor)
refractor.register(typoscript)
refractor.register(unrealscript)
refractor.register(uorazor)
refractor.register(v)
refractor.register(vala)
refractor.register(velocity)
refractor.register(verilog)
refractor.register(vhdl)
refractor.register(vim)
refractor.register(visualBasic)
refractor.register(warpscript)
refractor.register(wasm)
refractor.register(webIdl)
refractor.register(wgsl)
refractor.register(wiki)
refractor.register(wolfram)
refractor.register(wren)
refractor.register(xeora)
refractor.register(xmlDoc)
refractor.register(xojo)
refractor.register(xquery)
refractor.register(yang)
refractor.register(zig)

export {refractor} from './core.js'
