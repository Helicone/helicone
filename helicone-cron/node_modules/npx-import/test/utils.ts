import { expect, MockedFunction } from 'vitest'
import { npxImport } from '../lib'
import crypto from 'node:crypto'
// Surely there's a better way to mock stuff out??
import { execaCommand as _execaCommand } from 'execa'
import * as utils from '../lib/utils'
import os from 'os'
const WINDOWS = os.platform() === 'win32'
export const printPathCmd = WINDOWS ? 'set PATH' : 'printenv PATH'

const { _import, _importRelative, _resolve, _resolveRelative } = utils as unknown as {
  _import: MockedFunction<typeof utils._import>
  _importRelative: MockedFunction<typeof utils._importRelative>
  _resolve: MockedFunction<typeof utils._resolve>
  _resolveRelative: MockedFunction<typeof utils._resolveRelative>
}
const execaCommand = _execaCommand as MockedFunction<any>
export { _import, _importRelative, execaCommand, _resolve, _resolveRelative }
const MOCKS = { _import, _importRelative, execaCommand, _resolve, _resolveRelative }

let MOCK_COUNTERS: { [key in keyof typeof MOCKS]?: number } = {}
export const postAssertions = new Set<Function>()
export const runPostAssertions = async () => {
  for (const fn of postAssertions) {
    fn()
  }
  postAssertions.clear()
  MOCK_COUNTERS = {}
}
const increment = (mock: keyof typeof MOCKS) =>
  (MOCK_COUNTERS[mock] = (MOCK_COUNTERS[mock] ?? 0) + 1)
const NOOP_LOGGER = () => {}

export function matchesAllLines(...strings: string[]) {
  return new RegExp(
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    strings.map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'),
    's'
  )
}

export const npxImportLocalPackage = async (pkg: string) => {
  _import.mockResolvedValueOnce({ fake: 1, pkg: 2, mocking: 3 })
  const dynoImporto = await npxImport(pkg)
  expect(dynoImporto).toBeTruthy()
  expect(Object.keys(dynoImporto)).toStrictEqual(['fake', 'pkg', 'mocking'])
}

export async function pkgParseFailed(pkg: string | string[], errorMatcher: string | RegExp) {
  await expect(async () => {
    await npxImport(pkg, NOOP_LOGGER)
  }).rejects.toThrowError(errorMatcher)
}

export async function npxImportFailed(pkg: string | string[], errorMatcher: string | RegExp) {
  _import.mockRejectedValueOnce('not-found')
  await expect(async () => {
    await npxImport(pkg, NOOP_LOGGER)
  }).rejects.toThrowError(errorMatcher)
  expect(_import).toHaveBeenCalled()
}

export async function npxImportSucceeded(pkg: string | string[], logMatcher?: string | RegExp) {
  const pkgs = Array.isArray(pkg) ? pkg : [pkg]
  for (let i = 0; i < pkgs.length; i++) {
    _import.mockRejectedValueOnce('not-found')
  }
  const logs: string[] = []
  const imported = await npxImport(pkg, (msg: string) => logs.push(msg))
  expect(_import).toHaveBeenCalledTimes(pkgs.length)

  if (logMatcher) {
    expect(logs.join('\n')).toMatch(logMatcher)
  }
  return imported
}

export function expectMock<T = any>(
  mock: keyof typeof MOCKS,
  args: any[],
  transformSuccess: (retVal: T) => T = (x) => x
) {
  const mockedCmd = MOCKS[mock]
  const cmdNr = increment(mock)
  postAssertions.add(() => {
    expect(mockedCmd).toHaveBeenNthCalledWith(cmdNr, ...args)
  })

  return {
    returning(retVal: any | Error) {
      if (retVal instanceof Error) {
        mockedCmd.mockRejectedValueOnce(retVal)
      } else {
        mockedCmd.mockResolvedValueOnce(transformSuccess(retVal))
      }
    },
  }
}

export function expectExecaCommand(cmd: string, ...opts: any[]) {
  return expectMock<object>('execaCommand', [cmd, ...opts], (retVal) => ({
    failed: false,
    stdout: '',
    stderr: '',
    ...retVal,
  }))
}

export function expectRelativeImport(basePath: string, packageImport: string) {
  return expectMock('_importRelative', [basePath, packageImport])
}

export function randomString(length: number) {
  return crypto.randomBytes(length).toString('hex')
}

export function getBasePath(randomHash: string) {
  return WINDOWS
    ? `C:\\Users\\glen\\AppData\\Local\\npm-cache\\_npx\\${randomHash}\\node_modules`
    : `/Users/glen/.npm/_npx/${randomHash}/node_modules`
}

export function getNpxPath(randomHash: string) {
  return WINDOWS
    ? `C:\\Users\\glen\\node_modules\\.bin;C:\\Users\\node_modules\\.bin;C:\\node_modules\\.bin;C:\\Program Files\\nodejs\\node_modules\\npm\\node_modules\\@npmcli\\run-script\\lib\\node-gyp-bin;C:\\Users\\glen\\AppData\\Local\\npm-cache\\_npx\\${randomHash}\\node_modules\\.bin;C:\\Users\\glen\\bin;C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\local\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Users\\glen\\bin;C:\\Program Files (x86)\\Razer Chroma SDK\\bin;C:\\Program Files\\Razer Chroma SDK\\bin;C:\\Program Files (x86)\\Razer\\ChromaBroadcast\\bin;C:\\Program Files\\Razer\\ChromaBroadcast\\bin;C:\\Python38\\Scripts;C:
    Python38;C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0;C:\\Windows\\System32\\OpenSSH;C:\\Program Files (x86)\\NVIDIA Corporation\\PhysX\\Common;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0;C:\\WINDOWS\\System32\\OpenSSH;C:\\Program Files\\nodejs;C:\\ProgramData\\chocolatey\\bin;C:\\Program Files\\dotnet;C:\\WINDOWS\\system32\\config\\systemprofile\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\ProgramData\\DockerDesktop\\version-bin;C:\\Program Files\\NVIDIA Corporation\\NVIDIA NvDLISR;C:\\Program Files\\Cloudflare\\Cloudflare WARP;C:\\Program Files\\Git\\cmd;C:\\Users\\glen\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Program Files (x86)\\Nmap;C:\\Program Files\\JetBrains\\WebStorm 2020.3\\bin;C:\\Users\\glen\\AppData\\Local\\Programs\\Microsoft VS Code\\bin;C:\\Users\\glen\\AppData\\Roaming\\npm;C:\\Program Files\\Git\\usr\\bin\\vendor_perl;C:\\Program Files\\Git\\usr\\bin\\core_perl`
    : `/my/local/pwd/node_modules/.bin:/my/local/node_modules/.bin:/my/node_modules/.bin:/node_modules/.bin:/Users/glen/.nvm/versions/node/v18.3.0/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Users/glen/.npm/_npx/${randomHash}/node_modules/.bin:/Users/glen/go/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/X11/bin:/usr/local/go/bin`
}
