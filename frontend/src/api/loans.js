import client from './client';

export const listLoans = (params) => client.get('/loans', { params }).then((r) => r.data);

export const getLoan = (id) => client.get(`/loans/${id}`).then((r) => r.data.data);

export const myLoans = () => client.get('/loans/me').then((r) => r.data.data);

export const borrowBook = (data) => client.post('/loans/borrow', data).then((r) => r.data.data);

export const returnLoan = (id) => client.post(`/loans/${id}/return`).then((r) => r.data.data);

export const markOverdue = () => client.post('/loans/mark-overdue').then((r) => r.data.data);
