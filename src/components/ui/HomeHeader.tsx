import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../services/api/supabase';
import { Text, TextInput } from './Text';

type Props = {
    cartCount?: number;
    onCartPress?: () => void;
};

export const HomeHeader: React.FC<Props> = ({ cartCount = 0, onCartPress }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [deliveryTo, setDeliveryTo] = useState('Samarqand');

    useEffect(() => {
        let cancelled = false;

        const loadDeliveryAddress = async () => {
            try {
                const stored = await AsyncStorage.getItem('savatcha.delivery.address');
                if (!cancelled && stored?.trim()) {
                    setDeliveryTo(stored.trim());
                    return;
                }
                const { data } = await supabase.from('user').select('address').maybeSingle();
                if (!cancelled && data?.address?.trim()) setDeliveryTo(data.address.trim());
            } catch {
                return;
            }
        };

        void loadDeliveryAddress();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <View
            style={[
                styles.wrap,
                { backgroundColor: colors.primary, paddingTop: insets.top + 10 },
            ]}
        >
            <View style={styles.topRow}>
                <View>
                    <Text style={[styles.logoSmall, { color: colors.cream }]}>
                        Samarkand  ·  www.savatcha.uz
                    </Text>
                    <Text style={[styles.logo, { color: colors.textInverse }]}>
                        savatcha.uz
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onCartPress}
                    style={styles.cartBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                >
                    <BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.cartGlass}>
                        <Ionicons name="bag-handle-outline" size={22} color={colors.textInverse} />
                        {cartCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.badge }]}>
                                <Text style={styles.badgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </BlurView>
                </TouchableOpacity>
            </View>

            <BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.search}>
                <Ionicons name="search" size={20} color={colors.searchPlaceholder} />
                <TextInput
                    placeholder="Search Products or store"
                    placeholderTextColor={colors.searchPlaceholder}
                    style={[styles.searchInput, { color: colors.textInverse }]}
                    editable={false}
                />
            </BlurView>

            <View style={styles.deliveryRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.cream }]}>DELIVERY TO</Text>
                    <View style={styles.valueRow}>
                        <Text
                            numberOfLines={1}
                            style={[styles.value, { color: colors.textInverse }]}
                        >
                            {deliveryTo}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textInverse} />
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.label, { color: colors.cream }]}>WITHIN</Text>
                    <View style={styles.valueRow}>
                        <Text style={[styles.value, { color: colors.textInverse }]}>1 Hour</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textInverse} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: 20,
        paddingBottom: 22,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 22,
    },
    logoSmall: { fontSize: 8, fontWeight: '600', marginBottom: 2, letterSpacing: 0.5 },
    logo: { fontSize: 20, fontWeight: '800', textDecorationLine: 'underline' },
    cartBtn: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
    cartGlass: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.42)',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 18,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: { flex: 1, fontSize: 15, padding: 0 },

    deliveryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    value: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
});
