import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text } from '../../../components/ui/Text';
import { formatMoney } from '../../../services/api/session';
import { useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import type { CartItem } from '../../../types/cart';

type Props = {
	onBack?: () => void;
	onGoToCatalog?: () => void;
	onCheckout?: () => void;
};

export default function CartScreen({ onBack, onGoToCatalog, onCheckout }: Props) {
	const { colors } = useTheme();
	const { items, total, count, inc, dec } = useCart();
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? items : items.slice(0, 3);
	const hiddenCount = Math.max(items.length - 3, 0);

	if (items.length === 0) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<ScreenTopBar title="Shopping Cart (0)" onBack={onBack} />
				<View style={styles.emptyWrap}>
					<Ionicons name="bag-handle-outline" size={52} color={colors.primary} />
					<Text style={[styles.emptyTitle, { color: colors.text }]}>Корзина пуста</Text>
					<TouchableOpacity style={[styles.checkout, { backgroundColor: colors.primary }]} onPress={onGoToCatalog}>
						<Text style={styles.checkoutText}>Перейти в каталог</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScreenTopBar title={`Shopping Cart (${count})`} onBack={onBack} />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={[styles.promo, { backgroundColor: colors.primary }]}>
					<Text style={styles.promoOff}>OFF!!</Text>
					<Text style={styles.promoValue}>25%</Text>
					<Text style={styles.promoCode}>Use code #HalalFood at Checkout</Text>
				</View>

				{visible.map((item) => (
					<CartRow key={item.product.id} item={item} onInc={inc} onDec={dec} />
				))}

				<View style={styles.moreRow}>
					{hiddenCount > 0 && !expanded ? (
						<TouchableOpacity onPress={() => setExpanded(true)}>
							<Text style={[styles.more, { color: colors.primary }]}>+ {hiddenCount} More</Text>
						</TouchableOpacity>
					) : <View />}
					<TouchableOpacity onPress={() => setExpanded((value) => !value)}>
						<Text style={[styles.more, { color: colors.primary }]}>Edit</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			<View style={styles.summary}>
				<View style={styles.summaryRow}>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>Subtotal</Text>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>{formatMoney(total)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>Доставка</Text>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>от {formatMoney(0)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={[styles.totalLabel, { color: colors.primary }]}>Итого</Text>
					<Text style={[styles.totalLabel, { color: colors.primary }]}>{formatMoney(total)}</Text>
				</View>
				<TouchableOpacity style={[styles.checkout, { backgroundColor: colors.primary }]} onPress={onCheckout}>
					<Text style={styles.checkoutText}>Proceed To checkout</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

function CartRow({
	item,
	onInc,
	onDec,
}: {
	item: CartItem;
	onInc: (id: number) => void;
	onDec: (id: number) => void;
}) {
	const { colors } = useTheme();
	const { product, qty } = item;

	return (
		<View style={styles.row}>
			<View style={[styles.thumb, { backgroundColor: colors.placeholderBg }]}>
				{product.image_url ? (
					<Image source={{ uri: product.image_url }} style={styles.image} />
				) : (
					<Ionicons name="image-outline" size={28} color={colors.placeholderIcon} />
				)}
			</View>
			<View style={styles.info}>
				<Text style={[styles.name, { color: colors.primary }]}>{product.name}</Text>
				<Text style={[styles.price, { color: colors.textMuted }]}>{formatMoney(product.price)}</Text>
			</View>
			<View style={styles.qty}>
				<TouchableOpacity style={styles.qtyBtn} onPress={() => onDec(product.id)} accessibilityRole="button">
					<Text style={[styles.qtySign, { color: colors.primary }]}>-</Text>
				</TouchableOpacity>
				<Text style={[styles.qtyText, { color: colors.primary }]}>{qty}</Text>
				<TouchableOpacity style={styles.qtyBtn} onPress={() => onInc(product.id)} accessibilityRole="button">
					<Text style={[styles.qtySign, { color: colors.primary }]}>+</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { paddingBottom: 24 },
	emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
	emptyTitle: { fontSize: 20, fontWeight: '700' },
	promo: {
		marginHorizontal: 0,
		paddingHorizontal: 24,
		paddingTop: 28,
		paddingBottom: 36,
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
		marginBottom: 8,
	},
	promoOff: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'right' },
	promoValue: { color: '#FFFFFF', fontSize: 72, fontWeight: '800', lineHeight: 78 },
	promoCode: { color: 'rgba(255,255,255,0.55)', fontSize: 16, marginTop: 8 },
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F0EDED',
	},
	thumb: {
		width: 52,
		height: 52,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	image: { width: '100%', height: '100%' },
	info: { flex: 1, marginLeft: 14 },
	name: { fontSize: 16, fontWeight: '700' },
	price: { fontSize: 13, marginTop: 4 },
	qty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
	qtySign: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
	qtyText: { minWidth: 16, textAlign: 'center', fontSize: 16, fontWeight: '700' },
	moreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
	more: { fontSize: 14, fontWeight: '700' },
	summary: {
		margin: 16,
		marginBottom: 118,
		padding: 22,
		borderRadius: 28,
		backgroundColor: '#F7F7F7',
		gap: 12,
	},
	summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
	summaryLabel: { fontSize: 16, fontWeight: '600' },
	totalLabel: { fontSize: 18, fontWeight: '800' },
	checkout: { marginTop: 10, minHeight: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
	checkoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
