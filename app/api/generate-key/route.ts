import { NextResponse } from "next/server";
import { generateKeyPairSync } from "crypto";

export async function POST(request: Request) {
  try {
    const { keySize = 2048 } = await request.json();
    
    // Validate key size (common RSA key sizes)
    const validKeySizes = [1024, 2048, 3072, 4096];
    const size = typeof keySize === 'number' && validKeySizes.includes(keySize) 
      ? keySize 
      : 2048;
    
    // Generate RSA key pair using Node.js native crypto (much faster than jsrsasign)
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: size,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });
    
    // Extract just the key content without PEM markers for easier pasting
    const publicKeyContent = publicKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\n/g, "")
      .trim();
    
    return NextResponse.json({ 
      publicKey: publicKey,
      privateKey: privateKey,
      publicKeyContent: publicKeyContent
    });
  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSA key pair.' },
      { status: 500 }
    );
  }
}

