import { supabase } from './supabase';
import type { Product } from '../../types/product';

export async function fetchProducts(limit?: number) {
	let query = supabase.from('products').select('*').order('id', { ascending: true });
	if (limit) query = query.limit(limit);
	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []) as Product[];
}

export async function fetchProductById(id: number) {
	const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
	if (error) throw error;
	return (data ?? null) as Product | null;
}

export async function fetchProductsByIds(ids: number[]) {
	if (ids.length === 0) return [] as Product[];
	const { data, error } = await supabase.from('products').select('*').in('id', ids);
	if (error) throw error;
	return (data ?? []) as Product[];
}
