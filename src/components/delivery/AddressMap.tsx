import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { createAddressMapHtml } from './addressMapHtml';
import type { AddressMapLanguage, AddressMapMessage } from './addressMapHtml';

type Props = {
	mapApiKey: string;
	yandexApiKey: string;
	language: AddressMapLanguage;
	onLocationSelect: (location: AddressMapMessage) => void;
};

export default function AddressMap({ mapApiKey, yandexApiKey, language, onLocationSelect }: Props) {
	const html = useMemo(
		() => createAddressMapHtml(mapApiKey, yandexApiKey, language),
		[mapApiKey, yandexApiKey, language],
	);

	return (
		<View collapsable={false} style={styles.container}>
			<WebView
				originWhitelist={['*']}
				source={{ html, baseUrl: 'https://localhost' }}
				javaScriptEnabled
				domStorageEnabled
				geolocationEnabled
				nestedScrollEnabled
				androidLayerType="hardware"
				setSupportMultipleWindows={false}
				onMessage={(event) => {
					try {
						const message = JSON.parse(event.nativeEvent.data) as AddressMapMessage;
						if (message.type === 'location') onLocationSelect(message);
					} catch {
						return;
					}
				}}
				style={styles.webView}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', backgroundColor: '#E8E5E0' },
	webView: { flex: 1, backgroundColor: 'transparent' },
});
