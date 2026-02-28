'use client';

import Protected from "../../Components/Protected";
import { deleteUser, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { addDoc, collection, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { CarFront, Settings, Users, Car, School, UsersRound, User, Lock, Trash2, Mail, Shield, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import TestCreator from "../../Components/TestCreator";
import { useRouter } from "next/navigation";
import SendInvite from "../../Components/SendInvite";
import TestsList from "../../Components/TestsList";

const Page = () => {
    const router = useRouter();

    // ========== STATE VARIJABLE ==========
    // Autoškole
    const [nazivSkole, setNazivSkole] = useState("");
    const [mesto, setMesto] = useState("");
    const [autoSkole, setAutoSkole] = useState<{id: string, naziv: string, mesto: string}[]>([]);

    // Instruktori
    const [instruktori, setInstruktori] = useState<{id: string, fullName: string, email: string, godine: number, autoSkolaId: string}[]>([]);

    // Studenti
    const [studenti, setStudenti] = useState<any[]>([]);
    const [studentError, setStudentError] = useState("");

    // Korisnici
    const [users, setUsers] = useState<{id: string, fullName: string, email: string, role: string, instruktorID: string}[]>([]);
    const [userError, setUserError] = useState("");

    // UI State
    const [activeSection, setActiveSection] = useState<"Glavna" | "Testovi" | "Podesavanja">("Glavna");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    // Delete Account State
    const [deleteConfirm, setDeleteConfirm] = useState("");

    // Current User
    const [currentUser, setCurrentUser] = useState<any>(null);

    // ========== USE EFFECTS ==========
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setCurrentUser({
                    email: user.email,
                    uid: user.uid,
                    fullName: user.displayName
                });
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchAutoSkole = async () => {
            try {
                const snapshot = await getDocs(collection(db, "AutoSkole"));
                setAutoSkole(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as {id: string, naziv: string, mesto: string}[]);
            } catch(err) {
                console.log("Greska pri ucitavanju autoskola:", err);
            }
        };
        fetchAutoSkole();
    }, []);

    useEffect(() => {
        const fetchInstruktori = async () => {
            try {
                const snapshot = await getDocs(collection(db, "Instruktori"));
                const instruktoriData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as { fullName: string; email: string; godine: number; autoSkolaId: string })
                }));
                setInstruktori(instruktoriData);
            } catch(err) {
                setError("Greska pri ucitavanju instruktora: " + err);
            }
        };
        fetchInstruktori();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const snapshot = await getDocs(collection(db, "studenti"));
                const studentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudenti(studentsData);
            } catch(err) {
                setStudentError("Greska pri ucitavanju studenata:" + err);
            }
        };
        fetchStudents();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, "users"));
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as {fullName: string, email: string, role: string, instruktorID: string})
                }));
                setUsers(users);
            } catch (err) {
                setUserError("Greska prilikom ucitavanja korisnika" + err);
            }
        };
        fetchUsers();
    }, []);

    // ========== HELPER FUNKCIJE ==========
    const getAutoSkolaNaziv = (id: string) => {
        const skola = autoSkole.find(s => s.id === id);
        return skola ? skola.naziv : "Nepoznato";
    };

    const getInstruktorIme = (id: string) => {
        const instruktor = instruktori.find(i => i.id === id);
        return instruktor ? instruktor.fullName : "Nepoznato";
    };

    // ========== HANDLER FUNKCIJE ==========
    const handleAutoSkolaAdd = async () => {
        try {
            const docRef = await addDoc(collection(db, "AutoSkole"), {
                naziv: nazivSkole,
                mesto: mesto,
                createdAt: serverTimestamp()
            });
            setMessage("Uspešno ste dodali novu autoškolu!");
            setNazivSkole("");
            setMesto("");   
            setAutoSkole(prev => [...prev, {id: docRef.id, naziv: nazivSkole, mesto}]);
        } catch(error) {
            setError("Greska prilikom dodavanja autoskole. Pokušajte ponovo. " + error);
        }
    };

    const handlePasswordChange = async () => {
        if(newPassword == currentPassword) {
            setPasswordMessage("Lozinka vec u upotrebi.");
            return;
        }
        if(newPassword !== confirmPassword) {
            setPasswordMessage("Lozinke se ne poklapaju");
            return;
        }
        if(newPassword.length < 6) {
            setPasswordMessage("Lozinka mora imati najmanje 6 karaktera");
            return;
        }

        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if(!user) {
                setError("Niste ulogovani");
                return;
            }
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setPasswordMessage("Lozinka uspesno promenjena!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch(error: any) {
            console.error(error);
            switch(error.code) {
                case "auth/wrong-password":
                    setError("Trenutna lozinka nije tačna");
                    break;
                case "auth/weak-password":
                    setError("Lozinka je previše slaba. Koristite najmanje 6 karaktera");
                    break;
                case "auth/requires-recent-login":
                    setError("Molimo vas da se ponovo ulogujete pre promene lozinke");
                    break;
                default:
                    setError("Greška pri promeni lozinke: " + error.message);
            }
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setError("");
            setMessage("");
            const auth = getAuth();
            const user = auth.currentUser!;
            if(!deleteConfirm) {
                setError("Unesite Vasu lozinku za potvrdu brisanja");
                return;
            }
            const credential = EmailAuthProvider.credential(user.email!, deleteConfirm);
            await reauthenticateWithCredential(user, credential);
            const userQuery = await getDocs(collection(db, "users"));
            const userDoc = userQuery.docs.find(doc => doc.data().email === user.email);
            if(userDoc){
                await deleteDoc(doc(db, "users", userDoc.id));
            }
            await deleteUser(user);
            setMessage("Nalog uspesno obrisan. Preusmeravanje...");
            setTimeout(() => window.location.href = "/login", 2000);
        } catch(error: any) {
            console.error(error);
            setDeleteConfirm("");
            if (error.code === "auth/invalid-credential") {
                setError("Pogrešna lozinka");
            } else if (error.code === "auth/requires-recent-login") {
                setError("Molimo ponovo se ulogujte");
            } else {
                setError("Greška pri brisanju naloga" + error);
            }
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // ========== RENDER FUNKCIJE ==========
    const renderStatsCards = () => (
        <div className="grid grid-cols-4 gap-6 mt-10">
            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-gray-700">Ukupno autoškola</h1>
                    <School className="h-10 w-10 p-2 rounded-lg bg-blue-100 text-blue-600" />
                </div>
                <h1 className="font-bold text-3xl mt-4">{autoSkole.length}</h1>
            </div>
            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-gray-700">Ukupno studenata</h1>
                    <UsersRound className="h-10 w-10 p-2 rounded-lg bg-green-100 text-green-600" />
                </div>
                <h1 className="font-bold text-3xl mt-4">{studenti.length}</h1>
            </div>
            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-gray-700">Ukupno instruktora</h1>
                    <Users className="h-10 w-10 p-2 rounded-lg bg-purple-100 text-purple-600" />
                </div>
                <h1 className="font-bold text-3xl mt-4">{instruktori.length}</h1>
            </div>
        </div>
    );

    const renderAutoSkoleSection = () => (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Autoškole</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lista autoškola */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Sve autoškole</h2>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {autoSkole.length} autoškola
                        </span>
                    </div>
                    {autoSkole.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🏫</span>
                            </div>
                            <p className="text-gray-500 text-lg">Nema unetih autoškola</p>
                            <p className="text-gray-400 text-sm mt-1">Dodajte prvu autoškolu</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
                            {autoSkole.map((skola, index) => (
                                <div key={skola.id} className="group flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-blue-50 transition-all duration-200">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 group-hover:text-blue-700">{skola.naziv}</p>
                                            <p className="text-sm text-gray-600">{skola.mesto}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Dodavanje autoškole */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dodaj novu autoškolu</h2>
                    <p className="text-gray-500 mb-6">Unesite podatke o novoj autoškoli</p>
                    <div className="space-y-5">
                        <input type="text" placeholder="Unesite naziv autoškole" value={nazivSkole} onChange={(e) => setNazivSkole(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
                        <input type="text" placeholder="Unesite mesto" value={mesto} onChange={(e) => setMesto(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
                        <button onClick={handleAutoSkolaAdd} disabled={!nazivSkole.trim() || !mesto.trim()} className={`w-full p-3 rounded-xl font-semibold ${nazivSkole.trim() && mesto.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            Dodaj autoškolu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInstruktoriSection = () => (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Instruktori</h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Svi instruktori</h2>
                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                        {instruktori.length} instruktora
                    </span>
                </div>
                {instruktori.length === 0 ? (
                    <div className="text-center py-10">
                        <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Nema unetih instruktora</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-400 overflow-y-auto">
                        {instruktori.map((instruktor, index) => (
                            <div key={instruktor.id} className="border border-gray-200 p-4 rounded-xl hover:bg-purple-50">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center font-semibold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{instruktor.fullName}</p>
                                        <p className="text-sm text-gray-600">{instruktor.email} • {instruktor.godine} god.</p>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-2 inline-block">
                                            {getAutoSkolaNaziv(instruktor.autoSkolaId)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStudentiSection = () => (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Studenti</h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Svi studenti</h2>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        {studenti.length} studenata
                    </span>
                </div>
                {studenti.length === 0 ? (
                    <div className="text-center py-10">
                        <UsersRound className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Nema unetih studenata</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-400 overflow-y-auto">
                        {studenti.map((student, index) => (
                            <div key={student.id} className="border border-gray-200 p-4 rounded-xl hover:bg-green-50">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-green-100 text-green-800 rounded-lg flex items-center justify-center font-semibold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{student.fullName}</p>
                                        <p className="text-sm text-gray-600">{student.email}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                {getAutoSkolaNaziv(student.autoSkolaId)}
                                            </span>
                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                                {getInstruktorIme(student.instruktorId)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderMessages = () => (
        <>
            {message && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-700 font-medium">{message}</p>
                </div>
            )}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}
        </>
    );

    const renderContent = () => {
        switch(activeSection) {
            case "Glavna":
                return (
                    <div>
                        <div>
                            <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                            <p className="text-xl text-gray-500 mt-1">Upravljajte svim autoškolama u sistemu</p>
                        </div>
                        {renderStatsCards()}
                        <div className="mt-10">
                            <SendInvite/>
                        </div>
                        <div>
                            <TestsList />
                        </div>
                        {renderAutoSkoleSection()}
                        {renderInstruktoriSection()}
                        {renderStudentiSection()}
                    </div>
                );
            case "Testovi":
                return <TestCreator/>;
            case "Podesavanja":
                return (
                    <div>
                        <div>
                            <h1 className="text-3xl font-bold">Podešavanja naloga</h1>
                            <p className="text-xl text-gray-500 mt-1">Upravljajte vašim nalogom i sigurnosnim postavkama</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                            {/* Profil */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Moj profil</h2>
                                    <User className="h-10 w-10 p-2 rounded-lg bg-blue-100 text-blue-600" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-lg">{currentUser?.fullName}</p>
                                            <p className="text-gray-600">{currentUser?.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                                            <Mail className="w-5 h-5 text-gray-500 mr-3" />
                                            <div>
                                                <p className="text-sm text-gray-500">Email adresa</p>
                                                <p className="font-medium">{currentUser?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                                            <Shield className="w-5 h-5 text-gray-500 mr-3" />
                                            <div>
                                                <p className="text-sm text-gray-500">Uloga</p>
                                                <p className="font-medium">Super Admin</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sigurnost */}
                            <div className="space-y-8">
                                {/* Promena lozinke */}
                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Promena lozinke</h2>
                                        <Lock className="h-10 w-10 p-2 rounded-lg bg-green-100 text-green-600" />
                                    </div>
                                    <div className="space-y-5">
                                        <input type="password" placeholder="Trenutna lozinka" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3"/>
                                        <input type="password" placeholder="Nova lozinka" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3"/>
                                        <input type="password" placeholder="Potvrdite novu lozinku" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3"/>
                                        <button onClick={handlePasswordChange} disabled={!currentPassword || !newPassword || !confirmPassword} className={`w-full p-3 rounded-xl font-semibold ${currentPassword && newPassword && confirmPassword ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            Promeni lozinku
                                        </button>
                                        {passwordMessage && <p className="text-green-600 text-sm">{passwordMessage}</p>}
                                    </div>
                                </div>

                                {/* Brisanje naloga */}
                                <div className="bg-white border border-red-200 rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Brisanje naloga</h2>
                                        <Trash2 className="h-10 w-10 p-2 rounded-lg bg-red-100 text-red-600" />
                                    </div>
                                    <div className="space-y-5">
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-700 font-medium">⚠️ Upozorenje: Ova akcija je nepovratna</p>
                                        </div>
                                        <input type="password" placeholder="Unesite lozinku za potvrdu" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3"/>
                                        <button onClick={handleDeleteAccount} disabled={!deleteConfirm} className={`w-full p-3 rounded-xl font-semibold ${deleteConfirm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            Obriši nalog
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {renderMessages()}
                    </div>
                );
        }
    };

    // ========== GLAVNI RETURN ==========
    return (
        <Protected allowedRoles={["superadmin"]}>
            <div className="flex h-screen">
                <aside className="h-screen w-64 p-4 top-0 sticky bg-white border-r border-gray-200">
                    <h1 className="flex gap-2 font-bold text-xl">
                        <Car className="h-7 w-7 p-1 rounded-lg bg-blue-500 text-white"/>
                        AutoŠkola Šampion
                    </h1>
                    <hr className="w-full mt-2"/>
                    <nav className="flex flex-col gap-4 items-start mt-5">
                        <button onClick={() => setActiveSection("Glavna")} className={`flex gap-2 w-full text-left p-2 rounded-lg items-center ${activeSection === 'Glavna' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>
                            <CarFront/> Početna
                        </button>
                        <button onClick={() => setActiveSection("Testovi")} className={`flex gap-2 w-full text-left p-2 rounded-lg items-center ${activeSection === 'Testovi' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>
                            <Users/> Novi Test
                        </button>
                        <button onClick={() => setActiveSection("Podesavanja")} className={`flex gap-2 w-full text-left p-2 rounded-lg items-center ${activeSection === 'Podesavanja' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>
                            <Settings/> Podešavanja
                        </button>
                        <button onClick={logout} className='font-semibold bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 cursor-pointer mt-6 w-full'>
                            Odjavite se
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    {renderContent()}
                </main>
            </div>
        </Protected>
    );
};

export default Page;