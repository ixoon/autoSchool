'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Protected from '../../../../Components/Protected';
import { 
  Award, CheckCircle, XCircle, ArrowLeft, Clock, 
  HelpCircle, Image, Loader2, AlertCircle, ChevronRight 
} from 'lucide-react';

type Question = {
  question: string;
  imageUrl?: string;
  options: string[];
  correctOptions: number[];
  points: number;
};

type Test = {
  name: string;
  questions: Question[];
};

type HistoryAnswer = {
  selected: number[];
};

type History = {
  testId: string;
  answers: HistoryAnswer[];
  score: number;
  maxScore: number;
  createdAt?: any;
};

export default function ReviewTest() {
  const { historyId } = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!historyId) return;

      setLoading(true);
      try {
        const historySnap = await getDoc(doc(db, 'testHistory', historyId as string));
        if (!historySnap.exists()) return;

        const historyData = historySnap.data() as History;
        setHistory(historyData);

        const testSnap = await getDoc(doc(db, 'tests', historyData.testId));
        if (testSnap.exists()) {
          setTest(testSnap.data() as Test);
        }
      } catch (error) {
        console.error("Greška pri učitavanju:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [historyId]);

  const calculatePercentage = () => {
    if (!history || !history.maxScore || history.maxScore === 0) return 0;
    return Math.round((history.score / history.maxScore) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getScoreGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-600 to-emerald-600';
    if (percentage >= 60) return 'from-amber-600 to-orange-600';
    return 'from-red-600 to-rose-600';
  };

  const formatDate = () => {
    if (!history?.createdAt) return 'Nepoznato';
    const date = new Date(history.createdAt.seconds * 1000);
    return date.toLocaleDateString('sr-RS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safeScore = history?.score ?? 0;
  const safeMaxScore = history?.maxScore ?? 0;
  const percentage = calculatePercentage();

  if (loading) {
    return (
      <Protected allowedRoles={['superadmin','instruktor','student']}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </div>
              <p className="text-slate-600 font-medium text-lg">Učitavanje pregleda testa...</p>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  if (!test || !history) {
    return (
      <Protected allowedRoles={['superadmin','instruktor','student']}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Test nije pronađen</h2>
            <p className="text-slate-600 mb-6">Izgleda da test koji tražite ne postoji ili je obrisan.</p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Nazad</span>
            </button>
          </div>
        </div>
      </Protected>
    );
  }

  const scoreColor = getScoreColor(percentage);
  const scoreGradient = getScoreGradient(percentage);

  return (
    <Protected allowedRoles={['superadmin','instruktor','student']}>
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Navigacija */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Nazad na istoriju testova</span>
          </button>

          {/* Header kartica */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  {test.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    {formatDate()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Rezultat */}
                <div className={`px-6 py-3 rounded-xl bg-gradient-to-br ${scoreGradient} text-white shadow-lg`}>
                  <p className="text-xs font-medium opacity-90">Osvojeno poena</p>
                  <p className="text-2xl font-bold">
                    {safeScore} / {safeMaxScore}
                  </p>
                </div>

                {/* Procenat */}
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-slate-200"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={!isNaN(percentage) ? `${2 * Math.PI * 36 * (1 - percentage / 100)}` : `${2 * Math.PI * 36}`}
                      className={percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-bold ${scoreColor}`}>
                      {!isNaN(percentage) ? `${percentage}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistika */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tačnih odgovora</p>
                  <p className="text-lg font-bold text-slate-800">
                    {test.questions.reduce((acc, q, i) => {
                      const selected = history.answers?.[i]?.selected ?? [];
                      const isCorrect = q.correctOptions.every(opt => selected.includes(opt)) && 
                                      selected.length === q.correctOptions.length;
                      return acc + (isCorrect ? 1 : 0);
                    }, 0)} / {test.questions.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Osvojeno poena</p>
                  <p className="text-lg font-bold text-slate-800">{safeScore}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Maksimalno poena</p>
                  <p className="text-lg font-bold text-slate-800">{safeMaxScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pregled pitanja */}
          <div className="space-y-6">
            {test.questions.map((q, qi) => {
              const selected = history.answers?.[qi]?.selected ?? [];
              const isCorrect = q.correctOptions.every(opt => selected.includes(opt)) && 
                              selected.length === q.correctOptions.length;
              const questionPoints = isCorrect ? q.points : 0;

              return (
                <div 
                  key={qi} 
                  className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Header pitanja */}
                  <div className={`p-5 border-b flex items-center justify-between ${
                    isCorrect ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50' : 'border-red-200 bg-gradient-to-r from-red-50/50 to-rose-50/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCorrect ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-red-600 to-rose-600'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-800">
                          Pitanje {qi + 1}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {q.points} {q.points === 1 ? 'bod' : 'boda'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-semibold ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {questionPoints} / {q.points} poena
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Tekst pitanja */}
                    <div className="mb-4">
                      <p className="text-slate-800 font-medium">{q.question}</p>
                    </div>

                    {/* Slika ako postoji */}
                    {q.imageUrl && (
                      <div className="mb-4">
                        <div className="relative group">
                          <img
                            src={q.imageUrl}
                            alt="Pitanje"
                            className="max-h-64 object-contain rounded-xl border-2 border-slate-200 mx-auto"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <Image className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Opcije */}
                    <div className="space-y-3">
                      {q.options.map((opt, oi) => {
                        const isSelected = selected.includes(oi);
                        const isCorrectOption = q.correctOptions.includes(oi);

                        let bgColor = 'bg-white';
                        let borderColor = 'border-slate-200';
                        let textColor = 'text-slate-800';
                        let icon = null;

                        if (isCorrectOption) {
                          bgColor = 'bg-green-50';
                          borderColor = 'border-green-200';
                          textColor = 'text-green-800';
                          icon = <CheckCircle className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />;
                        } else if (isSelected && !isCorrectOption) {
                          bgColor = 'bg-red-50';
                          borderColor = 'border-red-200';
                          textColor = 'text-red-800';
                          icon = <XCircle className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />;
                        }

                        return (
                          <div
                            key={oi}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 ${borderColor} ${bgColor} transition-all`}
                          >
                            <span className={`flex-1 ${textColor}`}>{opt}</span>
                            <div className="flex items-center gap-2">
                              {isCorrectOption && !isSelected && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                  Tačan odgovor
                                </span>
                              )}
                              {isSelected && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isCorrectOption 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-red-600 text-white'
                                }`}>
                                  Tvoj odgovor
                                </span>
                              )}
                              {icon}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Indikator tačnosti na dnu */}
                    <div className={`mt-4 p-3 rounded-xl ${
                      isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm flex items-center gap-2 ${
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Tačan odgovor! Osvojili ste {q.points} {q.points === 1 ? 'bod' : 'boda'}.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Netačan odgovor. Tačni odgovori su: {q.correctOptions.map(i => q.options[i]).join(', ')}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer sa preporukom */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Preporuka za dalje vežbanje</h3>
                <p className="text-sm text-slate-600">
                  {percentage >= 80 
                    ? 'Odličan rezultat! Nastavite sa vežbanjem da zadržite ovaj nivo.'
                    : percentage >= 60
                    ? 'Dobar rezultat. Preporučujemo da ponovite pitanja koja ste pogrešili.'
                    : 'Potrebno je dodatno vežbanje. Fokusirajte se na oblasti gde ste imali greške.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}