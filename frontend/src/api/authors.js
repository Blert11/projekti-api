import client from './client';

export const listAuthors = () => client.get('/authors').then((r) => r.data.data);

export const getAuthor = (id) => client.get(`/authors/${id}`).then((r) => r.data.data);

export const createAuthor = (data) => client.post('/authors', data).then((r) => r.data.data);

export const updateAuthor = (id, data) => client.put(`/authors/${id}`, data).then((r) => r.data.data);

export const deleteAuthor = (id) => client.delete(`/authors/${id}`);
