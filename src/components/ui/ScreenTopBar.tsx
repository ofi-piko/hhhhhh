import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

type Props = {
	title: string;
	onBack?: () => void;
	right?: React.ReactNode;
	light?: boolean;
};

export function ScreenTopBar({ title, onBack, right, light = true }: Props) {
	const { colors } = useTheme();
	const iconColor = light ? colors.primary : colors.textInverse;
	const titleColor = light ? colors.primary : colors.textInverse;

	return (
		<View style={styles.row}>
			<View style={styles.side}>
				{onBack ? (
					<TouchableOpacity
						onPress={onBack}
						style={[styles.circle, light && styles.circleLight]}
						accessibilityRole="button"
						accessibilityLabel="Назад"
					>
						<Ionicons name="chevron-back" size={20} color={iconColor} />
					</TouchableOpacity>
				) : null}
			</View>
			<Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>{title}</Text>
			<View style={[styles.side, styles.right]}>{right}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 18,
		paddingBottom: 8,
		minHeight: 52,
	},
	side: { width: 52 },
	right: { alignItems: 'flex-end' },
	circle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.16)',
	},
	circleLight: {
		backgroundColor: '#F4F4F4',
	},
	title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
});
