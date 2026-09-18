import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../api/axios';
import { clearGuestCart, getGuestCart, setGuestCart } from '../utils/guestCart';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { api.post('/users/refresh').then((response) => { setAccessToken(response.data.data.token); setUser(response.data.data.user); }).catch(() => {}).finally(() => setReady(true)); }, []);
  const login = async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    const { token, user: next } = response.data.data;
    setAccessToken(token); setUser(next);
    const guestItems = getGuestCart();
    const remaining = [];
    for (const item of guestItems) {
      try { await api.post('/cart/add', { productId: item.product._id, variantId: item.variantId || null, quantity: item.quantity }); }
      catch { remaining.push(item); }
    }
    if (remaining.length) setGuestCart(remaining);
    else if (guestItems.length) clearGuestCart();
    return next;
  };
  const refreshUser = async () => {
    const response = await api.get('/users/me');
    const next = response.data.data;
    const normalized = { id: next._id, name: next.name, email: next.email, role: next.role, avatar: next.avatar, addresses: next.addresses || [] };
    setUser(normalized);
    return normalized;
  };
  const logout = async () => { try { await api.post('/users/logout'); } finally { setAccessToken(null); setUser(null); } };
  return <AuthContext.Provider value={{ user, login, logout, refreshUser, ready }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
