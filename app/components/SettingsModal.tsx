import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import { X, User, Globe, Palette, LogOut, Trash2, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserStorageService, SafeMedUser, apiService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

// Settings Section Component
const SettingsSection: React.FC<{
    title: string;
    children: React.ReactNode;
    isDark: boolean;
}> = ({ title, children, isDark }) => (
    <View className="mb-6">
        <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {title}
        </Text>
        <View className={`rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
            {children}
        </View>
    </View>
);

// Settings Item Component
const SettingsItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isDark: boolean;
    isLast?: boolean;
}> = ({ icon, title, subtitle, onPress, rightElement, isDark, isLast = false }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        className={`flex-row items-center p-4 ${!isLast ? `border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}` : ''}`}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <View className="mr-3">
            {icon}
        </View>
        <View className="flex-1">
            <Text className={`text-base font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                {title}
            </Text>
            {subtitle && (
                <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {subtitle}
                </Text>
            )}
        </View>
        {rightElement && (
            <View className="ml-3">
                {rightElement}
            </View>
        )}
    </TouchableOpacity>
);

// Language Selector Component
const LanguageSelector: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const { currentLanguage, changeLanguage, t } = useLanguage();

    const languages = [
        { code: 'en' as const, name: 'English', flag: '🇺🇸' },
        { code: 'ar' as const, name: 'العربية', flag: '🇮🇶' },
        { code: 'ku' as const, name: 'کوردی', flag: '❤️☀️💚' },
    ];

    return (
        <View>
            {languages.map((lang, index) => (
                <TouchableOpacity
                    key={lang.code}
                    onPress={() => changeLanguage(lang.code)}
                    className={`flex-row items-center justify-between p-4 ${
                        index < languages.length - 1 ? `border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}` : ''
                    }`}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center">
                        <Text className="text-lg mr-3">{lang.flag}</Text>
                        <Text className={`text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {lang.name}
                        </Text>
                    </View>
                    {currentLanguage === lang.code && (
                        <Text className="text-indigo-500 text-lg">✓</Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

// Main Settings Modal
const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { isDark, toggleTheme } = useTheme();
    const { t, currentLanguage } = useLanguage();
    const [user, setUser] = useState<SafeMedUser | null>(null);
    const [showLanguages, setShowLanguages] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (visible) {
            loadUserData();
        }
    }, [visible]);

    const loadUserData = async () => {
        try {
            const userData = await UserStorageService.getStoredUser();
            setUser(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('deleteAccount') || 'Delete Account',
            t('deleteAccountConfirmation') || 'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: confirmDeleteAccount,
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        if (!user) return;

        setIsDeleting(true);
        try {
            await apiService.deleteUser(user.id);
            await UserStorageService.clearUserData();
            await AsyncStorage.removeItem('onboarding_completed');

            // Navigate back to onboarding (this would need navigation context)
            Alert.alert(
                t('success') || 'Success',
                'Account deleted successfully',
                [{ text: t('ok') || 'OK', onPress: () => {
                        onClose();
                        // Reset app navigation here
                    }}]
            );
        } catch (error) {
            Alert.alert(
                t('error') || 'Error',
                t('deleteAccountError') || 'Failed to delete account. Please try again.',
                [{ text: t('ok') || 'OK' }]
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const getLanguageDisplayName = () => {
        const names = { en: 'English', ar: 'العربية', ku: 'کوردی' };
        return names[currentLanguage];
    };

    if (showLanguages) {
        return (
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    {/* Header */}
                    <View className={`flex-row items-center justify-between p-4 border-b ${
                        isDark ? 'border-slate-700' : 'border-gray-200'
                    }`}>
                        <TouchableOpacity onPress={() => setShowLanguages(false)}>
                            <Text className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('back') || 'Back'}
                            </Text>
                        </TouchableOpacity>
                        <Text className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {t('selectLanguage') || 'Select Language'}
                        </Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Language Options */}
                    <View className={`m-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                        <LanguageSelector isDark={isDark} />
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header */}
                <View className={`flex-row items-center justify-between p-4 border-b ${
                    isDark ? 'border-slate-700' : 'border-gray-200'
                }`}>
                    <Text className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {t('settings') || 'Settings'}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-4">
                    {/* Profile Section */}
                    {user && (
                        <SettingsSection title={t('profile') || 'Profile'} isDark={isDark}>
                            <SettingsItem
                                icon={<User size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                                title={`${user.firstName} ${user.lastName}`}
                                subtitle={`${t('age') || 'Age'}: ${new Date().getFullYear() - new Date(user.birthDate).getFullYear()} ${t('years') || 'years'}`}
                                isDark={isDark}
                                isLast
                            />
                        </SettingsSection>
                    )}

                    {/* App Settings */}
                    <SettingsSection title={t('appSettings') || 'App Settings'} isDark={isDark}>
                        <SettingsItem
                            icon={<Globe size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                            title={t('currentLanguage') || 'Language'}
                            subtitle={getLanguageDisplayName()}
                            onPress={() => setShowLanguages(true)}
                            rightElement={<Text className="text-gray-400">›</Text>}
                            isDark={isDark}
                        />
                        <SettingsItem
                            icon={<Palette size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                            title={t('darkMode') || 'Dark Mode'}
                            rightElement={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                                    thumbColor={isDark ? '#FFFFFF' : '#F3F4F6'}
                                />
                            }
                            isDark={isDark}
                            isLast
                        />
                    </SettingsSection>

                    {/* About */}
                    <SettingsSection title={t('about') || 'About'} isDark={isDark}>
                        <SettingsItem
                            icon={<Info size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                            title={t('version') || 'Version'}
                            subtitle="1.0.0"
                            isDark={isDark}
                            isLast
                        />
                    </SettingsSection>

                    {/* Danger Zone */}
                    <SettingsSection title={t('dangerZone') || 'Danger Zone'} isDark={isDark}>
                        <SettingsItem
                            icon={<Trash2 size={20} color="#EF4444" />}
                            title={t('deleteAccount') || 'Delete Account'}
                            subtitle={t('deleteAccountWarning') || 'This action cannot be undone'}
                            onPress={handleDeleteAccount}
                            isDark={isDark}
                            isLast
                        />
                    </SettingsSection>

                    {/* Bottom Padding */}
                    <View className="h-20" />
                </ScrollView>

                {/* Loading Overlay */}
                {isDeleting && (
                    <View
                        className="absolute inset-0 justify-center items-center"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    >
                        <View className={`p-8 rounded-2xl mx-8 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                            <Text className={`text-lg font-semibold text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {t('deletingAccount') || 'Deleting account...'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default SettingsModal;