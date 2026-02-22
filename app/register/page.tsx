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
  getDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
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
            query(collection(db, "instruktori"), where("email", "==", inviteData.email))
          );
          if (!instruktorCheck.empty) {
            addDebug(`Upozorenje: Instruktor već postoji u instruktori kolekciji, ali ne u users`);
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
    setDebugInfo([]);

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
      addDebug(`Započinjem registraciju za: ${email} sa rolom: ${role}`);
      
      // KORAK 1: Kreiranje naloga u Firebase Auth
      addDebug("Kreiranje naloga u Firebase Auth...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      addDebug(`Nalog kreiran sa UID: ${user.uid}`);

      // KORAK 2: Slanje email verifikacije
      addDebug("Slanje email verifikacije...");
      await sendEmailVerification(user);
      addDebug("Email za verifikaciju poslat");

      // KORAK 3: Priprema podataka
      const normalizedRole = role.trim().toLowerCase();
      const now = new Date();
      
      // Osnovni podaci za sve kolekcije
      const baseUserData = {
        fullName: fullName.trim(),
        email,
        role: normalizedRole,
        createdAt: serverTimestamp(),
        createdAtHuman: now.toISOString(),
        emailVerified: false,
        uid: user.uid,
        status: "aktivan",
        lastLogin: null,
        updatedAt: serverTimestamp()
      };

      // KORAK 4: Korišćenje batch-a za sve Firestore operacije
      const batch = writeBatch(db);

      // 4.1 Kreiranje u users kolekciji (UVEK)
      const userRef = doc(db, "users", user.uid);
      batch.set(userRef, baseUserData);
      addDebug("Pripremljen dokument za users kolekciju");

      // 4.2 Kreiranje u specifičnoj kolekciji prema roli
      if (normalizedRole === "student") {
        // Provera da li već postoji u studenti kolekciji
        const studentQuery = query(
          collection(db, "studenti"), 
          where("email", "==", email)
        );
        const studentSnapshot = await getDocs(studentQuery);
        
        if (!studentSnapshot.empty) {
          addDebug(`Student već postoji u studenti kolekciji, ažuriram...`);
          // Ažuriraj postojeći dokument
          const existingStudent = studentSnapshot.docs[0];
          batch.update(doc(db, "studenti", existingStudent.id), {
            ...baseUserData,
            userId: user.uid,
            updatedAt: serverTimestamp()
          });
        } else {
          // Kreiraj novi dokument
          const studentData = {
            ...baseUserData,
            // Student specifična polja
            kategorija: "", // Biće popunjeno kasnije
            instruktorId: null,
            instruktorIme: null,
            brojTelefona: "",
            adresa: "",
            datumRodjenja: null,
            brojPokusaja: 0,
            polozenTeorija: false,
            polozenPrakticni: false,
            prijavljeniTestovi: [],
            rezultati: [],
            // Veza ka users dokumentu
            userId: user.uid,
            userRef: `/users/${user.uid}`
          };
          
          const studentRef = doc(db, "studenti", user.uid);
          batch.set(studentRef, studentData);
        }
        addDebug("Pripremljen dokument za studenti kolekciju");

      } else if (normalizedRole === "instruktor") {
        // Provera da li već postoji u instruktori kolekciji
        const instruktorQuery = query(
          collection(db, "instruktori"), 
          where("email", "==", email)
        );
        const instruktorSnapshot = await getDocs(instruktorQuery);
        
        if (!instruktorSnapshot.empty) {
          addDebug(`Instruktor već postoji u instruktori kolekciji, ažuriram...`);
          const existingInstruktor = instruktorSnapshot.docs[0];
          batch.update(doc(db, "instruktori", existingInstruktor.id), {
            ...baseUserData,
            userId: user.uid,
            updatedAt: serverTimestamp()
          });
        } else {
          // Instruktor specifična polja
          const instruktorData = {
            ...baseUserData,
            specijalizacija: [], // Npr. ["B kategorija", "C kategorija"]
            brojTelefona: "",
            grad: "",
            dostupan: true,
            brojStudenata: 0,
            listaStudenata: [], // IDs studenata
            iskustvo: "",
            biografija: "",
            // Veza ka users dokumentu
            userId: user.uid,
            userRef: `/users/${user.uid}`
          };
          
          const instruktorRef = doc(db, "instruktori", user.uid);
          batch.set(instruktorRef, instruktorData);
        }
        addDebug("Pripremljen dokument za instruktori kolekciju");

      } else if (normalizedRole === "superadmin") {
        // Provera da li već postoji u admini kolekciji
        const adminQuery = query(
          collection(db, "admini"), 
          where("email", "==", email)
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          addDebug(`Admin već postoji u admini kolekciji, ažuriram...`);
          const existingAdmin = adminSnapshot.docs[0];
          batch.update(doc(db, "admini", existingAdmin.id), {
            ...baseUserData,
            userId: user.uid,
            updatedAt: serverTimestamp()
          });
        } else {
          // Admin specifična polja
          const adminData = {
            ...baseUserData,
            nivoPristupa: "pun",
            permissions: ["all"],
            lastLogin: null,
            // Veza ka users dokumentu
            userId: user.uid,
            userRef: `/users/${user.uid}`
          };
          
          const adminRef = doc(db, "admini", user.uid);
          batch.set(adminRef, adminData);
        }
        addDebug("Pripremljen dokument za admini kolekciju");
      }

      // 4.3 Obeležavanje invite-a kao iskorišćenog
      const inviteRef = doc(db, "invites", inviteDocId);
      batch.update(inviteRef, {
        used: true,
        usedAt: serverTimestamp(),
        usedBy: user.uid,
        usedAtHuman: now.toISOString(),
        registeredRole: normalizedRole,
        registeredFullName: fullName.trim()
      });
      addDebug("Pripremljeno ažuriranje invite-a");

      // KORAK 5: Izvršavanje batch operacije
      await batch.commit();
      addDebug("Sve Firestore operacije uspešno izvršene!");

      // KORAK 6: Dodatne provere nakon registracije
      addDebug("Provera uspešnosti upisa...");
      
      // Provera users kolekcije
      const userCheck = await getDoc(doc(db, "users", user.uid));
      if (userCheck.exists()) {
        addDebug(`✓ Users kolekcija: Dokument postoji sa rolom: ${userCheck.data()?.role}`);
      } else {
        addDebug(`✗ Users kolekcija: Dokument NE postoji!`);
      }

      // Provera specifične kolekcije
      if (normalizedRole === "student") {
        const studentCheck = await getDoc(doc(db, "studenti", user.uid));
        if (studentCheck.exists()) {
          addDebug(`✓ Studenti kolekcija: Dokument postoji`);
        } else {
          addDebug(`✗ Studenti kolekcija: Dokument NE postoji!`);
        }
      } else if (normalizedRole === "instruktor") {
        const instruktorCheck = await getDoc(doc(db, "instruktori", user.uid));
        if (instruktorCheck.exists()) {
          addDebug(`✓ Instruktori kolekcija: Dokument postoji`);
        } else {
          addDebug(`✗ Instruktori kolekcija: Dokument NE postoji!`);
        }
      }

      addDebug("🎉 Registracija uspešno završena!");
      setSuccess(true);
      
      // Preusmeravanje nakon 3 sekunde
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);

    } catch (err: any) {
      console.error("Greška pri registraciji:", err);
      addDebug(`❌ Greška: ${err.message}`);
      
      if (err.code === "auth/email-already-in-use") {
        setError("Email adresa je već u upotrebi.");
      } else if (err.code === "auth/weak-password") {
        setError("Lozinka je previše slaba.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Mrežna greška. Proverite internet konekciju.");
      } else {
        setError("Došlo je do greške prilikom registracije. Pokušajte ponovo.");
      }
    } finally {
      setRegistering(false);
    }
  };

  // Helper funkcija za proveru postojećih podataka
  const checkExistingData = async () => {
    if (!email) return;
    
    try {
      addDebug("Ručna provera postojećih podataka...");
      
      // Provera users
      const usersQuery = query(collection(db, "users"), where("email", "==", email));
      const usersSnap = await getDocs(usersQuery);
      addDebug(`Users kolekcija: ${usersSnap.size} dokumenata`);
      
      // Provera studenti
      const studentiQuery = query(collection(db, "studenti"), where("email", "==", email));
      const studentiSnap = await getDocs(studentiQuery);
      addDebug(`Studenti kolekcija: ${studentiSnap.size} dokumenata`);
      
      // Provera instruktori
      const instruktoriQuery = query(collection(db, "instruktori"), where("email", "==", email));
      const instruktoriSnap = await getDocs(instruktoriQuery);
      addDebug(`Instruktori kolekcija: ${instruktoriSnap.size} dokumenata`);
      
    } catch (err) {
      console.error(err);
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

      </div>
    </div>
  );
}