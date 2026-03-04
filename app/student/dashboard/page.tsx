'use client';

import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Protected from '../../../Components/Protected';
import React, { useEffect, useState } from 'react';
import { 
  Car, CarFront, Users, Settings, LogOut, Loader2, Calendar, User, 
  GraduationCap, Clock, Phone, Mail, ChevronRight, Home, 
  Menu, Bell, BookOpen, Award, TrendingUp, AlertCircle, X
} from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600 opacity-50" />
            </div>
          </div>
          <p className="text-slate-600 mt-4 font-medium">Učitavanje podataka...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            Pokušaj ponovo
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "Pocetna":
        return (
          <div className="space-y-8">
            {/* Welcome header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Dobrodošli, {studentData?.fullName || studentData?.ime || 'Studente'}!
                </h1>
                <p className="text-slate-500 mt-1">Vaš studentski panel</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>
              </div>
            </div>

            {/* Student info kartica */}
           {/* STUDENT + INSTRUKTOR ZAJEDNO */}
{studentData && (
  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

    {/* Header */}
    <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h2 className="text-lg sm:text-xl font-bold text-slate-800">
        Tvoj profil i instruktor
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Osnovne informacije o tebi i tvom instruktoru
      </p>
    </div>

    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

      {/* STUDENT */}
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {studentData.fullName || studentData.ime || "Student"}
            </h3>
            <p className="text-sm text-slate-500">Polaznik auto škole</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700 break-all">{studentData.email}</span>
          </div>

          {studentData.brojTelefona && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-green-600" />
              <span className="text-slate-700">{studentData.brojTelefona}</span>
            </div>
          )}

          {studentData.kategorija && (
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 text-purple-600" />
              <span className="text-slate-700">
                Kategorija: <span className="font-semibold">{studentData.kategorija}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* INSTRUKTOR */}
      <div className="p-6 space-y-6 bg-slate-50/40">
        {instructorData ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {instructorData.fullName}
                </h3>
                <p className="text-sm text-slate-500">Tvoj instruktor</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-purple-600" />
                <span className="text-slate-700 break-all">
                  {instructorData.email}
                </span>
              </div>

              {instructorData.godine && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-pink-600" />
                  <span className="text-slate-700">
                    Godine iskustva:{" "}
                    <span className="font-semibold">{instructorData.godine}</span>
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <Users className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              Instruktor još nije dodeljen.
            </p>
          </div>
        )}
      </div>

    </div>
  </div>
)}
            

            {/* Raspored časova za ovu nedelju */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Raspored časova - ova nedelja</h2>
              </div>
              
              {thisWeekLessons.length > 0 ? (
                <div className="space-y-3">
                  {thisWeekLessons.map((lesson: any, index: number) => {
                    const isToday = lesson.date === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div 
                        key={lesson.id} 
                        className={`group relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          isToday 
                            ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                            isToday ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-slate-100'
                          }`}>
                            <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${isToday ? 'text-white' : 'text-slate-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-base font-semibold text-slate-800">
                              {formatDateTime(lesson.date, lesson.startTime, lesson.endTime)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 rounded-full ${
                                isToday 
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                <Car className="w-3 h-3" />
                                Čas vožnje
                              </span>
                              {isToday && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 sm:px-3 py-1 rounded-full">
                                  Danas
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="hidden sm:block w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 font-medium">Nema zakazanih časova za ovu nedelju.</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">Vaš instruktor će vas kontaktirati za zakazivanje.</p>
                </div>
              )}
            </div>

            {/* Testovi sekcija */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Tvoji testovi</h2>
              </div>
              <TestsList />
            </div>

            {/* Recent tests */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Nedavno urađeni testovi</h2>
              </div>
              <RecentTests />
            </div>
          </div>
        );

      case "Podesavanja":
        return (
          <div className="animate-fadeIn">
            <Settings2 />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Protected allowedRoles={["student"]}>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-bold text-lg text-slate-800">AutoŠkola Šampion</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="font-bold text-base text-slate-800">AutoŠkola Šampion</h1>
                </div>
                
                <hr className="border-slate-100 mb-6" />
                
                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveSection("Pocetna");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'Pocetna'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium flex-1">Početna</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveSection("Podesavanja");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'Podesavanja'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium flex-1">Podešavanja</span>
                  </button>
                </nav>

                {studentData && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Prijavljeni kao</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{studentData?.email}</p>
                  </div>
                )}

                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className='w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 px-3 transition-all duration-200 disabled:opacity-50 shadow-md'
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
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-xl text-slate-800">AutoŠkola Šampion</h1>
            </div>
            
            <hr className="border-slate-100 mb-6" />
            
            <nav className="flex-1 space-y-2">
              <button
                onClick={() => setActiveSection("Pocetna")}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'Pocetna'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium flex-1">Početna</span>
                {activeSection === 'Pocetna' && <ChevronRight className="w-4 h-4 text-white/70" />}
              </button>
              
              <button
                onClick={() => setActiveSection("Podesavanja")}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'Podesavanja'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium flex-1">Podešavanja</span>
                {activeSection === 'Podesavanja' && <ChevronRight className="w-4 h-4 text-white/70" />}
              </button>
            </nav>

            {studentData && (
              <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Prijavljeni kao</p>
                <p className="font-semibold text-slate-800 truncate">{studentData?.email}</p>
              </div>
            )}

            <button
              onClick={logout}
              disabled={loggingOut}
              className='w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 px-3 transition-all duration-200 disabled:opacity-50 shadow-md hover:from-blue-700 hover:to-indigo-700'
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Protected>
  );
};

export default StudentDashboard;