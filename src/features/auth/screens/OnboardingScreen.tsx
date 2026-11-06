import React from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';

type Props = {
  onComplete: () => void;
};

export default function OnboardingScreen({ onComplete }: Props) {
  const { colors, isDark, toggle } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const titleSize = Math.min(58, Math.max(34, width * 0.077));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        onPress={toggle}
        style={[styles.themeButton, { top: insets.top + 10, backgroundColor: colors.surface }]}
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={[styles.hero, { minHeight: height * 0.43 }]}>
        <Text style={styles.logo}>savatcha.uz</Text>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text, fontSize: titleSize, lineHeight: titleSize * 1.3 }]}>
          {'Your holiday\nshopping\ndelivered to your\nhome 🏕️'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>
          There’s something for everyone to enjoy with Sweet Shop Favourites
        </Text>

        <View style={styles.pagination} accessibilityLabel="Page 1 of 3">
          {[0, 1, 2].map((page) => (
            <View
              key={page}
              style={[
                styles.pageIndicator,
                { backgroundColor: page === 0 ? colors.primary : colors.border },
                page === 0 && styles.activePageIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onComplete}
        activeOpacity={0.85}
        style={[styles.startButton, { backgroundColor: colors.accent, marginBottom: Math.max(insets.bottom, 24) }]}
      >
        <Text style={styles.startText}>Get Started</Text>
        <Ionicons name="arrow-forward-outline" size={34} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: '6.5%', paddingTop: 16 },
  themeButton: {
    position: 'absolute',
    zIndex: 1,
    right: '6.5%',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', justifyContent: 'center' },
  logo: { color: '#5C0A0A', fontSize: 44, fontWeight: '700' },
  copy: { flex: 1, justifyContent: 'center', paddingHorizontal: '5%' },
  title: { fontWeight: '700' },
  subtitle: { fontSize: 19, lineHeight: 25, marginTop: 28 },
  pagination: { flexDirection: 'row', gap: 16, marginTop: 38 },
  pageIndicator: { width: 48, height: 7, borderRadius: 4 },
  activePageIndicator: { width: 76 },
  startButton: {
    minHeight: 112,
    borderRadius: 40,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 42,
  },
  startText: { color: '#FFFFFF', fontSize: 23, fontWeight: '500' },
});
