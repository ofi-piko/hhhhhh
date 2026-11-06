import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '../../../components/ui/Text';
import { fetchProducts } from '../../../services/api/products';
import { formatMoney } from '../../../services/api/session';
import { cartStore, useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import type { Product } from '../../../types/product';

type Props = {
	onOpenProduct?: (product: Product) => void;
	onOpenCart?: () => void;
	onBack?: () => void;
};

export default function CatalogScreen({ onOpenProduct, onOpenCart, onBack }: Props) {
	const { colors } = useTheme();
	const { count } = useCart();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeCat, setActiveCat] = useState('Popular');

	useEffect(() => {
		fetchProducts()
			.then(setProducts)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки'))
			.finally(() => setLoading(false));
	}, []);

	const categories = useMemo(() => {
		const unique = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
		return ['Popular', ...unique];
	}, [products]);

	const filtered = activeCat === 'Popular' ? products : products.filter((product) => product.category === activeCat);

	return (
		<View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
			<View style={[styles.hero, { backgroundColor: colors.primary }]}>
				<View style={styles.heroTop}>
					<TouchableOpacity style={styles.back} onPress={onBack} accessibilityRole="button">
						<Ionicons name="chevron-back" size={20} color={colors.primary} />
					</TouchableOpacity>
					<View style={styles.heroActions}>
						<TouchableOpacity onPress={onOpenCart} accessibilityRole="button">
							<Ionicons name="search" size={22} color="#FFFFFF" />
						</TouchableOpacity>
						<TouchableOpacity onPress={onOpenCart} accessibilityRole="button">
							<Ionicons name="bag-handle-outline" size={22} color="#FFFFFF" />
							{count > 0 && (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>{count}</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>
				<Text style={styles.heroTitle}>Shop{'\n'}By Category</Text>
			</View>

			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
				{categories.map((category) => {
					const active = category === activeCat;
					return (
						<TouchableOpacity
							key={category}
							onPress={() => setActiveCat(category)}
							style={[styles.chip, { borderColor: colors.primary }, active && { backgroundColor: colors.primary }]}
						>
							<Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.primary }]}>{category}</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{loading ? (
				<ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
			) : error ? (
				<Text style={styles.error}>{error}</Text>
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(item) => String(item.id)}
					numColumns={2}
					columnWrapperStyle={styles.columns}
					contentContainerStyle={styles.grid}
					renderItem={({ item }) => (
						<TouchableOpacity style={styles.card} onPress={() => onOpenProduct?.(item)} activeOpacity={0.9}>
							<View style={styles.cardImg}>
								{item.image_url ? (
									<Image source={{ uri: item.image_url }} style={styles.image} />
								) : (
									<Ionicons name="image-outline" size={42} color="#C4A6A6" />
								)}
								<TouchableOpacity
									style={[styles.plus, { backgroundColor: colors.primary }]}
									onPress={() => cartStore.add(item)}
								>
									<Ionicons name="add" size={16} color="#FFFFFF" />
								</TouchableOpacity>
							</View>
							<Text style={[styles.price, { color: colors.primary }]}>{formatMoney(item.price)}</Text>
							<Text style={[styles.name, { color: colors.primary }]} numberOfLines={1}>{item.name}</Text>
						</TouchableOpacity>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	hero: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, borderBottomLeftRadius: 0 },
	heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
	heroActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
	badge: {
		position: 'absolute',
		top: -6,
		right: -8,
		minWidth: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeText: { color: '#5C0A0A', fontSize: 9, fontWeight: '700' },
	heroTitle: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', lineHeight: 46, marginTop: 28 },
	cats: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
	chip: { minHeight: 38, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center' },
	chipText: { fontSize: 13, fontWeight: '700' },
	error: { color: '#DC2626', padding: 20 },
	grid: { paddingHorizontal: 16, paddingBottom: 130 },
	columns: { gap: 12 },
	card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EFE7E4' },
	cardImg: { height: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#F6F0EA' },
	image: { width: '100%', height: '100%' },
	plus: {
		position: 'absolute',
		right: 10,
		bottom: 10,
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	price: { fontSize: 18, fontWeight: '800', marginTop: 10 },
	name: { fontSize: 13, marginTop: 2 },
});
