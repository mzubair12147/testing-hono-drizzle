// ...existing code...

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );
  const hash = new Uint8Array(derivedBits);
  // Combine salt and hash for storage (e.g., base64 encode)
  const combined = new Uint8Array(salt.length + hash.length);
  combined.set(salt);
  combined.set(hash, salt.length);
  return btoa(String.fromCharCode(...combined));
};

export const verifyPassword = async (storedHash: string, password: string): Promise<boolean> => {
  const combined = new Uint8Array(atob(storedHash).split("").map(c => c.charCodeAt(0)));
  const salt = combined.slice(0, 16);
  const originalHash = combined.slice(16);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(derivedBits);
  return hash.every((byte, i) => byte === originalHash[i]);
};

// ...existing code...