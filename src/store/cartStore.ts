import { useEffect, useState } from 'react';
import { clearCartItems, fetchCartItems, removeCartItem, saveCartItem } from '../services/api/cart';
import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';

export type { CartItem };

type Listener = () => void;

let items: CartItem[] = [];
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener());

const syncWarning = (error: unknown) => {
	console.warn('Cart could not be synced:', error);
};

export const cartStore = {
	getItems: () => items,

	hydrate: async () => {
		try {
			items = await fetchCartItems();
			emit();
		} catch (error) {
			syncWarning(error);
		}
	},

	add: (product: Product, qty = 1) => {
		const existing = items.find((item) => item.product.id === product.id);
		const nextQty = (existing?.qty ?? 0) + qty;
		if (existing) {
			items = items.map((item) => (item.product.id === product.id ? { ...item, qty: nextQty } : item));
		} else {
			items = [...items, { product, qty: nextQty }];
		}
		emit();
		void saveCartItem(product, nextQty).catch(syncWarning);
	},

	remove: (id: number) => {
		items = items.filter((item) => item.product.id !== id);
		emit();
		void removeCartItem(id).catch(syncWarning);
	},

	inc: (id: number) => {
		const current = items.find((item) => item.product.id === id);
		if (!current) return;
		const nextQty = current.qty + 1;
		items = items.map((item) => (item.product.id === id ? { ...item, qty: nextQty } : item));
		emit();
		void saveCartItem(current.product, nextQty).catch(syncWarning);
	},

	dec: (id: number) => {
		const current = items.find((item) => item.product.id === id);
		if (!current) return;
		const nextQty = current.qty - 1;
		if (nextQty <= 0) {
			items = items.filter((item) => item.product.id !== id);
			emit();
			void removeCartItem(id).catch(syncWarning);
			return;
		}
		items = items.map((item) => (item.product.id === id ? { ...item, qty: nextQty } : item));
		emit();
		void saveCartItem(current.product, nextQty).catch(syncWarning);
	},

	clear: (syncRemote = true) => {
		items = [];
		emit();
		if (syncRemote) void clearCartItems().catch(syncWarning);
	},

	subscribe: (listener: Listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
};

export function useCart() {
	const [, force] = useState(0);

	useEffect(() => {
		const unsub = cartStore.subscribe(() => force((value) => value + 1));
		return () => {
			unsub();
		};
	}, []);

	const list = cartStore.getItems();
	const count = list.reduce((sum, item) => sum + item.qty, 0);
	const total = list.reduce((sum, item) => sum + item.qty * item.product.price, 0);

	return {
		items: list,
		count,
		total,
		add: cartStore.add,
		remove: cartStore.remove,
		inc: cartStore.inc,
		dec: cartStore.dec,
		clear: cartStore.clear,
	};
}
