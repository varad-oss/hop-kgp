export async function sha1Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signHeaders(appKey: string, appSecret: string, nonce: string, timestamp: string) {
  return {
    'App-Key': appKey,
    Nonce: nonce,
    Timestamp: timestamp,
    Signature: await sha1Hex(appSecret + nonce + timestamp),
  };
}
