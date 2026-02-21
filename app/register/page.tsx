'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import Link from "next/link";

type Role = "student" | "instruktor" | "superadmin";

export default function RegisterPage() {
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

  useEffect(() => {
    const checkInvite = async () => {
      if (!token) {
        setError("Nevažeći link za registraciju. Nedostaje token.");
        setLoading(false);
        return;
      }

      console.log("Provera tokena:", token);

      try {
        // Provera da li invite postoji
        const q = query(
          collection(db, "invites"),
          where("token", "==", token)
        );

        const snapshot = await getDocs(q);
        console.log("Broj pronađenih invite-ova:", snapshot.size);

        if (snapshot.empty) {
          setError("Pozivnica ne postoji. Proverite link.");
          setLoading(false);
          return;
        }

        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();
        console.log("Invite podaci:", inviteData);

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

        // Provera da li korisnik već postoji
        const userCheck = await getDocs(
          query(collection(db, "users"), where("email", "==", inviteData.email))
        );
        
        if (!userCheck.empty) {
          setError("Korisnik sa ovim email-om već postoji. Idite na login.");
          setLoading(false);
          return;
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

    // Validacija
    if (!fullName.trim()) {
      setError("Unesite ime i prezime.");
      return;
    }

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    if (!role || !inviteDocId) {
      setError("Došlo je do greške. Osvežite stranicu.");
      return;
    }

    setRegistering(true);

    try {
      console.log("Kreiranje naloga za:", email);
      
      // Kreiranje naloga
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      
      console.log("Nalog kreiran:", user.uid);

      // Slanje email verifikacije
      await sendEmailVerification(user);
      console.log("Email za verifikaciju poslat");

      // Kreiranje korisnika u Firestore-u
      const userData = {
        fullName: fullName.trim(),
        email,
        role,
        createdAt: serverTimestamp(),
        createdAtHuman: new Date().toISOString(),
        emailVerified: false,
        uid: user.uid
      };

      await setDoc(doc(db, "users", user.uid), userData);
      console.log("Korisnik dodat u Firestore");

      // Obeležavanje invite-a kao iskorišćenog
      await updateDoc(doc(db, "invites", inviteDocId), {
        used: true,
        usedAt: serverTimestamp(),
        usedBy: user.uid,
        usedAtHuman: new Date().toISOString()
      });
      
      console.log("Invite označen kao iskorišćen");

      setSuccess(true);
      
      // Preusmeravanje nakon 3 sekunde
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);

    } catch (err: any) {
      console.error("Greška pri registraciji:", err);
      
      if (err.code === "auth/email-already-in-use") {
        setError("Email adresa je već u upotrebi.");
      } else if (err.code === "auth/weak-password") {
        setError("Lozinka je previše slaba.");
      } else {
        setError("Došlo je do greške prilikom registracije. Pokušajte ponovo.");
      }
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
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Uspešna registracija!</h2>
          <p className="text-gray-600 mb-4">
            Proverite vaš email ({email}) i verifikujte nalog.
          </p>
          <p className="text-sm text-gray-500">
            Preusmeravanje na login stranicu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
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
      </div>
    </div>
  );
}