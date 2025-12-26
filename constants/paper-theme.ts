import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03DAC6',
    tertiary: '#FFC107',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#F44336',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#1C1B1F',
    onSurface: '#1C1B1F',
    onError: '#FFFFFF',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    secondary: '#80CBC4',
    tertiary: '#FFD54F',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#CF6679',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: '#E1E1E1',
    onSurface: '#E1E1E1',
    onError: '#000000',
  },
};
