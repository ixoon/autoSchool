import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react'

const Protected = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if(user) {
            setAllowed(true);
            setLoading(false);
        } else {
            setAllowed(false);
            setLoading(false);
            router.push("/login");
        }
    })
    return () => unsubscribe();
  }, [router])

   if(loading) {
    return <div>Loading...</div>
   }

   return allowed ? <>{children}</> : null;
}

export default Protected;