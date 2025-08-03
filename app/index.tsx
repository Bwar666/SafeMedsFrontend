import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import contexts
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import navigation
import AppNavigator from './navigation/AppNavigator';

// App content with theme support
const AppContent: React.FC = () => {
    const { theme, isDark } = useTheme();

    return (
        <>
            <StatusBar
                style={isDark ? 'light' : 'dark'}
                backgroundColor={theme.background}
                translucent={false}
            />
            <AppNavigator />
        </>
    );
};

// Root App Component with Providers
const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <LanguageProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </LanguageProvider>
        </GestureHandlerRootView>
    );
};

export default App;