import { useSyncExternalStore } from 'preact/compat';
import { cartStore } from './cartStore';

export function useCartStore<T>(selector: (state: ReturnType<typeof cartStore.getState>) => T): T {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => selector(cartStore.getState())
  );
}
