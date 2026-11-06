export type PromoCode = {
	name: string;
	action: string;
	percent: number;
};

export function parsePromoPercent(action: string) {
	const normalized = action.replace(',', '.').trim();
	const withSign = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
	if (withSign) return Number(withSign[1]);
	if (!normalized.includes('%')) return null;
	const value = Number(normalized.replace(/[^\d.]/g, ''));
	return Number.isFinite(value) ? value : null;
}
