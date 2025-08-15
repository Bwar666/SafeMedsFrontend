// utilities/imageUtils.ts
import { medicines } from '@/assets/images/index';
import { MedicineForm } from '@/app/services/medicine/medicine/MedicineServiceTypes';

export interface ColorOption {
    key: string;
    name: string;
    color: string;
}

export const colorOptions: ColorOption[] = [
    { key: 'RE', name: 'Red', color: '#EF4444' },
    { key: 'PR', name: 'Purple', color: '#8B5CF6' },
    { key: 'GR', name: 'Green', color: '#10B981' },
    { key: 'BR', name: 'Brown', color: '#A3651A' },
    { key: 'BL', name: 'Blue', color: '#3B82F6' },
    { key: 'WH', name: 'White', color: '#F8FAFC' },
];

// Map MedicineForm enum to image keys
export const getMedicineImageKey = (form: MedicineForm): keyof typeof medicines | null => {
    const formMapping: Record<MedicineForm, keyof typeof medicines> = {
        [MedicineForm.PILL]: 'pill',
        [MedicineForm.CAPSULE]: 'capsule',
        [MedicineForm.HARDCAPSULE]: 'hardCapsule', // If you have this enum value
        [MedicineForm.TABLET]: 'pill', // Using pill images for tablet
        [MedicineForm.INJECTION]: 'injection',
        [MedicineForm.LIQUID]: 'liquid',
        [MedicineForm.DROPS]: 'liquid', // Using liquid images for drops
        [MedicineForm.INHALER]: 'inhaler',
        [MedicineForm.POWDER]: 'powder',
        [MedicineForm.PATCH]: 'patch',
        [MedicineForm.GEL]: 'gel',
        [MedicineForm.CREAM]: 'cream',
        [MedicineForm.SPRAY]: 'spray',
        [MedicineForm.GUMMYBEAR]: 'gummyBear', // If you have this enum value
        [MedicineForm.OTHER]: 'pill', // Default to pill for other
    };

    return formMapping[form] || null;
};

// Get available colors for a specific medicine form
export const getAvailableColors = (form: MedicineForm): ColorOption[] => {
    const imageKey = getMedicineImageKey(form);
    if (!imageKey || !medicines[imageKey]) return [];

    const availableColorKeys = Object.keys(medicines[imageKey]);
    return colorOptions.filter(color => availableColorKeys.includes(color.key));
};

// Get the image path for a specific form and color
export const getMedicineImage = (form: MedicineForm, colorKey: string) => {
    const imageKey = getMedicineImageKey(form);
    if (!imageKey || !medicines[imageKey]) return null;

    return medicines[imageKey][colorKey] || null;
};

// Get the first available image for a form (for preview)
export const getFirstAvailableImage = (form: MedicineForm) => {
    const imageKey = getMedicineImageKey(form);
    if (!imageKey || !medicines[imageKey]) return null;

    const availableImages = Object.values(medicines[imageKey]);
    return availableImages[0] || null;
};

// Get color key from image path (reverse lookup)
export const getColorKeyFromImage = (form: MedicineForm, imagePath: any): string | null => {
    const imageKey = getMedicineImageKey(form);
    if (!imageKey || !medicines[imageKey]) return null;

    for (const [colorKey, path] of Object.entries(medicines[imageKey])) {
        if (path === imagePath) {
            return colorKey;
        }
    }
    return null;
};

// Get color value from color key
export const getColorValue = (colorKey: string): string => {
    const colorOption = colorOptions.find(c => c.key === colorKey);
    return colorOption?.color || '#6366F1';
};