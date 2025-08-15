import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, Calendar, Save, Edit3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { userService } from '../../services/user/UserService';
import type { SafeMedUser } from '../../services/user/UserTypes';
import DateTimePicker from '@react-native-community/datetimepicker';
import {UserStorageService} from "@/app/services/user";

interface ProfileScreenProps {
    navigation: any;
}

const ProfileManagementScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const { isDark, theme } = useTheme();
    const { currentLanguage, isRTL, t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<SafeMedUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const getLanguagePreference = (): 'ENGLISH' | 'ARABIC' | 'KURDISH' => {
        const languageMap = { 'ar': 'ARABIC', 'ku': 'KURDISH', 'en': 'ENGLISH'} as const;
        return languageMap[currentLanguage as keyof typeof languageMap] || 'ENGLISH';
    };

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
        birthDate: '',
    });

    // Load user data on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await UserStorageService.getStoredUser();
                if (storedUser) {
                    setUser(storedUser);
                    setFormData({
                        firstName: storedUser.firstName,
                        lastName: storedUser.lastName,
                        gender: storedUser.gender,
                        birthDate: storedUser.birthDate,
                    });
                }
            } catch (error) {
                Alert.alert(t('error'), t('failedToLoadProfile'));
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const handleSave = async () => {
        if (!user) return;

        // Simple validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Alert.alert(t('validationError'), t('nameRequired'));
            return;
        }

        setIsSaving(true);
        try {
            const updatedUser = await userService.updateUser(user.id, {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                gender: formData.gender,
                birthDate: formData.birthDate,
                languagePreference: getLanguagePreference(),
                themePreference: isDark ? 'DARK' : 'LIGHT',
                allergies: []
            });

            await UserStorageService.storeUser(updatedUser);
            setUser(updatedUser);
            setIsEditing(false);
            Alert.alert(t('success'), t('profileUpdated'));
        } catch (error) {
            Alert.alert(t('error'), t('updateFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            // Format date to YYYY-MM-DD
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setFormData({...formData, birthDate: formattedDate});
        }
    };

    const calculateAge = (birthDate: string): number => {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const formatGender = (gender: string) => {
        switch (gender) {
            case 'MALE': return t('male');
            case 'FEMALE': return t('female');
            case 'OTHER': return t('other');
            default: return gender;
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text className={`mt-4`} style={{ color: theme.textSecondary }}>
                        {t('loadingProfile')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Convert birthDate string to Date object for picker
    const birthDateObj = formData.birthDate ? new Date(formData.birthDate) : new Date();

    return (
        <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
            {/* Keyboard avoiding wrapper */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                {/* Header */}
                <View
                    className={`flex-row items-center justify-between p-4 border-b`}
                    style={{ borderBottomColor: theme.border, backgroundColor: theme.card }}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                    >
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>

                    <Text className={`text-lg font-semibold`} style={{ color: theme.text }}>
                        {t('profile')}
                    </Text>

                    <TouchableOpacity
                        onPress={isEditing ? handleSave : () => setIsEditing(true)}
                        disabled={isSaving}
                        className={`flex-row items-center px-4 py-2 rounded-lg`}
                        style={{ backgroundColor: isEditing
                                ? theme.primary
                                : theme.surface }}
                        activeOpacity={0.7}
                    >
                        <Text className={`ml-2 font-medium`} style={{ color: isEditing
                                ? 'white'
                                : theme.text }}>
                            {isEditing
                                ? (isSaving ? t('saving') : t('save'))
                                : t('edit')
                            }
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Summary */}
                    <View className={`mx-4 mt-6 p-6 rounded-xl`} style={{ backgroundColor: theme.card }}>
                        <View className="items-center mb-4">
                            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4`}
                                  style={{ backgroundColor: isDark ? theme.primaryDark : theme.primaryLight }}>
                                <User size={40} color={isDark ? '#FFFFFF' : theme.primary} />
                            </View>
                            <Text className={`text-xl font-bold`} style={{ color: theme.text }}>
                                {formData.firstName} {formData.lastName}
                            </Text>
                            {formData.birthDate && (
                                <Text className={`text-sm mt-1`} style={{ color: theme.textSecondary }}>
                                    {calculateAge(formData.birthDate)} {t('years')} • {formatGender(formData.gender)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Profile Fields */}
                    <View className={`mx-4 my-4 p-6 rounded-xl`} style={{ backgroundColor: theme.card }}>
                        <Text className={`text-lg font-semibold mb-4`} style={{ color: theme.text }}>
                            {t('basicInformation')}
                        </Text>

                        {/* First Name */}
                        <View className="mb-6">
                            <Text className={`text-sm font-medium mb-2`} style={{ color: theme.textSecondary }}>
                                {t('firstName')}
                            </Text>
                            <View className={`flex-row items-center p-4 rounded-xl border`}
                                  style={{ borderColor: isEditing
                                          ? theme.primary
                                          : theme.border,
                                      backgroundColor: isEditing
                                          ? theme.surface
                                          : theme.background }}>
                                <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3`}
                                      style={{ backgroundColor: theme.border }}>
                                    <User size={20} color={theme.textSecondary} />
                                </View>
                                {isEditing ? (
                                    <TextInput
                                        value={formData.firstName}
                                        onChangeText={text => setFormData({...formData, firstName: text})}
                                        placeholder={t('enterFirstName')}
                                        placeholderTextColor={theme.textSecondary}
                                        className={`flex-1 text-base`}
                                        style={{ color: theme.text }}
                                        autoCapitalize="words"
                                    />
                                ) : (
                                    <Text className={`flex-1 text-base`}
                                          style={{ color: formData.firstName
                                                  ? theme.text
                                                  : theme.textSecondary }}>
                                        {formData.firstName || t('notSet')}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Last Name */}
                        <View className="mb-6">
                            <Text className={`text-sm font-medium mb-2`} style={{ color: theme.textSecondary }}>
                                {t('lastName')}
                            </Text>
                            <View className={`flex-row items-center p-4 rounded-xl border`}
                                  style={{ borderColor: isEditing
                                          ? theme.primary
                                          : theme.border,
                                      backgroundColor: isEditing
                                          ? theme.surface
                                          : theme.background }}>
                                <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3`}
                                      style={{ backgroundColor: theme.border }}>
                                    <User size={20} color={theme.textSecondary} />
                                </View>
                                {isEditing ? (
                                    <TextInput
                                        value={formData.lastName}
                                        onChangeText={text => setFormData({...formData, lastName: text})}
                                        placeholder={t('enterLastName')}
                                        placeholderTextColor={theme.textSecondary}
                                        className={`flex-1 text-base`}
                                        style={{ color: theme.text }}
                                        autoCapitalize="words"
                                    />
                                ) : (
                                    <Text className={`flex-1 text-base`}
                                          style={{ color: formData.lastName
                                                  ? theme.text
                                                  : theme.textSecondary }}>
                                        {formData.lastName || t('notSet')}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Gender */}
                        <View className="mb-6">
                            <Text className={`text-sm font-medium mb-2`} style={{ color: theme.textSecondary }}>
                                {t('gender')}
                            </Text>
                            {isEditing ? (
                                <View className="flex-row justify-between">
                                    {(['MALE', 'FEMALE', 'OTHER'] as const).map(gender => (
                                        <TouchableOpacity
                                            key={gender}
                                            className={`flex-1 mx-1 p-4 rounded-xl border`}
                                            style={{ backgroundColor: formData.gender === gender
                                                    ? theme.primary
                                                    : theme.background,
                                                borderColor: formData.gender === gender
                                                    ? theme.primary
                                                    : theme.border }}
                                            onPress={() => setFormData({...formData, gender})}
                                            activeOpacity={0.7}
                                        >
                                            <Text className={`text-center font-medium`}
                                                  style={{ color: formData.gender === gender
                                                          ? 'white'
                                                          : theme.text }}>
                                                {formatGender(gender)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View className={`flex-row items-center p-4 rounded-xl border`}
                                      style={{ borderColor: theme.border, backgroundColor: theme.background }}>
                                    <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3`}
                                          style={{ backgroundColor: theme.border }}>
                                        <User size={20} color={theme.textSecondary} />
                                    </View>
                                    <Text className={`flex-1 text-base`} style={{ color: theme.text }}>
                                        {formatGender(formData.gender)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Birth Date */}
                        <View className="mb-2">
                            <Text className={`text-sm font-medium mb-2`} style={{ color: theme.textSecondary }}>
                                {t('birthDate')}
                            </Text>
                            <TouchableOpacity
                                disabled={!isEditing}
                                onPress={() => isEditing && setShowDatePicker(true)}
                            >
                                <View className={`flex-row items-center p-4 rounded-xl border`}
                                      style={{ borderColor: isEditing
                                              ? theme.primary
                                              : theme.border,
                                          backgroundColor: isEditing
                                              ? theme.surface
                                              : theme.background }}>
                                    <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3`}
                                          style={{ backgroundColor: theme.border }}>
                                        <Calendar size={20} color={theme.textSecondary} />
                                    </View>
                                    <Text className={`flex-1 text-base`}
                                          style={{ color: formData.birthDate
                                                  ? theme.text
                                                  : theme.textSecondary }}>
                                        {formData.birthDate || t('notSet')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Information Note */}
                    <View className={`mx-4 p-4 rounded-xl`}
                          style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#EFF6FF' }}>
                        <Text className={`text-sm`}
                              style={{ color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                            ℹ️ {t('profileNote')}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={birthDateObj}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    themeVariant={isDark ? 'dark' : 'light'}
                />
            )}
        </SafeAreaView>
    );
};

export default ProfileManagementScreen;