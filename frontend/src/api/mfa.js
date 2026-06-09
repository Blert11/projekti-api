import client from './client';

export const setupMfa = () => client.post('/mfa/setup').then((r) => r.data.data);

export const enableMfa = (code) => client.post('/mfa/enable', { code }).then((r) => r.data.data);

export const disableMfa = (code) => client.post('/mfa/disable', { code }).then((r) => r.data.data);

export const verifyMfa = (mfaToken, code) =>
  client.post('/mfa/verify', { mfaToken, code }).then((r) => r.data.data);
