import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  type ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from './Text';

export type FooterTab =
  | 'home'
  | 'favourite'
  | 'catalog'
  | 'scan'
  | 'settings'
  | 'cart'
  | 'profile';

export type ScanOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NavTab = Exclude<FooterTab, 'scan'>;

type TabConfig = {
  key: NavTab;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

type Props = {
  activeTab: FooterTab;
  onTabPress: (tab: FooterTab, origin?: ScanOrigin) => void;
  cartCount?: number;
  isScanning: boolean;
};

type TabLayout = {
  x: number;
  width: number;
};

const CIRCLE_SIZE = 44;
const SCAN_SIZE = 52;

const TABS_LEFT: TabConfig[] = [
  {
    key: 'home',
    icon: 'home-outline',
    activeIcon: 'home',
    label: 'Home',
  },
  {
    key: 'catalog',
    icon: 'grid-outline',
    activeIcon: 'grid',
    label: 'Categories',
  },
  {
    key: 'favourite',
    icon: 'heart-outline',
    activeIcon: 'heart',
    label: 'Favourite',
  },
];

const TABS_RIGHT: TabConfig[] = [
  {
    key: 'settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    label: 'setting',
  },
  {
    key: 'cart',
    icon: 'cart-outline',
    activeIcon: 'cart',
    label: 'cart',
  },
  {
    key: 'profile',
    icon: 'person-outline',
    activeIcon: 'person',
    label: 'Profile',
  },
];

export const Footer: React.FC<Props> = ({
  activeTab,
  onTabPress,
  cartCount = 0,
  isScanning,
}) => {
  const insets = useSafeAreaInsets();

  const scanButtonRef = useRef<ViewInstance>(null);

  const [layouts, setLayouts] = useState<
    Partial<Record<NavTab, TabLayout>>
  >({});

  // Один постоянный Liquid Glass круг
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorInitialized = useRef(false);

  // Сжатие центральной кнопки при открытии сканера
  const centerBtnWidth = useRef(
    new Animated.Value(isScanning ? 0 : SCAN_SIZE),
  ).current;

  const centerBtnMargin = useRef(
    new Animated.Value(isScanning ? 0 : 8),
  ).current;

  const centerBtnOpacity = useRef(
    new Animated.Value(isScanning ? 0 : 1),
  ).current;

  // Запоминаем реальные координаты каждой вкладки
  const registerLayout = (
    key: NavTab,
    x: number,
    width: number,
  ) => {
    setLayouts((previous) => {
      const old = previous[key];

      if (
        old &&
        Math.abs(old.x - x) < 0.5 &&
        Math.abs(old.width - width) < 0.5
      ) {
        return previous;
      }

      return {
        ...previous,
        [key]: { x, width },
      };
    });
  };

  // Плавное перемещение общего индикатора под выбранную вкладку
  useEffect(() => {
    if (activeTab === 'scan') return;

    const layout = layouts[activeTab];

    if (!layout) return;

    const targetX =
      layout.x + (layout.width - CIRCLE_SIZE) / 2;

    if (!indicatorInitialized.current) {
      indicatorX.setValue(targetX);
      indicatorInitialized.current = true;
      return;
    }

    indicatorX.stopAnimation();

    Animated.spring(indicatorX, {
      toValue: targetX,
      tension: 75,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeTab, layouts, indicatorX]);

  // Здесь все анимации используют JS-драйвер,
  // потому что width и marginHorizontal несовместимы с native driver
  useEffect(() => {
    Animated.parallel([
      Animated.timing(centerBtnWidth, {
        toValue: isScanning ? 0 : SCAN_SIZE,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(centerBtnMargin, {
        toValue: isScanning ? 0 : 8,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(centerBtnOpacity, {
        toValue: isScanning ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    isScanning,
    centerBtnWidth,
    centerBtnMargin,
    centerBtnOpacity,
  ]);

  // Передаём координаты кнопки экрану сканирования
  const handleScanPress = () => {
    const button = scanButtonRef.current;

    if (!button) {
      onTabPress('scan');
      return;
    }

    button.measureInWindow((x, y, width, height) => {
      onTabPress('scan', {
        x,
        y,
        width,
        height,
      });
    });
  };

  const renderTab = (tab: TabConfig) => (
    <TabItem
      key={tab.key}
      tab={tab}
      active={activeTab === tab.key}
      onPress={() => onTabPress(tab.key)}
      onLayout={(x, width) =>
        registerLayout(tab.key, x, width)
      }
      badge={tab.key === 'cart' ? cartCount : undefined}
    />
  );

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      pointerEvents="box-none"
    >
      <BlurView intensity={65} tint="dark" style={styles.pill}>
        {/* Постоянный круг. Не исчезает, только перемещается */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              transform: [{ translateX: indicatorX }],
            },
          ]}
        >
          <BlurView
            intensity={35}
            tint="light"
            style={styles.indicatorBlur}
          />

          <View style={styles.indicatorTint} />
        </Animated.View>

        {TABS_LEFT.map(renderTab)}

        {/* Центральный сканер */}
        <Animated.View
          style={{
            width: centerBtnWidth,
            marginHorizontal: centerBtnMargin,
            opacity: centerBtnOpacity,
            overflow: 'hidden',
          }}
        >
          <View
            ref={scanButtonRef}
            collapsable={false}
            style={styles.scanButtonMeasure}
          >
            <TouchableOpacity
              style={styles.centerBtn}
              onPress={handleScanPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name="scan"
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {TABS_RIGHT.map(renderTab)}
      </BlurView>
    </View>
  );
};

type TabItemProps = {
  tab: TabConfig;
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
  badge?: number;
};

const TabItem: React.FC<TabItemProps> = ({
  tab,
  active,
  onPress,
  onLayout,
  badge,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const previousActive = useRef(active);

  useEffect(() => {
    if (active && !previousActive.current) {
      scaleAnim.stopAnimation();
      translateYAnim.stopAnimation();

      // Jump вверх
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.18,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -5,
            duration: 110,
            useNativeDriver: true,
          }),
        ]),

        // Пружинное возвращение
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 160,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            friction: 4,
            tension: 160,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    if (!active) {
      scaleAnim.stopAnimation();
      translateYAnim.stopAnimation();

      scaleAnim.setValue(1);
      translateYAnim.setValue(0);
    }

    previousActive.current = active;
  }, [active, scaleAnim, translateYAnim]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    onLayout(x, width);
  };

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLayout={handleLayout}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { translateY: translateYAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Ionicons
          name={active ? tab.activeIcon : tab.icon}
          size={22}
          color={active ? '#FFFFFF' : '#303136'}
        />

        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </Animated.View>

      <Text
        style={[styles.label, active && styles.activeLabel]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },

  pill: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 32,
    backgroundColor: 'rgba(65, 65, 75, 0.55)',
    paddingHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  activeIndicator: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(100, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#640000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },

indicatorBlur: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: CIRCLE_SIZE / 2,
},

indicatorTint: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: CIRCLE_SIZE / 2,
  backgroundColor: 'rgba(100, 0, 0, 0.42)',
},
  tabItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  label: {
    maxWidth: '100%',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
    color: '#929BB1',
    textAlign: 'center',
  },

  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scanButtonMeasure: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
  },

  centerBtn: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});