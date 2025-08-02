import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface PageIndicatorProps {
    totalPages: number;
    currentPage: number;
    variant?: 'dots' | 'lines' | 'pills' | 'progress';
}

const PageIndicator: React.FC<PageIndicatorProps> = ({
                                                         totalPages,
                                                         currentPage,
                                                         variant = 'dots'
                                                     }) => {
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();

    // Color classes
    const activeColor = 'bg-indigo-500';
    const inactiveColor = isDark ? 'bg-slate-600' : 'bg-gray-300';

    // Create array of page numbers
    const pages = Array.from({ length: totalPages }, (_, index) => index);

    // Render based on variant
    switch (variant) {
        case 'lines':
            return (
                <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-center items-center gap-2`}>
                    {pages.map((index) => (
                        <View
                            key={`line-${index}`}
                            className={`h-1 rounded-full ${
                                index === currentPage ? `${activeColor} w-8` : `${inactiveColor} w-4`
                            }`}
                        />
                    ))}
                </View>
            );

        case 'pills':
            return (
                <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-center items-center gap-2`}>
                    {pages.map((index) => (
                        <View
                            key={`pill-${index}`}
                            className={`h-2 rounded-full ${
                                index === currentPage ? `${activeColor} w-6` : `${inactiveColor} w-2`
                            }`}
                        />
                    ))}
                </View>
            );

        case 'progress':
            return (
                <View className="w-32 mx-auto">
                    <View className={`h-2 rounded-full ${inactiveColor}`}>
                        <View
                            className={`h-full rounded-full ${activeColor}`}
                            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                        />
                    </View>
                </View>
            );

        default: // dots
            return (
                <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-center items-center gap-2`}>
                    {pages.map((index) => (
                        <View
                            key={`dot-${index}`}
                            className={`rounded-full ${
                                index === currentPage
                                    ? `${activeColor} w-4 h-4`
                                    : `${inactiveColor} w-3 h-3`
                            }`}
                        />
                    ))}
                </View>
            );
    }
};

export default PageIndicator;