export type OrderStatus = 'current' | 'past';

export type OrderItem = {
	id: string;
	order_id: string;
	product_id: number | null;
	name: string;
	price: number;
	qty: number;
	image_url: string | null;
	category: string | null;
};

export type Order = {
	id: string;
	user_id: string;
	status: OrderStatus;
	address: string;
	latitude: number | null;
	longitude: number | null;
	subtotal: number;
	delivery_fee: number;
	total: number;
	created_at: string;
	items: OrderItem[];
};

export const STORE_PICKUP_LABEL = 'Забрать в магазине';
export const COURIER_FEE = 30000;
