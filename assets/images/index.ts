export const medicines = {
    spray: {
        RE: require('./medicines/spray/sprayRE.png'),
        PR: require('./medicines/spray/sprayPR.png'),
        GR: require('./medicines/spray/sprayGR.png'),
        BR: require('./medicines/spray/sprayBR.png'),
        BL: require('./medicines/spray/sprayBL.png'),
    },

    // Powder medicines
    powder: {
        RE: require('./medicines/powder/powderRE.png'),
        PR: require('./medicines/powder/powderPR.png'),
        GR: require('./medicines/powder/powderGR.png'),
        BR: require('./medicines/powder/powderBR.png'),
        BL: require('./medicines/powder/powderBL.png'),
    },

    // Pill medicines
    pill: {
        RE: require('./medicines/pill/pillRE.png'),
        PR: require('./medicines/pill/pillPR.png'),
        BR: require('./medicines/pill/pillBR.png'),
        BL: require('./medicines/pill/pillBL.png'),
        WH: require('./medicines/pill/pillWH.png'),
    },

    // Patch medicines
    patch: {
        RE: require('./medicines/patch/patchRE.png'),
        PR: require('./medicines/patch/patchPR.png'),
        GR: require('./medicines/patch/patchGR.png'),
        BR: require('./medicines/patch/patchBR.png'),
        BL: require('./medicines/patch/patchBL.png'),
    },

    drop:{
        RE: require('./medicines/drop/dropRE.png'),
        PR: require('./medicines/drop/dropPR.png'),
        GR: require('./medicines/drop/dropGR.png'),
        BR: require('./medicines/drop/dropBR.png'),
        BL: require('./medicines/drop/dropBL.png'),
    },

    // Liquid medicines
    liquid: {
        RE: require('./medicines/liquid/liquidRE.png'),
        PR: require('./medicines/liquid/liquidPR.png'),
        GR: require('./medicines/liquid/liquidGR.png'),
        BR: require('./medicines/liquid/liquidBR.png'),
        BL: require('./medicines/liquid/liquidBL.png'),
    },

    // Injection medicines
    injection: {
        RE: require('./medicines/injection/injectionRE.png'),
        PR: require('./medicines/injection/injectionPR.png'),
        GR: require('./medicines/injection/injectionGR.png'),
        BR: require('./medicines/injection/injectionBR.png'),
        BL: require('./medicines/injection/injectionBL.png'),
    },

    // Inhaler medicines
    inhaler: {
        RE: require('./medicines/inhaler/inhalerRE.png'),
        PR: require('./medicines/inhaler/inhalerPR.png'),
        GR: require('./medicines/inhaler/inhalerGR.png'),
        BR: require('./medicines/inhaler/inhalerBR.png'),
        BL: require('./medicines/inhaler/inhalerBL.png'),
    },

    // Hard Capsule medicines
    hardcapsule: {
        RE: require('./medicines/hardCapsule/hardCapsuleRE.png'),
        PR: require('./medicines/hardCapsule/hardCapsulePR.png'),
        BR: require('./medicines/hardCapsule/hardCapsuleBR.png'),
        BL: require('./medicines/hardCapsule/hardCapsuleBL.png'),
        WH: require('./medicines/hardCapsule/hardCapsuleWH.png'),
    },

    // Gummy Bear medicines
    gummybear: {
        RE: require('./medicines/gummyBear/gummybearRE.png'),
        PR: require('./medicines/gummyBear/gummybearPR.png'),
        GR: require('./medicines/gummyBear/gummybearGR.png'),
        BR: require('./medicines/gummyBear/gummybearBR.png'),
        BL: require('./medicines/gummyBear/gummybearBL.png'),
    },

    // Gel medicines
    gel: {
        RE: require('./medicines/gel/gelRE.png'),
        PR: require('./medicines/gel/gelPR.png'),
        GR: require('./medicines/gel/gelGR.png'),
        BR: require('./medicines/gel/gelBR.png'),
        BL: require('./medicines/gel/gelBL.png'),
    },

    // Cream medicines
    cream: {
        RE: require('./medicines/cream/creamRE.png'),
        PR: require('./medicines/cream/creamPR.png'),
        GR: require('./medicines/cream/creamGR.png'),
        BR: require('./medicines/cream/creamBR.png'),
        BL: require('./medicines/cream/creamBL.png'),
    },

    // Capsule medicines
    capsule: {
        RE: require('./medicines/capsule/capsuleRE.png'),
        PR: require('./medicines/capsule/capsulePR.png'),
        GR: require('./medicines/capsule/capsuleGR.png'),
        BR: require('./medicines/capsule/capsuleBR.png'),
        BL: require('./medicines/capsule/capsuleBL.png'),
    },
} as const;
export const images = {
    medicines,
} as const;

export type MedicineForm =
    | 'spray'
    | 'powder'
    | 'pill'
    | 'patch'
    | 'liquid'
    | 'injection'
    | 'inhaler'
    | 'hardcapsule'
    | 'gummybear'
    | 'drop'
    | 'gel'
    | 'cream'
    | 'capsule';

export type MedicineKeys = keyof typeof medicines;

export type ImageKeys = {
    medicines: MedicineKeys;
};

export const getMedicineFormImages = (form: MedicineForm) => {
    return medicines[form] || null;
};

export const getImage = (category: keyof typeof images, key: string) => {
    const categoryImages = images[category] as Record<string, any>;
    return categoryImages[key] || null;
};

export const getCategoryImages = (category: keyof typeof images) => {
    return images[category];
};

export const getAllMedicineForms = (): MedicineForm[] => {
    return Object.keys(medicines) as MedicineForm[];
};


export default images;