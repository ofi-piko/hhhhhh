import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Text } from './src/components/ui/Text';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { Footer, FooterTab } from './src/components/ui/footer';

import HomeScreen from './src/features/catalog/screens/HomeScreen';
import CatalogScreen from './src/features/catalog/screens/CatalogScreen';
import ProductScreen from './src/features/catalog/screens/ProductScreen';
import CartScreen from './src/features/cart/screens/CartScreen';
import CheckoutScreen from './src/features/cart/screens/CheckoutScreen';
import OrdersScreen from './src/features/orders/screens/OrdersScreen';
import TrackOrderScreen from './src/features/orders/screens/TrackOrderScreen';
import ScanScreen from './src/features/scan/screens/ScanScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import { cartStore, useCart } from './src/store/cartStore';
import type { Product } from './src/types/product';

type Stack =
	| { name: 'tabs' }
	| { name: 'product'; product: Product }
	| { name: 'checkout' }
	| { name: 'track'; orderId: string };

export default function App() {
	const [fontsLoaded] = useFonts([
		{
			fontFamily: 'Volkhov',
			fontDefinitions: [
				{ path: require('./assets/fonts/Volkhov-Regular.ttf'), weight: 400 },
				{ path: require('./assets/fonts/Volkhov-Bold.ttf'), weight: 700 },
			],
		},
	]);

	if (!fontsLoaded) return null;

	return (
		<ThemeProvider>
			<SafeAreaProvider>
				<AppInner />
			</SafeAreaProvider>
		</ThemeProvider>
	);
}

function AppInner() {
	const [activeTab, setActiveTab] = useState<FooterTab>('home');
	const [stack, setStack] = useState<Stack>({ name: 'tabs' });
	const [onboardingComplete, setOnboardingComplete] = useState(false);
	const [checkingOnboarding, setCheckingOnboarding] = useState(true);
	const { count } = useCart();
	const { colors, isDark } = useTheme();

	useEffect(() => {
		AsyncStorage.getItem('savatcha.onboarding.complete')
			.then((value) => setOnboardingComplete(value === 'true'))
			.catch(() => setOnboardingComplete(false))
			.finally(() => setCheckingOnboarding(false));
		void cartStore.hydrate();
	}, []);

	const isScanning = activeTab === 'scan';
	const handleTabPress = (tab: FooterTab) => {
		setStack({ name: 'tabs' });
		setActiveTab(tab);
	};

	const renderTab = () => {
		switch (activeTab) {
			case 'home':
				return (
					<HomeScreen
						onGoToCatalog={() => handleTabPress('catalog')}
						onOpenCart={() => handleTabPress('cart')}
						onOpenProduct={(product) => setStack({ name: 'product', product })}
					/>
				);
			case 'catalog':
				return (
					<CatalogScreen
						onBack={() => handleTabPress('home')}
						onOpenCart={() => handleTabPress('cart')}
						onOpenProduct={(product) => setStack({ name: 'product', product })}
					/>
				);
			case 'cart':
				return (
					<CartScreen
						onBack={() => handleTabPress('home')}
						onGoToCatalog={() => handleTabPress('catalog')}
						onCheckout={() => setStack({ name: 'checkout' })}
					/>
				);
			case 'profile':
				return (
					<OrdersScreen
						onBack={() => handleTabPress('home')}
						onTrack={(orderId) => setStack({ name: 'track', orderId })}
					/>
				);
			default:
				return (
					<View style={styles.placeholder}>
						<Text style={{ color: colors.text }}>Экран в разработке</Text>
					</View>
				);
		}
	};

	const renderStack = () => {
		if (stack.name === 'product') {
			return (
				<ProductScreen
					product={stack.product}
					onBack={() => setStack({ name: 'tabs' })}
					onOpenCart={() => {
						setStack({ name: 'tabs' });
						setActiveTab('cart');
					}}
				/>
			);
		}
		if (stack.name === 'checkout') {
			return (
				<CheckoutScreen
					onBack={() => setStack({ name: 'tabs' })}
					onPlaced={(orderId) => {
						setActiveTab('profile');
						setStack({ name: 'track', orderId });
					}}
				/>
			);
		}
		if (stack.name === 'track') {
			return (
				<TrackOrderScreen
					orderId={stack.orderId}
					onBack={() => {
						setActiveTab('profile');
						setStack({ name: 'tabs' });
					}}
				/>
			);
		}
		return renderTab();
	};

	if (checkingOnboarding) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<StatusBar style={isDark ? 'light' : 'dark'} />
			</View>
		);
	}

	if (!onboardingComplete) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<StatusBar style={isDark ? 'light' : 'dark'} />
				<SafeAreaView style={styles.safe} edges={['top']}>
					<RegisterScreen onComplete={() => setOnboardingComplete(true)} />
				</SafeAreaView>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<StatusBar style={isScanning || isDark ? 'light' : 'dark'} />

			{isScanning ? (
				<ScanScreen />
			) : (
				<SafeAreaView style={styles.safe} edges={['top']}>
					<View style={styles.content}>{renderStack()}</View>
				</SafeAreaView>
			)}

			<Footer
				activeTab={activeTab}
				onTabPress={handleTabPress}
				cartCount={count}
				isScanning={isScanning}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1 },
	content: { flex: 1 },
	placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
