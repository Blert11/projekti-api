import client from './client';

export const register = (data) => client.post('/auth/register', data).then((r) => r.data.data);

export const login = (data) => client.post('/auth/login', data).then((r) => r.data.data);

export const me = () => client.get('/auth/me').then((r) => r.data.data);

export const refresh = (refreshToken) =>
  client.post('/auth/refresh', { refreshToken }).then((r) => r.data.data);
