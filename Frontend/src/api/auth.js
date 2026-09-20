import client from './client';

export const signup = (email, password) =>
  client.post('/auth/signup', { email, password }).then((res) => res.data.data);

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((res) => res.data.data);
