function padMessage(message: string): string {
  while (message.length % 16 !== 0) {
    message += " ";
  }
  return message;
}

// Function to convert a base64 string to an ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Function to convert an ArrayBuffer to a base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to encrypt the message
async function encryptMessage(
  message: string,
  key: CryptoKey
): Promise<string> {
  const paddedMessage = padMessage(message);
  const encodedMessage = new TextEncoder().encode(paddedMessage);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM" },
    key,
    encodedMessage
  );
  return arrayBufferToBase64(encryptedBuffer);
}

async function decryptMessage(
  encryptedMessage: string,
  key: CryptoKey
): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM" },
    key,
    encryptedBuffer
  );
  const decodedMessage = new TextDecoder().decode(decryptedBuffer);
  return decodedMessage.trim();
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 128 }, true, [
    "encrypt",
    "decrypt",
  ]) as Promise<CryptoKey>;
}

async function exportKey(key: CryptoKey): Promise<string> {
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedKey as ArrayBuffer);
}

export async function newKey(): Promise<string> {
  return exportKey(await generateKey());
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function newAESEncryptionManager(
  key: string
): Promise<AESEncryptionManager> {
  return new AESEncryptionManager(await importKey(key));
}

export class AESEncryptionManager {
  constructor(private readonly key: CryptoKey) {}

  encrypt(data: string) {
    return encryptMessage(data, this.key);
  }

  decrypt(data: string) {
    return decryptMessage(data, this.key);
  }
}
