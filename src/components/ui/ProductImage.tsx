import React from 'react';
import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
    uri?: string | null;
    size?: number;
    radius?: number;
    style?: ViewStyle;
    iconSize?: number;
};

export const ProductImage: React.FC<Props> = ({
    uri,
    size = 84,
    radius = 14,
    style,
    iconSize = 28,
}) => {
    const hasImage = !!uri && uri.trim().length > 0;

    return (
        <View
            style={[
                styles.wrap,
                { width: size, height: size, borderRadius: radius },
                style,
            ]}
        >
            {hasImage ? (
                <Image
                    source={{ uri: uri as string }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <Ionicons name="restaurant-outline" size={iconSize} color="#9CA3AF" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
});