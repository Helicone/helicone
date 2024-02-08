/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import ReactDOMServer from 'react-dom/server'
import React from 'react'
import { VFileCompatible } from 'vfile'
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import spawn from 'cross-spawn'
import { ChildProcess } from 'child_process'
import treeKill from 'tree-kill'
import puppeteer, { Browser } from 'puppeteer'
import { Server } from 'http'
import handler from 'serve-handler'

import { MDXRemote, MDXRemoteProps } from '../src/index'
import { serialize } from '../src/serialize'
import { SerializeOptions } from '../src/types'

export async function renderStatic(
  mdx: VFileCompatible,
  {
    components,
    scope = {},
    mdxOptions,
    parseFrontmatter,
  }: Partial<SerializeOptions & Pick<MDXRemoteProps, 'components'>> = {}
): Promise<string> {
  const mdxSource = await serialize(mdx, {
    mdxOptions,
    parseFrontmatter,
  })

  return ReactDOMServer.renderToStaticMarkup(
    <MDXRemote {...mdxSource} components={components} scope={scope} />
  )
}

export async function getPathToPackedPackage() {
  const packageJson = JSON.parse(
    await fs.promises.readFile(
      path.join(__dirname, '..', 'package.json'),
      'utf-8'
    )
  )

  const filename = `${packageJson.name}-${packageJson.version}.tgz`

  return path.join(__dirname, '..', 'dist', filename)
}

// Create a temporary directory from one of our fixtures to run isolated tests in
// Handles installing the locally-packed next-mdx-remote
export async function createTmpTestDir(fixture: string) {
  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), `next-mdx-remote-${fixture}-`)
  )

  // copy over the fixture
  const pathToFixture = path.join(
    process.cwd(),
    '__tests__',
    'fixtures',
    fixture
  )

  await fs.promises.cp(pathToFixture, tmpDir, { recursive: true })

  // install locally packed package
  const pathToPackedPackage = await getPathToPackedPackage()

  console.log('installing dependencies in test directory')

  spawn.sync('npm', ['install', pathToPackedPackage], {
    cwd: tmpDir,
  })

  return tmpDir
}

async function cleanupTmpTestDir(tmpDir: string) {
  await fs.promises.rm(tmpDir, { recursive: true, force: true })
}

// Handles creating an isolated test dir from one of the fixtures in __tests__/fixtures/
export function createDescribe(
  name: string,
  options: { fixture: string },
  fn: ({ dir }: { dir: () => string; browser: () => Browser }) => void
): void {
  describe(name, () => {
    let tmpDir: string
    let browser: Browser

    beforeAll(async () => {
      tmpDir = await createTmpTestDir(options.fixture)
      browser = await puppeteer.launch()
    })

    fn({
      dir() {
        return tmpDir
      },
      browser() {
        return browser
      },
    })

    afterAll(async () => {
      await browser.close()
      await cleanupTmpTestDir(tmpDir)
    })
  })
}

// Starts a next dev server from the given directory on port 12333
export async function startDevServer(dir: string) {
  const childProcess = spawn('npx', ['next', 'dev', '-p', '12333'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: dir,
    env: { ...process.env, NODE_ENV: 'development', __NEXT_TEST_MODE: 'true' },
  })

  childProcess.stderr?.on('data', (chunk) => {
    process.stdout.write(chunk)
  })

  async function waitForStarted() {
    return new Promise<undefined>((resolve) => {
      childProcess.stdout?.on('data', (chunk) => {
        const msg = chunk.toString()
        process.stdout.write(chunk)

        if (msg.includes('started server on') && msg.includes('url:')) {
          resolve(undefined)
        }
      })
    })
  }

  await waitForStarted()

  return childProcess
}

// Stops running dev server using its ChildProcess instance
export async function stopDevServer(childProcess: ChildProcess) {
  console.log('stopping development server...')
  const promise = new Promise((resolve) => {
    childProcess.on('close', () => {
      console.log('development server stopped')
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    treeKill(childProcess.pid!, 'SIGKILL', () => resolve(undefined))
  })

  childProcess.kill('SIGKILL')

  await promise
}

// Runs next build and next export in the provided directory
export function buildFixture(dir: string) {
  spawn.sync('npx', ['next', 'build'], {
    stdio: 'inherit',
    cwd: dir,
    env: { ...process.env, NODE_ENV: 'production', __NEXT_TEST_MODE: 'true' },
  })
  spawn.sync('npx', ['next', 'export'], {
    stdio: 'inherit',
    cwd: dir,
    env: { ...process.env, NODE_ENV: 'production', __NEXT_TEST_MODE: 'true' },
  })
}

// Helper to read an html file in the out directory relative to the provided dir
export function readOutputFile(dir: string, name: string) {
  return fs.readFileSync(path.join(dir, 'out', `${name}.html`), 'utf8')
}

// Serves the out directory relative to the provided dir on port 1235
// TODO: we should just use next start
export function serveStatic(dir: string): Promise<Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) =>
      handler(req, res, {
        public: path.join(dir, 'out'),
      })
    )
    server.listen(1235, () => resolve(server))
  })
}
