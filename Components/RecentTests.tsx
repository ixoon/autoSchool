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
import { History, ChevronRight, Clock, Award, BarChart3, Eye, Loader2 } from 'lucide-react';

type HistoryItem = {
  id: string;
  testId: string;
  score: number;
  totalPoints: number;
  createdAt: any;
};

export default function RecentTests() {
  const [tests, setTests] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'testHistory'),
        where('userId', '==', user.uid)
      );

      const snap = await getDocs(q);

      const data: HistoryItem[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Sortiraj po datumu, noviji prvi
      data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      
      setTests(data);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const calculatePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Učitavanje istorije testova...</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nema urađenih testova</h3>
          <p className="text-gray-500">Vaša istorija testova biće prikazana ovde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Nedavno urađeni testovi</h2>
              <p className="text-sm text-gray-500 mt-1">Pregled vaših poslednjih testova</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Ukupno: {tests.length}
            </span>
          </div>
        </div>
      </div>

      {/* Lista testova */}
      <div className="p-6">
        <div className="space-y-4">
          {tests.map((test) => {
            const percentage = calculatePercentage(test.score, test.totalPoints);
            const scoreColor = getScoreColor(percentage);
            const scoreBg = getScoreBg(percentage);

            return (
              <div
                key={test.id}
                className="group relative flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/student/review/${test.id}`)}
              >
                {/* Leva strana */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Ikona za rezultat */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scoreBg}`}>
                    <BarChart3 className={`w-6 h-6 ${scoreColor}`} />
                  </div>

                  {/* Informacije o testu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        Test #{test.testId.slice(-6)}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${scoreBg} ${scoreColor}`}>
                        {percentage}% uspešnost
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(test.createdAt.seconds * 1000).toLocaleDateString('sr-RS', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Award className="w-4 h-4" />
                        <span>
                          {test.score} / {test.totalPoints} poena
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desna strana */}
                <div className="flex items-center gap-4">
                  {/* Cirkularni prikaz procenta */}
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - percentage / 100)}`}
                        className={percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${scoreColor}`}>{percentage}%</span>
                    </div>
                  </div>

                  {/* Dugme za pregled */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/student/review/${test.id}`);
                    }}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Pregled</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Hover efekat */}
                <div className="absolute inset-0 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/5 transition-all duration-200 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
          Prikazano {tests.length} {tests.length === 1 ? 'test' : tests.length < 5 ? 'testa' : 'testova'}
        </p>
      </div>
    </div>
  );
}