import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  expectExecaCommand,
  npxImportFailed,
  getNpxPath,
  matchesAllLines,
  _import,
  _resolve,
  _resolveRelative,
  randomString,
  runPostAssertions,
  npxImportLocalPackage,
  npxImportSucceeded,
  expectRelativeImport,
  pkgParseFailed,
  getBasePath,
  printPathCmd,
} from './utils'
import { npxImport, npxResolve } from '../lib'

vi.mock('../lib/utils', () => {
  return {
    _import: vi.fn(),
    _importRelative: vi.fn(),
    _resolve: vi.fn(),
    _resolveRelative: vi.fn(),
  }
})
vi.mock('execa', () => {
  return {
    execaCommand: vi.fn(),
  }
})

describe(`npxImport`, () => {
  afterEach(() => {
    runPostAssertions()
    vi.clearAllMocks()
  })

  describe('already installed', () => {
    test(`should call import() and return it`, async () => {
      await npxImportLocalPackage('fake-library')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore versions when trying to import locally (for now)`, async () => {
      await npxImportLocalPackage('fake-library@1.2.3')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library@1.2.3')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore tags when trying to import locally`, async () => {
      await npxImportLocalPackage('fake-library@beta')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library@beta')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should pass through paths`, async () => {
      await npxImportLocalPackage('fake-library/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await npxImportLocalPackage('@fake/library/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })

    test(`should work with versions and paths`, async () => {
      await npxImportLocalPackage('fake-library@1.2.3/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await npxImportLocalPackage('@fake/library@1.2.3/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })
  })

  describe('failure cases', () => {
    test(`Should fail for relative paths`, async () => {
      await pkgParseFailed(
        './local-dep/index.js',
        `npx-import can only import packages, not relative paths: got ./local-dep/index.js`
      )
      await pkgParseFailed(
        '../local-dep/index.js',
        `npx-import can only import packages, not relative paths: got ../local-dep/index.js`
      )
      await pkgParseFailed(
        '/local-dep/index.js',
        `npx-import can only import packages, not relative paths: got /local-dep/index.js`
      )
    })

    test(`Should fail for invalid package names`, async () => {
      await pkgParseFailed(
        'excited!',
        `npx-import can't import invalid package name: parsed name 'excited!' from 'excited!'`
      )
      await pkgParseFailed(
        ' leading-space:and:weirdchars',
        `npx-import can't import invalid package name: parsed name ' leading-space:and:weirdchars' from ' leading-space:and:weirdchars'`
      )
      await pkgParseFailed(
        '@npm-zors/money!time.js',
        `npx-import can't import invalid package name: parsed name '@npm-zors/money!time.js' from '@npm-zors/money!time.js'`
      )
      await pkgParseFailed(
        'fs',
        `npx-import can only import NPM packages, got core module 'fs' from 'fs'`
      )
      await pkgParseFailed(
        'fs@latest',
        `npx-import can only import NPM packages, got core module 'fs' from 'fs@latest'`
      )
      await pkgParseFailed(
        'fs/promises',
        `npx-import can only import NPM packages, got core module 'fs' from 'fs/promises'`
      )
    })

    test(`Should fail for the same package passed twice`, async () => {
      await npxImportFailed(
        ['pkg-a', 'pkg-a'],
        `npx-import cannot import the same package twice! Got: 'pkg-a' but already saw 'pkg-a' earlier!`
      )
      await npxImportFailed(
        ['pkg-a@latest', 'pkg-a'],
        `npx-import cannot import the same package twice! Got: 'pkg-a' but already saw 'pkg-a' earlier!`
      )
      await npxImportFailed(
        ['pkg-a', 'pkg-a@latest'],
        `npx-import cannot import the same package twice! Got: 'pkg-a@latest' but already saw 'pkg-a' earlier!`
      )
      // Arguably, we could make this one work in future.
      await npxImportFailed(
        ['pkg-a/path.js', 'pkg-a/other.js'],
        `npx-import cannot import the same package twice! Got: 'pkg-a/other.js' but already saw 'pkg-a' earlier!`
      )
    })

    test(`Should fail if NPX can't be found`, async () => {
      expectExecaCommand('npx --version').returning({ failed: true })

      await npxImportFailed(
        'no-npx-existo',
        `Couldn't execute npx --version. Is npm installed and up-to-date?`
      )
    })

    test(`Should fail if NPX is old`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '6.1.2' })

      await npxImportFailed(
        'npm-too-old',
        `Require npm version 7+. Got '6.1.2' when running 'npx --version'`
      )
    })

    test(`Should attempt to install, passing through whatever happens`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p broken-install@^2.0.0 ${printPathCmd}`, {
        shell: true,
      }).returning(new Error('EXPLODED TRYING TO INSTALL'))

      await npxImportFailed(
        'broken-install@^2.0.0',
        matchesAllLines(
          `EXPLODED TRYING TO INSTALL`,
          `You should install broken-install locally:`,
          `pnpm add -D broken-install@^2.0.0`
        )
      )
    })

    test(`Should include tag in error instructions`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p left-pad@this-tag-no-exist ${printPathCmd}`, {
        shell: true,
      }).returning(new Error('No matching version found for left-pad@this-tag-no-exist.'))

      await npxImportFailed(
        'left-pad@this-tag-no-exist',
        matchesAllLines(
          `No matching version found for left-pad@this-tag-no-exist.`,
          `You should install left-pad locally:`,
          `pnpm add -D left-pad@this-tag-no-exist`
        )
      )
    })

    test(`Should not include path in error instructions`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p @org/pkg@my-tag ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, '@org/pkg/weird-path.js').returning(
        new Error(`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`)
      )

      await npxImportFailed(
        '@org/pkg@my-tag/weird-path.js',
        matchesAllLines(
          `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`,
          `You should install @org/pkg locally:`,
          `pnpm add -D @org/pkg@my-tag`
        )
      )
    })
  })

  describe('success cases', () => {
    test(`Should call relative import and return`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p @org/pkg@my-tag ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, '@org/pkg/lib/index.js').returning({ foo: 1, bar: 2 })

      const imported = await npxImportSucceeded(
        '@org/pkg@my-tag/lib/index.js',
        matchesAllLines(
          `@org/pkg/lib/index.js not available locally. Attempting to use npx to install temporarily.`,
          `Installing... (npx --prefer-online -y -p @org/pkg@my-tag)`,
          `Installed into ${basePath}.`,
          `To skip this step in future, run: pnpm add -D @org/pkg@my-tag`
        )
      )
      expect(imported).toStrictEqual({ foo: 1, bar: 2 })
    })

    test(`Should prefer offline for exact versions`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-offline -y -p @org/pkg@3.0.1 ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, '@org/pkg/lib/index.js').returning({ foo: 1, bar: 2 })

      const imported = await npxImportSucceeded(
        '@org/pkg@3.0.1/lib/index.js',
        matchesAllLines(
          `@org/pkg/lib/index.js not available locally. Attempting to use npx to install temporarily.`,
          `Installing... (npx --prefer-offline -y -p @org/pkg@3.0.1)`,
          `Installed into ${basePath}.`,
          `To skip this step in future, run: pnpm add -D @org/pkg@3.0.1`
        )
      )
      expect(imported).toStrictEqual({ foo: 1, bar: 2 })
    })

    test(`Should install two packages`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p pkg-a@latest -p pkg-b@latest ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, 'pkg-a').returning({ name: 'pkg-a', foo: 1 })
      expectRelativeImport(basePath, 'pkg-b').returning({ name: 'pkg-b', bar: 2 })

      const imported = await npxImportSucceeded(
        ['pkg-a', 'pkg-b'],
        matchesAllLines(
          'Packages pkg-a, pkg-b not available locally. Attempting to use npx to install temporarily.',
          'Installing... (npx --prefer-online -y -p pkg-a@latest -p pkg-b@latest)',
          `Installed into ${basePath}.`,
          'To skip this step in future, run: pnpm add -D pkg-a@latest pkg-b@latest'
        )
      )
      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1 },
        { name: 'pkg-b', bar: 2 },
      ])
    })

    test(`Should install one package if the other is already present`, async () => {
      _import.mockResolvedValueOnce({ name: 'pkg-a', foo: 1, local: true })
      _import.mockRejectedValueOnce('not-found') // pkg-b

      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-offline -y -p pkg-b@1.2.3 ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, 'pkg-b').returning({ name: 'pkg-b', bar: 2, local: false })

      const logs: string[] = []
      const imported = await npxImport(['pkg-a', 'pkg-b@1.2.3'], (msg: string) => logs.push(msg))
      expect(_import).toHaveBeenCalledTimes(2)

      expect(logs.join('\n')).toMatch(
        matchesAllLines(
          'pkg-b not available locally. Attempting to use npx to install temporarily.',
          'Installing... (npx --prefer-offline -y -p pkg-b@1.2.3)',
          `Installed into ${basePath}.`,
          'To skip this step in future, run: pnpm add -D pkg-b@1.2.3'
        )
      )
      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1, local: true },
        { name: 'pkg-b', bar: 2, local: false },
      ])
    })

    test(`Should escape versions to be path-safe`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = getBasePath(npxDirectoryHash)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx --prefer-online -y -p 'pkg-a@>1.0.0' -p 'pkg-b@*' ${printPathCmd}`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, 'pkg-a').returning({ name: 'pkg-a', foo: 1 })
      expectRelativeImport(basePath, 'pkg-b').returning({ name: 'pkg-b', bar: 2 })

      const imported = await npxImportSucceeded(
        ['pkg-a@>1.0.0', 'pkg-b@*'],
        matchesAllLines(
          'Packages pkg-a, pkg-b not available locally. Attempting to use npx to install temporarily.',
          `Installing... (npx --prefer-online -y -p 'pkg-a@>1.0.0' -p 'pkg-b@*')`,
          `Installed into ${basePath}.`,
          `To skip this step in future, run: pnpm add -D 'pkg-a@>1.0.0' 'pkg-b@*'`
        )
      )
      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1 },
        { name: 'pkg-b', bar: 2 },
      ])
    })
  })
})

describe(`npxResolve`, () => {
  afterEach(() => {
    runPostAssertions()
    vi.clearAllMocks()
  })

  test(`Should return one local one new directory`, async () => {
    const npxDirectoryHash = randomString(12)
    const basePath = getBasePath(npxDirectoryHash)

    _import.mockResolvedValueOnce({}) // pkg-a
    _import.mockRejectedValueOnce('not-found') // pkg-b

    expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
    expectExecaCommand(`npx --prefer-online -y -p pkg-b@latest ${printPathCmd}`, {
      shell: true,
    }).returning({ stdout: getNpxPath(npxDirectoryHash) })
    expectRelativeImport(basePath, 'pkg-b').returning({ name: 'pkg-b', bar: 2, local: false })

    await npxImport(['pkg-a', 'pkg-b'], () => {})
    expect(_import).toHaveBeenCalledTimes(2)

    _resolve.mockReturnValueOnce('/Users/glen/src/npx-import/pkg-a')
    const localPath = npxResolve('pkg-a')
    expect(localPath).toBe('/Users/glen/src/npx-import/pkg-a')
    expect(_resolve).toHaveBeenLastCalledWith('pkg-a')

    _resolveRelative.mockReturnValueOnce(`${basePath}/pkg-b`)
    const tempPath = npxResolve('pkg-b')
    expect(tempPath).toBe(`${basePath}/pkg-b`)
    expect(_resolveRelative).toHaveBeenLastCalledWith(basePath, 'pkg-b')
  })
})
