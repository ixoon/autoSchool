'use client';

import { auth, db } from '../../config/firebase';
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore';

const Page = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if(!user.emailVerified) {
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

            if(role === 'superadmin') {
              router.push("/superadmin");
              return;
            } 
            
            if(role === 'instruktor') {
              router.push("/instruktor-panel");
              return;
            } 
            
            if(role === 'student') {
              router.push("/student/dashboard");
              return;
            } 
            
            setError("Nepoznata rola korisnika.");
            await signOut(auth);

        } catch(error: any) {
            setError("Greška prilikom prijave. Proverite email i lozinku.");
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-6 shadow-2xl border-2 border-gray-300 rounded-xl p-10">
        
        <h1 className="text-2xl font-bold text-center">
          🚙 AutoŠkola Šampion
        </h1>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-semibold">Login</h2>
          <p className='text-gray-400'>Enter your details to login</p>
        </div>

        <form className="flex flex-col gap-2" onSubmit={handleLogin}>
            <label className="text-sm font-medium">Email address</label>
          <input
            className='border border-gray-200 rounded-lg py-1 px-2'
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

            <label className="text-sm font-medium">Password</label>
          <input
            className='border border-gray-200 rounded-lg py-1 px-2'
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className='w-full bg-blue-500 text-white font-bold rounded-lg p-2 hover:bg-blue-600 disabled:opacity-50'
            type="submit"
          >
            {loading ? "Prijava..." : "Login"}
          </button>
        </form>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <a href="/forgot-password" className="text-sm text-center text-blue-600 hover:text-blue-800 underline transition">
          Zaboravili ste lozinku?
        </a>

        <p className="text-center">
          Don't have an account? <a href="/register" className="underline">Register</a>
        </p>
      </div>
    </div>
  )
}

export default Page;
