import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text } from '../../../components/ui/Text';
import { fetchOrders } from '../../../services/api/orders';
import { formatMoney } from '../../../services/api/session';
import { useTheme } from '../../../theme/ThemeContext';
import { STORE_PICKUP_LABEL, type Order, type OrderStatus } from '../../../types/order';

type Props = {
	onBack?: () => void;
	onTrack: (orderId: string) => void;
};

export default function OrdersScreen({ onBack, onTrack }: Props) {
	const { colors } = useTheme();
	const [tab, setTab] = useState<OrderStatus>('current');
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');

	const load = useCallback(async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		setError('');
		try {
			setOrders(await fetchOrders());
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить заказы');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const visible = orders.filter((order) => order.status === tab);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScreenTopBar title="Заказы" onBack={onBack} />
			<View style={styles.tabs}>
				{(['current', 'past'] as OrderStatus[]).map((value) => {
					const active = tab === value;
					return (
						<TouchableOpacity
							key={value}
							onPress={() => setTab(value)}
							style={[styles.tab, { borderColor: colors.primary }, active && { backgroundColor: colors.primary }]}
						>
							<Text style={[styles.tabText, { color: active ? '#FFFFFF' : colors.primary }]}>
								{value === 'current' ? 'Текущие' : 'Прошлые'}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
			{loading ? (
				<ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
			) : (
				<ScrollView
					contentContainerStyle={styles.list}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} />}
				>
					{!!error && <Text style={styles.error}>{error}</Text>}
					{visible.length === 0 && (
						<Text style={[styles.empty, { color: colors.textMuted }]}>Заказов пока нет</Text>
					)}
					{visible.map((order) => {
						const first = order.items[0];
						const isPickup = order.address.startsWith(STORE_PICKUP_LABEL);
						return (
							<View key={order.id} style={styles.card}>
								<View style={styles.cardTop}>
									<View style={[styles.thumb, { backgroundColor: '#F6F0EA' }]}>
										{first?.image_url ? (
											<Image source={{ uri: first.image_url }} style={styles.image} />
										) : (
											<Ionicons name="image-outline" size={22} color="#C4A6A6" />
										)}
									</View>
									<View style={{ flex: 1 }}>
										<Text style={[styles.name, { color: colors.primary }]}>{first?.name ?? 'Заказ'}</Text>
										<Text style={[styles.price, { color: colors.primary }]}>{formatMoney(order.total)}</Text>
										<Text style={[styles.id, { color: colors.textMuted }]} numberOfLines={1}>{order.address}</Text>
									</View>
									<Text style={[styles.id, { color: colors.textMuted }]}>#{order.id.slice(0, 6)}</Text>
								</View>
								<View style={styles.cardBottom}>
									<Text style={[styles.headline, { color: colors.primary }]}>
										{tab === 'past'
											? 'Заказ выполнен'
											: isPickup
												? 'Можно забрать в магазине'
												: 'Заказ уже в пути'}
									</Text>
									{tab === 'current' && (
										<TouchableOpacity style={[styles.track, { backgroundColor: colors.primary }]} onPress={() => onTrack(order.id)}>
											<Text style={styles.trackText}>{isPickup ? 'Детали' : 'Следить'}</Text>
										</TouchableOpacity>
									)}
								</View>
							</View>
						);
					})}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	tabs: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
	tab: { flex: 1, minHeight: 48, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
	tabText: { fontSize: 16, fontWeight: '700' },
	list: { padding: 20, paddingBottom: 140, gap: 22 },
	error: { color: '#DC2626', marginBottom: 12 },
	empty: { textAlign: 'center', marginTop: 40 },
	card: { paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#EFEFEF', gap: 16 },
	cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	thumb: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
	image: { width: '100%', height: '100%' },
	name: { fontSize: 16, fontWeight: '700' },
	price: { fontSize: 14, marginTop: 2 },
	id: { fontSize: 12 },
	cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
	headline: { flex: 1, fontSize: 22, fontWeight: '800', lineHeight: 28 },
	track: { minHeight: 48, paddingHorizontal: 18, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
	trackText: { color: '#FFFFFF', fontWeight: '700' },
});
