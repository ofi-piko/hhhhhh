import { parsePromoPercent, type PromoCode } from '../../types/promo';
import { supabase } from './supabase';

export async function fetchPromoByName(name: string): Promise<PromoCode | null> {
	const query = name.trim();
	if (!query) return null;

	const { data, error } = await supabase
		.from('promocodes')
		.select('name, action')
		.ilike('name', query)
		.maybeSingle();
	if (error) throw error;
	if (!data?.name || !data?.action) return null;

	const percent = parsePromoPercent(String(data.action));
	if (percent == null || percent <= 0 || percent > 100) {
		throw new Error('Промокод должен быть в процентах');
	}

	return {
		name: String(data.name),
		action: String(data.action),
		percent,
	};
}
