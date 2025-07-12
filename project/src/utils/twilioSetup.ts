declare global {
  interface Window {
    Twilio: any;
  }
}

let device: any = null;

export const setupTwilioDevice = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (device) device.destroy();

    device = new window.Twilio.Device(token, {
      codecPreferences: ['opus', 'pcmu'],
      edge: 'ashburn',
      debug: true
    });

    device.on('registered', () => resolve(device));
    device.on('error', (error: any) => reject(error));
    device.on('incoming', (connection: any) => connection.accept());
    device.on('connect', (connection: any) => console.log('Connected', connection));
    device.on('disconnect', () => console.log('Disconnected'));
  });
};

export const connectCall = (device: any, to: string): any => {
  return device.connect({ params: { To: to } });
};

export const disconnectCall = (connection: any): void => {
  if (connection) connection.disconnect();
};

export const getDevice = (): any => device;
