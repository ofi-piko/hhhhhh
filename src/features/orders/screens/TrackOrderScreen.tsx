import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text } from '../../../components/ui/Text';
import { fetchOrderById } from '../../../services/api/orders';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order } from '../../../types/order';

type Props = {
	orderId: string;
	onBack: () => void;
};

export default function TrackOrderScreen({ orderId, onBack }: Props) {
	const { colors } = useTheme();
	const [order, setOrder] = useState<Order | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		fetchOrderById(orderId)
			.then((value) => setOrder(value))
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить заказ'));
	}, [orderId]);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScreenTopBar title="Track Order" onBack={onBack} />
			{!order && !error ? (
				<ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					{!!error && <Text style={styles.error}>{error}</Text>}
					<View style={styles.map}>
						<View style={styles.park} />
						<View style={styles.streetV} />
						<View style={styles.streetH} />
						<View style={styles.pin} />
						<View style={styles.dest} />
					</View>
					<View style={styles.courier}>
						<View style={[styles.avatar, { backgroundColor: colors.placeholderBg }]}>
							<Ionicons name="person" size={22} color={colors.placeholderIcon} />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={[styles.courierLabel, { color: colors.textMuted }]}>Delivery Man</Text>
							<Text style={[styles.courierName, { color: colors.text }]}>Savatcha Courier</Text>
						</View>
						<View style={[styles.chat, { backgroundColor: colors.primary }]}>
							<Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
						</View>
					</View>
					<View style={styles.meta}>
						<Ionicons name="time-outline" size={18} color={colors.primary} />
						<View>
							<Text style={[styles.metaLabel, { color: colors.primary }]}>Delivery In</Text>
							<Text style={[styles.metaValue, { color: colors.text }]}>25 Min</Text>
						</View>
					</View>
					<View style={styles.meta}>
						<Ionicons name="location-outline" size={18} color={colors.primary} />
						<View>
							<Text style={[styles.metaLabel, { color: colors.primary }]}>Delivery Address</Text>
							<Text style={[styles.metaValue, { color: colors.text }]}>{order?.address ?? ''}</Text>
						</View>
					</View>
					<View style={styles.sheet}>
						<View style={styles.handle} />
						<Text style={[styles.sheetTitle, { color: colors.text }]}>
							Order Details  (ID: #{orderId.slice(0, 6)})
						</Text>
					</View>
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { paddingHorizontal: 18, paddingBottom: 40 },
	error: { color: '#DC2626', marginBottom: 12 },
	map: {
		height: 260,
		borderRadius: 28,
		backgroundColor: '#F4EEE6',
		overflow: 'hidden',
		marginBottom: 18,
	},
	park: { position: 'absolute', left: 0, bottom: 40, width: 90, height: 90, backgroundColor: '#B7E8C4' },
	streetV: { position: 'absolute', left: 110, top: 0, bottom: 0, width: 36, backgroundColor: '#8B86E8' },
	streetH: { position: 'absolute', left: 0, right: 0, top: 130, height: 36, backgroundColor: '#8B86E8' },
	pin: { position: 'absolute', left: 150, top: 70, width: 18, height: 18, borderRadius: 9, backgroundColor: '#F5A524' },
	dest: { position: 'absolute', right: 48, bottom: 48, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E85D4C' },
	courier: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: '#F7F7F7',
		borderRadius: 22,
		padding: 12,
		marginBottom: 22,
	},
	avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
	courierLabel: { fontSize: 12 },
	courierName: { fontSize: 16, fontWeight: '800' },
	chat: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
	meta: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
	metaLabel: { fontSize: 13, fontWeight: '700' },
	metaValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
	sheet: { marginTop: 8, backgroundColor: '#F7F7F7', borderRadius: 24, padding: 18 },
	handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: '#D9D9D9', marginBottom: 14 },
	sheetTitle: { fontSize: 16, fontWeight: '700' },
});
