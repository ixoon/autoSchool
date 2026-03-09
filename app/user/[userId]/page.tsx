'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  Stethoscope,
  ArrowLeft,
  Edit,
  X,
  AlertCircle,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { deleteField } from 'firebase/firestore';
import type { UserData } from '../../../lib/types';
import Protected from '@/Components/Protected';
import AdminUserProfileForm from '@/Components/AdminUserProfileForm';

type ViewerRole = 'superadmin' | 'instruktor' | null;

export default function UserViewPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [myStudentIds, setMyStudentIds] = useState<Set<string>>(new Set());
  const [studentIdsLoaded, setStudentIdsLoaded] = useState(false);

  const [userBasic, setUserBasic] = useState<{ fullName?: string; email?: string; role?: string } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setViewerRole(null);
        setStudentIdsLoaded(false);
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setViewerRole(null);
          setStudentIdsLoaded(false);
          setLoading(false);
          return;
        }
        const data = userSnap.data();
        const role = (data.role || '').trim().toLowerCase();
        if (role !== 'superadmin' && role !== 'instruktor') {
          setViewerRole(null);
          setForbidden(true);
          setStudentIdsLoaded(true);
          setLoading(false);
          return;
        }
        setViewerRole(role as ViewerRole);

        if (role === 'instruktor') {
          const studentsQuery = query(
            collection(db, 'studenti'),
            where('instruktorId', '==', user.uid)
          );
          const studentsSnap = await getDocs(studentsQuery);
          setMyStudentIds(new Set(studentsSnap.docs.map((d) => d.id)));
        }
        setStudentIdsLoaded(true);
      } catch (e) {
        console.error(e);
        setViewerRole(null);
        setStudentIdsLoaded(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId || viewerRole === null) return;
    if (viewerRole === 'instruktor' && !studentIdsLoaded) return;

    const allowed =
      viewerRole === 'superadmin' ||
      (viewerRole === 'instruktor' && myStudentIds.has(userId));

    if (!allowed) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    setForbidden(false);

    const fetchUser = async () => {
      setLoading(true);
      setForbidden(false);
      try {
        const [userSnap, userDataSnap] = await Promise.all([
          getDoc(doc(db, 'users', userId)),
          getDoc(doc(db, 'userData', userId)),
        ]);
        if (userSnap.exists()) {
          setUserBasic(userSnap.data() as { fullName?: string; email?: string; role?: string });
        } else {
          setUserBasic(null);
        }
        setUserData(userDataSnap.exists() ? (userDataSnap.data() as UserData) : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, viewerRole, studentIdsLoaded, myStudentIds]);

  const handleSave = async (
    data: Partial<UserData>,
    options?: { removeProfilePhoto?: boolean }
  ) => {
    setSaveError('');
    setSaveSuccess('');
    try {
      const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
      if (options?.removeProfilePhoto) {
        payload.profilePhotoUrl = deleteField();
      }
      await setDoc(doc(db, 'userData', userId), payload, { merge: true });
      setUserData((prev) => {
        const next = { ...prev, ...data } as UserData;
        if (options?.removeProfilePhoto) delete next.profilePhotoUrl;
        return next;
      });
      setSaveSuccess('Profil sačuvan.');
      setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Greška pri čuvanju.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Učitavanje...</p>
      </div>
    );
  }

  if (forbidden || (viewerRole !== 'superadmin' && viewerRole !== 'instruktor')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Nemate dozvolu za pristup ovom profilu.</p>
          <Link
            href={viewerRole === 'instruktor' ? '/instruktor-panel' : '/superadmin'}
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Protected allowedRoles={['superadmin', 'instruktor']}>
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href={viewerRole === 'instruktor' ? '/instruktor-panel' : '/superadmin'}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad
          </Link>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden">
                  {userData?.profilePhotoUrl ? (
                    <img
                      src={userData.profilePhotoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    {userBasic?.fullName || 'Korisnik'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    {userBasic?.email || '—'}
                  </p>
                </div>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4" />
                  Izmeni
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                  Otkaži
                </button>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {editing ? (
                <AdminUserProfileForm
                  targetUserId={userId}
                  initialData={userData}
                  onSave={handleSave}
                  saveError={saveError}
                  saveSuccess={saveSuccess}
                  targetUserRole={userBasic?.role}
                />
              ) : (
                <div className="space-y-4">
                  {userBasic?.role !== 'instruktor' && userData?.phoneNumber?.trim() && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Broj telefona</p>
                        <p className="text-sm font-medium text-slate-800">{userData.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {userData?.dateOfBirth?.trim() && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Datum rođenja</p>
                        <p className="text-sm font-medium text-slate-800">{userData.dateOfBirth}</p>
                      </div>
                    </div>
                  )}
                  {userBasic?.role !== 'instruktor' && userData?.healthInsuranceUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Zdravstveno osiguranje</p>
                        <a
                          href={userData.healthInsuranceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Pregledaj dokument
                        </a>
                      </div>
                    </div>
                  )}
                  {userBasic?.role !== 'instruktor' && userData?.idCardFrontUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Lična karta (prednja)</p>
                        <a
                          href={userData.idCardFrontUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Pregledaj
                        </a>
                      </div>
                    </div>
                  )}
                  {userBasic?.role !== 'instruktor' && userData?.idCardBackUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Lična karta (zadnja)</p>
                        <a
                          href={userData.idCardBackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Pregledaj
                        </a>
                      </div>
                    </div>
                  )}
                  {userBasic?.role !== 'instruktor' && userData?.firstAidUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                      <Stethoscope className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Prva pomoć</p>
                        <a
                          href={userData.firstAidUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Pregledaj dokument
                        </a>
                      </div>
                    </div>
                  )}
                  {userBasic?.role === 'instruktor'
                    ? !userData?.dateOfBirth?.trim() && !userData?.profilePhotoUrl && (
                        <p className="text-sm text-slate-500 py-4">
                          Nema sačuvanih podataka profila. Kliknite „Izmeni” da dodate.
                        </p>
                      )
                    : !userData?.phoneNumber?.trim() &&
                      !userData?.dateOfBirth?.trim() &&
                      !userData?.healthInsuranceUrl &&
                      !userData?.idCardFrontUrl &&
                      !userData?.idCardBackUrl &&
                      !userData?.firstAidUrl && (
                        <p className="text-sm text-slate-500 py-4">
                          Nema sačuvanih podataka profila. Kliknite „Izmeni” da dodate.
                        </p>
                      )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
