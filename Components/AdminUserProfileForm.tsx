'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  Save,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import type { UserData } from '../lib/types';
import { uploadProfileFile } from '../lib/upload';
import { storage } from '../lib/firebase';
import { isAllowedProfileFile } from '../lib/types';

const ACCEPT_FILES = '.jpg,.jpeg,.png,.pdf';
const FILE_ERROR = 'Dozvoljeni formati: JPEG, JPG, PNG, PDF.';

type FileFieldKey = 'healthInsurance' | 'idCardFront' | 'idCardBack' | 'firstAid';

type AdminUserProfileFormProps = {
  targetUserId: string;
  initialData: UserData | null;
  onSave: (data: Partial<UserData>, options?: { removeProfilePhoto?: boolean }) => Promise<void>;
  saveError?: string;
  saveSuccess?: string;
  /** When 'instruktor', only date of birth and profile photo (remove-only) are shown. */
  targetUserRole?: string;
};

export default function AdminUserProfileForm({
  targetUserId,
  initialData,
  onSave,
  saveError,
  saveSuccess,
  targetUserRole,
}: AdminUserProfileFormProps) {
  const isInstructor = targetUserRole === 'instruktor';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState('');
  const [newFiles, setNewFiles] = useState<Partial<Record<FileFieldKey, File>>>({});
  const inputRefs = useRef<Partial<Record<FileFieldKey, HTMLInputElement | null>>>({});

  const profilePhotoUrl = initialData?.profilePhotoUrl;
  const healthInsuranceUrl = initialData?.healthInsuranceUrl;
  const idCardFrontUrl = initialData?.idCardFrontUrl;
  const idCardBackUrl = initialData?.idCardBackUrl;
  const firstAidUrl = initialData?.firstAidUrl;

  useEffect(() => {
    if (initialData == null) return;
    setPhoneNumber(typeof initialData.phoneNumber === 'string' ? initialData.phoneNumber : '');
    const dob = initialData.dateOfBirth;
    const dobStr =
      typeof dob === 'string'
        ? dob
        : dob && typeof dob === 'object' && 'toDate' in dob
          ? (dob as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
          : '';
    setDateOfBirth(dobStr);
  }, [initialData]);

  const handleFileChange = (field: FileFieldKey, file: File | null) => {
    setFileError('');
    if (!file) {
      setNewFiles((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }
    if (!isAllowedProfileFile(file)) {
      setFileError(FILE_ERROR);
      return;
    }
    setNewFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError('');
    setLocalSuccess('');
    const filesToUpload = Object.entries(newFiles) as [FileFieldKey, File][];
    for (const [, file] of filesToUpload) {
      if (!isAllowedProfileFile(file)) {
        setFileError(FILE_ERROR);
        return;
      }
    }
    setSaving(true);
    try {
      const payload: Partial<UserData> = {};
      if (isInstructor) {
        if (dateOfBirth.trim()) payload.dateOfBirth = dateOfBirth.trim();
        if (!removeProfilePhoto && initialData?.profilePhotoUrl) payload.profilePhotoUrl = initialData.profilePhotoUrl;
      } else {
        if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
        if (dateOfBirth.trim()) payload.dateOfBirth = dateOfBirth.trim();
        if (!removeProfilePhoto && initialData?.profilePhotoUrl) payload.profilePhotoUrl = initialData.profilePhotoUrl;
        if (initialData?.healthInsuranceUrl) payload.healthInsuranceUrl = initialData.healthInsuranceUrl;
        if (initialData?.idCardFrontUrl) payload.idCardFrontUrl = initialData.idCardFrontUrl;
        if (initialData?.idCardBackUrl) payload.idCardBackUrl = initialData.idCardBackUrl;
        if (initialData?.firstAidUrl) payload.firstAidUrl = initialData.firstAidUrl;
      }

      const fieldToKey: Record<FileFieldKey, keyof UserData> = {
        healthInsurance: 'healthInsuranceUrl',
        idCardFront: 'idCardFrontUrl',
        idCardBack: 'idCardBackUrl',
        firstAid: 'firstAidUrl',
      };

      for (const [field, file] of filesToUpload) {
        const url = await uploadProfileFile(storage, targetUserId, field, file);
        (payload as Record<string, string>)[fieldToKey[field]] = url;
      }

      await onSave(payload, { removeProfilePhoto });
      setNewFiles({});
      setRemoveProfilePhoto(false);
      Object.values(inputRefs.current).forEach((input) => {
        if (input) input.value = '';
      });
      setLocalSuccess('Profil sačuvan.');
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Greška pri čuvanju.');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = removeProfilePhoto ? null : profilePhotoUrl;
  const successMsg = localSuccess || saveSuccess;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">Sva polja su opciona.</p>

      {/* Profile photo: display + remove only */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
          Profilna fotografija
        </label>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-slate-500" />
            )}
          </div>
          {profilePhotoUrl && !removeProfilePhoto && (
            <button
              type="button"
              onClick={() => setRemoveProfilePhoto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs sm:text-sm hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Ukloni fotografiju
            </button>
          )}
          {removeProfilePhoto && (
            <span className="text-xs text-slate-500">Fotografija će biti uklonjena pri čuvanju.</span>
          )}
        </div>
      </div>

      {!isInstructor && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Broj telefona</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-slate-400">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+"
              className="w-full border border-slate-200 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Datum rođenja</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-slate-400">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full border border-slate-200 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {!isInstructor && (
        <>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              Zdravstveno osiguranje (dokument)
            </label>
            <input
              ref={(el) => { inputRefs.current.healthInsurance = el; }}
              type="file"
              accept={ACCEPT_FILES}
              onChange={(e) => handleFileChange('healthInsurance', e.target.files?.[0] ?? null)}
              className="block w-full text-xs sm:text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            {healthInsuranceUrl && !newFiles.healthInsurance && (
              <a href={healthInsuranceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Pregledaj trenutni dokument
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              Lična karta – prednja strana
            </label>
            <input
              ref={(el) => { inputRefs.current.idCardFront = el; }}
              type="file"
              accept={ACCEPT_FILES}
              onChange={(e) => handleFileChange('idCardFront', e.target.files?.[0] ?? null)}
              className="block w-full text-xs sm:text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            {idCardFrontUrl && !newFiles.idCardFront && (
              <a href={idCardFrontUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Pregledaj trenutnu sliku
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              Lična karta – zadnja strana
            </label>
            <input
              ref={(el) => { inputRefs.current.idCardBack = el; }}
              type="file"
              accept={ACCEPT_FILES}
              onChange={(e) => handleFileChange('idCardBack', e.target.files?.[0] ?? null)}
              className="block w-full text-xs sm:text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            {idCardBackUrl && !newFiles.idCardBack && (
              <a href={idCardBackUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Pregledaj trenutnu sliku
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              Prva pomoć (dokument)
            </label>
            <input
              ref={(el) => { inputRefs.current.firstAid = el; }}
              type="file"
              accept={ACCEPT_FILES}
              onChange={(e) => handleFileChange('firstAid', e.target.files?.[0] ?? null)}
              className="block w-full text-xs sm:text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            {firstAidUrl && !newFiles.firstAid && (
              <a href={firstAidUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Pregledaj trenutni dokument
              </a>
            )}
          </div>
        </>
      )}

      {(fileError || saveError) && (
        <div className="p-2 sm:p-2.5 rounded-lg flex items-start gap-2 bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm">{fileError || saveError}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-2 sm:p-2.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
          <p className="text-xs sm:text-sm">{successMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Čuvanje...' : 'Sačuvaj'}
      </button>
    </form>
  );
}
