import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { isAllowedProfileFile } from './types';

const INVALID_FILE_MESSAGE = 'Dozvoljeni formati: JPEG, JPG, PNG, PDF.';

/**
 * Validates file type and uploads to Storage at userData/{uid}/{fieldName}/{timestamp}-{filename}.
 * Returns the download URL or throws on invalid type or upload error.
 */
export async function uploadProfileFile(
  storage: FirebaseStorage,
  uid: string,
  fieldName: string,
  file: File
): Promise<string> {
  if (!isAllowedProfileFile(file)) {
    throw new Error(INVALID_FILE_MESSAGE);
  }
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `userData/${uid}/${fieldName}/${Date.now()}-${sanitized}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
