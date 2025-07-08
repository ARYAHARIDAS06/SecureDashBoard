// WebAuthn Utility Functions
export const isWebAuthnSupported = (): boolean => {
  return !!(window.PublicKeyCredential && 
           navigator.credentials && 
           navigator.credentials.create);
};

// URL-safe Base64 conversion
export const bufferToBase64URL = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const base64URLToBuffer = (base64URL: string): ArrayBuffer => {
  const padding = '='.repeat((4 - (base64URL.length % 4)) % 4);
  const base64 = (base64URL + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};

// WebAuthn Operations
export async function createCredential(optionsFromServer: any): Promise<any> {
  try {
    const options = {
      ...optionsFromServer,
      challenge: base64URLToBuffer(optionsFromServer.challenge),
      user: {
        ...optionsFromServer.user,
        id: base64URLToBuffer(optionsFromServer.user.id)
      },
      excludeCredentials: optionsFromServer.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: base64URLToBuffer(cred.id)
      })) || []
    };

    const credential = await navigator.credentials.create({
      publicKey: options
    });

    if (!credential) {
      throw new Error('Credential creation failed');
    }

    return credentialToJSON(credential);
  } catch (error) {
    console.error('Create credential error:', error);
    throw new Error(`WebAuthn registration failed: ${error.message}`);
  }
}

export async function getAssertion(optionsFromServer: any): Promise<any> {
  try {
    const options = {
      ...optionsFromServer,
      challenge: base64URLToBuffer(optionsFromServer.challenge),
      allowCredentials: optionsFromServer.allowCredentials?.map((cred: any) => ({
        ...cred,
        id: base64URLToBuffer(cred.id)
      })) || []
    };

    const assertion = await navigator.credentials.get({
      publicKey: options
    });

    if (!assertion) {
      throw new Error('Assertion failed');
    }

    return credentialToJSON(assertion);
  } catch (error) {
    console.error('Get assertion error:', error);
    throw new Error(`WebAuthn authentication failed: ${error.message}`);
  }
}

function credentialToJSON(cred: PublicKeyCredential): any {
  if (!cred) return null;

  const response: any = {};
  if (cred.response) {
    for (const [key, value] of Object.entries(cred.response)) {
      if (value instanceof ArrayBuffer) {
        response[key] = bufferToBase64URL(value);
      } else {
        response[key] = value;
      }
    }
  }

  return {
    id: cred.id,
    type: cred.type,
    rawId: bufferToBase64URL(cred.rawId),
    response
  };
}