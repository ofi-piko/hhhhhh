import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, ThemeName } from './colors';

type Ctx = {
    theme: ThemeName;
    colors: typeof palettes.light;
    isDark: boolean;
    toggle: () => void;
    setTheme: (t: ThemeName) => void;
};

const ThemeCtx = createContext<Ctx>({
    theme: 'light',
    colors: palettes.light,
    isDark: false,
    toggle: () => { },
    setTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const system = useColorScheme();
    const [theme, setTheme] = useState<ThemeName>(
        system === 'dark' ? 'dark' : 'light'
    );
    const [themeLoaded, setThemeLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('savatcha.theme')
            .then((savedTheme) => {
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setTheme(savedTheme);
                }
            })
            .finally(() => setThemeLoaded(true));
    }, []);

    useEffect(() => {
        if (themeLoaded) {
            AsyncStorage.setItem('savatcha.theme', theme).catch(() => undefined);
        }
    }, [theme, themeLoaded]);

    const value: Ctx = {
        theme,
        colors: palettes[theme],
        isDark: theme === 'dark',
        toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
        setTheme,
    };

    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);