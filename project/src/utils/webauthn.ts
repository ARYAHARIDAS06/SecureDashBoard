// WebAuthn utility functions
export const isWebAuthnSupported = (): boolean => {
  return !!(navigator.credentials && navigator.credentials.create);
};

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const generateChallenge = (): ArrayBuffer => {
  return crypto.getRandomValues(new Uint8Array(32));
};

export const createCredential = async (
  email: string,
  name: string,
  challenge: ArrayBuffer
): Promise<PublicKeyCredential> => {
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    rp: {
      name: 'Secure Dashboard',
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(email),
      name: email,
      displayName: name,
    },
    challenge,
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7, // ES256
      },
      {
        type: 'public-key',
        alg: -257, // RS256
      },
    ],
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  });

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  return credential as PublicKeyCredential;
};

export const getAssertion = async (
  challenge: ArrayBuffer,
  credentialId?: string
): Promise<PublicKeyCredential> => {
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: credentialId ? [
      {
        id: base64ToBuffer(credentialId),
        type: 'public-key',
      },
    ] : [],
    timeout: 60000,
    userVerification: 'required',
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  });

  if (!assertion) {
    throw new Error('Failed to get assertion');
  }

  return assertion as PublicKeyCredential;
};