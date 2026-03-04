'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { History, ChevronRight, Clock, Award, BarChart3, Eye, Loader2, TrendingUp, Calendar, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

type HistoryItem = {
  id: string;
  testId: string;
  score: number;
  maxScore: number; // Promenjeno iz totalPoints u maxScore
  createdAt: any;
  answers?: Array<{ selected: number[] }>;
};

export default function RecentTests() {
  const [tests, setTests] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        console.log("Fetching history for user:", user.uid);
        
        const q = query(
          collection(db, 'testHistory'),
          where('userId', '==', user.uid)
        );

        const snap = await getDocs(q);
        console.log("Broj dokumenata:", snap.size);

        const data: HistoryItem[] = snap.docs.map((doc) => {
          const docData = doc.data();
          console.log("Dokument podaci:", doc.id, docData);
          
          return {
            id: doc.id,
            testId: docData.testId || '',
            score: docData.score !== undefined ? docData.score : 0,
            maxScore: docData.maxScore !== undefined ? docData.maxScore : 0, // Promenjeno iz totalPoints u maxScore
            createdAt: docData.createdAt,
            answers: docData.answers || []
          };
        });

        console.log("Mapirani podaci:", data);

        // Sortiraj po datumu, noviji prvi
        data.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return (b.createdAt.seconds || 0) - (a.createdAt.seconds || 0);
        });
        
        setTests(data);
      } catch (err) {
        console.error("Greška pri učitavanju istorije:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const calculatePercentage = (score: number, maxScore: number) => {
    console.log("Računanje procenta:", { score, maxScore });
    if (!maxScore || maxScore === 0) {
      console.log("maxScore je 0, vraćam 0");
      return 0;
    }
    const percentage = Math.round((score / maxScore) * 100);
    console.log("Izračunat procenat:", percentage);
    return percentage;
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

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (percentage >= 60) return <TrendingUp className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return 'Nepoznato';
    
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Danas';
    } else if (diffDays === 1) {
      return 'Juče';
    } else if (diffDays < 7) {
      return `Pre ${diffDays} dana`;
    } else {
      return date.toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const averageScore = tests.length > 0 
    ? Math.round(tests.reduce((acc, test) => {
        const percentage = calculatePercentage(test.score, test.maxScore); // Promenjeno
        return acc + (isNaN(percentage) ? 0 : percentage);
      }, 0) / tests.length)
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600 opacity-50" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Učitavanje istorije testova...</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12">
        <div className="text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Nema urađenih testova</h3>
          <p className="text-sm sm:text-base text-slate-500 mb-6">Vaša istorija testova biće prikazana ovde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header sa statistikom */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Nedavno urađeni testovi</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Pregled vaših poslednjih testova</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
              <p className="text-[10px] sm:text-xs text-blue-600 font-medium">Prosečan uspeh</p>
              <p className="text-base sm:text-lg font-bold text-blue-700">{averageScore}%</p>
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100">
              <p className="text-[10px] sm:text-xs text-purple-600 font-medium">Ukupno testova</p>
              <p className="text-base sm:text-lg font-bold text-purple-700">{tests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista testova */}
      <div className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {tests.map((test, index) => {
            // Provere pre računanja
            const score = typeof test.score === 'number' ? test.score : 0;
            const maxScore = typeof test.maxScore === 'number' ? test.maxScore : 0; // Promenjeno
            
            console.log(`Test ${index}:`, { score, maxScore }); // Promenjeno
            
            const percentage = calculatePercentage(score, maxScore); // Promenjeno
            const scoreColor = getScoreColor(percentage);
            const scoreBg = getScoreBg(percentage);
            const scoreGradient = getScoreGradient(percentage);
            const scoreIcon = getScoreIcon(percentage);
            const dateFormatted = formatDate(test.createdAt);
            const timeFormatted = formatTime(test.createdAt);

            return (
              <div
                key={test.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-lg sm:rounded-xl border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
                onClick={() => router.push(`/student/review/${test.id}`)}
              >
                {/* Redni broj */}
                <div className="absolute top-2 right-2 sm:static sm:mr-3 sm:top-auto sm:right-auto">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 bg-slate-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    #{test.testId?.slice(-4) || 'N/A'}
                  </span>
                </div>

                {/* Leva strana */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  {/* Ikona za rezultat sa gradijentom */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${scoreGradient} shadow-lg flex-shrink-0`}>
                    <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>

                  {/* Informacije o testu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-none">
                        Test #{test.testId?.slice(-6) || 'N/A'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${scoreBg} ${scoreColor} whitespace-nowrap`}>
                        {scoreIcon}
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{dateFormatted}</span>
                      </div>
                      {timeFormatted && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{timeFormatted}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>
                          {score} / {maxScore} poena {/* Promenjeno */}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desna strana */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 mt-3 sm:mt-0">
                  {/* Cirkularni prikaz procenta - samo na desktop */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 hidden sm:block">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-slate-200"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - (percentage / 100))}`}
                        className={percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[10px] sm:text-xs font-bold ${scoreColor}`}>{percentage}%</span>
                    </div>
                  </div>

                  {/* Dugme za pregled */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/student/review/${test.id}`);
                    }}
                    className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg group/btn"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="hidden xs:inline">Pregled</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Hover efekat sa gradijentom */}
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-200 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer sa statistikom */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-slate-500">
            Prikazano {tests.length} {tests.length === 1 ? 'test' : tests.length < 5 ? 'testa' : 'testova'}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600">Odličan (80%+)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600">Dobar (60-79%)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-slate-600">Potrebno vežbanje (ispod 60%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}