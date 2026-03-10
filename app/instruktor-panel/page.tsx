'use client';

import React, { useEffect, useState } from 'react'
import { Car, CarFront, Settings, Users, CalendarDays, Plus, Clock, User, Calendar, ChevronRight, MoreVertical, X, Trash2, Edit, Check, AlertCircle, LogOut, LayoutDashboard, Menu, Bell, Search } from 'lucide-react'
import Protected from '../../Components/Protected'
import Settings2 from '../../Components/Settings';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TestsList from '../../Components/TestsList';

const Page = () => {
    const [activeSection, setActiveSection] = useState<"Glavna" | "Podesavanja">("Glavna");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [instructorData, setInstructorData] = useState<any>(null);

    // STUDENTI I CASOVI - filtrirani po instruktoru
    const [myStudents, setMyStudents] = useState<any[]>([]);
    const [myLessons, setMyLessons] = useState<any[]>([]);

    // MODAL ZA DODAVANJE
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // MODAL ZA EDITOVANJE
    const [editModal, setEditModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState<any>(null);
    const [editStudent, setEditStudent] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");

    // DROPDOWN MENI
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // KONFIRMACIJA ZA BRISANJE
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser({
                    email: user.email!,
                    uid: user.uid,
                    fullName: user.displayName || user.email?.split('@')[0]
                });

                // Fetch instructor data from Instruktori collection
                try {
                    const instruktorQuery = query(
                        collection(db, "Instruktori"),
                        where("email", "==", user.email)
                    );
                    const instruktorSnapshot = await getDocs(instruktorQuery);
                    
                    if (!instruktorSnapshot.empty) {
                        const instruktorDoc = instruktorSnapshot.docs[0];
                        setInstructorData({
                            id: instruktorDoc.id,
                            ...instruktorDoc.data()
                        });
                    }
                } catch (error) {
                    console.error("Greška pri učitavanju instruktora:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        router.push("/")
    }

    // FETCH MY STUDENTS - samo studenti koji imaju ovog instruktora
    useEffect(() => {
        const fetchMyStudents = async () => {
            if (!instructorData?.id) return;

            try {
                const studentsQuery = query(
                    collection(db, "studenti"),
                    where("instruktorId", "==", instructorData.id)
                );
                const snapshot = await getDocs(studentsQuery);
                setMyStudents(snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                })));
            } catch (error) {
                console.error("Greška pri učitavanju studenata:", error);
            }
        };

        if (instructorData?.id) {
            fetchMyStudents();
        }
    }, [instructorData]);

    // FETCH MY LESSONS - samo časovi ovog instruktora
    useEffect(() => {
        const fetchMyLessons = async () => {
            if (!currentUser?.uid) return;

            try {
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("instructorId", "==", currentUser.uid)
                );
                const snapshot = await getDocs(lessonsQuery);
                setMyLessons(snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                })));
            } catch (error) {
                console.error("Greška pri učitavanju časova:", error);
            }
        };

        if (currentUser?.uid) {
            fetchMyLessons();
        }
    }, [currentUser]);

    const today = new Date().toISOString().split("T")[0];

    const lessonsToday = myLessons.filter(l => l.date === today).length;

    const lessonsThisWeek = myLessons.filter(l => {
        const lessonDate = new Date(l.date);
        const now = new Date();
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(now.setDate(firstDay.getDate() + 6));
        return lessonDate >= firstDay && lessonDate <= lastDay;
    }).length;

    const handleAddLesson = async () => {
        if (!selectedStudent || !date || !startTime || !endTime || !currentUser?.uid) return;

        const newLesson = {
            studentId: selectedStudent,
            date,
            startTime,
            endTime,
            instructorId: currentUser.uid,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "lessons"), newLesson);
        setMyLessons(prev => [...prev, { id: docRef.id, ...newLesson }]);
        setOpenModal(false);
        setSelectedStudent("");
        setDate("");
        setStartTime("");
        setEndTime("");
    };

    const handleDeleteLesson = async (lessonId: string) => {
        try {
            await deleteDoc(doc(db, "lessons", lessonId));
            setMyLessons(prev => prev.filter(l => l.id !== lessonId));
            setDeleteConfirm(null);
            setOpenDropdown(null);
        } catch (error) {
            console.error("Greška pri brisanju časa:", error);
        }
    };

    const handleEditLesson = (lesson: any) => {
        setEditingLesson(lesson);
        setEditStudent(lesson.studentId);
        setEditDate(lesson.date);
        setEditStartTime(lesson.startTime);
        setEditEndTime(lesson.endTime);
        setEditModal(true);
        setOpenDropdown(null);
    };

    const handleUpdateLesson = async () => {
        if (!editingLesson || !editStudent || !editDate || !editStartTime || !editEndTime) return;

        try {
            const lessonRef = doc(db, "lessons", editingLesson.id);
            const updatedData = {
                studentId: editStudent,
                date: editDate,
                startTime: editStartTime,
                endTime: editEndTime,
            };

            await updateDoc(lessonRef, updatedData);
            
            setMyLessons(prev => prev.map(l => 
                l.id === editingLesson.id ? { ...l, ...updatedData } : l
            ));
            
            setEditModal(false);
            setEditingLesson(null);
        } catch (error) {
            console.error("Greška pri ažuriranju časa:", error);
        }
    };

    // Sortiranje časova po datumu i vremenu
    const sortedLessons = [...myLessons].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
    });

    // Grupisanje časova po datumu
    const groupedLessons = sortedLessons.reduce((groups: any, lesson) => {
        const date = lesson.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(lesson);
        return groups;
    }, {});

    const renderContent = () => {
        switch (activeSection) {
            case "Glavna":
                return (
                    <div className="max-w-7xl mx-auto">
                        {/* HEADER SA DOBRODOŠLICOM */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Dobrodošli, {currentUser?.fullName || currentUser?.email}</h1>
                                    <p className="text-sm sm:text-base text-slate-500 mt-1">Vaša kontrolna tabla instruktora</p>
                                </div>
                                
                                {/* Notifikacije */}
                                <div className="flex items-center gap-3">
                                    <button className="p-2 sm:p-2.5 bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors relative">
                                        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* STAT CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                            <div className="group bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-blue-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-bl-full"></div>
                                <div className="flex justify-between items-center relative">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500">Moji studenti</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 sm:mt-2">{myStudents.length}</h3>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Aktivni studenti</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                    <span className="text-xs sm:text-sm text-slate-600">
                                        {myStudents.length > 0 ? `➕ ${myStudents.length} studenata` : '➕ Još uvek nema studenata'}
                                    </span>
                                </div>
                            </div>

                            <div className="group bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-green-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-600/5 to-emerald-600/5 rounded-bl-full"></div>
                                <div className="flex justify-between items-center relative">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500">Časovi danas</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 sm:mt-2">{lessonsToday}</h3>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                                            {lessonsToday > 0 ? 'Sledeći čas u 14:30' : 'Danas nema časova'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-600/20 group-hover:scale-110 transition-transform duration-300">
                                        <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                    <span className={`text-xs sm:text-sm ${lessonsToday > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                        {lessonsToday > 0 ? '✅ Aktivno' : '⏸️ Pauza'}
                                    </span>
                                </div>
                            </div>

                            <div className="group bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-purple-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-bl-full"></div>
                                <div className="flex justify-between items-center relative">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500">Časovi ove nedelje</p>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 sm:mt-2">{lessonsThisWeek}</h3>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Od ponedeljka do petka</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform duration-300">
                                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                    <span className="text-xs sm:text-sm text-slate-600">📊 Nedeljni pregled</span>
                                </div>
                            </div>
                        </div>

                        {/* MOJI STUDENTI - lista sa linkom na profil */}
                        {myStudents.length > 0 && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 mt-4 sm:mt-6 p-4 sm:p-5">
                                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-3 sm:mb-4">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Moji studenti
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {myStudents.map((s) => (
                                        <Link
                                            key={s.id}
                                            href={`/user/${s.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            {s.fullName || 'Student'}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RASPORED */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 mt-6 sm:mt-8 overflow-hidden">
                            <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        Raspored časova
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Pregled svih zakazanih časova</p>
                                </div>
                                <button
                                    onClick={() => setOpenModal(true)}
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-xl"
                                >
                                    <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                                    <span>Dodaj čas</span>
                                </button>
                            </div>

                            <div className="p-4 sm:p-5 lg:p-6">
                                {Object.keys(groupedLessons).length === 0 ? (
                                    <div className="text-center py-12 sm:py-16">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                                        </div>
                                        <p className="text-base sm:text-lg text-slate-600 font-medium">Nema zakazanih časova</p>
                                        <p className="text-xs sm:text-sm text-slate-400 mt-2">Kliknite na "Dodaj čas" da zakažete prvi čas</p>
                                        <button
                                            onClick={() => setOpenModal(true)}
                                            className="mt-4 sm:mt-6 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Zakaži prvi čas</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 sm:space-y-8">
                                        {Object.entries(groupedLessons).map(([date, dayLessons]: [string, any]) => {
                                            const isToday = date === today;
                                            const dayName = new Date(date).toLocaleDateString('sr-RS', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            });
                                            
                                            return (
                                                <div key={date} className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isToday ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                        <h3 className={`text-sm sm:text-base font-semibold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {dayName}
                                                        </h3>
                                                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                                                            isToday 
                                                                ? 'bg-blue-100 text-blue-700' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {dayLessons.length} {dayLessons.length === 1 ? 'čas' : 'časova'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid gap-2 sm:gap-3 pl-3 sm:pl-5">
                                                        {dayLessons.map((lesson: any) => {
                                                            const student = myStudents.find(s => s.id === lesson.studentId);
                                                            const isCurrentLesson = lesson.date === today;
                                                            
                                                            return (
                                                                <div key={lesson.id} className="relative">
                                                                    <div 
                                                                        className={`group relative flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                                                            isCurrentLesson 
                                                                                ? 'border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50' 
                                                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                                                                                isCurrentLesson ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-slate-100'
                                                                            }`}>
                                                                                <User className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                                                                    isCurrentLesson ? 'text-white' : 'text-slate-600'
                                                                                }`} />
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                                                                    {student?.fullName || "Student"}
                                                                                </p>
                                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                                                                    <div className="flex items-center gap-1 text-slate-500">
                                                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                                        <span className="text-[10px] sm:text-xs">{lesson.startTime} - {lesson.endTime}</span>
                                                                                    </div>
                                                                                    {isCurrentLesson && (
                                                                                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                                                                                            Danas
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="relative self-end xs:self-auto mt-2 xs:mt-0">
                                                                            <button 
                                                                                onClick={() => setOpenDropdown(openDropdown === lesson.id ? null : lesson.id)}
                                                                                className="opacity-100 xs:opacity-0 group-hover:opacity-100 transition-all p-1.5 sm:p-2 hover:bg-white/80 rounded-lg"
                                                                            >
                                                                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                                                            </button>
                                                                            
                                                                            {openDropdown === lesson.id && (
                                                                                <>
                                                                                    <div 
                                                                                        className="fixed inset-0 z-40"
                                                                                        onClick={() => setOpenDropdown(null)}
                                                                                    />
                                                                                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg sm:rounded-xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden">
                                                                                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                                                                                            <p className="text-[10px] sm:text-xs font-medium text-slate-500">AKCIJE</p>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => handleEditLesson(lesson)}
                                                                                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                                        >
                                                                                            <Edit size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                                                                                            <span>Izmeni čas</span>
                                                                                        </button>
                                                                                        <Link
                                                                                            href={`/user/${lesson.studentId}`}
                                                                                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-t border-slate-100"
                                                                                        >
                                                                                            <User size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                                                                                            <span>Pogledaj profil</span>
                                                                                        </Link>
                                                                                        {deleteConfirm === lesson.id ? (
                                                                                            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-slate-100">
                                                                                                <p className="text-[10px] sm:text-xs text-slate-500 mb-2">Potvrdi brisanje?</p>
                                                                                                <div className="flex gap-2">
                                                                                                    <button
                                                                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                                                                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:from-red-700 hover:to-rose-700"
                                                                                                    >
                                                                                                        Da
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => setDeleteConfirm(null)}
                                                                                                        className="flex-1 bg-slate-100 text-slate-700 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-slate-200"
                                                                                                    >
                                                                                                        Ne
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button
                                                                                                onClick={() => setDeleteConfirm(lesson.id)}
                                                                                                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                                                                            >
                                                                                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                                                                <span>Obriši čas</span>
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MODAL ZA DODAVANJE */}
                        {openModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-modalIn">
                                    <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                Dodaj novi čas
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">Unesite detalje časa</p>
                                        </div>
                                        <button 
                                            onClick={() => setOpenModal(false)}
                                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                                        </button>
                                    </div>

                                    <div className="p-4 sm:p-5 lg:p-6">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Student</label>
                                                <select
                                                    value={selectedStudent}
                                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                                >
                                                    <option value="">Izaberi studenta</option>
                                                    {myStudents.map(s => (
                                                        <option key={s.id} value={s.id}>{s.fullName}</option>
                                                    ))}
                                                </select>
                                                {myStudents.length === 0 && (
                                                    <p className="text-xs text-amber-600 mt-1">Nemate dodeljenih studenata</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Datum</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Od</label>
                                                    <input
                                                        type="time"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Do</label>
                                                    <input
                                                        type="time"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                                <button
                                                    onClick={() => setOpenModal(false)}
                                                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-xs sm:text-sm text-slate-600"
                                                >
                                                    Otkaži
                                                </button>
                                                <button
                                                    onClick={handleAddLesson}
                                                    disabled={!selectedStudent || !date || !startTime || !endTime || myStudents.length === 0}
                                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                                        selectedStudent && date && startTime && endTime && myStudents.length > 0
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20'
                                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Sačuvaj čas
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODAL ZA EDITOVANJE */}
                        {editModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-modalIn">
                                    <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                Izmeni čas
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">Izmenite detalje časa</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setEditModal(false);
                                                setEditingLesson(null);
                                            }}
                                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                                        </button>
                                    </div>

                                    <div className="p-4 sm:p-5 lg:p-6">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Student</label>
                                                <select
                                                    value={editStudent}
                                                    onChange={(e) => setEditStudent(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                                >
                                                    <option value="">Izaberi studenta</option>
                                                    {myStudents.map(s => (
                                                        <option key={s.id} value={s.id}>{s.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Datum</label>
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Od</label>
                                                    <input
                                                        type="time"
                                                        value={editStartTime || ""}
                                                        onChange={(e) => setEditStartTime(e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Do</label>
                                                    <input
                                                        type="time"
                                                        value={editEndTime || ""}
                                                        onChange={(e) => setEditEndTime(e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                                <button
                                                    onClick={() => {
                                                        setEditModal(false);
                                                        setEditingLesson(null);
                                                    }}
                                                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-xs sm:text-sm text-slate-600"
                                                >
                                                    Otkaži
                                                </button>
                                                <button
                                                    onClick={handleUpdateLesson}
                                                    disabled={!editStudent || !editDate || !editStartTime || !editEndTime}
                                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                                        editStudent && editDate && editStartTime && editEndTime
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20'
                                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Sačuvaj izmene
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Testovi sekcija */}
                        <div className="mt-6 sm:mt-8">
                            <TestsList/>
                        </div>
                    </div>
                );

            case "Podesavanja":
                return (
                    <div className="animate-fadeIn">
                        <Settings2/>
                    </div>
                );
        }
    };

    return (
        <Protected allowedRoles={["instruktor"]}>
            <div className="min-h-screen bg-slate-50">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b border-slate-200 p-3 sm:p-4 sticky top-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h1 className="font-bold text-sm sm:text-base text-slate-800">AutoŠkola Šampion</h1>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                        <div className="absolute left-0 top-0 h-full w-64 sm:w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                        <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h1 className="font-bold text-sm sm:text-base text-slate-800">AutoŠkola Šampion</h1>
                                </div>
                                
                                {currentUser && (
                                    <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border border-slate-200">
                                        <p className="text-[10px] sm:text-xs text-slate-500 mb-1">Prijavljeni kao</p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{currentUser.email}</p>
                                    </div>
                                )}
                                
                                <nav className="space-y-1 sm:space-y-2">
                                    <button
                                        onClick={() => {
                                            setActiveSection("Glavna");
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200 ${
                                            activeSection === 'Glavna'
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <LayoutDashboard size={18} className="sm:w-5 sm:h-5" />
                                        <span className="font-medium">Početna</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setActiveSection("Podesavanja");
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200 ${
                                            activeSection === 'Podesavanja'
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Settings size={18} className="sm:w-5 sm:h-5" />
                                        <span className="font-medium">Podešavanja</span>
                                    </button>

                                    <div className="border-t border-slate-200 my-3 sm:my-4"></div>

                                    <button
                                        onClick={logout}
                                        className='flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200'
                                    >
                                        <LogOut size={18} className="sm:w-5 sm:h-5" />
                                        <span className="font-medium">Odjavite se</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Sidebar */}
                <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 xl:w-72 bg-white border-r border-slate-200 shadow-lg">
                    <div className="p-5 xl:p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 xl:gap-3 mb-5 xl:mb-6">
                            <div className="w-10 h-10 xl:w-12 xl:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Car className="w-5 h-5 xl:w-6 xl:h-6 text-white" />
                            </div>
                            <h1 className="font-bold text-base xl:text-xl text-slate-800">AutoŠkola Šampion</h1>
                        </div>
                        
                        <hr className="border-slate-100 mb-5 xl:mb-6" />

                        <nav className="flex-1 space-y-1 xl:space-y-2">
                            <button
                                onClick={() => setActiveSection("Glavna")}
                                className={`flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base transition-all duration-200 ${
                                    activeSection === 'Glavna'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <LayoutDashboard size={20} className="xl:w-5 xl:h-5" />
                                <span className="font-medium flex-1">Početna</span>
                                <ChevronRight size={16} className="xl:w-4 xl:h-4 text-white/70" />
                            </button>

                            <button
                                onClick={() => setActiveSection("Podesavanja")}
                                className={`flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base transition-all duration-200 ${
                                    activeSection === 'Podesavanja'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Settings size={20} className="xl:w-5 xl:h-5" />
                                <span className="font-medium flex-1">Podešavanja</span>
                                <ChevronRight size={16} className="xl:w-4 xl:h-4 text-white/70" />
                            </button>
                        </nav>

                        {currentUser && (
                            <div className="mt-auto pt-5 xl:pt-6 border-t border-slate-200">
                                <div className="p-3 xl:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg xl:rounded-xl border border-slate-200">
                                    <p className="text-[10px] xl:text-xs text-slate-500 mb-1">Prijavljeni kao</p>
                                    <p className="text-xs xl:text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                                        <User className="w-3 h-3 xl:w-4 xl:h-4 text-blue-600" />
                                        {currentUser.email}
                                    </p>
                                    <button 
                                        onClick={logout} 
                                        className='w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg xl:rounded-xl p-2 xl:p-3 text-xs xl:text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mt-3 xl:mt-4 shadow-md'
                                    >
                                        <LogOut size={16} className="xl:w-4 xl:h-4" />
                                        <span>Odjavite se</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:ml-64 xl:ml-72">
                    <div className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>

            <style jsx>{`
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-modalIn {
                    animation: modalIn 0.3s ease-out;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
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
            `}</style>
        </Protected>
    );
};

export default Page;