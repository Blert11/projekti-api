import client from './client';

export const listBooks = (params) => client.get('/books', { params }).then((r) => r.data);

export const getBook = (id) => client.get(`/books/${id}`).then((r) => r.data.data);

export const createBook = (data) => client.post('/books', data).then((r) => r.data.data);

export const updateBook = (id, data) => client.put(`/books/${id}`, data).then((r) => r.data.data);

export const deleteBook = (id) => client.delete(`/books/${id}`);
