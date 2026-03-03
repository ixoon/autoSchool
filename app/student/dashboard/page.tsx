'use client';

import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Protected from '../../../Components/Protected';
import React, { useEffect, useState } from 'react';
import { Car, CarFront, Users, Settings, LogOut, Loader2, Calendar, User } from 'lucide-react';
import Settings2 from '../../../Components/Settings';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import TestsList from '../../../Components/TestsList';
import RecentTests from '../../../Components/RecentTests';

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState<"Pocetna" | "Podesavanja">("Pocetna");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [instructorData, setInstructorData] = useState<any>(null);
  const [thisWeekLessons, setThisWeekLessons] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

  // Funkcija za formatiranje datuma i vremena
  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    const formattedDate = new Date(date).toLocaleDateString('sr-RS', options);
    return `${formattedDate} od ${startTime} do ${endTime}`;
  };

  // Funkcija za dobijanje dana u nedelji
  const getWeekDays = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 je nedelja, 1 ponedeljak...
    
    // Podesi da nedelja bude 7 za lakše računanje
    const day = currentDay === 0 ? 7 : currentDay;
    
    // Početak nedelje (ponedeljak)
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Kraj nedelje (nedelja)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
  };

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
        // Prvo proveri u users kolekciji
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        let studentInfo: any = {};

        if (userSnap.exists()) {
          studentInfo = {
            ...userSnap.data(),
            uid: currentUser.uid
          };
        }

        // Onda proveri u studenti kolekciji
        const q = query(
          collection(db, "studenti"), 
          where("email", "==", currentUser.email)
        );
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const studentDoc = snapshot.docs[0];
          const studentDataFromDb = {
            id: studentDoc.id,
            ...studentDoc.data(),
            ...studentInfo
          };
          
          setStudentData(studentDataFromDb);
        } else {
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

  // Fetchovanje podataka o instruktoru iz kolekcije Instruktori
  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!studentData?.instruktorId) return;

      try {
        // Direktno čitanje instruktora po ID-ju iz kolekcije "Instruktori"
        const instructorRef = doc(db, "Instruktori", studentData.instruktorId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (instructorSnap.exists()) {
          setInstructorData({
            id: instructorSnap.id,
            ...instructorSnap.data()
          });
        }
      } catch (err) {
        console.error("Greška pri učitavanju instruktora:", err);
      }
    };

    fetchInstructorData();
  }, [studentData]);

  // Fetchovanje rasporeda časova za ovu nedelju iz kolekcije lessons
  useEffect(() => {
    const fetchThisWeekLessons = async () => {
      if (!studentData?.id) return;

      try {
        const { monday, sunday } = getWeekDays();
        
        // Formatiranje datuma za poređenje (pošto je u bazi string "YYYY-MM-DD")
        const mondayStr = monday.toISOString().split('T')[0];
        const sundayStr = sunday.toISOString().split('T')[0];
        
        // Preuzimanje svih časova za studenta
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("studentId", "==", studentData.id)
        );

        const lessonsSnapshot = await getDocs(lessonsQuery);
        const allLessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtriranje za ovu nedelju (pošto je date string)
        const filteredLessons = allLessons.filter((lesson: any) => {
          return lesson.date >= mondayStr && lesson.date <= sundayStr;
        });

        // Sortiranje po datumu i vremenu
        filteredLessons.sort((a: any, b: any) => {
          if (a.date === b.date) {
            return a.startTime.localeCompare(b.startTime);
          }
          return a.date.localeCompare(b.date);
        });

        setThisWeekLessons(filteredLessons);
      } catch (err) {
        console.error("Greška pri učitavanju rasporeda:", err);
      }
    };

    if (studentData?.id) {
      fetchThisWeekLessons();
    }
  }, [studentData]);

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
                </div>
              </div>
            )}

            {/* Instruktor kartica */}
            {instructorData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Tvoj instruktor</h3>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-800">{instructorData.fullName}</p>
                  <p className="text-sm text-gray-600 mt-1">{instructorData.email}</p>
                  {instructorData.godine && (
                    <p className="text-sm text-gray-600 mt-1">Godine: {instructorData.godine}</p>
                  )}
                </div>
              </div>
            )}

            {/* Raspored časova za ovu nedelju */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Raspored časova - ova nedelja</h3>
              </div>
              
              {thisWeekLessons.length > 0 ? (
                <div className="space-y-3">
                  {thisWeekLessons.map((lesson: any) => (
                    <div key={lesson.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="font-medium text-gray-800">
                        {formatDateTime(lesson.date, lesson.startTime, lesson.endTime)}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          Čas vožnje
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nema zakazanih časova za ovu nedelju.</p>
              )}
            </div>

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
    <Protected allowedRoles={["student"]}>
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