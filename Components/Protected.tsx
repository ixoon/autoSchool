'use client';

import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'superadmin' | 'instruktor' | 'student';

interface ProtectedProps {
  children: ReactNode;
  allowedRoles: Role[];
}

const Protected = ({ children, allowedRoles }: ProtectedProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('Nema ulogovanog korisnika');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {

        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log('User dokument ne postoji u Firestore');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const userData = userSnap.data() as { role?: string };

        // Normalizacija role (trim + lowercase)
        const roleFromDb = (userData.role || '').trim().toLowerCase();
        const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());


        if (normalizedAllowed.includes(roleFromDb as Role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error('Greška pri proveri role:', err);
        setAuthorized(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Učitavanje...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg font-semibold">
          Nemate dozvolu za pristup ovoj stranici.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default Protected;
