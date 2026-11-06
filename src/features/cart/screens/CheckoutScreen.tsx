import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text, TextInput } from '../../../components/ui/Text';
import { createOrderFromCart } from '../../../services/api/orders';
import { fetchDeliveryProfile } from '../../../services/api/profile';
import { fetchPromoByName } from '../../../services/api/promos';
import { formatMoney } from '../../../services/api/session';
import { cartStore, useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { COURIER_FEE } from '../../../types/order';
import type { PromoCode } from '../../../types/promo';

type Fulfillment = 'store' | 'courier';
type PayMethod = 'receive' | 'online';

type Props = {
	onBack: () => void;
	onPlaced: (orderId: string) => void;
};

const tomorrowLabel = () => {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	const formatted = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function CheckoutScreen({ onBack, onPlaced }: Props) {
	const { colors } = useTheme();
	const { items, total, count } = useCart();
	const [fulfillment, setFulfillment] = useState<Fulfillment>('store');
	const [payMethod, setPayMethod] = useState<PayMethod>('receive');
	const [address, setAddress] = useState('');
	const [city, setCity] = useState('');
	const [phone, setPhone] = useState('');
	const [promoInput, setPromoInput] = useState('');
	const [promo, setPromo] = useState<PromoCode | null>(null);
	const [promoError, setPromoError] = useState('');
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		fetchDeliveryProfile()
			.then((profile) => {
				setAddress(profile.address);
				setCity(profile.city || 'Samarqand');
				setPhone(profile.phone);
			})
			.finally(() => setLoading(false));
	}, []);

	const discount = promo ? Math.round(total * promo.percent / 100) : 0;
	const deliveryFee = fulfillment === 'courier' ? COURIER_FEE : 0;
	const payable = Math.max(total - discount, 0) + deliveryFee;
	const storeLabel = `Savatcha, ${city || 'Samarqand'}`;

	const applyPromo = async () => {
		setPromoError('');
		setPromo(null);
		try {
			const found = await fetchPromoByName(promoInput);
			if (!found) {
				setPromoError('Промокод не найден');
				return;
			}
			setPromo(found);
		} catch (promoLoadError) {
			setPromoError(promoLoadError instanceof Error ? promoLoadError.message : 'Не удалось проверить промокод');
		}
	};

	const placeOrder = async () => {
		setError('');
		const deliveryAddress = fulfillment === 'store' ? storeLabel : address;
		if (fulfillment === 'courier' && !address.trim()) {
			setError('Нет адреса доставки');
			return;
		}
		setBusy(true);
		try {
			const profile = await fetchDeliveryProfile();
			const order = await createOrderFromCart({
				items,
				fulfillment,
				address: deliveryAddress,
				latitude: profile.latitude,
				longitude: profile.longitude,
				discount,
				promoName: promo?.name,
			});
			cartStore.clear(false);
			onPlaced(order.id);
		} catch (placeError) {
			setError(placeError instanceof Error ? placeError.message : 'Не удалось оформить заказ');
		} finally {
			setBusy(false);
		}
	};

	const payHint = useMemo(() => (
		payMethod === 'receive'
			? fulfillment === 'store'
				? 'Оплата при получении в магазине'
				: 'Оплата курьеру при доставке'
			: 'Оплата картой онлайн'
	), [fulfillment, payMethod]);

	return (
		<View style={[styles.screen, { backgroundColor: '#F4F1F1' }]}>
			<ScreenTopBar title="Заказ" onBack={onBack} />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={[styles.pageTitle, { color: colors.primary }]}>Доставка Savatcha</Text>

				<View style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.primary }]}>Способ получения</Text>
					<View style={styles.segment}>
						<TouchableOpacity
							style={[styles.segmentBtn, fulfillment === 'store' && { backgroundColor: colors.primarySoft }]}
							onPress={() => setFulfillment('store')}
						>
							<Text style={[styles.segmentLabel, { color: colors.primary }]}>Забрать в магазине</Text>
							<Text style={styles.segmentHint}>бесплатно</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.segmentBtn, fulfillment === 'courier' && { backgroundColor: colors.primarySoft }]}
							onPress={() => setFulfillment('courier')}
						>
							<Text style={[styles.segmentLabel, { color: colors.primary }]}>Курьером</Text>
							<Text style={styles.segmentHint}>от {formatMoney(COURIER_FEE)}</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.row}>
						<Ionicons name={fulfillment === 'store' ? 'storefront-outline' : 'bicycle-outline'} size={20} color={colors.primary} />
						<Text style={styles.rowText}>
							{fulfillment === 'store' ? storeLabel : (address || 'Адрес доставки не указан')}
						</Text>
					</View>
					<View style={styles.row}>
						<Ionicons name="person-outline" size={20} color={colors.primary} />
						<View>
							<Text style={styles.rowMuted}>Получатель</Text>
							<Text style={styles.rowText}>{phone || 'Телефон не указан'}</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.primary }]}>{tomorrowLabel()}</Text>
				</View>

				<View style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.primary }]}>Способ оплаты</Text>
					<TouchableOpacity
						style={[styles.payOption, payMethod === 'online' && styles.payOptionActive]}
						onPress={() => setPayMethod('online')}
					>
						<Text style={[styles.payTitle, { color: colors.primary }]}>Картой онлайн</Text>
						<Text style={styles.rowMuted}>UZCARD, HUMO, Visa, MasterCard</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.payOption, payMethod === 'receive' && styles.payOptionActive]}
						onPress={() => setPayMethod('receive')}
					>
						<Text style={[styles.payTitle, { color: colors.primary }]}>При получении заказа</Text>
						<Text style={styles.rowMuted}>{payHint}</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.primary }]}>Промокод</Text>
					<View style={styles.promoRow}>
						<TextInput
							value={promoInput}
							onChangeText={setPromoInput}
							placeholder="Название промокода"
							placeholderTextColor="#9A8A8A"
							style={[styles.promoInput, { color: colors.primary }]}
							autoCapitalize="characters"
						/>
						<TouchableOpacity style={[styles.promoBtn, { backgroundColor: colors.primary }]} onPress={() => { void applyPromo(); }}>
							<Text style={styles.promoBtnText}>Применить</Text>
						</TouchableOpacity>
					</View>
					{promo ? (
						<Text style={styles.promoOk}>{promo.name}: −{promo.percent}%</Text>
					) : null}
					{!!promoError && <Text style={styles.error}>{promoError}</Text>}
				</View>

				<View style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.primary }]}>Ваш заказ</Text>
					<View style={styles.summaryRow}>
						<Text style={styles.rowMuted}>{count} товар(ов)</Text>
						<Text style={[styles.rowText, { color: colors.primary }]}>{formatMoney(total)}</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.rowMuted}>Скидка</Text>
						<Text style={{ color: discount ? '#B42318' : '#8A8A8A' }}>{discount ? `−${formatMoney(discount)}` : 'нет'}</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.rowMuted}>Доставка</Text>
						<Text style={[styles.rowText, { color: colors.primary }]}>{deliveryFee ? formatMoney(deliveryFee) : 'бесплатно'}</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.summaryRow}>
						<Text style={[styles.total, { color: colors.primary }]}>К оплате</Text>
						<Text style={[styles.total, { color: colors.primary }]}>{formatMoney(payable)}</Text>
					</View>
					{!!error && <Text style={styles.error}>{error}</Text>}
					<TouchableOpacity
						style={[styles.submit, { backgroundColor: colors.primary, opacity: busy || loading ? 0.7 : 1 }]}
						disabled={busy || loading}
						onPress={() => { void placeOrder(); }}
					>
						{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Оформить заказ</Text>}
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	content: { padding: 16, paddingBottom: 140, gap: 12 },
	pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
	card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, gap: 12 },
	cardTitle: { fontSize: 18, fontWeight: '800' },
	segment: { flexDirection: 'row', backgroundColor: '#F6F1F1', borderRadius: 16, padding: 4, gap: 4 },
	segmentBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
	segmentLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
	segmentHint: { fontSize: 11, color: '#8A8A8A', marginTop: 4 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	rowText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
	rowMuted: { fontSize: 13, color: '#8A8A8A' },
	payOption: { borderWidth: 1, borderColor: '#EDE4E4', borderRadius: 16, padding: 14, gap: 4 },
	payOptionActive: { borderColor: '#5C0A0A', backgroundColor: '#FBF6F6' },
	payTitle: { fontSize: 15, fontWeight: '700' },
	promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
	promoInput: { flex: 1, minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#E6DCDC', fontSize: 16, fontWeight: '700' },
	promoBtn: { height: 44, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
	promoBtnText: { color: '#FFFFFF', fontWeight: '700' },
	promoOk: { color: '#15803D', fontWeight: '700' },
	summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	divider: { height: 1, backgroundColor: '#EFE7E7' },
	total: { fontSize: 18, fontWeight: '800' },
	submit: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
	submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
	error: { color: '#B42318', fontSize: 13 },
});
