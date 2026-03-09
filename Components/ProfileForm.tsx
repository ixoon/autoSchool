'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, Calendar, Save, AlertCircle, FileText, CreditCard, Stethoscope } from 'lucide-react';
import type { UserData } from '../lib/types';
import { uploadProfileFile } from '../lib/upload';
import { storage } from '../lib/firebase';
import { isAllowedProfileFile } from '../lib/types';

const ACCEPT_FILES = '.jpg,.jpeg,.png,.pdf';
const FILE_ERROR = 'Dozvoljeni formati: JPEG, JPG, PNG, PDF.';

type ProfileFormProps = {
  uid: string;
  initialData: UserData | null;
  onSave: (data: Partial<UserData>) => Promise<void>;
  saveError?: string;
  saveSuccess?: string;
};

type FileFieldKey = 'profilePhoto' | 'healthInsurance' | 'idCardFront' | 'idCardBack' | 'firstAid';

export default function ProfileForm({
  uid,
  initialData,
  onSave,
  saveError,
  saveSuccess,
}: ProfileFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fileError, setFileError] = useState('');

  // Prefill form when saved data loads from the database
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
  const [saving, setSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState('');

  const [newFiles, setNewFiles] = useState<Partial<Record<FileFieldKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<FileFieldKey, string>>>({});
  const inputRefs = useRef<Partial<Record<FileFieldKey, HTMLInputElement | null>>>({});

  const profilePhotoUrl = initialData?.profilePhotoUrl;
  const healthInsuranceUrl = initialData?.healthInsuranceUrl;
  const idCardFrontUrl = initialData?.idCardFrontUrl;
  const idCardBackUrl = initialData?.idCardBackUrl;
  const firstAidUrl = initialData?.firstAidUrl;

  const handleFileChange = (field: FileFieldKey, file: File | null) => {
    setFileError('');
    if (!file) {
      setNewFiles((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setPreviews((prev) => {
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
    if (field === 'profilePhoto' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [field]: '' }));
    }
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
      if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
      if (dateOfBirth.trim()) payload.dateOfBirth = dateOfBirth.trim();
      if (initialData?.profilePhotoUrl) payload.profilePhotoUrl = initialData.profilePhotoUrl;
      if (initialData?.healthInsuranceUrl) payload.healthInsuranceUrl = initialData.healthInsuranceUrl;
      if (initialData?.idCardFrontUrl) payload.idCardFrontUrl = initialData.idCardFrontUrl;
      if (initialData?.idCardBackUrl) payload.idCardBackUrl = initialData.idCardBackUrl;
      if (initialData?.firstAidUrl) payload.firstAidUrl = initialData.firstAidUrl;

      const fieldToKey: Record<FileFieldKey, keyof UserData> = {
        profilePhoto: 'profilePhotoUrl',
        healthInsurance: 'healthInsuranceUrl',
        idCardFront: 'idCardFrontUrl',
        idCardBack: 'idCardBackUrl',
        firstAid: 'firstAidUrl',
      };

      for (const [field, file] of filesToUpload) {
        const url = await uploadProfileFile(storage, uid, field, file);
        (payload as Record<string, string>)[fieldToKey[field]] = url;
      }

      await onSave(payload);
      setNewFiles({});
      setPreviews({});
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

  const avatarUrl = previews.profilePhoto || profilePhotoUrl;
  const successMsg = localSuccess || saveSuccess;

  const hasSavedData =
    (initialData?.phoneNumber && initialData.phoneNumber.trim()) ||
    (initialData?.dateOfBirth && initialData.dateOfBirth.trim()) ||
    initialData?.healthInsuranceUrl ||
    initialData?.idCardFrontUrl ||
    initialData?.idCardBackUrl ||
    initialData?.firstAidUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Avatar */}
      <div className="flex justify-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white" />
        </div>
      </div>

      {/* Display saved data (all optional) */}
      {hasSavedData && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium text-slate-600">Sačuvani podaci</p>
          <div className="space-y-2 p-3 sm:p-4 border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50/50">
            {initialData?.phoneNumber?.trim() && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Broj telefona</p>
                  <p className="text-sm font-medium text-slate-800">{initialData.phoneNumber}</p>
                </div>
              </div>
            )}
            {initialData?.dateOfBirth?.trim() && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Datum rođenja</p>
                  <p className="text-sm font-medium text-slate-800">{initialData.dateOfBirth}</p>
                </div>
              </div>
            )}
            {initialData?.healthInsuranceUrl && (
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Zdravstveno osiguranje</p>
                  <a href={initialData.healthInsuranceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                    Pregledaj dokument
                  </a>
                </div>
              </div>
            )}
            {initialData?.idCardFrontUrl && (
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Lična karta (prednja)</p>
                  <a href={initialData.idCardFrontUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                    Pregledaj
                  </a>
                </div>
              </div>
            )}
            {initialData?.idCardBackUrl && (
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Lična karta (zadnja)</p>
                  <a href={initialData.idCardBackUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                    Pregledaj
                  </a>
                </div>
              </div>
            )}
            {initialData?.firstAidUrl && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Prva pomoć</p>
                  <a href={initialData.firstAidUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                    Pregledaj dokument
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
        <p className="text-xs text-slate-500">Sva polja su opciona. Popunite samo ona koja želite da sačuvate.</p>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
            Broj telefona
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-slate-400">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+381..."
              className="w-full border border-slate-200 rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3 pl-10 sm:pl-12 pr-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
            Datum rođenja
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full border border-slate-200 rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3 pl-10 sm:pl-12 pr-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Profile photo */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
            Profilna fotografija
          </label>
          <input
            ref={(el) => { inputRefs.current.profilePhoto = el; }}
            type="file"
            accept={ACCEPT_FILES}
            onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] ?? null)}
            className="block w-full text-xs sm:text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
          />
          {profilePhotoUrl && !newFiles.profilePhoto && (
            <p className="text-xs text-slate-500 mt-1">Trenutna slika postavljena.</p>
          )}
        </div>

        {/* Health insurance */}
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

        {/* ID card front */}
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

        {/* ID card back */}
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

        {/* First aid */}
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
      </div>

      {(fileError || saveError) && (
        <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex items-start gap-2 bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm">{fileError || saveError}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex items-start gap-2 bg-green-50 text-green-700 border border-green-200">
          <p className="text-xs sm:text-sm">{successMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{saving ? 'Čuvanje...' : 'Sačuvaj profil'}</span>
      </button>
    </form>
  );
}
