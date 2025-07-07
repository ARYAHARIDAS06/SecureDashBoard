// // WebAuthn utility functions
// export const isWebAuthnSupported = (): boolean => {
//   return !!(navigator.credentials && navigator.credentials.create);
// };

// export const bufferToBase64 = (buffer: ArrayBuffer): string => {
//   return btoa(String.fromCharCode(...new Uint8Array(buffer)));
// };

// export const base64ToBuffer = (base64: string): ArrayBuffer => {
//   const binaryString = atob(base64);
//   const bytes = new Uint8Array(binaryString.length);
//   for (let i = 0; i < binaryString.length; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// };

// export const generateChallenge = (): ArrayBuffer => {
//   return crypto.getRandomValues(new Uint8Array(32));
// };

// export const createCredential = async (
//   email: string,
//   name: string,
//   challenge: ArrayBuffer
// ): Promise<PublicKeyCredential> => {
//   const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
//     rp: {
//       name: 'Secure Dashboard',
//       id: window.location.hostname,
//     },
//     user: {
//       id: new TextEncoder().encode(email),
//       name: email,
//       displayName: name,
//     },
//     challenge,
//     pubKeyCredParams: [
//       {
//         type: 'public-key',
//         alg: -7, // ES256
//       },
//       {
//         type: 'public-key',
//         alg: -257, // RS256
//       },
//     ],
//     timeout: 60000,
//     authenticatorSelection: {
//       authenticatorAttachment: 'platform',
//       userVerification: 'required',
//     },
//   };

//   const credential = await navigator.credentials.create({
//     publicKey: publicKeyCredentialCreationOptions,
//   });

//   if (!credential) {
//     throw new Error('Failed to create credential');
//   }

//   return credential as PublicKeyCredential;
// };

// export const getAssertion = async (
//   challenge: ArrayBuffer,
//   credentialId?: string
// ): Promise<PublicKeyCredential> => {
//   const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
//     challenge,
//     allowCredentials: credentialId ? [
//       {
//         id: base64ToBuffer(credentialId),
//         type: 'public-key',
//       },
//     ] : [],
//     timeout: 60000,
//     userVerification: 'required',
//   };

//   const assertion = await navigator.credentials.get({
//     publicKey: publicKeyCredentialRequestOptions,
//   });

//   if (!assertion) {
//     throw new Error('Failed to get assertion');
//   }

//   return as
// sertion as PublicKeyCredential;
// };


export async function createCredential(optionsFromServer: any) {
  const options = {
    ...optionsFromServer,
    challenge: base64ToBuffer(optionsFromServer.challenge),
    user: {
      ...optionsFromServer.user,
      id: base64ToBuffer(optionsFromServer.user.id)
    }
  };
  const cred = await navigator.credentials.create({ publicKey: options });
  return credentialToJSON(cred);
}

export async function getAssertion(optionsFromServer: any) {
  const options = {
    ...optionsFromServer,
    challenge: base64ToBuffer(optionsFromServer.challenge),
    allowCredentials: optionsFromServer.allowCredentials.map((cred: any) => ({
      ...cred,
      id: base64ToBuffer(cred.id)
    }))
  };
  const assertion = await navigator.credentials.get({ publicKey: options });
  return credentialToJSON(assertion);
}

export const bufferToBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
export const base64ToBuffer = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

function credentialToJSON(cred: any) {
  if (!cred) return null;
  const obj: any = {
    id: cred.id,
    type: cred.type,
    rawId: bufferToBase64(cred.rawId)
  };
  if (cred.response) {
    obj.response = {};
    for (let key in cred.response) {
      const val = cred.response[key];
      if (val instanceof ArrayBuffer) {
        obj.response[key] = bufferToBase64(val);
      }
    }
  }
  return obj;
}
