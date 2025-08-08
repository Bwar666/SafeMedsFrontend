// services/index.ts or wherever your main export is
export { userService } from './user';
export { medicineService, medicineUsageService } from './medicine';
export { allergyService } from './allergy';
export { aiWarningService } from './ai'; // Points to the ai/index.ts file
export { notificationService } from './notification';
export { medicalSearchService } from './search';