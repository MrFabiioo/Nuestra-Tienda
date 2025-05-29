import { createStore } from 'zustand/vanilla';

type Store = {
  count: number;
  addToCart: (amount: number) => void;
};

export const cartStore = createStore<Store>((set) => ({
  count: 0,
  addToCart: (amount) => set((state) => ({ count: state.count + amount })),
}));