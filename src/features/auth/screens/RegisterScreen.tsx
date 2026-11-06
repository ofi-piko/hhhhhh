import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Animated,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Platform,
	View,
	useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeName } from '../../../theme/colors';
import AddressMap from '../../../components/delivery/AddressMap';
import type { AddressMapMessage } from '../../../components/delivery/addressMapHtml';
import { env } from '../../../config/env';
import { supabase } from '../../../services/api/supabase';
import { Text, TextInput } from '../../../components/ui/Text';
import jokeEntries from '../../../components/data/joke.json';

type Language = 'uz' | 'ru' | 'en';
type SectionStep = 'language' | 'phone' | 'city' | 'address' | 'theme';
type Step = SectionStep | 'joke' | 'welcome';

const SECTION_STEPS: SectionStep[] = ['language', 'phone', 'city', 'address', 'theme'];

type Props = {
	onComplete: () => void;
};

const CITIES = [
	'Samarqand', 'tashkent', 'Buxoro', 'andijon', 'Fargʻona', 'Nukus',
	'Namangan', 'termiz', 'Urganch', 'Jizzax', 'Guliston', 'Navoiy',
];
const AVAILABLE_CITY = 'Samarqand';
const GREETINGS = ['Salom!', 'Привет!', 'Hello!'];
const JOKES = jokeEntries
	.filter((entry) => entry.title.trim() && entry.description.trim())
	.slice(0, 10);

const formatPhoneNumber = (digits: string) => {
	const groups = [2, 3, 2, 2];
	let remaining = digits;
	return groups
		.map((size) => {
			const group = remaining.slice(0, size);
			remaining = remaining.slice(size);
			return group;
		})
		.filter(Boolean)
		.join(' ');
};

const COPY = {
	uz: {
		languageTitle: 'Tilni tanlang', languageSubtitle: 'Ilovadan qaysi tilda foydalanasiz?',
		phoneTitle: 'Telefon raqamingiz', phoneSubtitle: 'Hozircha raqam SMS tasdiqlashisiz saqlanadi',
		cityTitle: 'Shahringiz', citySubtitle: 'Hozircha yetkazib berish faqat Samarqandda mavjud',
		addressTitle: 'Yetkazib berish manzili', addressSubtitle: 'Biz sizni xaritadan topamiz. Shu yerga yetkazamizmi?',
		themeTitle: 'Mavzuni tanlang', themeSubtitle: 'Ilova koʻrinishini xohlagan vaqtda oʻzgartirishingiz mumkin',
		phone: 'Telefon raqami', city: 'Shahar', address: 'Yetkazib berish manzili',
		deliverHere: 'Shu yerga yetkazamizmi?', confirmDelivery: 'Ha, shu yerga', locating: 'Xaritadan qidirilmoqda…', pickOnMap: 'Xaritadagi nuqtani tasdiqlang',
		appearance: 'Mavzu', light: 'Yorugʻ', dark: 'Qorongʻi',
		phonePlaceholder: 'Telefon raqamingizni kiriting', privacyConsent: 'Maxfiylik siyosatiga roziman', personalDataConsent: 'Shaxsiy maʼlumotlarimni qayta ishlashga roziman', consentRequired: 'Davom etish uchun ikkala rozilikni belgilang',
		language: 'Til', continue: 'Davom etish', back: 'Orqaga',
		required: 'Barcha maydonlarni toʻldiring',
		phoneError: 'Telefon raqami 9 ta raqamdan iborat boʻlishi kerak',
		comingSoon: 'Tez orada', registrationError: 'Roʻyxatdan oʻtishda xatolik yuz berdi',
		sessionError: 'Foydalanuvchi seansini yaratib boʻlmadi. Supabase sozlamalarini tekshiring.',
	},
	ru: {
		languageTitle: 'Выберите язык', languageSubtitle: 'На каком языке вам удобнее пользоваться приложением?',
		phoneTitle: 'Номер телефона', phoneSubtitle: 'Пока номер сохраняется без SMS-подтверждения',
		cityTitle: 'Ваш город', citySubtitle: 'Пока доставка доступна только в Самарканде',
		addressTitle: 'Адрес доставки', addressSubtitle: 'Мы найдём вас на карте. Сюда будем доставлять?',
		themeTitle: 'Выберите тему', themeSubtitle: 'Позже тему можно будет изменить в настройках',
		phone: 'Номер телефона', city: 'Город', address: 'Адрес доставки',
		deliverHere: 'Доставлять сюда?', confirmDelivery: 'Да, сюда', locating: 'Ищем вас на карте…', pickOnMap: 'Подтвердите точку на карте',
		appearance: 'Тема', light: 'Светлая', dark: 'Темная',
		phonePlaceholder: 'Введите свой номер телефона', privacyConsent: 'Согласен с политикой конфиденциальности', personalDataConsent: 'Согласен на обработку персональных данных', consentRequired: 'Отметьте оба согласия, чтобы продолжить',
		language: 'Язык', continue: 'Продолжить', back: 'Назад',
		required: 'Заполните все поля',
		phoneError: 'Номер должен содержать 9 цифр после +998',
		comingSoon: 'Скоро', registrationError: 'Не удалось завершить регистрацию',
		sessionError: 'Не удалось создать сессию. Проверьте настройки Supabase.',
	},
	en: {
		languageTitle: 'Choose your language', languageSubtitle: 'Which language would you like to use?',
		phoneTitle: 'Your phone number', phoneSubtitle: 'For now, the number is saved without SMS verification',
		cityTitle: 'Your city', citySubtitle: 'Delivery is currently available only in Samarkand',
		addressTitle: 'Delivery address', addressSubtitle: 'We’ll find you on the map. Deliver here?',
		themeTitle: 'Choose a theme', themeSubtitle: 'You can change this later in settings',
		phone: 'Phone number', city: 'City', address: 'Delivery address',
		deliverHere: 'Deliver here?', confirmDelivery: 'Yes, here', locating: 'Finding you on the map…', pickOnMap: 'Confirm the point on the map',
		appearance: 'Theme', light: 'Light', dark: 'Dark',
		phonePlaceholder: 'Enter your phone number', privacyConsent: 'I agree to the Privacy Policy', personalDataConsent: 'I consent to the processing of my personal data', consentRequired: 'Check both consent boxes to continue',
		language: 'Language', continue: 'Continue', back: 'Back',
		required: 'Complete all fields',
		phoneError: 'Enter 9 digits after +998',
		comingSoon: 'Coming soon', registrationError: 'Registration could not be completed',
		sessionError: 'Could not create a user session. Check the Supabase settings.',
	},
} as const;

