'use client';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React from 'react'

const page = () => {
const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/")
    }

  return (
    <div>STUDENT DASHBOARD
        <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default page