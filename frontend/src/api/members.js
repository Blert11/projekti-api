import client from './client';

export const listMembers = (params) => client.get('/members', { params }).then((r) => r.data);

export const getMember = (id) => client.get(`/members/${id}`).then((r) => r.data.data);

export const myMember = () => client.get('/members/me').then((r) => r.data.data);

export const updateMember = (id, data) => client.put(`/members/${id}`, data).then((r) => r.data.data);

export const deleteMember = (id) => client.delete(`/members/${id}`);
