/**
 * Extended user profile stored in Firestore collection "userData" (doc id = uid).
 * File fields store download URLs; actual files live in Firebase Storage.
 */
export type UserData = {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  healthInsuranceUrl?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  firstAidUrl?: string;
  updatedAt?: unknown; // Firestore Timestamp
};

/** Allowed file extensions for profile uploads (lowercase). */
export const ALLOWED_PROFILE_FILE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf'] as const;

/** Allowed MIME types for profile uploads (image/jpeg covers .jpg and .jpeg). */
export const ALLOWED_PROFILE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export function isAllowedProfileFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasExt = ALLOWED_PROFILE_FILE_EXTENSIONS.some((e) => name.endsWith(e));
  const hasMime =
    ALLOWED_PROFILE_MIME_TYPES.includes(file.type as (typeof ALLOWED_PROFILE_MIME_TYPES)[number]) ||
    file.type === 'image/jpg';
  return hasExt && hasMime;
}
