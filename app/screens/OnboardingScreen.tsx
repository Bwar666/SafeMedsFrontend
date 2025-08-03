import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Dimensions,
    SafeAreaView,
    TouchableOpacity,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IconButton, PrimaryButton, LanguageDropdown, PageIndicator } from '../components';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingScreenProps = StackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { isDark, toggleTheme } = useTheme();

    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const slides = [
        { id: 1, title: t('onboarding1Title'), description: t('onboarding1Desc'), icon: '💊' },
        { id: 2, title: t('onboarding2Title'), description: t('onboarding2Desc'), icon: '⚠️' },
        { id: 3, title: t('onboarding3Title'), description: t('onboarding3Desc'), icon: '📱' },
    ];

    const isLastSlide = currentSlideIndex === slides.length - 1;

    const completeOnboarding = useCallback(async (): Promise<void> => {
        try {
            await AsyncStorage.setItem('onboarding_completed', 'true');
            navigation.navigate('ProfileCreation');
        } catch (error) {
            console.log('Error saving onboarding status:', error);
            navigation.navigate('ProfileCreation');
        }
    }, [navigation]);

    const handleNextSlide = useCallback((): void => {
        if (isLastSlide) {
            completeOnboarding();
        } else {
            const nextIndex = currentSlideIndex + 1;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * screenWidth,
                animated: true,
            });
            setTimeout(() => setCurrentSlideIndex(nextIndex), 50);
        }
    }, [currentSlideIndex, isLastSlide, completeOnboarding]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>): void => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
        if (slideIndex !== currentSlideIndex) {
            setCurrentSlideIndex(slideIndex);
        }
    }, [currentSlideIndex]);

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            {/* Header */}
            <View className={`px-5 pt-12 pb-5 ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center`}>
                <View className={`${isRTL ? 'flex-row' : 'flex-row-reverse'} gap-4`}>
                    <IconButton icon={isDark ? '☀️' : '🌙'} onPress={toggleTheme} />
                    <LanguageDropdown />
                </View>
                <TouchableOpacity onPress={completeOnboarding} className="px-4 py-3" activeOpacity={0.7}>
                    <Text className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                        {t('skip')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                className="flex-1"
            >
                {slides.map((slide) => (
                    <View key={slide.id} style={{ width: screenWidth }} className="flex-1 justify-center items-center">
                        <View className="items-center px-10">
                            <Text className="text-8xl mb-10">{slide.icon}</Text>
                            <Text className={`text-3xl font-bold mb-5 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {slide.title}
                            </Text>
                            <Text className={`text-base leading-6 text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                                {slide.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Bottom Section */}
            <View className="px-5 pb-10">
                <View className="mb-8">
                    <PageIndicator
                        totalPages={slides.length}
                        currentPage={currentSlideIndex}
                        variant="pills"
                    />
                </View>
                <PrimaryButton
                    title={isLastSlide ? t('getStarted') : t('next')}
                    onPress={handleNextSlide}
                />
            </View>
        </SafeAreaView>
    );
};

export default OnboardingScreen;