export default function RegisterScreen({ onComplete }: Props) {
	const { colors, theme, setTheme } = useTheme();
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const phoneHeight = Math.max(screenHeight - insets.top, screenWidth * 1.35);
	const [step, setStep] = useState<Step>('language');
	const [language, setLanguage] = useState<Language>('ru');
	const [phone, setPhone] = useState('');
	const [privacyAcceptedAt, setPrivacyAcceptedAt] = useState<string | null>(null);
	const [personalDataAcceptedAt, setPersonalDataAcceptedAt] = useState<string | null>(null);
	const [city, setCity] = useState(AVAILABLE_CITY);
	const [address, setAddress] = useState('');
	const [addressCoordinates, setAddressCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
	const [jokeIndex, setJokeIndex] = useState(0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [greetingIndex, setGreetingIndex] = useState(0);
	const greetingOpacity = useRef(new Animated.Value(0)).current;
	const titleEntrance = useRef(new Animated.ValueXY({ x: -44, y: -54 })).current;
	const descriptionEntrance = useRef(new Animated.ValueXY({ x: 34, y: 48 })).current;
	const progressEntrance = useRef(new Animated.ValueXY({ x: 48, y: 0 })).current;
	const buttonEntrance = useRef(new Animated.ValueXY({ x: 0, y: 88 })).current;
	const formEntrance = useRef(new Animated.ValueXY({ x: 64, y: 12 })).current;
	const optionEntrances = useRef<Animated.ValueXY[]>([]);
	if (optionEntrances.current.length === 0) {
		optionEntrances.current = Array.from({ length: 3 }, () => new Animated.ValueXY({ x: 0, y: 96 }));
	}
	const text = COPY[language];
	const handleLocationSelect = useCallback((location: AddressMapMessage) => {
		setAddressCoordinates({ latitude: location.latitude, longitude: location.longitude });
		if (location.address) setAddress(location.address);
		setError('');
	}, []);

	useLayoutEffect(() => {
		if (step === 'welcome') return;

		const isJoke = step === 'joke';
		const sectionIndex = SECTION_STEPS.indexOf(step as SectionStep);
		titleEntrance.setValue(isJoke
			? { x: screenWidth * 0.05, y: -phoneHeight * 0.2 }
			: { x: -screenWidth * 0.14, y: -phoneHeight * 0.12 });
		descriptionEntrance.setValue(isJoke
			? { x: -screenWidth * 0.38, y: phoneHeight * 0.06 }
			: { x: screenWidth * 0.2, y: phoneHeight * 0.08 });
		progressEntrance.setValue(isJoke
			? { x: screenWidth * 0.4, y: -phoneHeight * 0.02 }
			: { x: -screenWidth * 0.35, y: 0 });
		buttonEntrance.setValue(isJoke
			? { x: screenWidth * 0.12, y: phoneHeight * 0.22 }
			: { x: 0, y: phoneHeight * 0.22 });
		optionEntrances.current.forEach((entrance, index) => {
			entrance.setValue({
				x: index === 1 ? screenWidth * 0.12 : -screenWidth * 0.12,
				y: phoneHeight * (0.13 + index * 0.025),
			});
		});
		formEntrance.setValue({
			x: sectionIndex % 2 === 0 ? -screenWidth * 0.32 : screenWidth * 0.32,
			y: phoneHeight * 0.04,
		});

		const springIn = (value: Animated.ValueXY) => Animated.spring(value, {
			toValue: { x: 0, y: 0 },
			friction: 8,
			tension: 64,
			useNativeDriver: Platform.OS !== 'web',
		});
		const entrances = [springIn(titleEntrance), springIn(descriptionEntrance), springIn(progressEntrance)];
		if (step === 'language') entrances.push(...optionEntrances.current.map(springIn));
		entrances.push(springIn(buttonEntrance));
		const staggeredEntrance = Animated.stagger(68, entrances);
		const screenReveal = Animated.sequence([
			Animated.delay(180),
			staggeredEntrance,
		]);
		screenReveal.start();
		const formReveal = sectionIndex >= 0
			? Animated.sequence([Animated.delay(180), springIn(formEntrance)])
			: undefined;
		formReveal?.start();

		return () => {
			screenReveal.stop();
			formReveal?.stop();
			[titleEntrance, descriptionEntrance, progressEntrance, buttonEntrance, formEntrance, ...optionEntrances.current]
				.forEach((entrance) => entrance.stopAnimation());
		};
	}, [step, jokeIndex, screenWidth, phoneHeight, titleEntrance, descriptionEntrance, progressEntrance, buttonEntrance, formEntrance]);

	useEffect(() => {
		if (step !== 'welcome') return;
		let stopped = false;
		let holdTimer: ReturnType<typeof setTimeout>;
		const completeTimer = setTimeout(onComplete, 5600);

		const showGreeting = () => {
			Animated.timing(greetingOpacity, {
				toValue: 1,
				duration: 420,
				useNativeDriver: true,
			}).start(({ finished }) => {
				if (!finished || stopped) return;
				holdTimer = setTimeout(() => {
					Animated.timing(greetingOpacity, {
						toValue: 0,
						duration: 420,
						useNativeDriver: true,
					}).start(({ finished: fadedOut }) => {
						if (!fadedOut || stopped) return;
						setGreetingIndex((current) => (current + 1) % GREETINGS.length);
						showGreeting();
					});
				}, 620);
			});
		};

		showGreeting();
		return () => {
			stopped = true;
			clearTimeout(completeTimer);
			clearTimeout(holdTimer);
			greetingOpacity.stopAnimation();
		};
	}, [greetingOpacity, onComplete, step]);

	const completeRegistration = async () => {
		setError('');
		if (phone.length !== 9) {
			setError(text.phoneError);
			return;
		}
		if (!city || !address.trim() || !addressCoordinates) {
			setError(text.pickOnMap);
			return;
		}
		if (!privacyAcceptedAt || !personalDataAcceptedAt) {
			setError(text.consentRequired);
			return;
		}

		setBusy(true);
		try {
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;

			let userId = sessionData.session?.user.id;
			if (!userId) {
				const { data, error: signInError } = await supabase.auth.signInAnonymously();
				if (signInError) throw signInError;
				if (!data.user) throw new Error(text.sessionError);
				userId = data.user.id;
			}

			const { error: profileError } = await supabase.from('user').upsert({
				id: userId,
				phone: `+998${phone}`,
				city,
				address: address.trim(),
				theme,
				language,
				status: 'client',
			}, { onConflict: 'id' });
			if (profileError) throw profileError;

			try {
				const deliveryStore: [string, string][] = [
					['savatcha.theme', theme],
					['savatcha.language', language],
					['savatcha.onboarding.complete', 'true'],
					['savatcha.delivery.address', address.trim()],
					['savatcha.delivery.city', city],
					['savatcha.consent.privacy', privacyAcceptedAt ?? ''],
					['savatcha.consent.personal', personalDataAcceptedAt ?? ''],
				];
				if (addressCoordinates) {
					deliveryStore.push(
						['savatcha.delivery.latitude', String(addressCoordinates.latitude)],
						['savatcha.delivery.longitude', String(addressCoordinates.longitude)],
					);
				}
				await AsyncStorage.multiSet(deliveryStore);
			} catch (storageError) {
				console.warn('Registration succeeded, but local settings could not be saved:', storageError);
			}
			setStep('welcome');
		} catch (registrationError) {
			const errorData = typeof registrationError === 'object' && registrationError !== null
				? registrationError as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
				: undefined;
			const message = typeof errorData?.message === 'string'
				? [errorData.message, errorData.code, errorData.details, errorData.hint]
					.filter((part): part is string => typeof part === 'string' && part.length > 0)
					.join('\n')
				: registrationError instanceof Error
					? registrationError.message
					: typeof registrationError === 'string' && registrationError.length > 0
						? registrationError
						: text.registrationError;
			setError(message);
		} finally {
			setBusy(false);
		}
	};

	/* Future Telegram verification: move challenge creation and one-time code generation
	 * into a Supabase Edge Function; the client must never generate the secret itself.
	 * const startTelegramVerification = async () => {
	 *   const { data, error } = await supabase.functions.invoke('telegram-verification-start', {
	 *     body: { phone: `+998${phone}` },
	 *   });
	 *   if (error) setError(error.message);
	 *   else if (data?.botUrl) await Linking.openURL(data.botUrl);
	 * };
	 */

	const continueStep = () => {
		setError('');
		if (step === 'language') setStep('phone');
		else if (step === 'phone') {
			if (phone.length !== 9) setError(text.phoneError);
			else if (!privacyAcceptedAt || !personalDataAcceptedAt) setError(text.consentRequired);
			else setStep('city');
		} else if (step === 'city') {
			if (!city) setError(text.required);
			else setStep('address');
		} else if (step === 'address') {
			if (!addressCoordinates || !address.trim()) setError(text.pickOnMap);
			else setStep('theme');
		} else if (step === 'theme') {
			completeRegistration();
		}
	};

	const goBack = () => {
		setError('');
		if (step === 'phone') {
			setStep('joke');
			return;
		}
		if (step === 'joke') {
			setStep('language');
			return;
		}
		const previousIndex = SECTION_STEPS.indexOf(step as SectionStep) - 1;
		if (previousIndex >= 0) setStep(SECTION_STEPS[previousIndex]);
	};

	if (step === 'welcome') {
		return (
			<View style={[styles.welcome, { backgroundColor: colors.background }]}>
				<Text style={[styles.welcomeEyebrow, { color: colors.textMuted }]}>SAVATCHA</Text>
				<Animated.Text style={[styles.welcomeTitle, { color: colors.primary, opacity: greetingOpacity, fontFamily: 'Volkhov' }]}>
					{GREETINGS[greetingIndex]}
				</Animated.Text>
			</View>
		);
	}

	if (step === 'language') {
		return (
			<View style={styles.languageScreen}>
				<View style={styles.languageCopy}>
					<Animated.View style={{ transform: titleEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageTitle, { fontSize: screenWidth * 0.073, lineHeight: screenWidth * 0.095 }]}>Выберите свой{ '\n' }язык</Text>
					</Animated.View>
					<Animated.View style={{ transform: descriptionEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageSubtitle, { fontSize: screenWidth * 0.05, lineHeight: screenWidth * 0.07 }]}>Choose your language{ '\n' }Tilni tanlang</Text>
					</Animated.View>
					<Animated.View style={{ transform: progressEntrance.getTranslateTransform() }}>
						<View style={[styles.languageProgress, { marginTop: screenWidth * 0.055 }]}>
							{SECTION_STEPS.map((item, index) => (
								<View
									key={item}
									style={[styles.languageProgressSegment, index === 0 && styles.languageProgressActive]}
								/>
							))}
						</View>
					</Animated.View>
				</View>

				<View style={styles.languageOptions}>
					{([
						['ru', 'Русский'], ['uz', 'Uzb'], ['en', 'English'],
					] as [Language, string][]).map(([value, label], index) => (
						<Animated.View key={value} style={{ transform: optionEntrances.current[index].getTranslateTransform() }}>
						<TouchableOpacity
							key={value}
							onPress={() => setLanguage(value)}
							accessibilityRole="radio"
							accessibilityState={{ selected: language === value }}
							style={[
								styles.languageOption,
								{ height: screenWidth * 0.125, marginBottom: screenWidth * 0.053 },
								language === value && styles.languageOptionSelected,
							]}
						>
							<BlurView intensity={24} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageOptionGlass, styles.glassChoiceSurface]}>
								<Text style={[styles.languageOptionText, { fontSize: screenWidth * 0.047 }]}>{label}</Text>
							</BlurView>
						</TouchableOpacity>
						</Animated.View>
					))}
				</View>

				<Animated.View style={[styles.languageNext, { transform: buttonEntrance.getTranslateTransform() }]}>
					<TouchableOpacity
						accessibilityRole="button"
						onPress={() => {
							setJokeIndex(0);
							setStep('joke');
						}}
						style={StyleSheet.absoluteFill}
					>
						<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageNextGlass, styles.glassButtonSurface]}>
							<Text style={styles.languageNextText}>Далее</Text>
							<Ionicons name="arrow-forward" size={screenWidth * 0.05} color="#FFFFFF" />
						</BlurView>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	}

	if (step === 'joke') {
		const joke = JOKES[jokeIndex];
		const isLastJoke = jokeIndex === JOKES.length - 1;
		const jokeProgressGap = 6;
		const jokeProgressWidth = screenWidth * 0.8 * 0.57;
		const jokeSegmentWidth = (jokeProgressWidth - jokeProgressGap * (SECTION_STEPS.length - 1)) / SECTION_STEPS.length;
		const jokeFillWidth = jokeSegmentWidth * 2 + jokeProgressGap;

		return (
			<View style={styles.languageScreen}>
				<View style={styles.jokeCopy}>
					<Animated.View style={{ transform: titleEntrance.getTranslateTransform() }}>
						<Text style={[styles.jokeTitle, { fontSize: Math.max(28, screenWidth * 0.078), lineHeight: Math.max(36, screenWidth * 0.1) }]}>
							{joke?.title ?? ''}
						</Text>
					</Animated.View>
					<Animated.View style={{ transform: descriptionEntrance.getTranslateTransform() }}>
						<Text style={[styles.jokeDescription, { fontSize: Math.max(20, screenWidth * 0.046), lineHeight: Math.max(29, screenWidth * 0.062) }]}>
							{joke?.description ?? ''}
						</Text>
					</Animated.View>
					<Animated.View style={{ transform: progressEntrance.getTranslateTransform() }}>
						<View style={styles.jokeProgress}>
							{SECTION_STEPS.map((item) => (
								<View key={item} style={styles.languageProgressSegment} />
							))}
							<View pointerEvents="none" style={[styles.jokeProgressFill, { width: jokeFillWidth }]} />
						</View>
					</Animated.View>
				</View>

				<Animated.View style={[styles.languageNext, { transform: buttonEntrance.getTranslateTransform() }]}>
					<TouchableOpacity
						accessibilityRole="button"
						onPress={() => {
							if (isLastJoke) setStep('phone');
							else setJokeIndex((current) => current + 1);
						}}
						style={StyleSheet.absoluteFill}
					>
						<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageNextGlass, styles.glassButtonSurface]}>
							<Text style={styles.languageNextText}>{isLastJoke ? 'Get Started' : 'Далее'}</Text>
							<Ionicons name="arrow-forward" size={screenWidth * 0.05} color="#FFFFFF" />
						</BlurView>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	}

	if (step === 'phone') {
		const toggleConsent = (acceptedAt: string | null, setAcceptedAt: (value: string | null) => void) => {
			setAcceptedAt(acceptedAt ? null : new Date().toISOString());
			setError('');
		};

		return (
			<View style={styles.languageScreen}>
				<TouchableOpacity onPress={goBack} style={[styles.phoneBack, { top: insets.top + 8 }]} accessibilityRole="button" accessibilityLabel={text.back}>
					<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.iconButtonGlass}>
						<Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.92)" />
					</BlurView>
				</TouchableOpacity>

				<View style={styles.phoneCopy}>
					<Animated.View style={{ transform: titleEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageTitle, { fontSize: screenWidth * 0.073, lineHeight: screenWidth * 0.095 }]}>{text.phoneTitle}</Text>
					</Animated.View>
					<Animated.View style={{ transform: descriptionEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageSubtitle, { fontSize: screenWidth * 0.05, lineHeight: screenWidth * 0.07 }]}>
							{language === 'ru' ? 'Your phone number\nTelefon raqamingiz' : language === 'uz' ? 'Your phone number\nTelefon raqamingiz' : 'Номер телефона\nTelefon raqamingiz'}
						</Text>
					</Animated.View>
					<Animated.View style={{ transform: progressEntrance.getTranslateTransform() }}>
						<View style={[styles.languageProgress, { marginTop: screenWidth * 0.19 }]}>
							{SECTION_STEPS.map((item, index) => (
								<View key={item} style={[styles.languageProgressSegment, index === 1 && styles.languageProgressActive]} />
							))}
						</View>
					</Animated.View>
				</View>

				<Animated.View style={[styles.phoneFieldPosition, { transform: formEntrance.getTranslateTransform() }]}>
					<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.phoneGlassField}>
						<View style={styles.phonePrefixGlass}>
							<Text style={styles.phoneGlassPrefix}>+998</Text>
						</View>
						<TextInput
							value={formatPhoneNumber(phone)}
							onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 9))}
							keyboardType="phone-pad"
							placeholder={text.phonePlaceholder}
							placeholderTextColor="rgba(255,235,235,0.52)"
							style={[styles.phoneGlassInput, { fontSize: screenWidth * 0.036 }]}
							maxLength={12}
							accessibilityLabel={text.phone}
						/>
					</BlurView>
				</Animated.View>

				<View style={styles.consentGroup}>
					<TouchableOpacity
						accessibilityRole="checkbox"
						accessibilityState={{ checked: Boolean(privacyAcceptedAt) }}
						onPress={() => toggleConsent(privacyAcceptedAt, setPrivacyAcceptedAt)}
						style={styles.consentRow}
					>
						<BlurView intensity={28} tint={privacyAcceptedAt ? 'light' : 'dark'} blurMethod="dimezisBlurViewSdk31Plus" style={[styles.consentBox, styles.glassChoiceSurface, privacyAcceptedAt && styles.consentBoxChecked]}>
							{privacyAcceptedAt && <Ionicons name="checkmark" size={16} color="#680000" />}
						</BlurView>
						<Text style={styles.consentText}>{text.privacyConsent}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						accessibilityRole="checkbox"
						accessibilityState={{ checked: Boolean(personalDataAcceptedAt) }}
						onPress={() => toggleConsent(personalDataAcceptedAt, setPersonalDataAcceptedAt)}
						style={styles.consentRow}
					>
						<BlurView intensity={28} tint={personalDataAcceptedAt ? 'light' : 'dark'} blurMethod="dimezisBlurViewSdk31Plus" style={[styles.consentBox, styles.glassChoiceSurface, personalDataAcceptedAt && styles.consentBoxChecked]}>
							{personalDataAcceptedAt && <Ionicons name="checkmark" size={16} color="#680000" />}
						</BlurView>
						<Text style={styles.consentText}>{text.personalDataConsent}</Text>
					</TouchableOpacity>
				</View>

				{!!error && <Text style={styles.phoneError}>{error}</Text>}

				<Animated.View style={[styles.languageNext, { transform: buttonEntrance.getTranslateTransform(), bottom: Math.max(insets.bottom, 14) + 8 }]}>
					<TouchableOpacity accessibilityRole="button" onPress={continueStep} style={StyleSheet.absoluteFill}>
						<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageNextGlass, styles.glassButtonSurface]}>
							<Text style={styles.languageNextText}>{language === 'ru' ? 'Далее' : language === 'uz' ? 'Davom etish' : 'Next'}</Text>
							<Ionicons name="arrow-forward" size={screenWidth * 0.05} color="#FFFFFF" />
						</BlurView>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	}

	if (step === 'city') {
		return (
			<View style={styles.languageScreen}>
				<TouchableOpacity onPress={goBack} style={[styles.phoneBack, { top: insets.top + 8 }]} accessibilityRole="button" accessibilityLabel={text.back}>
					<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.iconButtonGlass}>
						<Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.92)" />
					</BlurView>
				</TouchableOpacity>
				<View style={styles.phoneCopy}>
					<Animated.View style={{ transform: titleEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageTitle, { fontSize: screenWidth * 0.073, lineHeight: screenWidth * 0.095 }]}>Your city</Text>
					</Animated.View>
					<Animated.View style={{ transform: descriptionEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageSubtitle, { fontSize: screenWidth * 0.05, lineHeight: screenWidth * 0.07 }]}>
							Your phone number{ '\n' }Telefon raqamingiz
						</Text>
					</Animated.View>
					<Animated.View style={{ transform: progressEntrance.getTranslateTransform() }}>
						<View style={[styles.languageProgress, { marginTop: screenWidth * 0.19 }]}>
							{SECTION_STEPS.map((item, index) => (
								<View key={item} style={[styles.languageProgressSegment, index === 2 && styles.languageProgressActive]} />
							))}
						</View>
					</Animated.View>
				</View>

				<View style={styles.cityChoiceGrid}>
					{CITIES.map((item) => {
						const selected = city === AVAILABLE_CITY && item === AVAILABLE_CITY;
						const available = item === AVAILABLE_CITY;
						return (
							<TouchableOpacity
								key={item}
								onPress={() => available && setCity(item)}
								disabled={!available}
								accessibilityRole="radio"
								accessibilityState={{ disabled: !available, selected }}
								style={[styles.cityChoice, selected && styles.cityChoiceSelected]}
							>
								<BlurView intensity={24} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.cityChoiceGlass, selected ? styles.cityChoiceGlassSelected : styles.glassChoiceSurface]}>
									<Text style={[styles.cityChoiceText, { fontSize: screenWidth * 0.034 }, !available && styles.cityChoiceUnavailable]} numberOfLines={1} adjustsFontSizeToFit>
										{item}
									</Text>
								</BlurView>
							</TouchableOpacity>
						);
					})}
				</View>

				{!!error && <Text style={styles.cityError}>{error}</Text>}

				<Animated.View style={[styles.languageNext, styles.cityNext, { transform: buttonEntrance.getTranslateTransform(), bottom: Math.max(insets.bottom, 14) + 8 }]}>
					<TouchableOpacity accessibilityRole="button" onPress={continueStep} style={StyleSheet.absoluteFill}>
						<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageNextGlass, styles.glassButtonSurface]}>
							<Text style={styles.languageNextText}>{language === 'ru' ? 'Далее' : language === 'uz' ? 'Davom etish' : 'Next'}</Text>
							<Ionicons name="arrow-forward" size={screenWidth * 0.05} color="#FFFFFF" />
						</BlurView>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	}

	if (step === 'address') {
		const canConfirmDelivery = Boolean(addressCoordinates && address.trim());

		return (
			<View style={styles.languageScreen}>
				<TouchableOpacity onPress={goBack} style={[styles.phoneBack, { top: insets.top + 8 }]} accessibilityRole="button" accessibilityLabel={text.back}>
					<BlurView intensity={28} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.iconButtonGlass}>
						<Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.92)" />
					</BlurView>
				</TouchableOpacity>

				<View style={styles.addressCopy}>
					<Animated.View style={{ transform: titleEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageTitle, { fontSize: screenWidth * 0.073, lineHeight: screenWidth * 0.095 }]}>{text.address}</Text>
					</Animated.View>
					<Animated.View style={{ transform: descriptionEntrance.getTranslateTransform() }}>
						<Text style={[styles.languageSubtitle, styles.addressSubtitle, { fontSize: screenWidth * 0.05, lineHeight: screenWidth * 0.07 }]}>
							{ text.addressSubtitle }
						</Text>
					</Animated.View>
				</View>

				<Animated.View style={[styles.addressProgressPosition, { transform: progressEntrance.getTranslateTransform() }]}>
					<View style={styles.languageProgress}>
						{SECTION_STEPS.map((item, index) => (
							<View key={item} style={[styles.languageProgressSegment, index === 3 && styles.languageProgressActive]} />
						))}
					</View>
				</Animated.View>

				<View collapsable={false} style={styles.mapFrame}>
					<AddressMap
						mapApiKey={env.twoGisMapKey}
						yandexApiKey={env.yandexMapKey}
						language={language}
						onLocationSelect={handleLocationSelect}
					/>
				</View>

				<View style={styles.deliveryCard}>
					<BlurView intensity={36} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.deliveryCardGlass}>
						<Ionicons name="location" size={18} color="#FFFFFF" />
						<View style={styles.deliveryCardCopy}>
							<Text style={styles.deliveryCardLabel}>{text.deliverHere}</Text>
							<Text numberOfLines={2} style={styles.deliveryCardAddress}>
								{address.trim() || text.locating}
							</Text>
						</View>
					</BlurView>
				</View>

				{!!error && <Text style={styles.addressError}>{error}</Text>}

				<Animated.View style={[styles.languageNext, styles.addressNext, { transform: buttonEntrance.getTranslateTransform(), bottom: Math.max(insets.bottom, 14) + 8, opacity: canConfirmDelivery ? 1 : 0.62 }]}>
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityState={{ disabled: !canConfirmDelivery }}
						onPress={continueStep}
						style={StyleSheet.absoluteFill}
					>
						<BlurView intensity={34} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={[styles.languageNextGlass, styles.glassButtonSurface]}>
							<Text style={styles.addressNextText}>{text.confirmDelivery}</Text>
							<Ionicons name="arrow-forward" size={screenWidth * 0.06} color="#FFFFFF" />
						</BlurView>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	}

	const optionTextStyle = (selected: boolean) => [
		styles.optionText,
		{ color: selected ? colors.textInverse : colors.text },
	];
	const sectionTitles: Record<SectionStep, string> = {
		language: text.languageTitle,
		phone: text.phoneTitle,
		city: text.cityTitle,
		address: text.addressTitle,
		theme: text.themeTitle,
	};
	const sectionSubtitles: Record<SectionStep, string> = {
		language: text.languageSubtitle,
		phone: text.phoneSubtitle,
		city: text.citySubtitle,
		address: text.addressSubtitle,
		theme: text.themeSubtitle,
	};
	const sectionIndex = SECTION_STEPS.indexOf(step as SectionStep);

	return (
		<Animated.ScrollView
			style={[styles.screen, { backgroundColor: colors.background, transform: formEntrance.getTranslateTransform() }]}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.brandRow}>
				<View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
					<Text style={styles.brandMarkText}>S</Text>
				</View>
				<Text style={[styles.brandName, { color: colors.text }]}>SAVATCHA</Text>
			</View>

			<TouchableOpacity onPress={goBack} style={styles.backButton} accessibilityRole="button">
				<BlurView intensity={28} tint={theme === 'dark' ? 'dark' : 'light'} blurMethod="dimezisBlurViewSdk31Plus" style={styles.backButtonGlass}>
					<Ionicons name="arrow-back" size={17} color={colors.textMuted} />
					<Text style={[styles.backText, { color: colors.textMuted }]}>{text.back}</Text>
				</BlurView>
			</TouchableOpacity>

			<View style={styles.progressRow}>
				{SECTION_STEPS.map((item, index) => (
					<View
						key={item}
						style={[styles.progressSegment, { backgroundColor: index <= sectionIndex ? colors.primary : colors.border }]}
					/>
				))}
			</View>
			<Text style={[styles.stepCount, { color: colors.textMuted }]}>
				{Math.max(sectionIndex + 1, 1)} / {SECTION_STEPS.length}
			</Text>

			<Text style={[styles.title, { color: colors.text }]}>
				{sectionTitles[step]}
			</Text>
			<Text style={[styles.subtitle, { color: colors.textMuted }]}>
				{sectionSubtitles[step]}
			</Text>

			{step === 'theme' && (
				<>
					<Text style={[styles.label, { color: colors.text }]}>{text.appearance}</Text>
					<View style={styles.optionRow}>
						{(['light', 'dark'] as ThemeName[]).map((value) => {
							const selected = theme === value;
							return (
								<TouchableOpacity
									key={value}
									onPress={() => setTheme(value)}
									accessibilityRole="radio"
									accessibilityState={{ selected }}
									style={[styles.option, styles.flexOption, selected ? styles.themeOptionSelected : styles.themeOption]}
								>
									<BlurView intensity={selected ? 38 : 25} tint={selected ? 'dark' : 'light'} blurMethod="dimezisBlurViewSdk31Plus" style={[styles.optionGlass, styles.glassChoiceSurface]}>
										<Text style={optionTextStyle(selected)}>{value === 'light' ? text.light : text.dark}</Text>
									</BlurView>
								</TouchableOpacity>
							);
						})}
					</View>
				</>
			)}

			{!!error && <Text style={styles.error}>{error}</Text>}

			<TouchableOpacity
				accessibilityRole="button"
				accessibilityState={{ disabled: busy, busy }}
				onPress={continueStep}
				disabled={busy}
				style={[styles.submit, { borderColor: colors.border, opacity: busy ? 0.7 : 1 }]}
			>
				<BlurView intensity={34} tint={theme === 'dark' ? 'dark' : 'light'} blurMethod="dimezisBlurViewSdk31Plus" style={[styles.submitGlass, styles.glassButtonSurface]}>
					{busy ? <ActivityIndicator color={colors.textInverse} /> : (
						<>
							<Text style={[styles.submitText, { color: colors.textInverse }]}>{text.continue}</Text>
							<Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
						</>
					)}
				</BlurView>
			</TouchableOpacity>
		</Animated.ScrollView>
	);
}

