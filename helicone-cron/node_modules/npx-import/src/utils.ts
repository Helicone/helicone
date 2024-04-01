/* The purpose of this file is to be mocked for testing. */
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

export async function _import(packageWithPath: string) {
  return await import(packageWithPath)
}

export async function _importRelative(installDir: string, packageWithPath: string) {
  return await import(pathToFileURL(_resolveRelative(installDir, packageWithPath)).href)
}

export function _resolve(packageWithPath: string) {
  const require = createRequire(import.meta.url)
  return require.resolve(packageWithPath)
}

export function _resolveRelative(installDir: string, packageWithPath: string) {
  return createRequire(pathToFileURL(installDir).href).resolve(packageWithPath)
}
