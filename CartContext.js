// CartContext.js
import React, { createContext, useContext, useReducer } from 'react';

// Buat context
const CartContext = createContext();

// Reducer untuk mengelola state keranjang
const cartReducer = (state, action) => {
  switch (action.type) {
    // Tambah item ke keranjang
    case 'ADD_TO_CART':
      const existingItem = state.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Jika item sudah ada, tambahkan jumlahnya
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Jika belum ada, tambahkan sebagai item baru
      return [...state, { ...action.payload, quantity: 1, checked: true }];

    // Hapus item dari keranjang
    case 'REMOVE_FROM_CART':
      return state.filter(item => item.id !== action.payload);

    // Tambah jumlah item
    case 'INCREMENT_QUANTITY':
      return state.map(item =>
        item.id === action.payload ? { ...item, quantity: item.quantity + 1 } : item
      );

    // Kurangi jumlah item
    case 'DECREMENT_QUANTITY':
      return state.map(item =>
        item.id === action.payload && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );

    // Toggle centang item (untuk checkout)
    case 'TOGGLE_CHECKED':
      return state.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked } : item
      );

    // Hapus semua item dari keranjang
    case 'CLEAR_CART':
      return [];

    // Hapus hanya item yang dicentang (setelah checkout)
    case 'CLEAR_CHECKED':
      return state.filter(item => !item.checked);

    // Ganti isi keranjang (misalnya untuk testing atau load dari storage)
    case 'SET_CART':
      return action.payload;

    default:
      return state;
  }
};

// Provider komponen
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook custom untuk mengakses context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};