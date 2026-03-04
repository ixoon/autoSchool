'use client';

import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, 
  KeyRound, Send, Shield, Info 
} from 'lucide-react';

const Page = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!email.trim()) {
      setError("Unesite email adresu.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Poslali smo link za reset lozinke na Vaš email. Proverite i spam folder.");
      setEmail("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setError("Korisnik sa ovom email adresom ne postoji.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Neispravna email adresa.");
      } else {
        setError("Došlo je do greške. Pokušajte ponovo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Nazad dugme */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Nazad na prijavu</span>
        </button>

        {/* Glavna kartica */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header sa gradijentom */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-3">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Zaboravljena lozinka?</h1>
            <p className="text-blue-100 text-sm">
              Bez brige, poslaćemo vam link za resetovanje
            </p>
          </div>

          {/* Forma */}
          <div className="p-6">
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* Info box */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Unesite email adresu koju ste koristili prilikom registracije. 
                  Poslaćemo vam link za resetovanje lozinke.
                </p>
              </div>

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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="primer@email.com"
                    className="pl-10 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Submit dugme */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl p-3 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Slanje u toku...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Pošalji link</span>
                  </>
                )}
              </button>

              {/* Success poruka */}
              {message && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Email poslat!</p>
                    <p className="text-xs text-green-600">{message}</p>
                  </div>
                </div>
              )}

              {/* Error poruka */}
              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>

            {/* Dodatni saveti */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="space-y-2 text-xs text-slate-500">
                  <p>• Link za resetovanje lozinke važi kratko vreme.</p>
                  <p>• Ako ne vidite email u inbox-u, proverite spam folder.</p>
                  <p>• Ako i dalje imate problema, kontaktirajte administratora.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 AutoŠkola Šampion. Sva prava zadržana.
        </p>
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
};

export default Page;