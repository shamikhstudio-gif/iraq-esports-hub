/**
 * Application-wide constants — single source of truth.
 * Import from here instead of hardcoding values across components.
 */

/** LocalStorage key for the logged-in user's profile ID */
export const AUTH_USER_KEY = 'babylon_user_id';

/** Iraqi cities list — used in registration, team creation, settings */
export const IRAQI_CITIES = [
  'أونلاين (بدون مقر فيزيائي)',
  'بغداد',
  'بابل',
  'أربيل',
  'البصرة',
  'السليمانية',
  'الموصل',
  'النجف',
  'كربلاء',
  'كركوك',
  'دهوك',
  'الأنبار',
  'ذي قار',
  'صلاح الدين',
  'ديالى',
  'ميسان',
  'المثنى',
  'القادسية',
  'واسط',
] as const;

/** Games list — used in filtering, team creation, scrim creation */
export const GAMES_LIST = [
  { id: 'all', name: 'جميع الألعاب' },
  { id: 'PUBG Mobile', name: 'PUBG Mobile' },
  { id: 'Valorant', name: 'Valorant' },
  { id: 'Counter-Strike 2', name: 'Counter-Strike 2' },
  { id: 'League of Legends', name: 'League of Legends' },
  { id: 'FC24 (FIFA)', name: 'FC24' },
  { id: 'Fortnite', name: 'Fortnite' },
  { id: 'Apex Legends', name: 'Apex Legends' },
  { id: 'Rocket League', name: 'Rocket League' },
] as const;

/** Post type filter options */
export const POST_TYPES = [
  { id: 'all', name: 'الكل' },
  { id: 'scrim', name: 'سكريمات' },
  { id: 'recruitment', name: 'تجنيد' },
  { id: 'announcement', name: 'إعلانات' },
  { id: 'general', name: 'عام' },
] as const;

/** Server regions for scrim lobbies */
export const SERVER_REGIONS = [
  'البحرين (AWS)',
  'دبي (Azure)',
  'فرانكفورت',
  'باريس',
  'لندن',
  'سنغافورة',
] as const;

/** Scrim format options */
export const SCRIM_FORMATS = [
  '5v5 BO1',
  '5v5 BO3',
  '3v3',
  '2v2',
  '1v1',
] as const;
