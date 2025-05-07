import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});
