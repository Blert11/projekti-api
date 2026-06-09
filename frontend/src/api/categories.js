import client from './client';

export const listCategories = () => client.get('/categories').then((r) => r.data.data);

export const getCategory = (id) => client.get(`/categories/${id}`).then((r) => r.data.data);

export const createCategory = (data) => client.post('/categories', data).then((r) => r.data.data);

export const updateCategory = (id, data) =>
  client.put(`/categories/${id}`, data).then((r) => r.data.data);

export const deleteCategory = (id) => client.delete(`/categories/${id}`);
