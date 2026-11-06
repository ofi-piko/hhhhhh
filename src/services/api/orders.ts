import type { CartItem } from '../../types/cart';
import type { Order, OrderItem, OrderStatus } from '../../types/order';
import { COURIER_FEE, STORE_PICKUP_LABEL } from '../../types/order';
import { clearCartItems } from './cart';
import { getCurrentUserId } from './session';
import { supabase } from './supabase';

type OrderRow = Omit<Order, 'items'>;
type OrderItemRow = OrderItem;

function mapOrder(row: OrderRow, items: OrderItemRow[]): Order {
	return { ...row, items };
}

export async function fetchOrders(): Promise<Order[]> {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const { data: orderRows, error: orderError } = await supabase
		.from('orders')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
	if (orderError) throw orderError;

	const orders = (orderRows ?? []) as OrderRow[];
	if (orders.length === 0) return [];

	const { data: itemRows, error: itemError } = await supabase
		.from('order_items')
		.select('*')
		.in('order_id', orders.map((order) => order.id));
	if (itemError) throw itemError;

	const items = (itemRows ?? []) as OrderItemRow[];
	const itemsByOrder = new Map<string, OrderItemRow[]>();
	items.forEach((item) => {
		const current = itemsByOrder.get(item.order_id) ?? [];
		current.push(item);
		itemsByOrder.set(item.order_id, current);
	});

	return orders.map((order) => mapOrder(order, itemsByOrder.get(order.id) ?? []));
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.eq('id', orderId)
		.eq('user_id', userId)
		.maybeSingle();
	if (error) throw error;
	if (!data) return null;

	const { data: itemRows, error: itemError } = await supabase
		.from('order_items')
		.select('*')
		.eq('order_id', orderId);
	if (itemError) throw itemError;

	return mapOrder(data as OrderRow, (itemRows ?? []) as OrderItemRow[]);
}

export async function createOrderFromCart(input: {
	items: CartItem[];
	fulfillment: 'store' | 'courier';
	address: string;
	latitude?: number | null;
	longitude?: number | null;
	discount?: number;
	promoName?: string;
}): Promise<Order> {
	const userId = await getCurrentUserId();
	if (!userId) throw new Error('Нужна сессия, чтобы оформить заказ');
	if (input.items.length === 0) throw new Error('Корзина пуста');
	if (!input.address.trim()) throw new Error(input.fulfillment === 'store' ? 'Не выбран магазин' : 'Нет адреса доставки');

	const subtotal = input.items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
	const discount = Math.min(Math.max(input.discount ?? 0, 0), subtotal);
	const deliveryFee = input.fulfillment === 'courier' ? COURIER_FEE : 0;
	const promoPart = input.promoName ? ` · ${input.promoName}` : '';
	const address = input.fulfillment === 'store'
		? `${STORE_PICKUP_LABEL} · ${input.address.trim()}${promoPart}`
		: `Курьер · ${input.address.trim()}${promoPart}`;

	const { data, error } = await supabase.from('orders').insert({
		user_id: userId,
		status: 'current' satisfies OrderStatus,
		address,
		latitude: input.fulfillment === 'courier' ? input.latitude ?? null : null,
		longitude: input.fulfillment === 'courier' ? input.longitude ?? null : null,
		subtotal,
		delivery_fee: deliveryFee,
		total: subtotal - discount + deliveryFee,
	}).select('*').single();
	if (error) throw error;

	const order = data as OrderRow;
	const payload = input.items.map((item) => ({
		order_id: order.id,
		product_id: item.product.id,
		name: item.product.name,
		price: item.product.price,
		qty: item.qty,
		image_url: item.product.image_url,
		category: item.product.category,
	}));

	const { data: itemRows, error: itemError } = await supabase
		.from('order_items')
		.insert(payload)
		.select('*');
	if (itemError) throw itemError;

	await clearCartItems();
	return mapOrder(order, (itemRows ?? []) as OrderItemRow[]);
}
