import {SplashScreen, Stack} from "expo-router";
import "./global.css"
import { useFonts  } from "expo-font";
import {useEffect, useState} from "react";
import {error} from "@expo/fingerprint/cli/build/utils/log";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Lato-Black': require('./assets/fonts/Lato/Lato-Black.ttf'),
    'Lato-Bold': require('./assets/fonts/Lato/Lato-Bold.ttf'),
    'Lato-Light': require('./assets/fonts/Lato/Lato-Light.ttf'),
    'Lato-Regular': require('./assets/fonts/Lato/Lato-Regular.ttf'),
    'Lato-Thin': require('./assets/fonts/Lato/Lato-Thin.ttf'),
    'Merriweather-Light': require('./assets/fonts/Merriweather/Merriweather-Light.ttf'),
    'Merriweather-Medium': require('./assets/fonts/Merriweather/Merriweather-Medium.ttf'),
    'Merriweather-Regular': require('./assets/fonts/Merriweather/Merriweather-Regular.ttf'),
    'Merriweather-SemiBold': require('./assets/fonts/Merriweather/Merriweather-SemiBold.ttf'),
  });
  useEffect(() => {
    if(error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  return <Stack screenOptions={{headerShown: false}}/>;
}
