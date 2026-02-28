'use client';

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import Link from "next/link";

type Role = "student" | "instruktor" | "superadmin";

// Komponenta koja koristi useSearchParams
function RegisterForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [inviteDocId, setInviteDocId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Funkcija za dodavanje debug poruka
  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    const checkInvite = async () => {
      if (!token) {
        setError("Nevažeći link za registraciju. Nedostaje token.");
        setLoading(false);
        return;
      }

      addDebug(`Provera tokena: ${token}`);

      try {
        // Provera da li invite postoji
        const q = query(
          collection(db, "invites"),
          where("token", "==", token)
        );

        const snapshot = await getDocs(q);
        addDebug(`Broj pronađenih invite-ova: ${snapshot.size}`);

        if (snapshot.empty) {
          setError("Pozivnica ne postoji. Proverite link.");
          setLoading(false);
          return;
        }

        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();
        addDebug(`Invite podaci: ${JSON.stringify(inviteData)}`);

        // Provera da li je već iskorišćen
        if (inviteData.used) {
          setError("Ova pozivnica je već iskorišćena.");
          setLoading(false);
          return;
        }

        // Provera da li je istekao
        const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(inviteData.expiresAt);
        if (expiresAt < new Date()) {
          setError("Pozivnica je istekla. Zatražite novu.");
          setLoading(false);
          return;
        }

        // Provera da li korisnik već postoji u auth
        // Ovo ne možemo direktno proveriti, ali možemo proveriti u users kolekciji
        const userCheck = await getDocs(
          query(collection(db, "users"), where("email", "==", inviteData.email))
        );
        
        if (!userCheck.empty) {
          setError("Korisnik sa ovim email-om već postoji. Idite na login.");
          setLoading(false);
          return;
        }

        // Provera da li već postoji u specifičnoj kolekciji
        if (inviteData.role === "student") {
          const studentCheck = await getDocs(
            query(collection(db, "studenti"), where("email", "==", inviteData.email))
          );
          if (!studentCheck.empty) {
            addDebug(`Upozorenje: Student već postoji u studenti kolekciji, ali ne u users`);
          }
        } else if (inviteData.role === "instruktor") {
          const instruktorCheck = await getDocs(
            query(collection(db, "Instruktori"), where("email", "==", inviteData.email))
          );
          if (!instruktorCheck.empty) {
            addDebug(`Upozorenje: Instruktor već postoji u Instruktori kolekciji, ali ne u users`);
          }
        }

        // Postavljanje podataka
        setEmail(inviteData.email);
        setRole(inviteData.role);
        setInviteDocId(inviteDoc.id);
        setInviteData(inviteData);
        setLoading(false);

      } catch (err) {
        console.error("Greška pri proveri invite-a:", err);
        setError("Greška pri proveri pozivnice. Pokušajte ponovo.");
        setLoading(false);
      }
    };

    checkInvite();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!fullName.trim()) return setError("Unesite ime i prezime.");
  if (password.length < 6) return setError("Lozinka mora imati 6+ karaktera.");
  if (password !== confirmPassword) return setError("Lozinke se ne poklapaju.");
  if (!role || !inviteDocId || !inviteData) return setError("Greška sa pozivnicom.");

  setRegistering(true);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    await sendEmailVerification(user);

    const batch = writeBatch(db);

    // USERS
    batch.set(doc(db, "users", user.uid), {
      fullName,
      email,
      role,
      createdAt: serverTimestamp(),
    });

    if (role === "student") {
      if (!inviteData.autoSkolaId || !inviteData.instruktorId) {
        throw new Error("Student mora imati autoskolu i instruktora.");
      }

      batch.set(doc(db, "studenti", user.uid), {
        fullName,
        email,
        autoSkolaId: inviteData.autoSkolaId,
        instruktorId: inviteData.instruktorId,
        createdAt: serverTimestamp(),
      });
    }

    if (role === "instruktor") {
      if (!inviteData.autoSkolaId) {
        throw new Error("Instruktor mora imati autoskolu.");
      }

      batch.set(doc(db, "Instruktori", user.uid), {
        fullName,
        email,
        autoSkolaId: inviteData.autoSkolaId,
        createdAt: serverTimestamp(),
      });
    }

    batch.update(doc(db, "invites", inviteDocId), {
      used: true,
      usedBy: user.uid,
      usedAt: serverTimestamp(),
    });

    await batch.commit();
    setSuccess(true);

    setTimeout(() => router.push("/login"), 3000);
  } catch (err: any) {
    setError(err.message || "Greška pri registraciji.");
  } finally {
    setRegistering(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Provera pozivnice...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Uspešna registracija!</h2>
            <p className="text-gray-600 mb-4">
              Proverite vaš email ({email}) i verifikujte nalog.
            </p>
            
            <p className="text-sm text-gray-500 mt-4">
              Preusmeravanje na login stranicu...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Greška</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Idi na početnu
            </Link>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dovršite registraciju
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registrujete se kao <span className="font-semibold text-blue-600">{role}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Ime i prezime
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Marko Marković"
                disabled={registering}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email adresa
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-lg sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email je dodeljen putem pozivnice
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Lozinka
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
                minLength={6}
                disabled={registering}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Potvrdi lozinku
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
                minLength={6}
                disabled={registering}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={registering}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registracija u toku...
                </>
              ) : "Registruj se"}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

        </form>

        {/* Debug info - sakriveno u produkciji */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug info:</h3>
            <pre className="text-xs overflow-auto max-h-40">
              {debugInfo.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

// Glavna stranica sa Suspense granicom
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje stranice...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}