'use client';

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
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
        setError("Nevažeći link za registraciju.");
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "invites"),
          where("token", "==", token)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Pozivnica ne postoji.");
          setLoading(false);
          return;
        }

        const inviteDoc = snapshot.docs[0];
        const data = inviteDoc.data();

        if (data.used) {
          setError("Ova pozivnica je već iskorišćena.");
          setLoading(false);
          return;
        }

        const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (expiresAt < new Date()) {
          setError("Pozivnica je istekla.");
          setLoading(false);
          return;
        }

        setEmail(data.email);
        setRole(data.role);
        setInviteDocId(inviteDoc.id);
        setInviteData(data);

        // PREFILL IME
        if (data.fullName) {
          setFullName(data.fullName);
        }

        setLoading(false);

      } catch (err) {
        setError("Greška pri proveri pozivnice.");
        setLoading(false);
      }
    };

    checkInvite();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) return setError("Unesite ime i prezime.");
    if (password.length < 6) return setError("Lozinka mora imati 6+ karaktera.");
    if (password !== confirmPassword) return setError("Lozinke se ne poklapaju.");
    if (!role || !inviteDocId || !inviteData) return setError("Greška sa pozivnicom.");

    setRegistering(true);
    setError("");

    try {

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const batch = writeBatch(db);

      batch.set(doc(db, "users", user.uid), {
        fullName,
        email,
        role,
        createdAt: serverTimestamp(),
      });

      if (role === "student") {

        batch.set(doc(db, "studenti", user.uid), {
          fullName,
          email,
          autoSkolaId: inviteData.autoSkolaId,
          instruktorId: inviteData.instruktorId,
          createdAt: serverTimestamp(),
        });

      }

      if (role === "instruktor") {

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

      setTimeout(() => {
        router.push("/login");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "Greška pri registraciji.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Registracija uspešna</h2>
          <p className="text-slate-600 mb-4">
            Vaš nalog je uspešno kreiran.
          </p>
          <p className="text-sm text-slate-500">
            Preusmeravanje na login...
          </p>
        </div>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">

        <h2 className="text-xl font-bold mb-6 text-center">
          Dovršite registraciju
        </h2>

        <form className="space-y-4" onSubmit={handleRegister}>

          <div>
            <label className="text-sm">Ime i prezime</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              value={email}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm">Lozinka</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm">Potvrdi lozinku</label>
            <input
              type={showConfirmPassword ? "text":"password"}
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            disabled={registering}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {registering ? "Registracija..." : "Registruj se"}
          </button>

        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600">
            Već imate nalog? Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}