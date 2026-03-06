'use client';

import { auth, db } from '../../lib/firebase';
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import LoginProtection from '@/Components/LoginProtection';
import { 
  Car, Mail, Lock, LogIn, AlertCircle, Loader2, 
  Eye, EyeOff, ArrowRight, Shield, UserCheck 
} from 'lucide-react';

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        setError("Email nije verifikovan. Poslali smo vam novi verifikacioni email (proverite i spam).");
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setError("Korisnik postoji u Auth, ali nema zapis u bazi (kontaktirajte admina).");
        setLoading(false);
        return;
      }

      const userData = userSnap.data() as { role: string };
      const role = userData.role?.trim().toLowerCase();

      if (role === 'superadmin') {
        router.push("/superadmin");
        return;
      }

      if (role === 'instruktor') {
        router.push("/instruktor-panel");
        return;
      }

      if (role === 'student') {
        router.push("/student/dashboard");
        return;
      }

      setError("Nepoznata rola korisnika.");
      await signOut(auth);
    } catch (error: any) {
      setError("Greška prilikom prijave. Proverite email i lozinku.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginProtection>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo iznad forme */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-600/20 mb-4">
              <Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">AutoŠkola Šampion</h1>
            <p className="text-slate-500 mt-1">Dobrodošli nazad!</p>
          </div>

          {/* Glavna forma */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-800">Prijava na sistem</h2>
              <p className="text-sm text-slate-500 mt-1">Unesite vaše podatke za pristup</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email polje */}
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
                    className="pl-10 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    type="email"
                    placeholder="primer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password polje */}
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
                    className="pl-10 pr-12 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              {/* Opcije - Remember me i Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Zapamti me</span>
                </label>
                <a 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Zaboravili ste lozinku?
                </a>
              </div>

              {/* Submit dugme */}
              <button
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl p-3 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Prijava u toku...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Prijavi se</span>
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

            {/* Info za testiranje */}
            
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
          AutoŠkola Šampion.
          </p>
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
    </LoginProtection>
  );
};

export default Page;