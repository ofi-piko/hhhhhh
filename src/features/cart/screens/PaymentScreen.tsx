import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScreenTopBar } from '../../../components/ui/ScreenTopBar';
import { Text, TextInput } from '../../../components/ui/Text';
import { createOrderFromCart } from '../../../services/api/orders';
import { fetchDeliveryProfile } from '../../../services/api/profile';
import { formatMoney } from '../../../services/api/session';
import { cartStore, useCart } from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { COURIER_FEE } from '../../../types/order';

type Props = {
	onBack: () => void;
	onPaid: (orderId: string) => void;
};

export default function PaymentScreen({ onBack, onPaid }: Props) {
	const { colors } = useTheme();
	const { items, total } = useCart();
	const [name, setName] = useState('');
	const [number, setNumber] = useState('');
	const [expiry, setExpiry] = useState('');
	const [cvc, setCvc] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	const pay = async () => {
		setError('');
		if (!name.trim() || number.replace(/\s/g, '').length < 12 || expiry.length < 4 || cvc.length < 3) {
			setError('Заполните данные карты');
			return;
		}
		setBusy(true);
		try {
			const profile = await fetchDeliveryProfile();
			const order = await createOrderFromCart({
				items,
				fulfillment: 'courier',
				address: profile.address,
				latitude: profile.latitude,
				longitude: profile.longitude,
			});
			cartStore.clear(false);
			onPaid(order.id);
		} catch (paymentError) {
			setError(paymentError instanceof Error ? paymentError.message : 'Не удалось оформить заказ');
		} finally {
			setBusy(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScreenTopBar title="Add Card" onBack={onBack} />
			<View style={styles.form}>
				<Text style={styles.label}>CARD HOLDER NAME</Text>
				<TextInput value={name} onChangeText={setName} style={[styles.input, { color: colors.primary }]} />
				<Text style={styles.label}>CARD NUMBER</Text>
				<TextInput
					value={number}
					onChangeText={setNumber}
					keyboardType="number-pad"
					style={[styles.input, { color: colors.primary }]}
				/>
				<View style={styles.row}>
					<View style={styles.half}>
						<Text style={styles.label}>EXP DATE</Text>
						<TextInput value={expiry} onChangeText={setExpiry} style={[styles.input, { color: colors.primary }]} />
					</View>
					<View style={styles.half}>
						<Text style={styles.label}>CVC</Text>
						<TextInput value={cvc} onChangeText={setCvc} keyboardType="number-pad" style={[styles.input, { color: colors.primary }]} />
					</View>
				</View>
				{!!error && <Text style={styles.error}>{error}</Text>}
			</View>
			<View style={styles.summary}>
				<View style={styles.summaryRow}>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>Subtotal</Text>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>{formatMoney(total)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>Delivery</Text>
					<Text style={[styles.summaryLabel, { color: colors.primary }]}>{formatMoney(COURIER_FEE)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={[styles.total, { color: colors.primary }]}>Total</Text>
					<Text style={[styles.total, { color: colors.primary }]}>{formatMoney(total + COURIER_FEE)}</Text>
				</View>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
					onPress={() => { void pay(); }}
					disabled={busy}
				>
					{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Make Payment</Text>}
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	form: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
	label: { color: '#9AA0A6', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 18 },
	input: { borderBottomWidth: 1, borderBottomColor: '#E6E6E6', minHeight: 44, fontSize: 20, fontWeight: '700' },
	row: { flexDirection: 'row', gap: 24 },
	half: { flex: 1 },
	error: { color: '#DC2626', marginTop: 16, fontSize: 13 },
	summary: { margin: 16, marginBottom: 118, padding: 22, borderRadius: 28, backgroundColor: '#F7F7F7', gap: 12 },
	summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
	summaryLabel: { fontSize: 16, fontWeight: '600' },
	total: { fontSize: 18, fontWeight: '800' },
	button: { marginTop: 10, minHeight: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
	buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
