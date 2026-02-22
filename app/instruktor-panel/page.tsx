'use client';

import React, { useEffect, useState } from 'react'
import { Car, CarFront, Settings, Users, CalendarDays, Plus, Clock, User, Calendar, ChevronRight, MoreVertical, X, Trash2, Edit, Check, AlertCircle } from 'lucide-react'
import Protected from '../../Components/Protected'
import Settings2 from '../../Components/Settings';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import TestsList from '../../Components/TestsList';

const Page = () => {
    const [activeSection, setActiveSection] = useState<"Glavna" | "Podesavanja">("Glavna");
    const [currentUser, setCurrentUser] = useState<any>(null);

    // STUDENTI I CASOVI
    const [students, setStudents] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);

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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser({
                    email: user.email!,
                    uid: user.uid,
                    fullName: user.displayName || user.email?.split('@')[0]
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        router.push("/")
    }

    // FETCH STUDENTS
    useEffect(() => {
        const fetchStudents = async () => {
            const snapshot = await getDocs(collection(db, "studenti"));
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchStudents();
    }, []);

    // FETCH LESSONS
    useEffect(() => {
        const fetchLessons = async () => {
            const snapshot = await getDocs(collection(db, "lessons"));
            setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchLessons();
    }, []);

    const today = new Date().toISOString().split("T")[0];

    const lessonsToday = lessons.filter(l => l.date === today).length;

    const lessonsThisWeek = lessons.filter(l => {
        const lessonDate = new Date(l.date);
        const now = new Date();
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(now.setDate(firstDay.getDate() + 6));
        return lessonDate >= firstDay && lessonDate <= lastDay;
    }).length;

    const handleAddLesson = async () => {
        if (!selectedStudent || !date || !startTime || !endTime) return;

        const newLesson = {
            studentId: selectedStudent,
            date,
            startTime,
            endTime,
            instructorId: currentUser.uid,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "lessons"), newLesson);
        setLessons(prev => [...prev, { id: docRef.id, ...newLesson }]);
        setOpenModal(false);
        setSelectedStudent("");
        setDate("");
        setStartTime("");
        setEndTime("");
    };

    const handleDeleteLesson = async (lessonId: string) => {
        try {
            await deleteDoc(doc(db, "lessons", lessonId));
            setLessons(prev => prev.filter(l => l.id !== lessonId));
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
            
            setLessons(prev => prev.map(l => 
                l.id === editingLesson.id ? { ...l, ...updatedData } : l
            ));
            
            setEditModal(false);
            setEditingLesson(null);
        } catch (error) {
            console.error("Greška pri ažuriranju časa:", error);
        }
    };

    // Sortiranje časova po datumu i vremenu
    const sortedLessons = [...lessons].sort((a, b) => {
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
                        {/* HEADER */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">Dobrodošli, {currentUser?.fullName || currentUser?.email}</h1>
                            <p className="text-gray-500 mt-1">Vaša kontrolna tabla instruktora</p>
                        </div>

                        {/* STAT CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Moji studenti</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{students.length}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-500">
                                    <span className="text-green-500 font-semibold">+{students.length}</span> ukupno
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Časovi danas</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{lessonsToday}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <CalendarDays className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-500">
                                    {lessonsToday > 0 ? (
                                        <span className="text-green-500 font-semibold">Aktivno</span>
                                    ) : (
                                        <span className="text-gray-400">Nema časova</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Časovi ove nedelje</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{lessonsThisWeek}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-500">
                                    <span className="text-purple-500 font-semibold">Nedeljni pregled</span>
                                </div>
                            </div>
                        </div>

                        {/* RASPORED */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Raspored časova</h2>
                                    <p className="text-sm text-gray-500 mt-1">Pregled svih zakazanih časova</p>
                                </div>
                                <button
                                    onClick={() => setOpenModal(true)}
                                    className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/20"
                                >
                                    <Plus size={18} /> 
                                    <span>Dodaj čas</span>
                                </button>
                            </div>

                            <div className="p-6">
                                {Object.keys(groupedLessons).length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg">Nema zakazanih časova</p>
                                        <p className="text-gray-400 text-sm mt-1">Kliknite na "Dodaj čas" da zakažete prvi čas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(groupedLessons).map(([date, dayLessons]: [string, any]) => (
                                            <div key={date} className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <h3 className="font-semibold text-gray-700">
                                                        {new Date(date).toLocaleDateString('sr-RS', { 
                                                            weekday: 'long', 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                    </h3>
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                        {dayLessons.length} časova
                                                    </span>
                                                </div>
                                                
                                                <div className="grid gap-3 pl-5">
                                                    {dayLessons.map((lesson: any, i: number) => {
                                                        const student = students.find(s => s.id === lesson.studentId);
                                                        const isToday = lesson.date === today;
                                                        
                                                        return (
                                                            <div key={lesson.id} className="relative">
                                                                <div 
                                                                    className={`group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                                                        isToday 
                                                                            ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50' 
                                                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                                            isToday ? 'bg-blue-100' : 'bg-gray-100'
                                                                        }`}>
                                                                            <User className={`w-5 h-5 ${
                                                                                isToday ? 'text-blue-600' : 'text-gray-600'
                                                                            }`} />
                                                                        </div>
                                                                        
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                                                {student?.fullName || "Student"}
                                                                            </p>
                                                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                                                <div className="flex items-center gap-1 text-gray-500">
                                                                                    <Clock className="w-4 h-4" />
                                                                                    <span>{lesson.startTime} - {lesson.endTime}</span>
                                                                                </div>
                                                                                {isToday && (
                                                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                                                        Danas
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="relative">
                                                                        <button 
                                                                            onClick={() => setOpenDropdown(openDropdown === lesson.id ? null : lesson.id)}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                                                                        >
                                                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                                                        </button>
                                                                        
                                                                        {openDropdown === lesson.id && (
                                                                            <>
                                                                                <div 
                                                                                    className="fixed inset-0 z-40"
                                                                                    onClick={() => setOpenDropdown(null)}
                                                                                />
                                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
                                                                                    <button
                                                                                        onClick={() => handleEditLesson(lesson)}
                                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                                    >
                                                                                        <Edit size={16} className="text-blue-500" />
                                                                                        <span>Izmeni čas</span>
                                                                                    </button>
                                                                                    {deleteConfirm === lesson.id ? (
                                                                                        <div className="px-4 py-3">
                                                                                            <p className="text-xs text-gray-500 mb-2">Potvrdi brisanje?</p>
                                                                                            <div className="flex gap-2">
                                                                                                <button
                                                                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                                                                    className="flex-1 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600"
                                                                                                >
                                                                                                    Da
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => setDeleteConfirm(null)}
                                                                                                    className="flex-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200"
                                                                                                >
                                                                                                    Ne
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => setDeleteConfirm(lesson.id)}
                                                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                                        >
                                                                                            <Trash2 size={16} />
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
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MODAL ZA DODAVANJE */}
                        {openModal && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Dodaj novi čas</h2>
                                            <p className="text-sm text-gray-500 mt-1">Unesite detalje časa</p>
                                        </div>
                                        <button 
                                            onClick={() => setOpenModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                                                <select
                                                    value={selectedStudent}
                                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                >
                                                    <option value="">Izaberi studenta</option>
                                                    {students.map(s => (
                                                        <option key={s.id} value={s.id}>{s.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Od</label>
                                                    <input
                                                        type="time"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Do</label>
                                                    <input
                                                        type="time"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 mt-6">
                                                <button
                                                    onClick={() => setOpenModal(false)}
                                                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                                                >
                                                    Otkaži
                                                </button>
                                                <button
                                                    onClick={handleAddLesson}
                                                    disabled={!selectedStudent || !date || !startTime || !endTime}
                                                    className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                                        selectedStudent && date && startTime && endTime
                                                            ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Izmeni čas</h2>
                                            <p className="text-sm text-gray-500 mt-1">Izmenite detalje časa</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setEditModal(false);
                                                setEditingLesson(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                                                <select
                                                    value={editStudent}
                                                    onChange={(e) => setEditStudent(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                >
                                                    <option value="">Izaberi studenta</option>
                                                    {students.map(s => (
                                                        <option key={s.id} value={s.id}>{s.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Od</label>
                                                    <input
                                                        type="time"
                                                        value={editStartTime || ""}
                                                        onChange={(e) => setEditStartTime(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Do</label>
                                                    <input
                                                        type="time"
                                                        value={editEndTime || ""}
                                                        onChange={(e) => setEditEndTime(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 mt-6">
                                                <button
                                                    onClick={() => {
                                                        setEditModal(false);
                                                        setEditingLesson(null);
                                                    }}
                                                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                                                >
                                                    Otkaži
                                                </button>
                                                <button
                                                    onClick={handleUpdateLesson}
                                                    disabled={!editStudent || !editDate || !editStartTime || !editEndTime}
                                                    className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                                        editStudent && editDate && editStartTime && editEndTime
                                                            ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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

                        <div>
                            <TestsList/>
                        </div>
                    </div>
                );

            case "Podesavanja":
                return (
                    <Settings2/>
                );
        }
    };

    return (
        <Protected allowedRoles={['superadmin', 'instruktor']}>
            <div className="flex h-screen bg-gray-50">
                <aside className="h-screen w-72 p-6 top-0 sticky bg-white border-r border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-xl text-gray-800">AutoŠkola Šampion</h1>
                    </div>
                    
                    <hr className="border-gray-100 mb-6" />

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveSection("Glavna")}
                            className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                                activeSection === 'Glavna'
                                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <CarFront size={20} />
                            <span className="font-medium flex-1">Početna</span>
                            {activeSection === 'Glavna' && (
                                <ChevronRight size={18} className="text-white/70" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveSection("Podesavanja")}
                            className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 ${
                                activeSection === 'Podesavanja'
                                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Settings size={20} />
                            <span className="font-medium flex-1">Podešavanja</span>
                            {activeSection === 'Podesavanja' && (
                                <ChevronRight size={18} className="text-white/70" />
                            )}
                        </button>
                    </nav>

                    {currentUser && (
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">Prijavljeni kao</p>
                                <p className="font-semibold text-gray-800 truncate">{currentUser.email}</p>
                                <button onClick={logout} className='font-semibold bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 cursor-pointer mt-6'>Odjavite se</button>
                            </div>
                        </div>
                    )}
                </aside>

                <main className="flex-1 p-8 overflow-auto">
                    {renderContent()}
                </main>
            </div>
        </Protected>
    );
};

export default Page;