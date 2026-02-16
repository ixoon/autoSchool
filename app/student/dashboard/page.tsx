'use client';
import { auth, db } from '@/config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Protected from '@/Components/Protected';
import React, { useEffect, useState } from 'react'
import { Car, CarFront, Users, Settings } from 'lucide-react';
import Settings2 from '../../../Components/Settings'
import { getDocs, collection, query, where } from 'firebase/firestore';
const page = () => {
  const [activeSection, setActiveSection] = useState<"Pocetna" | "Podesavanja">("Pocetna");

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [studentData, setStudentData] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

const router = useRouter();

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
      if(user) {
        setCurrentUser({
          email: user.email,
          uid: user.uid,
          fullName: user.displayName
        });
      }
  })
  return () => unsubscribe();
}, [])

useEffect(() => {
  const fetchStudentData = async () => {
    if(!currentUser?.email) return;

    try {
      const q = query(collection(db, "studenti"), where ("email", "==", currentUser.email));
      const snapshot = await getDocs(q);

      if(!snapshot.empty) {
        const studentDoc = snapshot.docs[0];
        setStudentData({
          id: studentDoc.id,
          ...studentDoc.data()
        })
      } else {

        setError("Student nije pronadjen u bazi")
      }
    } catch(err) {
      setError("Došlo je do greške prilikom učitavanja podataka...")
    }
  }
  fetchStudentData();
}, [currentUser])

    const logout = async () => {
        await signOut(auth);
        router.push("/")
    }

    const renderContent = () => {
      switch(activeSection) {
        case "Pocetna":
          return <div>
            {studentData ? (
              <div>
                <h1>{studentData.fullName}</h1>
                <h1>{studentData.email}</h1>
              </div>
            ) : (
              <div>
                <h1>Ucitavanje podataka...</h1>
              </div>
            )}
            
          </div>
        case "Podesavanja":
          return <Settings2/>
      }
    }

  return (
    <Protected allowedRoles={['student']}>
      <div className="flex h-screen">
                <aside className="h-screen w-64 p-4 top-0 sticky bg-white border-r border-gray-200">
                    <h1 className="flex gap-2 font-bold text-xl"><Car className="h-7 w-7 p-1 items-center justify-center rounded-lg bg-blue-500 text-white"/>AutoŠkola Šampion</h1>
                    <hr className="w-full mt-2"/>
                    <nav className="flex flex-col gap-4 items-start mt-5">
                        <button onClick={() => setActiveSection("Pocetna")} className={`flex gap-2 w-full text-left hover:bg-blue-50 p-2 rounded-lg items-center ${activeSection === 'Pocetna' ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}`}><CarFront/>Pocetna</button>
                        <button onClick={() => setActiveSection("Podesavanja")} className={`flex gap-2 w-full text-left hover:bg-blue-50 rounded-lg p-2 items-center ${activeSection === 'Podesavanja' ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}`}><Settings/>Podesavanja</button>
                        <button onClick={logout} className='font-semibold bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 cursor-pointer mt-6'>Odjavite se</button>
                    </nav>
                </aside>

                <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    {renderContent()}
                </main>
            </div>
    </Protected>
  )
}

export default page