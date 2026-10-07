const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export const ENCRYPTED_PACKAGE_VERSION = 1;
export const ENCRYPTION_ALGORITHM = "AES-256-GCM";
export const KDF_ALGORITHM = "PBKDF2-SHA256";

export interface EncryptedPackage {
  version: number;
  algorithm: typeof ENCRYPTION_ALGORITHM;
  kdf: typeof KDF_ALGORITHM;
  iterations: number;
  salt: string;
  iv: string;
  data: string;
  fileName?: string;
  mimeType?: string;
}

function getCrypto(): Crypto {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is not available.");
  }

  return window.crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function toCanonicalUint8Array(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return new Uint8Array(buffer) as Uint8Array<ArrayBuffer>;
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function generateSalt(): Uint8Array<ArrayBuffer> {
  return getCrypto().getRandomValues(
    new Uint8Array(SALT_LENGTH)
  ) as Uint8Array<ArrayBuffer>;
}

function generateIV(): Uint8Array<ArrayBuffer> {
  return getCrypto().getRandomValues(
    new Uint8Array(IV_LENGTH)
  ) as Uint8Array<ArrayBuffer>;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const crypto = getCrypto();

  const passwordBytes = new TextEncoder().encode(password);

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(
  data: Uint8Array<ArrayBuffer>,
  password: string,
  metadata?: {
    fileName?: string;
    mimeType?: string;
  }
): Promise<EncryptedPackage> {
  if (!password) {
    throw new Error("Password is required.");
  }

  if (!data || data.length === 0) {
    throw new Error("Data cannot be empty.");
  }

  const crypto = getCrypto();

  const salt = generateSalt();
  const iv = generateIV();

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    data
  );

  return {
    version: ENCRYPTED_PACKAGE_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    kdf: KDF_ALGORITHM,
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(
      toCanonicalUint8Array(new Uint8Array(encrypted))
    ),
    ...(metadata?.fileName && {
      fileName: metadata.fileName,
    }),
    ...(metadata?.mimeType && {
      mimeType: metadata.mimeType,
    }),
  };
}

export async function decryptData(
  encryptedPackage: EncryptedPackage,
  password: string
): Promise<Uint8Array<ArrayBuffer>> {
  if (!password) {
    throw new Error("Password is required.");
  }

  validateEncryptedPackage(encryptedPackage);

  const crypto = getCrypto();

  const salt = base64ToBytes(encryptedPackage.salt);
  const iv = base64ToBytes(encryptedPackage.iv);
  const encryptedData = base64ToBytes(encryptedPackage.data);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encryptedData
    );

    return toCanonicalUint8Array(new Uint8Array(decrypted));
  } catch {
    // Deliberately do not reveal whether the password was wrong
    // or the encrypted package was modified.
    throw new Error(
      "Incorrect password or corrupted encrypted data."
    );
  }
}

function validateEncryptedPackage(
  encryptedPackage: EncryptedPackage
): void {
  if (!encryptedPackage || typeof encryptedPackage !== "object") {
    throw new Error("Invalid encrypted package.");
  }

  if (encryptedPackage.version !== ENCRYPTED_PACKAGE_VERSION) {
    throw new Error("Unsupported encrypted package version.");
  }

  if (encryptedPackage.algorithm !== ENCRYPTION_ALGORITHM) {
    throw new Error("Unsupported encryption algorithm.");
  }

  if (encryptedPackage.kdf !== KDF_ALGORITHM) {
    throw new Error("Unsupported key derivation function.");
  }

  if (encryptedPackage.iterations !== PBKDF2_ITERATIONS) {
    throw new Error("Unsupported encryption parameters.");
  }

  if (
    typeof encryptedPackage.salt !== "string" ||
    typeof encryptedPackage.iv !== "string" ||
    typeof encryptedPackage.data !== "string"
  ) {
    throw new Error("Invalid encrypted package.");
  }

  const salt = base64ToBytes(encryptedPackage.salt);
  const iv = base64ToBytes(encryptedPackage.iv);

  if (salt.length !== SALT_LENGTH) {
    throw new Error("Invalid encrypted package.");
  }

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid encrypted package.");
  }
}

export async function encryptText(
  text: string,
  password: string
): Promise<EncryptedPackage> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const data = toCanonicalUint8Array(
    new TextEncoder().encode(text)
  );

  return encryptData(data, password, {
    mimeType: "text/plain",
  });
}

export async function decryptText(
  encryptedPackage: EncryptedPackage,
  password: string
): Promise<string> {
  const decrypted = await decryptData(
    encryptedPackage,
    password
  );

  return new TextDecoder().decode(decrypted);
}

export async function encryptFile(
  file: File,
  password: string
): Promise<EncryptedPackage> {
  if (!file) {
    throw new Error("File is required.");
  }

  const buffer = await file.arrayBuffer();
  const data = toCanonicalUint8Array(new Uint8Array(buffer));

  return encryptData(data, password, {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
}

export async function decryptFile(
  encryptedPackage: EncryptedPackage,
  password: string
): Promise<Blob> {
  const decrypted = await decryptData(
    encryptedPackage,
    password
  );

  return new Blob([decrypted], {
    type: encryptedPackage.mimeType || "application/octet-stream",
  });
}

export function serializeEncryptedPackage(
  encryptedPackage: EncryptedPackage
): string {
  return JSON.stringify(encryptedPackage);
}

export function parseEncryptedPackage(
  serialized: string
): EncryptedPackage {
  try {
    const parsed: unknown = JSON.parse(serialized);

    validateEncryptedPackage(parsed as EncryptedPackage);

    return parsed as EncryptedPackage;
  } catch {
    throw new Error("Invalid or corrupted encrypted package.");
  }
}

export function downloadEncryptedPackage(
  encryptedPackage: EncryptedPackage,
  fileName = "encrypted.securedata"
): void {
  const content = serializeEncryptedPackage(encryptedPackage);

  const blob = new Blob([content], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export function downloadDecryptedFile(
  blob: Blob,
  fileName: string
): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}