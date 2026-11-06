import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

type Props = {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    showCart?: boolean;
    cartCount?: number;
    onCartPress?: () => void;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
};

export const Header: React.FC<Props> = ({
    title = 'Магазин',
    subtitle,
    showBack = false,
    onBackPress,
    showCart = true,
    cartCount = 0,
    onCartPress,
    rightIcon,
    onRightPress,
}) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.wrap,
                { backgroundColor: colors.primary, paddingTop: insets.top + 6 },
            ]}
        >
            <View style={styles.row}>
                <View style={styles.side}>
                    {showBack ? (
                        <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
                            <Ionicons name="chevron-back" size={24} color={colors.textInverse} />
                        </TouchableOpacity>
                    ) : (
                        <View
                            style={[
                                styles.logoBadge,
                                { backgroundColor: 'rgba(255,255,255,0.18)' },
                            ]}
                        >
                            <Ionicons name="storefront" size={18} color={colors.textInverse} />
                        </View>
                    )}
                </View>

                <View style={styles.center}>
                    <Text
                        style={[styles.title, { color: colors.textInverse }]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.side, styles.sideRight]}>
                    {rightIcon && (
                        <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
                            <Ionicons name={rightIcon} size={22} color={colors.textInverse} />
                        </TouchableOpacity>
                    )}

                    {showCart && (
                        <TouchableOpacity onPress={onCartPress} style={styles.iconBtn}>
                            <Ionicons
                                name="bag-handle-outline"
                                size={24}
                                color={colors.textInverse}
                            />
                            {cartCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.badge }]}>
                                    <Text style={styles.badgeText}>
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    row: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    side: { width: 72, flexDirection: 'row', alignItems: 'center' },
    sideRight: { justifyContent: 'flex-end', gap: 8 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
    subtitle: { fontSize: 12, marginTop: 2 },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});