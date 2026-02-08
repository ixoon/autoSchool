'use client';

import { auth } from '../../config/firebase'
import React, { useState } from 'react'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { db } from '../../config/firebase'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

const page = () => {
    const [fullName, setfullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);

            await setDoc(doc(db, "users", user.uid), {
                fullName,
                email,
                role: "student",
                createdAt: serverTimestamp()
            })
            setMessage("Regitracija uspešna! Proverite svoj email za verifikaciju. Proverite spam folder ako ne vidite email.");

        } catch (error: any) {
            setError(error.message);
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-6 shadow-2xl border-2 border-gray-300 rounded-xl p-10">
        
        <h1 className="text-2xl font-bold text-center">
          🚙AutoŠkola Šampion
        </h1>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-semibold">Registration</h2>
          <p className='text-gray-400'>Enter your details to create an account</p>
        </div>

        <form className="flex flex-col gap-2" onSubmit={handleRegister}>
            <label className="text-sm font-medium">Full Name</label>
          <input value={fullName} onChange={(e) => setfullName(e.target.value)} className='border border-gray-200 rounded-lg py-1 px-1' type="text" placeholder="Joe Smith" />
            <label className="text-sm font-medium">Email address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className='border border-gray-200 rounded-lg py-1 px-1' type="email" placeholder="example@gmail.com" />
            <label className="text-sm font-medium">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} className='border border-gray-200 rounded-lg py-1 px-1' type="password" placeholder="********" />
          <button className='w-full bg-blue-500 text-white font-bold rounded-lg p-1 hover:bg-blue-600' type="submit">Register</button>
        </form>

        {message && <p className="text-green-500 text-center">{message}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        <p className="text-center">
          Already have an account? <a href="/login" className="underline">Login</a>
        </p>

      </div>
    </div>
  )
}

export default page



