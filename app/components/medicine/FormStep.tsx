import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, Image, ImageSourcePropType} from 'react-native';
import {MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";
import {medicines} from '@/assets/images/index';
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";

interface FormData {
    form: MedicineForm | null;
    icon: string;
    [key: string]: any;
}

interface FormStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}

const FormStep: React.FC<FormStepProps> = ({
                                               formData,
                                               updateFormData,
                                           }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    const getImageKey = (form: MedicineForm): keyof typeof medicines | null => {
        const formMapping: Record<MedicineForm, keyof typeof medicines> = {
            [MedicineForm.PILL]: 'pill',
            [MedicineForm.CAPSULE]: 'capsule',
            [MedicineForm.TABLET]: 'pill',
            [MedicineForm.INJECTION]: 'injection',
            [MedicineForm.LIQUID]: 'liquid',
            [MedicineForm.DROP]: 'drop',
            [MedicineForm.INHALER]: 'inhaler',
            [MedicineForm.POWDER]: 'powder',
            [MedicineForm.PATCH]: 'patch',
            [MedicineForm.GEL]: 'gel',
            [MedicineForm.SPRAY]: 'spray',
            [MedicineForm.HARDCAPSULE]: 'hardcapsule',
            [MedicineForm.CREAM]: 'cream',
            [MedicineForm.GUMMYBEAR]: 'gummybear',
            [MedicineForm.OTHER]: 'pill',
        };

        return formMapping[form] || null;
    };

    const medicineFormOptions = [
        {
            value: MedicineForm.PILL,
            label: t('pill') || 'Pill',
            description: t('pillDescription') || 'Solid oral dosage form',
            imageKey: 'pill' as keyof typeof medicines
        },
        {
            value: MedicineForm.CAPSULE,
            label: t('capsule') || 'Capsule',
            description: t('capsuleDescription') || 'Encapsulated medication',
            imageKey: 'capsule' as keyof typeof medicines
        },
        {
            value: MedicineForm.HARDCAPSULE,
            label: t('hardCapsule') || 'Hard Capsule',
            description: t('hardCapsuleDescription') || 'Hard capsule form',
            imageKey: 'hardcapsule' as keyof typeof medicines
        },
        {
            value: MedicineForm.INJECTION,
            label: t('injection') || 'Injection',
            description: t('injectionDescription') || 'Injectable medication',
            imageKey: 'injection' as keyof typeof medicines
        },
        {
            value: MedicineForm.LIQUID,
            label: t('liquid') || 'Liquid',
            description: t('liquidDescription') || 'Liquid medication',
            imageKey: 'liquid' as keyof typeof medicines
        },
        {
            value: MedicineForm.DROP,
            label: t('drops') || 'Drops',
            description: t('dropsDescription') || 'Eye/ear/nose drops',
            imageKey: 'drop' as keyof typeof medicines
        },
        {
            value: MedicineForm.CREAM,
            label: t('cream') || 'Cream',
            description: t('creamDescription') || 'Topical cream',
            imageKey: 'cream' as keyof typeof medicines
        },
        {
            value: MedicineForm.INHALER,
            label: t('inhaler') || 'Inhaler',
            description: t('inhalerDescription') || 'Inhaled medication',
            imageKey: 'inhaler' as keyof typeof medicines
        },
        {
            value: MedicineForm.POWDER,
            label: t('powder') || 'Powder',
            description: t('powderDescription') || 'Powdered medication',
            imageKey: 'powder' as keyof typeof medicines
        },
        {
            value: MedicineForm.PATCH,
            label: t('patch') || 'Patch',
            description: t('patchDescription') || 'Transdermal patch',
            imageKey: 'patch' as keyof typeof medicines
        },
        {
            value: MedicineForm.GEL,
            label: t('gel') || 'Gel',
            description: t('gelDescription') || 'Topical gel',
            imageKey: 'gel' as keyof typeof medicines
        },
        {
            value: MedicineForm.SPRAY,
            label: t('spray') || 'Spray',
            description: t('sprayDescription') || 'Spray medication',
            imageKey: 'spray' as keyof typeof medicines
        },
        {
            value: MedicineForm.GUMMYBEAR,
            label: t('gummyBear') || 'Gummy Bear',
            description: t('gummyBearDescription') || 'Gummy bear medication',
            imageKey: 'gummybear' as keyof typeof medicines
        },
        {
            value: MedicineForm.OTHER,
            label: t('other') || 'Other',
            description: t('otherDescription') || 'Other form',
            imageKey: 'pill' as keyof typeof medicines
        },
    ];

    const colorOptions = [
        {key: 'RE', name: t('red') || 'Red', color: '#EF4444'},
        {key: 'PR', name: t('purple') || 'Purple', color: '#8B5CF6'},
        {key: 'GR', name: t('green') || 'Green', color: '#10B981'},
        {key: 'BR', name: t('brown') || 'Brown', color: '#A3651A'},
        {key: 'BL', name: t('blue') || 'Blue', color: '#3B82F6'},
        {key: 'WH', name: t('white') || 'White', color: '#F8FAFC'},
    ];

    const selectForm = (form: MedicineForm) => {
        try {
            const imageKey = getImageKey(form);

            if (imageKey && medicines[imageKey]) {
                const medicineImages = medicines[imageKey] as Record<string, ImageSourcePropType>;
                const availableColors = Object.keys(medicineImages);

                if (availableColors.length > 0) {
                    const firstColor = availableColors[0];
                    updateFormData({
                        form,
                        icon: firstColor
                    });
                } else {
                    updateFormData({form, icon: "💊"});
                }
            } else {
                updateFormData({form, icon: "💊"});
            }
        } catch (error) {
            updateFormData({form, icon: "💊"});
        }
    };

    const selectColor = (colorKey: string) => {
        if (formData.form) {
            const imageKey = getImageKey(formData.form);
            if (imageKey && medicines[imageKey]) {
                const medicineImages = medicines[imageKey] as Record<string, any>;
                if (colorKey in medicineImages) {
                    updateFormData({
                        icon: colorKey
                    });
                }
            }
        }
    };

    const getAvailableColors = () => {
        if (!formData.form) return [];
        const imageKey = getImageKey(formData.form);
        if (!imageKey || !medicines[imageKey]) return [];

        const medicineImages = medicines[imageKey] as Record<string, any>;
        const availableColorKeys = Object.keys(medicineImages);
        return colorOptions.filter(color => availableColorKeys.includes(color.key));
    };

    const getImageSource = (): ImageSourcePropType | null => {
        if (!formData.form || !formData.icon) return null;

        const imageKey = getImageKey(formData.form);
        if (!imageKey || !medicines[imageKey]) return null;

        const medicineImages = medicines[imageKey] as Record<string, ImageSourcePropType>;
        return medicineImages[formData.icon] || null;
    };

    const getColorValue = (): string | null => {
        if (!formData.icon) return null;
        const colorOption = colorOptions.find(c => c.key === formData.icon);
        return colorOption ? colorOption.color : null;
    };

    const getSafeImage = (imageKey: keyof typeof medicines, colorKey: string): ImageSourcePropType | null => {
        try {
            const medicineImages = medicines[imageKey] as Record<string, any>;
            return (colorKey in medicineImages) ? medicineImages[colorKey] : null;
        } catch (error) {
            return null;
        }
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text style={{ color: theme.text }} className="text-2xl font-bold text-center mb-2">
                    {t('medicineForm') || 'Medicine Form'}
                </Text>
                <Text style={{ color: theme.textSecondary }} className="text-base text-center">
                    {t('medicineFormDescription') || 'What form is your medicine in?'}
                </Text>
            </View>

            {/* Form Selection Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap justify-between">
                    {medicineFormOptions.map((option) => {
                        let sampleImage = null;
                        try {
                            if (medicines[option.imageKey]) {
                                const medicineImages = medicines[option.imageKey] as Record<string, ImageSourcePropType>;
                                const imageValues = Object.values(medicineImages);
                                sampleImage = imageValues.length > 0 ? imageValues[0] : null;
                            }
                        } catch (error) {
                            sampleImage = null;
                        }

                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => selectForm(option.value)}
                                style={{
                                    backgroundColor: formData.form === option.value
                                        ? `${theme.primary}20`
                                        : theme.card,
                                    borderColor: formData.form === option.value
                                        ? theme.primary
                                        : theme.border,
                                    borderWidth: formData.form === option.value ? 2 : 1,
                                }}
                                className="w-[48%] p-4 rounded-xl mb-4"
                                activeOpacity={0.7}
                            >
                                <View className="items-center">
                                    {sampleImage ? (
                                        <Image
                                            source={sampleImage}
                                            className="w-12 h-12 mb-2"
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <View style={{ backgroundColor: theme.surface }} className="w-12 h-12 mb-2 rounded-lg flex items-center justify-center">
                                            <Text className="text-lg">💊</Text>
                                        </View>
                                    )}
                                    <Text style={{
                                        color: formData.form === option.value
                                            ? theme.primary
                                            : theme.text
                                    }} className="font-semibold text-center mb-1">
                                        {option.label}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs text-center">
                                        {option.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Selected Form Display */}
            {formData.form && (
                <View style={{ backgroundColor: theme.surface }} className="p-2 rounded-xl mt-2">
                    {/* Color Selection */}
                    {getAvailableColors().length > 0 && (
                        <View>
                            <Text style={{ color: theme.text }} className="font-medium mb-3">
                                {t('selectColor') || 'Select Color'}
                            </Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row space-x-3">
                                    {getAvailableColors().map((color) => {
                                        const isSelected = formData.icon === color.key;
                                        const imageKey = getImageKey(formData.form!);
                                        const imageSource = imageKey ? getSafeImage(imageKey, color.key) : null;

                                        return (
                                            <TouchableOpacity
                                                key={color.key}
                                                onPress={() => selectColor(color.key)}
                                                style={{
                                                    backgroundColor: isSelected
                                                        ? `${theme.primary}20`
                                                        : theme.card,
                                                    borderColor: isSelected
                                                        ? theme.primary
                                                        : theme.border,
                                                }}
                                                className="items-center p-3 rounded-xl border-2 ml-1"
                                            >
                                                {imageSource && (
                                                    <Image
                                                        source={imageSource}
                                                        className="w-10 h-10 mb-2"
                                                        resizeMode="contain"
                                                    />
                                                )}
                                                <Text style={{
                                                    color: isSelected
                                                        ? theme.primary
                                                        : theme.text
                                                }} className="text-xs font-medium">
                                                    {color.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}

            {/* Help Text */}
            <View style={{ backgroundColor: `${theme.secondary}20`, borderColor: `${theme.secondary}40` }} className="mt-6 p-4 rounded-xl border">
                <Text style={{ color: theme.secondary }} className="text-sm">
                    💡 {t('formTip') || 'Tip: The form and color help you quickly identify your medicine'}
                </Text>
            </View>
        </View>
    );
};

export default FormStep;