import React, { createContext, useState, useContext, useEffect } from 'react';
import { NativeModules } from 'react-native';
import { API_OVERRIDE } from './apiConfig';
// Local database fallback dihapus sesuai kebutuhan: selalu gunakan server

const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
const hostMatch = scriptURL.match(/\/\/(.*?):\d+/);
const bundlerHost = hostMatch ? hostMatch[1] : null;
const CANDIDATES = [
  bundlerHost ? `http://${bundlerHost}:3000/api` : null,
  'http://10.0.2.2:3000/api',
  'http://localhost:3000/api',
  'http://192.168.0.101:3000/api',
  'http://192.168.1.23:3000/api'
].filter(Boolean);
const CANDIDATES_FINAL = (API_OVERRIDE ? [API_OVERRIDE] : []).concat(CANDIDATES);

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [apiUrl, setApiUrl] = useState(CANDIDATES[0]);
  const [serverBase, setServerBase] = useState('');
  const [resolving, setResolving] = useState(false);
  const [lastSelectedUrl, setLastSelectedUrl] = useState(null);

  useEffect(() => {
    resolveApi().then(() => refreshProducts());
    return () => {};
  }, []);

  const withTimeout = (promise, ms = 3000) =>
    Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  const testUrl = async (url) => {
    try {
      const h = await withTimeout(fetch(`${url}/health?t=${Date.now()}`), 2500);
      if (!h.ok) return false;
      const p = await withTimeout(fetch(`${url}/products?t=${Date.now()}`), 6000);
      if (!p.ok) return false;
      return true;
    } catch {
      return false;
    }
  };

  const resolveApi = async () => {
    if (resolving) return;
    setResolving(true);
    // Jika URL saat ini sudah valid, tidak perlu ganti dan tidak perlu log berulang
    if (apiUrl) {
      const okCurrent = await testUrl(apiUrl);
      if (okCurrent) {
        setResolving(false);
        return;
      }
    }
    for (const url of CANDIDATES_FINAL) {
      const ok = await testUrl(url);
      if (ok) {
        if (lastSelectedUrl !== url) {
          console.log('API URL selected:', url);
          setLastSelectedUrl(url);
        }
        setApiUrl(url);
        setServerBase(url.replace(/\/api$/, ''));
        setResolving(false);
        return;
      }
    }
    console.warn('No API URL reachable from candidates:', CANDIDATES_FINAL);
    setServerBase(apiUrl?.replace(/\/api$/, '') || '');
    setResolving(false);
  };

  const fetchJson = async (url, options = {}, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = setTimeout(() => controller && controller.abort(), 9000);
      try {
        const res = await fetch(url, { ...(options || {}), signal: controller ? controller.signal : undefined });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`http_${res.status}`);
        return await res.json();
      } catch (e) {
        clearTimeout(timeoutId);
        const isAbort = e?.name === 'AbortError' || String(e)?.toLowerCase().includes('abort');
        if (attempt < retries) {
          // Hanya resolve jika URL saat ini tidak valid; jika valid, beri jeda lalu ulangi
          const okCurrent = apiUrl ? await testUrl(apiUrl) : false;
          if (!okCurrent) {
            await resolveApi();
          } else {
            await new Promise((r) => setTimeout(r, isAbort ? 800 : 500));
          }
          continue;
        }
        // Jika ini AbortError (timeout), jangan lempar error keras
        if (isAbort) {
          throw new Error('fetch_timeout');
        }
        throw e;
      }
    }
  };

  const refreshProducts = async (category) => {
    try {
      if (!apiUrl) {
        await resolveApi();
      }
      const qs = category ? `category=${encodeURIComponent(category)}&t=${Date.now()}` : `t=${Date.now()}`;
      const result = await fetchJson(`${apiUrl}/products?${qs}`);
      
      if (result.message === 'success') {
        const base = serverBase || apiUrl.replace(/\/api$/, '');
        const mappedProducts = result.data.map(p => {
          const img = p.imageKey
            ? { uri: `${base}/assets/images/${p.imageKey}` }
            : { uri: 'https://via.placeholder.com/300?text=No+Image' };
          const chart = p.sizeChartImageKey
            ? { uri: `${base}/assets/images/${p.sizeChartImageKey}` }
            : { uri: 'https://via.placeholder.com/300?text=Size+Chart' };
          return { ...p, image: img, sizeChartImage: chart };
        });
        setProducts(mappedProducts);
        return;
      }
    } catch (error) {
      try {
        await resolveApi();
      } catch {}
      const isAbort =
        error?.name === 'AbortError' ||
        error?.message === 'fetch_timeout' ||
        String(error)?.toLowerCase().includes('abort') ||
        String(error)?.toLowerCase().includes('fetch_timeout');
      if (!isAbort) {
        if (!global.__PRODUCTS_FETCH_ERROR_SHOWN__) {
          console.error("Failed to fetch products from server:", error);
          global.__PRODUCTS_FETCH_ERROR_SHOWN__ = true;
          setTimeout(() => { global.__PRODUCTS_FETCH_ERROR_SHOWN__ = false; }, 15000);
        }
      }
    }
  };

  const addReview = async (productId, newReview) => {
    try {
      const response = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          user: newReview.user,
          rating: newReview.rating,
          comment: newReview.comment,
          date: newReview.date
        }),
      });

      const result = await response.json();
      
      if (result.message === 'success') {
        await refreshProducts();
      } else {
        console.error("Failed to save review to server:", result.error);
      }
    } catch (error) {
      console.error("Error posting review:", error);
    }
  };

  const getProductById = (id) => {
    return products.find(p => p.id === id);
  };

  return (
    <ProductContext.Provider value={{ products, addReview, getProductById, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
