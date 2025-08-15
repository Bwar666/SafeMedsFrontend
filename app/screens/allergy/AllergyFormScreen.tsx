import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { AllergyResponse } from '../../services/allergy/AllergyTypes';

interface AllergyFormScreenProps {
    allergy?: AllergyResponse | null;
    onSave: (allergy: { name: string; description: string }) => void;
    onCancel: () => void;
    isSaving: boolean;
    isDark: boolean;
    theme: any;
    t: any;
}

const AllergyFormScreen: React.FC<AllergyFormScreenProps> = ({
                                                                 allergy,
                                                                 onSave,
                                                                 onCancel,
                                                                 isSaving,
                                                                 isDark,
                                                                 theme,
                                                                 t
                                                             }) => {
    const { theme: contextTheme } = useTheme();
    const [name, setName] = useState(allergy?.name || '');
    const [description, setDescription] = useState(allergy?.description || '');

    const commonAllergies = [
        'Penicillin', 'Aspirin', 'Ibuprofen', 'Codeine', 'Morphine',
        'Insulin', 'Latex', 'Peanuts', 'Shellfish', 'Eggs',
        'Milk', 'Soy', 'Wheat', 'Tree nuts', 'Fish'
    ];

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert(
                t('validationError') || 'Validation Error',
                t('allergyNameRequired') || 'Allergy name is required.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }
        onSave({ name: name.trim(), description: description.trim() });
    };

    const isEditMode = !!allergy?.id;

    return (
        <SafeAreaView className={`flex-1`} style={{ backgroundColor: contextTheme.background }}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {/* Header */}
                <View className={`flex-row items-center justify-between p-4 border-b`}
                      style={{ borderBottomColor: contextTheme.border, backgroundColor: contextTheme.card }}>
                    <TouchableOpacity onPress={onCancel}>
                        <X size={24} color={contextTheme.text} />
                    </TouchableOpacity>

                    <Text className={`text-lg font-semibold`} style={{ color: contextTheme.text }}>
                        {isEditMode ? t('editAllergy') : t('addAllergy')}
                    </Text>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSaving || !name.trim()}
                        className={`px-4 py-2 rounded-lg`}
                        style={{ backgroundColor: name.trim() && !isSaving
                                ? contextTheme.primary
                                : contextTheme.border }}
                        activeOpacity={0.7}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={contextTheme.textSecondary} />
                        ) : (
                            <Text className={`font-medium`} style={{ color: name.trim() && !isSaving
                                    ? 'white'
                                    : contextTheme.textSecondary }}>
                                {t('save')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Allergy Name */}
                    <View className="mb-6">
                        <Text className={`text-sm font-medium mb-2`} style={{ color: contextTheme.textSecondary }}>
                            {t('allergyName')} *
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder={t('allergyNamePlaceholder') || 'e.g., Penicillin'}
                            placeholderTextColor={contextTheme.textSecondary}
                            className={`p-4 rounded-xl border text-base`}
                            style={{ borderColor: contextTheme.border, backgroundColor: contextTheme.card, color: contextTheme.text }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                    </View>

                    {/* Allergy Description */}
                    <View className="mb-6">
                        <Text className={`text-sm font-medium mb-2`} style={{ color: contextTheme.textSecondary }}>
                            {t('description')} ({t('optional')})
                        </Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('allergyDescriptionPlaceholder') || 'Describe your reaction or severity'}
                            placeholderTextColor={contextTheme.textSecondary}
                            className={`p-4 rounded-xl border text-base`}
                            style={{ borderColor: contextTheme.border, backgroundColor: contextTheme.card, color: contextTheme.text, minHeight: 80 }}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            autoCorrect={false}
                            returnKeyType="done"
                            blurOnSubmit={true}
                        />
                    </View>

                    {/* Common Allergies (only for add mode) */}
                    {!isEditMode && (
                        <View className="mb-6">
                            <Text className={`text-sm font-medium mb-2`} style={{ color: contextTheme.textSecondary }}>
                                {t('commonAllergies')}
                            </Text>
                            <View className="flex-row flex-wrap">
                                {commonAllergies.map((allergy) => (
                                    <TouchableOpacity
                                        key={allergy}
                                        onPress={() => setName(allergy)}
                                        className={`px-3 py-2 rounded-full border mr-2 mb-2`}
                                        style={{ backgroundColor: name === allergy
                                                ? contextTheme.primary
                                                : contextTheme.surface,
                                            borderColor: name === allergy
                                                ? contextTheme.primary
                                                : contextTheme.border }}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-sm`} style={{ color: name === allergy
                                                ? 'white'
                                                : contextTheme.textSecondary }}>
                                            {allergy}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AllergyFormScreen;