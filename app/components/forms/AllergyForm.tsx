import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import SearchDropdown from '../../components/SearchDropdown'; // Import your SearchDropdown

interface Allergy {
    name: string;
    description: string;
}

interface AllergyFormProps {
    onSubmit: (allergies: Allergy[]) => void;
    onSkip: () => void;
}

// SearchResult interface (from SearchDropdown)
interface SearchResult {
    id: string;
    name: string;
    description?: string;
    category?: string;
}

const AllergyForm: React.FC<AllergyFormProps> = ({ onSubmit, onSkip }) => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const [allergies, setAllergies] = useState<Allergy[]>([]);
    const [currentAllergy, setCurrentAllergy] = useState({ name: '', description: '' });

    const commonAllergies = [
        'Penicillin', 'Aspirin', 'Ibuprofen', 'Codeine', 'Morphine',
        'Peanuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat'
    ];

    const addAllergy = () => {
        const trimmedName = currentAllergy.name.trim();
        if (!trimmedName) return;

        const isDuplicate = allergies.some(
            allergy => allergy.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert(
                t('duplicateAllergy') || 'Duplicate Allergy',
                t('allergyAlreadyAdded') || 'This allergy has already been added.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        setAllergies([...allergies, {
            name: trimmedName,
            description: currentAllergy.description.trim()
        }]);
        setCurrentAllergy({ name: '', description: '' });
    };

    const removeAllergy = (index: number) => {
        setAllergies(allergies.filter((_, i) => i !== index));
    };

    const addQuickAllergy = (allergyName: string) => {
        setCurrentAllergy({ ...currentAllergy, name: allergyName });
    };

    // Handle search result selection
    const handleSearchResultSelect = (result: SearchResult) => {
        setCurrentAllergy({
            name: result.name,
            description: result.description || ''
        });
    };

    const inputClass = `p-4 rounded-xl border text-base ${
        isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
    }`;

    const labelClass = `text-sm font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-gray-700'}`;

    const AllergyItem = ({ allergy, index }: { allergy: Allergy; index: number }) => (
        <View className={`flex-row items-center justify-between p-3 mb-2 rounded-lg ${
            isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}>
            <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {allergy.name}
                </Text>
                {allergy.description && (
                    <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        {allergy.description}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={() => removeAllergy(index)} className="p-2" activeOpacity={0.7}>
                <Text className="text-red-500 text-lg">×</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    className="flex-1 px-5"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View className="mb-6">
                        <Text className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {t('allergies') || 'Allergies'}
                        </Text>
                        <Text className={`text-base text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                            {t('allergyDescription') || 'Add any allergies to help us keep you safe. You can skip this step.'}
                        </Text>
                    </View>

                    {/* Current Allergies List */}
                    {allergies.length > 0 && (
                        <View className="mb-6">
                            <Text className={labelClass}>
                                {t('yourAllergies') || 'Your Allergies'} ({allergies.length})
                            </Text>
                            {allergies.map((allergy, index) => (
                                <AllergyItem key={index} allergy={allergy} index={index} />
                            ))}
                        </View>
                    )}

                    {/* Add New Allergy */}
                    <View className="mb-6">
                        <Text className={labelClass}>{t('addAllergy') || 'Add Allergy'}</Text>

                        {/* Search Dropdown for Allergy Name */}
                        <View className="mb-3">
                            <Text className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {t('searchAllergies') || 'Search for medicine or allergy name'}
                            </Text>
                            <SearchDropdown
                                value={currentAllergy.name}
                                onChangeText={(text) => setCurrentAllergy({...currentAllergy, name: text})}
                                placeholder={t('allergyName') || 'Type allergy name (e.g., Penicillin)'}
                                searchType="allergy"
                                onSelectResult={handleSearchResultSelect}
                            />
                        </View>

                        {/* Description Input */}
                        <TextInput
                            value={currentAllergy.description}
                            onChangeText={(text) => setCurrentAllergy({...currentAllergy, description: text})}
                            placeholder={t('allergyDescriptionPlaceholder') || 'Description (optional)'}
                            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            className={`${inputClass} mb-3`}
                            textAlign={isRTL ? 'right' : 'left'}
                            multiline
                            numberOfLines={2}
                            returnKeyType="done"
                            onSubmitEditing={addAllergy}
                        />

                        <TouchableOpacity
                            onPress={addAllergy}
                            disabled={!currentAllergy.name.trim()}
                            className={`py-3 rounded-lg items-center ${
                                currentAllergy.name.trim()
                                    ? 'bg-purple-500'
                                    : isDark ? 'bg-slate-700' : 'bg-gray-300'
                            }`}
                            activeOpacity={0.8}
                        >
                            <Text className={`font-semibold ${
                                currentAllergy.name.trim() ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                ➕ {t('addAllergy') || 'Add Allergy'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Common Allergies Quick Add */}
                    <View className="mb-8">
                        <Text className={labelClass}>{t('commonAllergies') || 'Quick Add Common Allergies'}</Text>
                        <Text className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('commonAllergies') || 'Tap any item below to add it quickly'}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {commonAllergies.map((allergy) => {
                                const isAlreadyAdded = allergies.some(
                                    existing => existing.name.toLowerCase() === allergy.toLowerCase()
                                );

                                return (
                                    <TouchableOpacity
                                        key={allergy}
                                        onPress={() => !isAlreadyAdded && addQuickAllergy(allergy)}
                                        className={`px-3 py-2 rounded-full border ${
                                            isAlreadyAdded
                                                ? (isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-200')
                                                : (isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white')
                                        }`}
                                        activeOpacity={isAlreadyAdded ? 1 : 0.7}
                                        disabled={isAlreadyAdded}
                                    >
                                        <Text className={`text-sm ${
                                            isAlreadyAdded
                                                ? (isDark ? 'text-slate-500' : 'text-gray-400')
                                                : (isDark ? 'text-slate-200' : 'text-gray-700')
                                        }`}>
                                            {isAlreadyAdded ? '✓ ' : '+ '}{allergy}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="gap-3 pb-6">
                        <TouchableOpacity
                            onPress={() => onSubmit(allergies)}
                            className="bg-indigo-500 py-4 rounded-xl items-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white text-lg font-semibold">
                                {allergies.length > 0
                                    ? `${t('continueWithAllergies') || 'Continue with'} ${allergies.length} ${allergies.length === 1 ? (t('allergy') || 'allergy') : (t('allergies') || 'allergies')}`
                                    : t('continueWithoutAllergies') || 'Continue without allergies'
                                }
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onSkip}
                            className={`py-3 rounded-xl items-center border ${
                                isDark ? 'border-slate-600' : 'border-gray-300'
                            }`}
                            activeOpacity={0.8}
                        >
                            <Text className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('skipForNow') || 'Skip for now'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default AllergyForm;