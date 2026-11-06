import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text } from '../../../components/ui/Text';
import { formatMoney } from '../../../services/api/session';
import { cartStore, useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import type { Product } from '../../../types/product';

type Props = {
	product: Product;
	onBack: () => void;
	onOpenCart: () => void;
};

export default function ProductScreen({ product, onBack, onOpenCart }: Props) {
	const { colors } = useTheme();
	const { count } = useCart();
	const [detailsOpen, setDetailsOpen] = useState(true);
	const [factsOpen, setFactsOpen] = useState(false);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScreenTopBar
				title={product.name}
				onBack={onBack}
				right={(
					<TouchableOpacity onPress={onOpenCart} accessibilityRole="button">
						<Ionicons name="bag-handle-outline" size={24} color={colors.primary} />
						{count > 0 && (
							<View style={[styles.badge, { backgroundColor: colors.primary }]}>
								<Text style={styles.badgeText}>{count}</Text>
							</View>
						)}
					</TouchableOpacity>
				)}
			/>
			<ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}>
				<View style={[styles.hero, { backgroundColor: '#F6F0EA' }]}>
					{product.image_url ? (
						<Image source={{ uri: product.image_url }} style={styles.heroImage} />
					) : (
						<Ionicons name="image-outline" size={72} color="#C4A6A6" />
					)}
				</View>
				<View style={styles.dots}>
					<View style={[styles.dot, { backgroundColor: colors.primary }]} />
					<View style={[styles.dot, { backgroundColor: '#D9D9D9' }]} />
					<View style={[styles.dot, { backgroundColor: '#D9D9D9' }]} />
				</View>

				<Text style={[styles.title, { color: colors.primary }]}>{product.name}</Text>
				<View style={styles.priceRow}>
					<Text style={[styles.price, { color: colors.primary }]}>{formatMoney(product.price)}/KG</Text>
					<View style={[styles.offBadge, { backgroundColor: colors.primary }]}>
						<Text style={styles.offText}>OFF</Text>
					</View>
				</View>
				<View style={styles.stars}>
					{[0, 1, 2, 3, 4].map((star) => (
						<Ionicons key={star} name="star" size={16} color={colors.primary} />
					))}
					<Text style={[styles.reviews, { color: colors.textMuted }]}>110 Reviews</Text>
				</View>

				<View style={styles.actions}>
					<TouchableOpacity
						style={[styles.outlineBtn, { borderColor: colors.primary }]}
						onPress={() => cartStore.add(product)}
					>
						<Text style={[styles.outlineText, { color: colors.primary }]}>Add To Cart</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.solidBtn, { backgroundColor: colors.primary }]}
						onPress={() => {
							cartStore.add(product);
							onOpenCart();
						}}
					>
						<Text style={styles.solidText}>Buy Now</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity style={styles.sectionHead} onPress={() => setDetailsOpen((value) => !value)}>
					<Text style={[styles.sectionTitle, { color: colors.primary }]}>Details</Text>
					<Ionicons name={detailsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
				</TouchableOpacity>
				{detailsOpen && (
					<Text style={[styles.sectionBody, { color: colors.textMuted }]}>
						{product.short_desc || product.category}
					</Text>
				)}

				<TouchableOpacity style={styles.sectionHead} onPress={() => setFactsOpen((value) => !value)}>
					<Text style={[styles.sectionTitle, { color: colors.primary }]}>Nutritional facts</Text>
					<Ionicons name={factsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
				</TouchableOpacity>
				{factsOpen && (
					<Text style={[styles.sectionBody, { color: colors.textMuted }]}>
						{product.calories != null ? `${product.calories} ккал` : 'Нет данных'}
						{product.protein_g != null ? ` · белки ${product.protein_g}г` : ''}
						{product.fat_g != null ? ` · жиры ${product.fat_g}г` : ''}
						{product.carbs_g != null ? ` · углеводы ${product.carbs_g}г` : ''}
					</Text>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { paddingHorizontal: 22, paddingBottom: 40 },
	badge: {
		position: 'absolute',
		top: -6,
		right: -8,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
	hero: {
		height: 220,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		marginTop: 8,
	},
	heroImage: { width: '100%', height: '100%' },
	dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 16 },
	dot: { width: 18, height: 4, borderRadius: 2 },
	title: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
	priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	price: { fontSize: 22, fontWeight: '800' },
	offBadge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
	offText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
	stars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, marginBottom: 22 },
	reviews: { marginLeft: 6, fontSize: 13 },
	actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
	outlineBtn: { flex: 1, minHeight: 54, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
	outlineText: { fontSize: 15, fontWeight: '700' },
	solidBtn: { flex: 1, minHeight: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
	solidText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
	sectionHead: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderTopWidth: 1,
		borderTopColor: '#EFEFEF',
	},
	sectionTitle: { fontSize: 16, fontWeight: '700' },
	sectionBody: { fontSize: 14, lineHeight: 22, paddingBottom: 12 },
});
