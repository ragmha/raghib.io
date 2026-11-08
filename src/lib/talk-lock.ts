// Locked talks ship encrypted: AES-GCM with a key derived from the view code.
// No server or accounts; the deck is only as private as the code.
const text = new TextEncoder()
const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

async function deriveKey(code: string, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage) {
  const secret = await crypto.subtle.importKey('raw', text.encode(code.trim()), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    secret,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  )
}

export async function seal(plain: string, code: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(code, salt, 'encrypt'), text.encode(plain))
  return [salt, iv, new Uint8Array(data)].map(toBase64).join('.')
}

// Rejects when the code is wrong: AES-GCM authenticates the ciphertext.
export async function open(sealed: string, code: string) {
  const [salt, iv, data] = sealed.split('.').map(fromBase64)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await deriveKey(code, salt, 'decrypt'), data)
  return new TextDecoder().decode(plain)
}
