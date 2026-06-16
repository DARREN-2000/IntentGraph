// Client-side encryption helpers using Web Crypto API
// Provides encryptConfig(plaintext, passphrase) -> base64 blob
// and decryptConfig(blob, passphrase) -> plaintext

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptConfig(plaintext: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  const payload = {
    v: 1,
    s: toBase64(salt.buffer),
    i: toBase64(iv.buffer),
    c: toBase64(ciphertext),
  };
  return JSON.stringify(payload);
}

export async function decryptConfig(blob: string, passphrase: string) {
  const parsed = JSON.parse(blob);
  if (!parsed || parsed.v !== 1) throw new Error('unsupported blob');
  const salt = new Uint8Array(fromBase64(parsed.s));
  const iv = new Uint8Array(fromBase64(parsed.i));
  const ciphertext = fromBase64(parsed.c);
  const key = await deriveKey(passphrase, salt);
  const plaintextBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(plaintextBuf);
}
