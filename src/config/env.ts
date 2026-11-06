import Constants from 'expo-constants';

const extraConfig = Constants.expoConfig?.extra ?? {};

export const env = {
    supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ??
        String(extraConfig.EXPO_PUBLIC_SUPABASE_URL ?? ''),
    supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        String(extraConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''),
    twoGisMapKey:
        process.env.EXPO_PUBLIC_2GIS_API_KEY ??
        String(extraConfig.EXPO_PUBLIC_2GIS_API_KEY ?? ''),
    yandexMapKey:
        process.env.EXPO_PUBLIC_YANDEX_MAP_API_KEY ??
        String(extraConfig.EXPO_PUBLIC_YANDEX_MAP_API_KEY ?? ''),
};

export function getSupabaseConfig() {
    const { supabaseUrl, supabaseAnonKey } = env;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Supabase config is missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the .env file or app.json extra settings.'
        );
    }

    return { supabaseUrl, supabaseAnonKey };
}
