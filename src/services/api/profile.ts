import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type DeliveryProfile = {
	address: string;
	city: string;
	phone: string;
	latitude: number | null;
	longitude: number | null;
};

export async function fetchDeliveryProfile(): Promise<DeliveryProfile> {
	const [[, storedAddress], [, storedCity], [, storedLat], [, storedLng]] = await AsyncStorage.multiGet([
		'savatcha.delivery.address',
		'savatcha.delivery.city',
		'savatcha.delivery.latitude',
		'savatcha.delivery.longitude',
	]);

	const { data } = await supabase.from('user').select('address, city, phone').maybeSingle();
	const latitude = storedLat ? Number(storedLat) : null;
	const longitude = storedLng ? Number(storedLng) : null;

	return {
		address: storedAddress?.trim() || data?.address?.trim() || '',
		city: storedCity?.trim() || data?.city?.trim() || '',
		phone: data?.phone?.trim() || '',
		latitude: Number.isFinite(latitude) ? latitude : null,
		longitude: Number.isFinite(longitude) ? longitude : null,
	};
}
