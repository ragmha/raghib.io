export const rstackVersionPattern = /^v\d+\.\d+\.\d+$/
export const rstackPathPattern = /^(?:skills\/[a-z0-9-]+|agents\/[a-z0-9-]+(?:\.agent)?\.md|workflows\/[a-z0-9-]+\.(?:md|ya?ml))$/

export function rstackUrl(version, path) {
  if (typeof version !== 'string' || !rstackVersionPattern.test(version)) {
    throw new Error('rstack.version must be a release tag such as v0.2.0')
  }
  if (typeof path !== 'string' || !rstackPathPattern.test(path)) {
    throw new Error(`Invalid rstack path: ${path}`)
  }
  const view = path.startsWith('skills/') ? 'tree' : 'blob'
  return `https://github.com/ragmha/rstack/${view}/${version}/${path}`
}
