import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Simple props - only what we actually need
interface IconButtonProps {
    icon: string;          // The emoji or icon text
    onPress: () => void;   // What happens when pressed
    size?: 'small' | 'large';  // Optional size
}

const IconButton: React.FC<IconButtonProps> = ({
                                                   icon,
                                                   onPress,
                                                   size = 'large'
                                               }) => {
    const { isDark } = useTheme();

    // Simple size logic
    const buttonSize = size === 'small' ? 'p-2' : 'p-3';
    const iconSize = size === 'small' ? 'text-lg' : 'text-xl';

    // Check if icon is text (more than 2 characters) or emoji
    const isTextIcon = icon.length > 2;

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${buttonSize} rounded-full ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}
            activeOpacity={0.7}
        >
            <Text className={`${iconSize} ${isTextIcon && isDark ? 'text-slate-100' : isTextIcon && !isDark ? 'text-gray-800' : ''}`}>
                {icon}
            </Text>
        </TouchableOpacity>
    );
};

export default IconButton;