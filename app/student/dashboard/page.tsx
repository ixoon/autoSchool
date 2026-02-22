'use client';

import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Protected from '../../../Components/Protected';
import React, { useEffect, useState } from 'react';
import { Car, CarFront, Users, Settings, LogOut, Loader2 } from 'lucide-react';
import Settings2 from '../../../Components/Settings';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import TestsList from '../../../Components/TestsList';
import RecentTests from '../../../Components/RecentTests';

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState<"Pocetna" | "Podesavanja">("Pocetna");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

  // Praćenje auth stanja
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          email: user.email,
          uid: user.uid,
          fullName: user.displayName
        });
      } else {
        // Ako nema usera, redirect na login
        router.push('/');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Fetchovanje student podataka
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.email) return;

      setLoading(true);
      setError("");

      try {
        // Prvo proveri u users kolekciji (generalni podaci)
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        let studentInfo: any = {};

        if (userSnap.exists()) {
          studentInfo = {
            ...userSnap.data(),
            uid: currentUser.uid
          };
        }

        // Onda proveri u studenti kolekciji (specifični podaci za studente)
        const q = query(
          collection(db, "studenti"), 
          where("email", "==", currentUser.email)
        );
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const studentDoc = snapshot.docs[0];
          setStudentData({
            id: studentDoc.id,
            ...studentDoc.data(),
            ...studentInfo // Spoji sa podacima iz users kolekcije
          });
        } else {
          // Ako nema u studenti kolekciji, koristi podatke iz users
          if (Object.keys(studentInfo).length > 0) {
            setStudentData(studentInfo);
          } else {
            setError("Student nije pronađen u bazi podataka.");
          }
        }
      } catch (err) {
        console.error("Greška pri učitavanju:", err);
        setError("Došlo je do greške prilikom učitavanja podataka.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Greška pri odjavi:", error);
      setError("Došlo je do greške prilikom odjave.");
    } finally {
      setLoggingOut(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Učitavanje podataka...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Pokušaj ponovo
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "Pocetna":
        return (
          <div className="space-y-6">
            {/* Student info kartica */}
            {studentData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Dobrodošli, {studentData.fullName || studentData.ime || 'Studente'}!
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{studentData.email}</p>
                  </div>
                  {studentData.brojTelefona && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Telefon</p>
                      <p className="font-medium">{studentData.brojTelefona}</p>
                    </div>
                  )}
                  {studentData.kategorija && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Kategorija</p>
                      <p className="font-medium">{studentData.kategorija}</p>
                    </div>
                  )}
                  {studentData.instruktor && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Instruktor</p>
                      <p className="font-medium">{studentData.instruktor}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Testovi sekcija */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tvoji testovi</h3>
              <TestsList />
            </div>

            <div>
              <RecentTests/>
            </div>
          </div>
          
        );

      case "Podesavanja":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Podešavanja naloga</h2>
            <Settings2 />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Protected allowedRoles={['superadmin', 'student']}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="h-screen w-64 p-4 top-0 sticky bg-white border-r border-gray-200 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-800">AutoŠkola Šampion</h1>
          </div>
          
          <hr className="w-full my-4" />
          
          {/* Navigacija */}
          <nav className="flex-1 flex flex-col gap-2">
            <button 
              onClick={() => setActiveSection("Pocetna")} 
              className={`flex gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors items-center ${
                activeSection === 'Pocetna' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <CarFront className="h-5 w-5" />
              <span>Početna</span>
            </button>
            
            <button 
              onClick={() => setActiveSection("Podesavanja")} 
              className={`flex gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors items-center ${
                activeSection === 'Podesavanja' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Podešavanja</span>
            </button>
          </nav>

          {/* Odjava dugme */}
          <button 
            onClick={logout}
            disabled={loggingOut}
            className='w-full mt-auto flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg py-2.5 px-3 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Odjavljivanje...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Odjavi se</span>
              </>
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </Protected>
  );
};

export default StudentDashboard;