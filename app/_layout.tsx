import { SplashScreen, Stack } from "expo-router";
import "./global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Lato-Black': require('../assets/fonts/lato/Lato-Black.ttf'),
    'Lato-Bold': require('../assets/fonts/lato/Lato-Bold.ttf'),
    'Lato-Light': require('../assets/fonts/lato/Lato-Light.ttf'),
    'Lato-Regular': require('../assets/fonts/lato/Lato-Regular.ttf'),
    'Lato-Thin': require('../assets/fonts/lato/Lato-Thin.ttf'),
    'Merriweather-Light': require('../assets/fonts/Merriweather/Merriweather-Light.ttf'),
    'Merriweather-Medium': require('../assets/fonts/Merriweather/Merriweather-Medium.ttf'),
    'Merriweather-Regular': require('../assets/fonts/Merriweather/Merriweather-Regular.ttf'),
    'Merriweather-SemiBold': require('../assets/fonts/Merriweather/Merriweather-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}