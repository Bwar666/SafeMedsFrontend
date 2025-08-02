import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

// Simple props - only essential ones
interface PrimaryButtonProps {
    title: string;         // Button text
    onPress: () => void;   // What happens when pressed
    variant?: 'primary' | 'secondary';  // Optional style variant
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
                                                         title,
                                                         onPress,
                                                         variant = 'primary'
                                                     }) => {
    // Simple styling based on variant
    const buttonStyle = variant === 'primary'
        ? 'bg-indigo-500'
        : 'bg-purple-500';

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${buttonStyle} rounded-xl py-4 items-center`}
            activeOpacity={0.8}
        >
            <Text className="text-white text-lg font-semibold">
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default PrimaryButton;