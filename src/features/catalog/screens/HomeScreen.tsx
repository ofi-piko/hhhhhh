import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, ActivityIndicator, Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Product } from '../../../types/product';
import { HomeHeader } from '../../../components/ui/HomeHeader';
import { cartStore, useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { fetchProducts } from '../../../services/api/products';
import { formatMoney } from '../../../services/api/session';
import { Text } from '../../../components/ui/Text';

const BANNERS = [
    {
        id: '1',
        title: 'Get',
        highlight: '50% OFF',
        sub: 'On first 03 order',
        variant: 'primary' as const,
    },
    {
        id: '2',
        title: 'Free',
        highlight: 'DELIVERY',
        sub: 'On orders 700 ₽+',
        variant: 'cream' as const,
    },
];

type Props = {
    onGoToCatalog?: () => void;
    onOpenCart?: () => void;
    onOpenProduct?: (product: Product) => void;
};

export default function HomeScreen({ onOpenCart, onOpenProduct }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors } = useTheme();
    const { count } = useCart();

    useEffect(() => {
        fetchProducts(20)
            .then(setProducts)
            .finally(() => setLoading(false));
    }, []);

    const addToCart = (product: Product) => {
        cartStore.add(product);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            <HomeHeader cartCount={count} onCartPress={onOpenCart} />

            {/* Banners */}
            <FlatList
                data={BANNERS}
                keyExtractor={(b) => b.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannerRow}
                renderItem={({ item }) => <Banner item={item} />}
            />

            {/* Recommended */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Recommended
            </Text>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(p) => String(p.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recoRow}
                    renderItem={({ item }) => (
                        <RecoCard
                            item={item}
                            onAdd={() => addToCart(item)}
                            onPress={() => onOpenProduct?.(item)}
                        />
                    )}
                />
            )}
        </ScrollView>
    );
}

// ============ BANNER ============
const Banner = ({ item }: { item: typeof BANNERS[number] }) => {
    const { colors } = useTheme();
    const isPrimary = item.variant === 'primary';

    return (
        <View
            style={[
                styles.banner,
                {
                    backgroundColor: isPrimary ? colors.primary : colors.cream,
                },
            ]}
        >
            <View
                style={[
                    styles.bannerImg,
                    {
                        borderColor: isPrimary ? 'rgba(255,255,255,0.35)' : 'rgba(92,10,10,0.35)',
                    },
                ]}
            >
                <Ionicons
                    name="image-outline"
                    size={40}
                    color={isPrimary ? 'rgba(255,255,255,0.5)' : 'rgba(92,10,10,0.4)'}
                />
            </View>

            <View style={styles.bannerText}>
                <Text
                    style={[
                        styles.bannerTitle,
                        { color: isPrimary ? '#fff' : colors.primary },
                    ]}
                >
                    {item.title}
                </Text>
                <Text
                    style={[
                        styles.bannerHighlight,
                        { color: isPrimary ? '#fff' : colors.primary },
                    ]}
                >
                    {item.highlight}
                </Text>
                <Text
                    style={[
                        styles.bannerSub,
                        { color: isPrimary ? 'rgba(255,255,255,0.85)' : colors.primary },
                    ]}
                >
                    {item.sub}
                </Text>
            </View>
        </View>
    );
};

// ============ RECO CARD ============
const RecoCard = ({ item, onAdd, onPress }: { item: Product; onAdd: () => void; onPress?: () => void }) => {
    const { colors } = useTheme();
    const [imgError, setImgError] = useState(false);
    const hasImg = !!item.image_url && !imgError;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.card,
                { backgroundColor: '#FFFFFF', shadowColor: colors.shadow },
            ]}
        >
            <View
                style={[
                    styles.cardImg,
                    { backgroundColor: '#F6F0EA', borderColor: '#EFE7E4' },
                ]}
            >
                {hasImg ? (
                    <Image
                        source={{ uri: item.image_url! }}
                        style={styles.cardImgReal}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <Ionicons
                        name="image-outline"
                        size={44}
                        color="#C4A6A6"
                    />
                )}
            </View>

            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                {item.category}
            </Text>

            <View style={styles.cardFoot}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={[styles.unitLabel, { color: colors.textMuted }]}>Unit</Text>
                    <Text style={[styles.unitPrice, { color: colors.text }]}>
                        {formatMoney(item.price)}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onAdd}
                    activeOpacity={0.85}
                    style={[styles.plus, { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// ============ STYLES ============
const styles = StyleSheet.create({
    container: { flex: 1 },

    bannerRow: { paddingHorizontal: 20, gap: 14, paddingTop: 22 },
    banner: {
        width: 270,
        height: 130,
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    bannerImg: {
        width: 80,
        height: 80,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: { flex: 1 },
    bannerTitle: { fontSize: 16, fontWeight: '500' },
    bannerHighlight: { fontSize: 26, fontWeight: '900', marginTop: 2 },
    bannerSub: { fontSize: 12, marginTop: 4 },

    sectionTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 30,
        marginBottom: 16,
        marginHorizontal: 20,
        letterSpacing: -0.5,
    },

    recoRow: { paddingHorizontal: 20, gap: 12 },

    card: {
        width: 160,
        borderRadius: 20,
        padding: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    cardImg: {
        height: 110,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cardImgReal: { width: '100%', height: '100%' },
    cardName: { fontSize: 15, fontWeight: '800', marginTop: 12 },
    cardSub: { fontSize: 12, marginTop: 2 },
    cardFoot: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    unitLabel: { fontSize: 12, fontWeight: '500' },
    unitPrice: { fontSize: 16, fontWeight: '800' },
    plus: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});