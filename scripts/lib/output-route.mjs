export function outputFileRoute(file) {
  return `/${file.replaceAll('\\', '/').replace(/(^|\/)index\.html$/, '$1')}`
}
