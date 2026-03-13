'use client';

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import Link from "next/link";
import { 
  User, Mail, Lock, CheckCircle, AlertCircle, 
  Loader2, ArrowLeft, Shield, KeyRound, Eye, EyeOff,
  FileText, Award, Users, Car
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkInvite = async () => {
      if (!token) {
        setError("Nevažeći link za registraciju. Nedostaje token.");
        setLoading(false);
        return;
      }

      try {
        // Provera da li invite postoji
        const q = query(
          collection(db, "invites"),
          where("token", "==", token)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Pozivnica ne postoji. Proverite link.");
          setLoading(false);
          return;
        }

        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();

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

        // Provera da li korisnik već postoji u users kolekciji
        const userCheck = await getDocs(
          query(collection(db, "users"), where("email", "==", inviteData.email))
        );
        
        if (!userCheck.empty) {
          setError("Korisnik sa ovim email-om već postoji. Idite na login.");
          setLoading(false);
          return;
        }

        // Postavljanje podataka - IME PREFILLED iz invite-a
        setFullName(inviteData.fullName || "");
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
      // Kreiranje korisnika u Firebase Auth - BEZ slanja verifikacionog emaila
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const batch = writeBatch(db);

      // USERS kolekcija
      batch.set(doc(db, "users", user.uid), {
        fullName,
        email,
        role,
        createdAt: serverTimestamp(),
        emailVerified: true // Dodajemo polje za praćenje
      });

      // Dodavanje u odgovarajuću kolekciju po roli
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

      // Označavanje invite-a kao iskorišćenog
      batch.update(doc(db, "invites", inviteDocId), {
        used: true,
        usedBy: user.uid,
        usedAt: serverTimestamp(),
      });

      await batch.commit();
      
      setSuccess(true);
      
      // Preusmeravanje na login stranicu
      setTimeout(() => router.push("/login?registered=true"), 2000);
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Greška pri registraciji.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>
            <p className="text-slate-600 font-medium text-lg">Provera pozivnice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Uspešna registracija!</h2>
            <p className="text-slate-600 mb-6">
              Vaš nalog je uspešno kreiran.
            </p>
            
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Preusmeravanje na login stranicu...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Greška</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Idi na početnu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch(role) {
      case 'student': return <Users className="w-5 h-5 text-white" />;
      case 'instruktor': return <Award className="w-5 h-5 text-white" />;
      case 'superadmin': return <Shield className="w-5 h-5 text-white" />;
      default: return <User className="w-5 h-5 text-white" />;
    }
  };

  const getRoleColor = () => {
    switch(role) {
      case 'student': return 'from-blue-600 to-indigo-600';
      case 'instruktor': return 'from-purple-600 to-pink-600';
      case 'superadmin': return 'from-amber-600 to-orange-600';
      default: return 'from-blue-600 to-indigo-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-600/20 mb-4">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AutoŠkola Šampion</h1>
        </div>

        {/* Glavna kartica */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getRoleColor()} p-6 text-center`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-3">
              {getRoleIcon()}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Dovršite registraciju</h2>
            <p className="text-white/90 text-sm">
              Registrujete se kao <span className="font-semibold capitalize">{role}</span>
            </p>
          </div>

          {/* Forma */}
          <div className="p-6">
            <form className="space-y-5" onSubmit={handleRegister}>
              {/* Ime i prezime - SADA JE PREFILLED iz invite-a */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <User className="w-4 h-4 text-blue-600" />
                  Ime i prezime
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Marko Marković"
                    disabled={registering}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email adresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-xl p-3"
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Email je dodeljen putem pozivnice
                </p>
              </div>

              {/* Lozinka */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Lozinka
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    minLength={6}
                    disabled={registering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Potvrda lozinke */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Potvrdi lozinku
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-12 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    minLength={6}
                    disabled={registering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit dugme */}
              <button
                type="submit"
                disabled={registering}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl p-3 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registracija u toku...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Registruj se</span>
                  </>
                )}
              </button>

              {/* Error poruka */}
              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>

            {/* Link za login */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">
                Već imate nalog?{' '}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Prijavite se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Glavna stranica sa Suspense granicom
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>
            <p className="text-slate-600 font-medium text-lg">Učitavanje stranice...</p>
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}