import type { CartItem } from '../../types/cart';
import type { Product } from '../../types/product';
import { fetchProductsByIds } from './products';
import { getCurrentUserId } from './session';
import { supabase } from './supabase';

type CartRow = {
	product_id: number;
	qty: number;
};

export async function fetchCartItems(): Promise<CartItem[]> {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const { data, error } = await supabase
		.from('cart_items')
		.select('product_id, qty')
		.eq('user_id', userId);
	if (error) throw error;

	const rows = (data ?? []) as CartRow[];
	const products = await fetchProductsByIds(rows.map((row) => row.product_id));
	const byId = new Map(products.map((product) => [product.id, product]));

	return rows.flatMap((row) => {
		const product = byId.get(row.product_id);
		if (!product) return [];
		return [{ product, qty: row.qty }];
	});
}

export async function saveCartItem(product: Product, qty: number) {
	const userId = await getCurrentUserId();
	if (!userId) return;
	if (qty <= 0) {
		await removeCartItem(product.id);
		return;
	}
	const { error } = await supabase.from('cart_items').upsert({
		user_id: userId,
		product_id: product.id,
		qty,
		updated_at: new Date().toISOString(),
	}, { onConflict: 'user_id,product_id' });
	if (error) throw error;
}

export async function removeCartItem(productId: number) {
	const userId = await getCurrentUserId();
	if (!userId) return;
	const { error } = await supabase
		.from('cart_items')
		.delete()
		.eq('user_id', userId)
		.eq('product_id', productId);
	if (error) throw error;
}

export async function clearCartItems() {
	const userId = await getCurrentUserId();
	if (!userId) return;
	const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
	if (error) throw error;
}
