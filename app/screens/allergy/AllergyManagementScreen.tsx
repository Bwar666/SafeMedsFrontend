import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import {
    ArrowLeft,
    Plus,
    Search,
    MoreVertical
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { allergyService } from '@/app/services';
import type { AllergyResponse } from '@/app/services/allergy';
import { UserStorageService } from "@/app/services/user";
import AllergyFormScreen from './AllergyFormScreen';
import ActionMenu from '../../components/ActionMenu';

interface AllergyManagementScreenProps {
    navigation: any;
}

const AllergyManagementScreen: React.FC<AllergyManagementScreenProps> = ({ navigation }) => {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [allergies, setAllergies] = useState<AllergyResponse[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAllergy, setEditingAllergy] = useState<AllergyResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAllergy, setSelectedAllergy] = useState<AllergyResponse | null>(null);
    const [showActionMenu, setShowActionMenu] = useState(false);

    const commonAllergies = [
        'Penicillin', 'Aspirin', 'Ibuprofen', 'Codeine', 'Morphine',
        'Insulin', 'Latex', 'Peanuts', 'Shellfish', 'Eggs',
        'Milk', 'Soy', 'Wheat', 'Tree nuts', 'Fish'
    ];

    // Load user allergies
    const loadUserAllergies = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await UserStorageService.getStoredUser();
            if (currentUser) {
                setUser(currentUser);
                const storedAllergies = await allergyService.getAllergies(currentUser.id);
                setAllergies(storedAllergies);
            }
        } catch (error) {
            console.error('Error loading allergies:', error);
            Alert.alert(
                t('error') || 'Error',
                t('failedToLoadAllergies') || 'Failed to load allergies.',
                [{ text: t('ok') || 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserAllergies();
    }, []);

    // Handle saving allergy (add or edit)
    const handleSaveAllergy = async (allergyData: { name: string; description: string }) => {
        if (!user?.id) return;

        // Check for duplicates
        const isDuplicate = allergies.some(allergy =>
            allergy.name.toLowerCase() === allergyData.name.toLowerCase() &&
            allergy.id !== editingAllergy?.id
        );

        if (isDuplicate) {
            Alert.alert(
                t('duplicateAllergy') || 'Duplicate Allergy',
                t('allergyAlreadyAdded') || 'This allergy has already been added.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        setIsSaving(true);
        try {
            if (editingAllergy?.id) {
                // Edit existing allergy
                const updatedAllergy = await allergyService.updateAllergy(
                    user.id,
                    editingAllergy.id,
                    allergyData
                );

                const updatedAllergies = allergies.map(allergy =>
                    allergy.id === editingAllergy.id ? updatedAllergy : allergy
                );
                setAllergies(updatedAllergies);

                Alert.alert(
                    t('success') || 'Success',
                    t('allergyUpdated') || 'Allergy updated successfully!',
                    [{ text: t('ok') || 'OK' }]
                );
            } else {
                // Add new allergy
                const newAllergy = await allergyService.createAllergy(user.id, allergyData);
                setAllergies([...allergies, newAllergy]);

                Alert.alert(
                    t('success') || 'Success',
                    t('allergyAdded') || 'Allergy added successfully!',
                    [{ text: t('ok') || 'OK' }]
                );
            }

            setShowForm(false);
            setEditingAllergy(null);
        } catch (error) {
            console.error('Error saving allergy:', error);
            Alert.alert(
                t('error') || 'Error',
                editingAllergy?.id
                    ? (t('failedToUpdateAllergy') || 'Failed to update allergy. Please try again.')
                    : (t('failedToAddAllergy') || 'Failed to add allergy. Please try again.'),
                [{ text: t('ok') || 'OK' }]
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Handle deleting an allergy
    const handleDeleteAllergy = (allergyToDelete: AllergyResponse) => {
        Alert.alert(
            t('deleteAllergy') || 'Delete Allergy',
            `${t('confirmDeleteAllergy') || 'Are you sure you want to delete'} "${allergyToDelete.name}"?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: () => confirmDeleteAllergy(allergyToDelete),
                },
            ]
        );
    };

    const confirmDeleteAllergy = async (allergyToDelete: AllergyResponse) => {
        if (!user?.id) return;

        try {
            await allergyService.deleteAllergy(user.id, allergyToDelete.id);

            // Update the UI immediately after successful deletion
            const updatedAllergies = allergies.filter(allergy => allergy.id !== allergyToDelete.id);
            setAllergies(updatedAllergies);
            setShowActionMenu(false);

            Alert.alert(
                t('success') || 'Success',
                t('allergyDeleted') || 'Allergy deleted successfully!',
                [{ text: t('ok') || 'OK' }]
            );
        } catch (error) {
            console.error('Error deleting allergy:', error);

            // Log more details about the error
            console.log('Error details:', {

            });

            // Check if the allergy was actually deleted despite the error
            try {
                const currentAllergies = await allergyService.getAllergies(user.id);
                const allergyStillExists = currentAllergies.some(allergy => allergy.id === allergyToDelete.id);

                if (!allergyStillExists) {
                    // Allergy was deleted successfully, just update the UI
                    const updatedAllergies = allergies.filter(allergy => allergy.id !== allergyToDelete.id);
                    setAllergies(updatedAllergies);
                    setShowActionMenu(false);

                    Alert.alert(
                        t('success') || 'Success',
                        t('allergyDeleted') || 'Allergy deleted successfully!',
                        [{ text: t('ok') || 'OK' }]
                    );
                } else {
                    // Actually failed to delete
                    Alert.alert(
                        t('error') || 'Error',
                        t('failedToDeleteAllergy') || 'Failed to delete allergy. Please try again.',
                        [{ text: t('ok') || 'OK' }]
                    );
                }
            } catch (verificationError) {
                console.error('Error verifying deletion:', verificationError);
                Alert.alert(
                    t('error') || 'Error',
                    t('failedToDeleteAllergy') || 'Failed to delete allergy. Please try again.',
                    [{ text: t('ok') || 'OK' }]
                );
            }
        }
    };

    // Handle quick add from common allergies
    const handleQuickAddAllergy = (allergyName: string) => {
        // Check for duplicates
        const isDuplicate = allergies.some(allergy =>
            allergy.name.toLowerCase() === allergyName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert(
                t('duplicateAllergy') || 'Duplicate Allergy',
                t('allergyAlreadyAdded') || 'This allergy has already been added.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        setEditingAllergy({ id: '', name: allergyName, description: '' });
        setShowForm(true);
    };

    // Filter allergies based on search query
    const filteredAllergies = allergies.filter(allergy =>
        allergy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (allergy.description && allergy.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Open action menu for allergy
    const openActionMenu = (allergy: AllergyResponse) => {
        setSelectedAllergy(allergy);
        setShowActionMenu(true);
    };

    // Close action menu
    const closeActionMenu = () => {
        setShowActionMenu(false);
        setSelectedAllergy(null);
    };

    // Show form screen when adding/editing
    if (showForm) {
        return (
            <AllergyFormScreen
                allergy={editingAllergy}
                onSave={handleSaveAllergy}
                onCancel={() => {
                    setShowForm(false);
                    setEditingAllergy(null);
                }}
                isSaving={isSaving}
                isDark={isDark}
                theme={theme}
                t={t}
            />
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text className={`mt-4`} style={{ color: theme.textSecondary }}>
                        {t('loadingAllergies')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
            {/* Header */}
            <View className={`flex-row items-center justify-between p-4 border-b`}
                  style={{ borderBottomColor: theme.border, backgroundColor: theme.card }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>

                <Text className={`text-lg font-semibold`} style={{ color: theme.text }}>
                    {t('allergies')}
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        setEditingAllergy(null);
                        setShowForm(true);
                    }}
                    className="w-10 h-10 rounded-full bg-indigo-500 items-center justify-center"
                    activeOpacity={0.7}
                >
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="p-4">
                <View className={`flex-row items-center p-3 rounded-xl border`}
                      style={{ borderColor: theme.border, backgroundColor: theme.card }}>
                    <Search size={20} color={theme.textSecondary} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('searchAllergies') || 'Search allergies...'}
                        placeholderTextColor={theme.textSecondary}
                        className={`flex-1 ml-3 text-base`}
                        style={{ color: theme.text }}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Allergies List */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    {filteredAllergies.length > 0 ? (
                        <View className="pb-4">
                            {filteredAllergies.map((allergy) => (
                                <View
                                    key={allergy.id}
                                    className={`p-4 rounded-xl border mb-3`}
                                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                                >
                                    <View className="flex-row items-start justify-between">
                                        <View className="flex-1 mr-3">
                                            <View className="flex-row items-center mb-2">
                                                <Text className={`ml-2 font-semibold text-base`}
                                                      style={{ color: theme.text }}>
                                                    {allergy.name}
                                                </Text>
                                            </View>

                                            {allergy.description && (
                                                <Text className={`text-sm leading-relaxed`}
                                                      style={{ color: theme.textSecondary }}>
                                                    {allergy.description}
                                                </Text>
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => openActionMenu(allergy)}
                                            className="p-2"
                                            activeOpacity={0.7}
                                        >
                                            <MoreVertical size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="flex-1 items-center justify-center py-12">
                            <Text className={`text-lg font-semibold mt-4 mb-2`}
                                  style={{ color: theme.text }}>
                                {searchQuery
                                    ? t('noAllergiesFound')
                                    : t('noAllergiesYet')
                                }
                            </Text>
                            <Text className={`text-center text-sm px-8 mb-6`}
                                  style={{ color: theme.textSecondary }}>
                                {searchQuery
                                    ? t('tryDifferentSearch')
                                    : t('addFirstAllergy')
                                }
                            </Text>

                            {!searchQuery && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingAllergy(null);
                                        setShowForm(true);
                                    }}
                                    className="flex-row items-center bg-indigo-500 px-6 py-3 rounded-xl"
                                    activeOpacity={0.7}
                                >
                                    <Plus size={20} color="white" />
                                    <Text className="text-white font-medium ml-2">
                                        {t('addAllergy')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Quick Add Section */}
                    {!searchQuery && allergies.length > 0 && (
                        <View className={`p-4 rounded-xl mb-4`}
                              style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#EFF6FF' }}>
                            <Text className={`font-medium mb-3`}
                                  style={{ color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                                {t('quickAddCommon')}
                            </Text>
                            <View className="flex-row flex-wrap">
                                {commonAllergies
                                    .filter(common => !allergies.some(allergy =>
                                        allergy.name.toLowerCase() === common.toLowerCase()
                                    ))
                                    .slice(0, 6)
                                    .map((allergy) => (
                                        <TouchableOpacity
                                            key={allergy}
                                            onPress={() => handleQuickAddAllergy(allergy)}
                                            className={`px-3 py-2 rounded-full border mr-2 mb-2`}
                                            style={{
                                                borderColor: isDark ? '#60A5FA' : '#93C5FD',
                                                backgroundColor: isDark ? 'rgba(30, 58, 138, 0.5)' : '#DBEAFE'
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text className={`text-sm`}
                                                  style={{ color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                                                + {allergy}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                }
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action Menu */}
            <ActionMenu
                visible={showActionMenu}
                onClose={closeActionMenu}
                onEdit={() => {
                    closeActionMenu();
                    setEditingAllergy(selectedAllergy);
                    setShowForm(true);
                }}
                onDelete={() => {
                    closeActionMenu();
                    if (selectedAllergy) {
                        handleDeleteAllergy(selectedAllergy);
                    }
                }}
                isDark={isDark}
                t={t}
            />
        </SafeAreaView>
    );
};

export default AllergyManagementScreen;