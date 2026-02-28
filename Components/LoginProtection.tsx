'use client';

import React, { useEffect, useState } from 'react'
import {auth} from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

const LoginProtection = ({children}: { children: React.ReactNode}) => {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if(user && user.emailVerified) {
                router.replace('/');
            } else {
                setLoading(false);
            }
        })
        return () => unsub();
    }, [router])

     if (loading) {
    return <div className="text-white text-center py-20">Loading...</div>;
  }

  return <>{children}</>
  
}

export default LoginProtection;