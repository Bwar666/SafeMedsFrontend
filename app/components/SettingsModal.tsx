import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    Switch, I18nManager
} from 'react-native';
import {
    X,
    User,
    AlertTriangle,
    Globe,
    Palette,
    Trash2,
    ChevronRight,
    RefreshCw,
    Shield,
    ChevronLeft
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/user/UserService';
import LanguageDropdown from "@/app/components/LanguageDropdown";

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    onNavigateToProfile: () => void;
    onNavigateToAllergies: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
                                                         visible,
                                                         onClose,
                                                         user,
                                                         onNavigateToProfile,
                                                         onNavigateToAllergies,
                                                     }) => {
    const navigation = useNavigation<any>(); // Use any to bypass strict typing
    const { isDark, toggleTheme, theme } = useTheme();
    const { currentLanguage, t } = useLanguage();
    const [showLanguages, setShowLanguages] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [layoutDirection, setLayoutDirection] = useState(
        I18nManager.isRTL ? 'rtl' : 'ltr'
    );

    useEffect(() => {
        setLayoutDirection(I18nManager.isRTL ? 'rtl' : 'ltr');
    }, [currentLanguage]);


    const clearAllLocalData = async (): Promise<void> => {
        try {
            await Promise.all([
                AsyncStorage.removeItem('onboarding_completed'),
                AsyncStorage.removeItem('profile_created'),
                AsyncStorage.removeItem('user_profile'),
                AsyncStorage.removeItem('user_preferences'),
                AsyncStorage.removeItem('auth_token'),
                AsyncStorage.removeItem('refresh_token'),
                AsyncStorage.removeItem('theme_preference'),
                AsyncStorage.removeItem('language_preference'),
                AsyncStorage.removeItem('medications'),
                AsyncStorage.removeItem('intake_history'),
                AsyncStorage.removeItem('reminders'),
                AsyncStorage.removeItem('notifications_settings'),
                AsyncStorage.removeItem('allergies'),
                AsyncStorage.removeItem('search_history'),
                AsyncStorage.removeItem('app_settings'),
                AsyncStorage.removeItem('favorites'),
                AsyncStorage.removeItem('bookmarks'),
                AsyncStorage.removeItem('cached_data'),
                AsyncStorage.removeItem('first_launch'),
                AsyncStorage.removeItem('app_version'),
            ]);

            console.log('All local data cleared successfully');
        } catch (error) {
            console.error('Error clearing local data:', error);
            throw error;
        }
    };

    const handleDeleteAccount = (): void => {
        Alert.alert(
            t('deleteAccount') || 'Delete Account',
            t('deleteAccountConfirmation') || 'Are you sure you want to delete your account? This action cannot be undone and will remove all your data.',
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

    const navigateToOnboarding = (): void => {
        try {
            // Method 1: Try reset first
            navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
            });
        } catch (error) {
            try {
                navigation.navigate('Onboarding');
            } catch (fallbackError) {
                console.error('Navigation failed:', fallbackError);
                console.log('Forcing app restart...');
            }
        }
    };

    const confirmDeleteAccount = async (): Promise<void> => {
        if (!user?.id) return;

        setIsDeleting(true);
        try {
            // 1. Delete account from backend
            await userService.deleteUser(user.id);

            // 2. Clear all local storage
            await clearAllLocalData();

            // 3. Close the modal first
            onClose();

            // 4. Show success message and navigate to onboarding
            Alert.alert(
                t('accountDeleted') || 'Account Deleted',
                t('accountDeletedMessage') || 'Your account has been successfully deleted. All your data has been removed. Restarting app...',
                [
                    {
                        text: t('ok') || 'OK',
                        onPress: navigateToOnboarding
                    }
                ]
            );

        } catch (error) {
            console.error('Delete account error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Development helper function to clear data for testing
    const handleResetApp = async (): Promise<void> => {
        try {
            await clearAllLocalData();
            onClose();

            Alert.alert(
                'App Reset',
                'All app data cleared. Restarting onboarding flow...',
                [{
                    text: 'OK',
                    onPress: navigateToOnboarding
                }]
            );
        } catch (error) {
            console.error('Reset app error:', error);
            Alert.alert('Error', 'Failed to reset app data');
        }
    };

    const SettingsSection: React.FC<{
        title: string;
        children: React.ReactNode;
        isDark: boolean
    }> = ({ title, children, isDark }) => (
        <View className="mb-6">
            <Text className={`text-sm font-semibold mb-4`} style={{ color: theme.textSecondary }}>
                {title.toUpperCase()}
            </Text>
            <View className={`rounded-xl`} style={{ backgroundColor: theme.surface }}>
                {children}
            </View>
        </View>
    );

    const SettingsItem: React.FC<{
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        isDark: boolean;
        showChevron?: boolean;
        destructive?: boolean;
        customRightComponent?: React.ReactNode;
        disabled?: boolean;
    }> = ({
              icon,
              title,
              subtitle,
              onPress,
              isDark,
              showChevron = true,
              destructive = false,
              customRightComponent,
              disabled = false
          }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-5 ${destructive ? '' : 'border-b border-opacity-20'}`}
            style={{ borderBottomColor: theme.border }}
            activeOpacity={0.7}
            disabled={!onPress || disabled}
        >
            <View className={`w-10 h-10 rounded-lg items-center justify-center mr-4`}
                  style={{ backgroundColor: destructive
                          ? '#FEF2F2'
                          : theme.card }}>
                {icon}
            </View>

            <View className="flex-1 mr-3">
                <Text className={`text-base font-medium`}
                      style={{ color: destructive
                              ? '#EF4444'
                              : theme.text }}>
                    {title}
                </Text>
                {subtitle && (
                    <Text className={`text-sm mt-1`} style={{ color: theme.textSecondary }}>
                        {subtitle}
                    </Text>
                )}
            </View>

            {customRightComponent ? customRightComponent : (
                showChevron && !destructive && (
                    <ChevronRight size={20} color={theme.textSecondary} />
                )
            )}
        </TouchableOpacity>
    );

    if (showLanguages) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowLanguages(false)}
            >
                <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
                    {/* Fixed Header */}
                    <View className={`flex-row items-center justify-between p-5 border-b`}
                          style={{ borderBottomColor: theme.border }}>
                        <TouchableOpacity
                            onPress={() => setShowLanguages(false)}
                            className="p-2"
                        >
                            <ChevronLeft size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text className={`text-xl font-bold`} style={{ color: theme.text }}>
                            {t('selectLanguage') || 'Select Language'}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Language Options */}
                    <View className="p-5">
                        <LanguageDropdown/>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
                {/* Fixed Header */}
                <View className={`flex-row items-center justify-between p-5 border-b`}
                      style={{ borderBottomColor: theme.border }}>
                    <Text className={`text-xl font-bold`} style={{ color: theme.text }}>
                        {t('settings') || 'Settings'}
                    </Text>
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <X size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Personal Section */}
                    <SettingsSection title={t('personal') || 'Personal'} isDark={isDark}>
                        <SettingsItem
                            icon={<User size={20} color={theme.textSecondary} />}
                            title={t('profile') || 'Profile'}
                            subtitle={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : t('editProfile') || 'Edit your profile information'}
                            onPress={onNavigateToProfile}
                            isDark={isDark}
                            disabled={isDeleting}
                        />

                        <SettingsItem
                            icon={<AlertTriangle size={20} color={theme.textSecondary} />}
                            title={t('allergies') || 'Allergies'}
                            subtitle={user?.allergies?.length > 0
                                ? `${user.allergies.length} ${user.allergies.length === 1 ? (t('allergy') || 'allergy') : (t('allergies') || 'allergies')}`
                                : t('manageAllergies') || 'Manage your allergies'
                            }
                            onPress={onNavigateToAllergies}
                            isDark={isDark}
                            disabled={isDeleting}
                        />
                    </SettingsSection>

                    {/* App Settings Section */}
                    <SettingsSection title={t('appSettings') || 'App Settings'} isDark={isDark}>
                        <SettingsItem
                            icon={<Globe size={20} color={theme.textSecondary} />}
                            title={t('changeLanguage') || 'Language'}
                            onPress={() => setShowLanguages(true)}
                            isDark={isDark}
                            disabled={isDeleting}
                        />

                        <SettingsItem
                            icon={<Palette size={20} color={theme.textSecondary} />}
                            title={t('changeTheme') || 'Theme'}
                            subtitle={isDark ? (t('dark') || 'Dark') : (t('light') || 'Light')}
                            isDark={isDark}
                            showChevron={false}
                            disabled={isDeleting}
                            customRightComponent={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
                                    thumbColor={isDark ? '#c7d2fe' : '#f1f5f9'}
                                    disabled={isDeleting}
                                />
                            }
                        />
                    </SettingsSection>

                    {/* Danger Zone */}
                    <SettingsSection title={t('dangerZone') || 'Danger Zone'} isDark={isDark}>
                        <View className={`rounded-xl border`}
                              style={{
                                  backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
                                  borderColor: isDark ? '#991B1B' : '#FECACA'
                              }}>
                            <SettingsItem
                                icon={<Trash2 size={20} color="#EF4444" />}
                                title={isDeleting ? (t('deletingAccount') || 'Deleting Account...') : (t('deleteAccount') || 'Delete Account')}
                                subtitle={t('deleteAccountWarning') || 'This action cannot be undone'}
                                onPress={isDeleting ? undefined : handleDeleteAccount}
                                isDark={isDark}
                                showChevron={false}
                                destructive={true}
                                disabled={isDeleting}
                            />
                        </View>

                        <Text className={`text-xs text-center mt-3 px-4`}
                              style={{ color: theme.textSecondary }}>
                            {t('deleteAccountWarning') || 'This action cannot be undone'}
                        </Text>
                    </SettingsSection>

                    {/* App Info Section - Moved to bottom */}
                    <SettingsSection title={t('appInfo') || 'App Info'} isDark={isDark}>
                        <View className={`p-5 flex-row items-center`} style={{ backgroundColor: theme.surface }}>
                            <View className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-4">
                                <Shield size={24} color={isDark ? '#818cf8' : '#4f46e5'} />
                            </View>
                            <View>
                                <Text className={`text-base font-medium`} style={{ color: theme.text }}>
                                    SafeMed v1.0.0
                                </Text>
                                <Text className={`text-sm mt-1`} style={{ color: theme.textSecondary }}>
                                    {t('madeWithLove') || 'Made with â¤ï¸ for better health'}
                                </Text>
                                {user?.id && (
                                    <Text className={`text-xs mt-2`} style={{ color: theme.textSecondary }}>
                                        {t('userIdLocal') || 'User ID'}: {user.id.slice(0, 8)}...
                                    </Text>
                                )}
                            </View>
                        </View>
                    </SettingsSection>

                    {/* Debug Section (Development only) */}
                    {__DEV__ && (
                        <SettingsSection title="Debug" isDark={isDark}>
                            <SettingsItem
                                icon={<RefreshCw size={20} color={theme.textSecondary} />}
                                title={t('resetApp') || 'Reset App (Testing)'}
                                subtitle="Clear all data and restart"
                                onPress={() => {
                                    Alert.alert(
                                        'Reset App',
                                        'This will clear all data. Continue?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Reset', style: 'destructive', onPress: handleResetApp},
                                        ]
                                    );
                                }}
                                isDark={isDark}
                                showChevron={false}
                                disabled={isDeleting}
                            />
                        </SettingsSection>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

export default SettingsModal;