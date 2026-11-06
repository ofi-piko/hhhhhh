import React, { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MAP_LABELS, SAMARKAND_CENTER } from './addressMapHtml';
import type { AddressMapLanguage, AddressMapMessage } from './addressMapHtml';
import { Text } from '../ui/Text';

type Props = {
	mapApiKey: string;
	yandexApiKey: string;
	language: AddressMapLanguage;
	onLocationSelect: (location: AddressMapMessage) => void;
};

type MapGlApi = {
	Map: new (
		container: HTMLElement,
		options: { key: string; center: [number, number]; zoom: number; lang?: string },
	) => MapGlMap;
	Marker: new (map: MapGlMap, options: { coordinates: [number, number] }) => { destroy: () => void };
};

type MapGlMap = {
	destroy: () => void;
	on: (event: 'click', handler: (event: { lngLat?: [number, number] }) => void) => void;
	setCenter: (center: [number, number], zoom?: number, options?: { duration: number }) => void;
};

declare global {
	interface Window {
		mapgl?: MapGlApi;
	}
}

const loadMapGl = () => new Promise<MapGlApi>((resolve, reject) => {
	if (window.mapgl) {
		resolve(window.mapgl);
		return;
	}
	const existing = document.querySelector<HTMLScriptElement>('script[data-savatcha-mapgl="true"]');
	if (existing) {
		existing.addEventListener('load', () => (window.mapgl ? resolve(window.mapgl) : reject(new Error('MapGL missing'))));
		existing.addEventListener('error', () => reject(new Error('MapGL failed')));
		return;
	}
	const script = document.createElement('script');
	script.src = 'https://mapgl.2gis.com/api/js/v1';
	script.async = true;
	script.dataset.savatchaMapgl = 'true';
	script.onload = () => (window.mapgl ? resolve(window.mapgl) : reject(new Error('MapGL missing')));
	script.onerror = () => reject(new Error('MapGL failed'));
	document.head.appendChild(script);
});

const reverseYandex = async (latitude: number, longitude: number, yandexApiKey: string, language: AddressMapLanguage) => {
	const url = new URL('https://geocode-maps.yandex.ru/v1');
	url.searchParams.set('apikey', yandexApiKey);
	url.searchParams.set('geocode', `${longitude},${latitude}`);
	url.searchParams.set('lang', language === 'en' ? 'en_RU' : 'ru_RU');
	url.searchParams.set('format', 'json');
	url.searchParams.set('results', '1');
	const response = await fetch(url.toString());
	if (!response.ok) return '';
	const data = await response.json() as {
		response?: { GeoObjectCollection?: { featureMember?: Array<{ GeoObject?: { name?: string; metaDataProperty?: { GeocoderMetaData?: { text?: string } } } }> } };
	};
	const item = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
	return item?.metaDataProperty?.GeocoderMetaData?.text || item?.name || '';
};

const reverseNominatim = async (latitude: number, longitude: number) => {
	const url = new URL('https://nominatim.openstreetmap.org/reverse');
	url.searchParams.set('lat', String(latitude));
	url.searchParams.set('lon', String(longitude));
	url.searchParams.set('format', 'json');
	const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
	if (!response.ok) return '';
	const data = await response.json() as { display_name?: string };
	return data.display_name || '';
};

export default function AddressMap({ mapApiKey, yandexApiKey, language, onLocationSelect }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MapGlMap | null>(null);
	const markerRef = useRef<{ destroy: () => void } | null>(null);
	const onSelectRef = useRef(onLocationSelect);
	const [status, setStatus] = useState(mapApiKey ? MAP_LABELS[language].loading : MAP_LABELS[language].missingKey);
	const labels = MAP_LABELS[language];

	onSelectRef.current = onLocationSelect;

	const reportPoint = useCallback(async (latitude: number, longitude: number, knownAddress?: string) => {
		if (mapRef.current) {
			markerRef.current?.destroy();
			if (window.mapgl) {
				markerRef.current = new window.mapgl.Marker(mapRef.current, { coordinates: [longitude, latitude] });
			}
		}
		let address = knownAddress || '';
		if (!address && yandexApiKey) {
			try {
				address = await reverseYandex(latitude, longitude, yandexApiKey, language);
			} catch {
				address = '';
			}
		}
		if (!address) {
			try {
				address = await reverseNominatim(latitude, longitude);
			} catch {
				address = '';
			}
		}
		onSelectRef.current({
			type: 'location',
			latitude,
			longitude,
			address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
		});
	}, [language, yandexApiKey]);
	const reportPointRef = useRef(reportPoint);
	reportPointRef.current = reportPoint;

	const locateUser = useCallback((silent: boolean) => {
		if (!navigator.geolocation || !mapRef.current) {
			if (!silent) setStatus(labels.locate);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				mapRef.current?.setCenter([longitude, latitude], 16, { duration: 450 });
				void reportPointRef.current(latitude, longitude);
				setStatus('');
			},
			() => {
				if (!silent) setStatus(labels.locate);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, [labels.locate]);

	useEffect(() => {
		if (!mapApiKey || !containerRef.current) {
			setStatus(labels.missingKey);
			return;
		}

		let cancelled = false;
		setStatus(labels.loading);

		loadMapGl().then((mapgl) => {
			if (cancelled || !containerRef.current) return;
			mapRef.current?.destroy();
			const map = new mapgl.Map(containerRef.current, {
				key: mapApiKey,
				center: SAMARKAND_CENTER,
				zoom: 13,
				lang: language === 'en' ? 'en' : 'ru',
			});
			map.on('click', (event) => {
				const point = event.lngLat;
				if (!point) return;
				void reportPointRef.current(point[1], point[0]);
			});
			mapRef.current = map;
			setStatus('');
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						if (cancelled) return;
						const { latitude, longitude } = position.coords;
						map.setCenter([longitude, latitude], 16, { duration: 450 });
						void reportPointRef.current(latitude, longitude);
					},
					() => undefined,
					{ enableHighAccuracy: true, timeout: 10000 },
				);
			}
		}).catch(() => {
			if (!cancelled) setStatus(labels.missingKey);
		});

		return () => {
			cancelled = true;
			markerRef.current?.destroy();
			markerRef.current = null;
			mapRef.current?.destroy();
			mapRef.current = null;
		};
	}, [language, labels.loading, labels.missingKey, mapApiKey]);

	return (
		<View collapsable={false} style={styles.container}>
			{createElement('div', {
				ref: containerRef,
				style: {
					position: 'absolute',
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
					width: '100%',
					height: '100%',
				},
			})}
			<View pointerEvents="box-none" style={styles.controls}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel={labels.locate}
					onPress={() => locateUser(false)}
					style={styles.locate}
				>
					<BlurView intensity={32} tint="light" blurMethod="dimezisBlurViewSdk31Plus" style={styles.locateGlass}>
						<Ionicons name="navigate" size={18} color="#3A1818" />
					</BlurView>
				</TouchableOpacity>
			</View>
			{status ? (
				<BlurView intensity={28} tint="light" blurMethod="dimezisBlurViewSdk31Plus" style={styles.status}>
					<Text style={styles.statusText}>{status}</Text>
				</BlurView>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', backgroundColor: '#E8E5E0' },
	controls: { position: 'absolute', zIndex: 5, top: 12, right: 12 },
	locate: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
	locateGlass: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.72)',
		backgroundColor: 'rgba(255,255,255,0.22)',
	},
	status: {
		position: 'absolute',
		zIndex: 6,
		left: 12,
		right: 12,
		top: 66,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 12,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.45)',
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	statusText: { color: '#3A1818', fontSize: 12 },
});
