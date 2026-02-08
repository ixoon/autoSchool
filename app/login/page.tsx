'use client';

import { auth } from '@/config/firebase';
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { send } from 'process';
import React, { useState } from 'react'

const page = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            const user = userCredential.user;

            if(!user.emailVerified) {
                await sendEmailVerification(user);
                await signOut(auth);
                setError("Email nije verifikovan. Poslali smo vam novi verifikacioni email (proverite i spam).")

                return;
            } 

            setMessage("Uspešno ste prijavljeni!")
            setEmail("")
            setPassword("")
            router.push("/student/dashboard")
            

        } catch(error: any) {
            setError(error.message + " Greska prilikom prijave. Proverite email i lozinku i pokušajte ponovo.")
        }
    }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-6 shadow-2xl border-2 border-gray-300 rounded-xl p-10">
        
        <h1 className="text-2xl font-bold text-center">
          🚙AutoŠkola Šampion
        </h1>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-semibold">Login</h2>
          <p className='text-gray-400'>Enter your details to login</p>
        </div>

        <form className="flex flex-col gap-2" onSubmit={handleLogin}>
            <label className="text-sm font-medium">Email address</label>
          <input className='border border-gray-200 rounded-lg py-1 px-1' type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="text-sm font-medium">Password</label>
          <input className='border border-gray-200 rounded-lg py-1 px-1' type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className='w-full bg-blue-500 text-white font-bold rounded-lg p-1 hover:bg-blue-600' type="submit">Login</button>
        </form>
        {message && <p className="text-green-500 text-center">{message}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        <p className="text-center">
          Don't have an account? <a href="/register" className="underline">Register</a>
        </p>

      </div>
    </div>
  )
}

export default page