const styles = StyleSheet.create({
	languageScreen: { flex: 1, backgroundColor: '#680000', overflow: 'hidden' },
	phoneBack: { position: 'absolute', left: '7%', zIndex: 3, width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
	iconButtonGlass: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', backgroundColor: 'rgba(255,255,255,0.08)' },
	phoneCopy: { position: 'absolute', top: '8.7%', left: '11%', right: '10%' },
	cityChoiceGrid: { position: 'absolute', top: '34.8%', left: '6.7%', right: '6.7%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
	cityChoice: { width: '31%', aspectRatio: 2.35, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.06)' },
	cityChoiceSelected: { borderColor: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(255,255,255,0.14)' },
	cityChoiceGlass: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
	cityChoiceGlassSelected: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.12)' },
	cityChoiceText: { maxWidth: '100%', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
	cityChoiceUnavailable: { opacity: 0.48 },
	cityError: { position: 'absolute', left: '10%', right: '10%', bottom: '14%', color: '#FFE0E0', fontSize: 12, lineHeight: 17 },
	cityNext: { left: '16.5%', width: '67%' },
	phoneFieldPosition: { position: 'absolute', top: '39%', left: '7%', width: '86%', height: '7.1%', minHeight: 58, maxHeight: 76 },
	phoneGlassField: { flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', backgroundColor: 'rgba(255,255,255,0.08)' },
	phonePrefixGlass: { width: '23%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.04)' },
	phoneGlassPrefix: { color: 'rgba(255,255,255,0.72)', fontSize: 20 },
	phoneGlassInput: { flex: 1, minWidth: 0, height: '100%', paddingHorizontal: 12, color: '#FFFFFF' },
	consentGroup: { position: 'absolute', top: '51%', left: '10%', right: '10%', gap: 12 },
	consentRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12 },
	consentBox: { width: 25, height: 25, borderRadius: 7, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
	consentBoxChecked: { backgroundColor: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.78)' },
	consentText: { flex: 1, color: 'rgba(255,245,245,0.9)', fontSize: 13, lineHeight: 19 },
	phoneError: { position: 'absolute', left: '10%', right: '10%', bottom: '14%', color: '#FFE0E0', fontSize: 12, lineHeight: 17 },
	languageCopy: { position: 'absolute', top: '8.7%', left: '10%', right: '10%' },
	addressCopy: { position: 'absolute', top: '8.7%', left: '11%', right: '10%' },
	addressSubtitle: { marginTop: 2 },
	addressProgressPosition: { position: 'absolute', top: '28.5%', left: '11%', width: '57%' },
	mapFrame: { position: 'absolute', top: '32.5%', left: '6.5%', width: '87%', height: '42%', zIndex: 1, borderRadius: 42, overflow: 'hidden', backgroundColor: '#F6F3EF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
	deliveryCard: { position: 'absolute', top: '75.6%', left: '8%', right: '8%', zIndex: 2, borderRadius: 22, overflow: 'hidden' },
	deliveryCardGlass: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)', backgroundColor: 'rgba(255,255,255,0.1)' },
	deliveryCardCopy: { flex: 1, minWidth: 0 },
	deliveryCardLabel: { color: 'rgba(255,245,245,0.72)', fontSize: 11, fontWeight: '700' },
	deliveryCardAddress: { color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
	mapBase: { flex: 1, overflow: 'hidden', backgroundColor: '#F6F3EF' },
	mapParkLeft: { position: 'absolute', left: 0, top: '56%', width: '37%', height: '22%', backgroundColor: '#84F0A7' },
	mapParkTop: { position: 'absolute', right: 0, top: 0, width: '58%', height: '7%', backgroundColor: '#84F0A7' },
	mapParkBottom: { position: 'absolute', right: 0, bottom: 0, width: '34%', height: '32%', backgroundColor: '#84F0A7' },
	mapBlock: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.88)' },
	mapBlockOne: { left: '18%', top: 0, width: '2.2%', height: '56%' },
	mapBlockTwo: { left: '63%', top: '7%', width: '3%', height: '49%' },
	mapBlockThree: { left: 0, top: '23%', width: '100%', height: '2.6%' },
	mapBlockFour: { left: 0, top: '43%', width: '100%', height: '2.6%' },
	mapStreet: { position: 'absolute', backgroundColor: '#9288F3' },
	mapStreetVertical: { left: '36%', top: 0, bottom: 0, width: '7%' },
	mapStreetHorizontal: { left: 0, right: 0, top: '56%', height: '10%' },
	mapStreetLower: { left: '46%', right: 0, top: '68%', height: '10%' },
	mapRoute: { position: 'absolute', backgroundColor: 'rgba(255,177,166,0.88)', borderRadius: 9, shadowColor: '#FFFFFF', shadowOpacity: 0.65, shadowRadius: 6, elevation: 3 },
	mapRouteTop: { left: '39%', top: '51%', width: '32%', height: '2.6%' },
	mapRouteLeft: { left: '38%', top: '51%', width: '2.4%', height: '34%' },
	mapRouteMiddle: { left: '38%', top: '83%', width: '49%', height: '2.6%' },
	mapRouteEnd: { left: '85%', top: '83%', width: '2.4%', height: '18%' },
	mapRoundabout: { position: 'absolute', left: '28%', top: '66%', width: '23%', aspectRatio: 1, borderRadius: 999, borderWidth: 14, borderColor: '#9288F3', backgroundColor: '#9288F3', alignItems: 'center', justifyContent: 'center' },
	mapRoundaboutCenter: { width: '44%', height: '44%', borderRadius: 999, backgroundColor: '#FFFFFF' },
	mapHomePin: { position: 'absolute', left: '60%', top: '39%', width: '17%', height: '19%', alignItems: 'center', justifyContent: 'center', shadowColor: '#8C4B13', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
	mapDestinationPin: { position: 'absolute', left: '79%', top: '73%', width: '13%', aspectRatio: 1, borderRadius: 999, backgroundColor: 'rgba(255,119,99,0.45)', alignItems: 'center', justifyContent: 'center' },
	mapDestinationDot: { width: '40%', height: '40%', borderRadius: 999, backgroundColor: '#FF503E' },
	addressError: { position: 'absolute', left: '10%', right: '10%', bottom: '13%', color: '#FFE0E0', fontSize: 12, lineHeight: 17 },
	addressNext: { left: '16.5%', width: '67%', height: '8.5%', minHeight: 58, maxHeight: 80, bottom: '3.6%' },
	addressNextText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
	languageTitle: { color: '#FFFFFF', fontWeight: '400' },
	languageSubtitle: { color: 'rgba(255,235,235,0.78)', marginTop: 2 },
	languageProgress: { flexDirection: 'row', gap: 6, width: '57%' },
	languageProgressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
	languageProgressActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
	languageOptions: { position: 'absolute', top: '39%', left: '10%', width: '60%' },
	languageOption: { height: 30, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.06)' },
	languageOptionSelected: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.14)' },
	languageOptionGlass: { flex: 1, paddingHorizontal: '8%', justifyContent: 'center', borderRadius: 22, overflow: 'hidden' },
	glassChoiceSurface: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.06)' },
	glassButtonSurface: { borderWidth: 1, borderColor: 'rgba(255,235,235,0.58)', backgroundColor: 'rgba(255,255,255,0.06)', shadowColor: '#FFFFFF', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 1 }, elevation: 4 },
	languageOptionText: { color: '#FFFFFF' },
	languageNext: { position: 'absolute', left: '10%', width: '83%', bottom: '3.6%', height: '8.5%', minHeight: 46, maxHeight: 80, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,225,225,0.5)', backgroundColor: 'rgba(38,0,0,0.26)', zIndex: 2, elevation: 2 },
	languageNextGlass: { ...StyleSheet.absoluteFill, paddingHorizontal: '18%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	languageNextText: { color: '#FFFFFF', fontSize: 14 },
	jokeCopy: { position: 'absolute', top: '17%', left: '10%', right: '10%' },
	jokeTitle: { color: '#FFFFFF', fontWeight: '700' },
	jokeDescription: { color: 'rgba(255,235,235,0.78)', marginTop: '22%' },
	jokeProgress: { position: 'relative', flexDirection: 'row', gap: 6, width: '57%', marginTop: '18%' },
	jokeProgressFill: { position: 'absolute', top: 0, left: 0, maxWidth: '100%', height: 4, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,235,235,0.32)' },
	screen: { flex: 1 },
	content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
	brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
	brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
	brandMarkText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
	brandName: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
	backButton: { alignSelf: 'flex-start', minHeight: 40, minWidth: 88, borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
	backButtonGlass: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)', backgroundColor: 'rgba(255,255,255,0.22)' },
	backText: { fontSize: 14, fontWeight: '600' },
	progressRow: { flexDirection: 'row', gap: 6, marginBottom: 9 },
	progressSegment: { flex: 1, height: 4, borderRadius: 2 },
	stepCount: { fontSize: 12, marginBottom: 16 },
	title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
	subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 26 },
	label: { fontSize: 14, fontWeight: '700', marginBottom: 9 },
	phoneField: { minHeight: 54, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
	prefix: { fontSize: 16, fontWeight: '700', paddingRight: 12, borderRightWidth: 1, borderRightColor: '#B9B9B9' },
	input: { flex: 1, minHeight: 50, fontSize: 16, paddingHorizontal: 12 },
	cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	option: { minHeight: 44, borderWidth: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
	themeOption: { borderColor: 'rgba(255,255,255,0.42)', backgroundColor: 'rgba(255,255,255,0.12)' },
	themeOptionSelected: { borderColor: 'rgba(255,245,245,0.72)', backgroundColor: 'rgba(255,255,255,0.18)' },
	optionGlass: { flex: 1, alignSelf: 'stretch', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, overflow: 'hidden' },
	optionText: { fontSize: 13, fontWeight: '600' },
	disabledCity: { minHeight: 54, opacity: 0.55 },
	cityComingSoon: { fontSize: 10, marginTop: 2 },
	addressInput: { minHeight: 82, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
	optionRow: { flexDirection: 'row', gap: 8 },
	flexOption: { flex: 1 },
	error: { color: '#DC2626', fontSize: 13, marginTop: 14 },
	submit: { minHeight: 58, borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginTop: 24 },
	submitGlass: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
	submitText: { fontSize: 16, fontWeight: '700' },
	welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
	welcomeEyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 18 },
	welcomeTitle: { fontSize: 38, fontWeight: '800' },
});
