import { supabase } from './supabase';

export async function getCurrentUserId() {
	const { data, error } = await supabase.auth.getSession();
	if (error) throw error;
	return data.session?.user.id ?? null;
}

export function formatMoney(value: number) {
	return `${Math.round(value).toLocaleString('ru-RU')} сум`;
}
