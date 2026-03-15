'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db, auth } from '../../../../lib/firebase';
import { addDoc, collection, Timestamp, doc, getDoc } from 'firebase/firestore';
import Protected from '../../../../Components/Protected';
import { 
  Clock, AlertCircle, CheckCircle, XCircle, ArrowRight, 
  Flag, Loader2, Award, BarChart3, ChevronLeft, ChevronRight,
  HelpCircle, BookOpen, FileText, Image as ImageIcon
} from 'lucide-react';

type Option = {
  text: string;
  imageUrl?: string;
};

type Question = {
  question: string;
  imageUrl?: string;
  options: Option[]; // Sada je ovo niz Option objekata, a ne string[]
  correctOptions: number[];
  points: number;
};

type Test = {
  name: string;
  questions: Question[];
};

export default function TestRunner() {
  const { testId } = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answerError, setAnswerError] = useState("");

  // ⏱️ 45 minuta = 2700 sekundi
  const [timeLeft, setTimeLeft] = useState(2700);
  const [timeWarning, setTimeWarning] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'tests', testId as string));
        if (snap.exists()) {
          const data = snap.data() as Test;
          setTest(data);
          setAnswers(Array(data.questions.length).fill([]));
        }
      } catch (error) {
        console.error("Greška pri učitavanju testa:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  // ⏳ Tajmer
  useEffect(() => {
    if (finished || !test) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 60) setTimeWarning(true);
        
        if (prev <= 1) {
          clearInterval(interval);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [finished, test]);

  if (loading) {
    return (
      <Protected allowedRoles={['superadmin','instruktor', 'student']}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </div>
              <p className="text-slate-600 font-medium text-lg">Učitavanje testa...</p>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  if (!test) {
    return (
      <Protected allowedRoles={['superadmin','instruktor', 'student']}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Test nije pronađen</h2>
            <p className="text-slate-600 mb-6">Izgleda da test koji tražite ne postoji.</p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Nazad</span>
            </button>
          </div>
        </div>
      </Protected>
    );
  }

  const question = test.questions[current];
  const answeredCount = answers.filter(a => a.length > 0).length;
  const progress = ((current + 1) / test.questions.length) * 100;

  // ⏱️ format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Vremenska boja
  const timeColor = timeLeft < 60 ? 'text-red-600' : timeLeft < 300 ? 'text-amber-600' : 'text-green-600';

  const toggleOption = (index: number) => {
    setAnswerError(""); // Resetuj grešku kada korisnik odabere opciju
    setAnswers((prev) => {
      const copy = [...prev];
      if (copy[current].includes(index)) {
        copy[current] = copy[current].filter((i) => i !== index);
      } else {
        copy[current] = [...copy[current], index];
      }
      return copy;
    });
  };

  const nextQuestion = () => {
    // Provera da li je odgovoreno na trenutno pitanje
    if (answers[current].length === 0) {
      setAnswerError("Morate odabrati bar jedan odgovor pre nego što nastavite.");
      return;
    }

    if (current < test.questions.length - 1) {
      setCurrent((c) => c + 1);
      setAnswerError(""); // Resetuj grešku
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishTest();
    }
  };

  const prevQuestion = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setAnswerError(""); // Resetuj grešku
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const finishTest = async () => {
    if (!test) return;

    // Provera da li je odgovoreno na poslednje pitanje
    if (answers[current].length === 0) {
      setAnswerError("Morate odabrati bar jedan odgovor pre nego što završite test.");
      return;
    }

    setSaving(true);

    let total = 0;

    test.questions.forEach((q, i) => {
      const selected = [...answers[i]].sort().join(',');
      const correct = [...q.correctOptions].sort().join(',');
      if (selected === correct) {
        total += q.points;
      }
    });

    setScore(total);
    setFinished(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      // Izračunaj maksimalni broj poena
      const maxScore = test.questions.reduce((sum, q) => sum + q.points, 0);

      await addDoc(collection(db, 'testHistory'), {
        userId: user.uid,
        testId: testId,
        answers: answers.map(a => ({ selected: a })),
        score: total,
        maxScore: maxScore,
        createdAt: now,
        expiresAt,
      });
      
      console.log("Test sačuvan:", { total, maxScore });
    } catch (err) {
      console.error('Greška pri snimanju testa:', err);
    } finally {
      setSaving(false);
    }
  };

  if (finished) {
    const maxPoints = test.questions.reduce((sum, q) => sum + q.points, 0);
    const percent = (score / maxPoints) * 100;
    const passed = percent >= 85;

    return (
      <Protected allowedRoles={['superadmin','instruktor', 'student']}>
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Header sa rezultatom */}
              <div className={`p-8 text-center ${
                passed ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'
              }`}>
                {passed ? (
                  <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
                ) : (
                  <XCircle className="w-20 h-20 text-white mx-auto mb-4" />
                )}
                <h1 className="text-3xl font-bold text-white mb-2">
                  {passed ? 'Čestitamo!' : 'Nažalost'}
                </h1>
                <p className="text-white text-lg opacity-90">
                  {passed ? 'Položili ste test!' : 'Pali ste test'}
                </p>
              </div>

              {/* Statistika */}
              <div className="p-8">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Osvojeno poena</p>
                    <p className="text-3xl font-bold text-slate-800">{score}</p>
                    <p className="text-xs text-slate-400">od {maxPoints}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Uspešnost</p>
                    <p className="text-3xl font-bold text-slate-800">{percent.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">potrebno 85%</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Potrebno za prolaz</span>
                    <span className="font-semibold">{percent >= 85 ? '✅ Dostignuto' : '❌ Nije dostignuto'}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        passed ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>0%</span>
                    <span>85%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Poruka */}
                <div className={`p-6 rounded-xl mb-8 ${
                  passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-center font-medium ${
                    passed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {passed 
                      ? 'Odličan rezultat! Možete nastaviti sa daljom obukom.' 
                      : 'Potrebno je dodatno vežbanje. Minimum 85% za prolaz.'}
                  </p>
                </div>

                {/* Dugmad */}
                
<div className="flex flex-col sm:flex-row gap-4">
  <button
    onClick={async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          window.location.href = '/login';
          return;
        }

        // Dohvati ulogu iz Firestore-a
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role; // Pretpostavka da je polje 'role'
          
          // Preusmeri na osnovu uloge
          switch (role) {
            case 'superadmin':
              window.location.href = '/superadmin';
              break;
            case 'instruktor':
              window.location.href = '/instruktor-panel';
              break;
            case 'student':
            default:
              window.location.href = '/student/dashboard';
              break;
          }
        } else {
          // Ako nema dokumenta, podrazumevano na login
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Greška pri preusmeravanju:', error);
        window.location.href = '/login';
      }
    }}
    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-semibold"
  >
    Nazad na početnu
  </button>
</div>
              </div>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected allowedRoles={['superadmin','instruktor', 'student']}>
      <div className="min-h-screen bg-slate-50 py-4 sm:py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header sa informacijama */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{test.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <BookOpen className="w-4 h-4" />
                    {test.questions.length} pitanja
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Award className="w-4 h-4" />
                    {test.questions.reduce((sum, q) => sum + q.points, 0)} poena
                  </span>
                </div>
              </div>
              
              {/* Tajmer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                timeLeft < 60 ? 'border-red-200 bg-red-50' : 'border-slate-200'
              }`}>
                <Clock className={`w-5 h-5 ${timeColor}`} />
                <span className={`font-mono font-bold ${timeColor}`}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Napredak: {current + 1}/{test.questions.length}</span>
                <span>Odgovoreno: {answeredCount}/{test.questions.length}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Upozorenje za vreme */}
            {timeWarning && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Pažnja! Imate manje od jednog minuta do kraja testa.
                </p>
              </div>
            )}
          </div>

          {/* Pitanje */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            {/* Broj pitanja i bodovi */}
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                <HelpCircle className="w-4 h-4" />
                Pitanje {current + 1} / {test.questions.length}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm">
                <Award className="w-4 h-4" />
                {question.points} {question.points === 1 ? 'bod' : 'boda'}
              </span>
            </div>

            {/* Tekst pitanja */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">
              {question.question}
            </h2>

            {/* Slika ako postoji */}
            {question.imageUrl && (
              <div className="mb-6">
                <div className="relative group">
                  <img
                    src={question.imageUrl}
                    alt="Pitanje"
                    className="w-full max-h-80 object-contain rounded-xl border-2 border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">Klikni za uvećanje</span>
                  </div>
                </div>
              </div>
            )}

            {/* Opcije - sada podržavaju i tekst i sliku */}
            {/* Opcije - sada podržavaju i tekst i sliku */}
<div className="space-y-3 mb-8">
  {question.options.map((opt, i) => {
    const isSelected = answers[current].includes(i);
    
    return (
      <label
        key={i}
        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleOption(i)}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
          {opt.imageUrl ? (
            <div className="flex-shrink-0">
              <img 
                src={opt.imageUrl} 
                alt={`Opcija ${i + 1}`}
                className="w-full sm:w-48 h-32 object-cover rounded-lg border-2 border-slate-200 shadow-sm"
              />
            </div>
          ) : null}
          <span className={`text-base sm:text-lg ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-700'}`}>
            {opt.text || `Opcija ${i + 1}`}
          </span>
        </div>
        {isSelected && (
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        )}
      </label>
    );
  })}
</div>

            {/* Poruka o grešci ako nije odabran odgovor */}
            {answerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{answerError}</p>
              </div>
            )}

            {/* Navigacija */}
            <div className="flex flex-col sm:flex-row gap-3">
              {current > 0 && (
                <button
                  onClick={prevQuestion}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prethodno
                </button>
              )}
              
              <button
                onClick={nextQuestion}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  current === test.questions.length - 1
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20'
                }`}
              >
                {current === test.questions.length - 1 ? (
                  <>
                    <Flag className="w-4 h-4" />
                    <span>Završi test</span>
                  </>
                ) : (
                  <>
                    <span>Sledeće pitanje</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Indikator pitanja */}
            <div className="mt-6 flex justify-center gap-2">
              {test.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (answers[i].length > 0 || i === current) {
                      setCurrent(i);
                      setAnswerError("");
                    }
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                    i === current
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110'
                      : answers[i].length > 0
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  disabled={answers[i].length === 0 && i !== current}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Saving overlay */}
          {saving && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-lg font-medium text-slate-800">Čuvanje rezultata...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}