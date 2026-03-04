'use client';

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  FileText, BookOpen, Award, Play, Loader2, AlertCircle, 
  ChevronRight, Clock, Star, BarChart, Calendar, Users,
  TrendingUp, CheckCircle, HelpCircle, Sparkles
} from "lucide-react";

type Question = {
  question: string;
  imageUrl: string;
  options: string[];
  correctOptions: number[];
  points: number;
};

type Test = {
  id: string;
  name: string;
  questions: Question[];
};

const TestsList = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const snapshot = await getDocs(collection(db, "tests"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { name: string; questions: Question[] })
        }));
        setTests(data);
      } catch (err) {
        console.error("Greška pri učitavanju testova:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const getTotalPoints = (questions: Question[]) => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  };

  const getAverageDifficulty = (questions: Question[]) => {
    const avgPoints = getTotalPoints(questions) / questions.length;
    if (avgPoints <= 5) return { text: "Lak", color: "green" };
    if (avgPoints <= 8) return { text: "Srednji", color: "amber" };
    return { text: "Težak", color: "red" };
  };

  const handleStartTest = (testId: string) => {
    router.push(`/student/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-slate-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 opacity-50" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium">Učitavanje testova...</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">Nema dostupnih testova</h3>
          <p className="text-xs sm:text-sm text-slate-500">Molimo sačekajte da administrator doda testove</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Dostupni testovi</h2>
              <p className="text-xs text-slate-500">Izaberite test za polaganje</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
              {tests.length} testova
            </span>
          </div>
        </div>
      </div>

      {/* Lista testova */}
      <div className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {tests.map((test, index) => {
            const totalPoints = getTotalPoints(test.questions);
            const difficulty = getAverageDifficulty(test.questions);
            
            return (
              <div
                key={test.id}
                onClick={() => handleStartTest(test.id)}
                className="group relative flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 rounded-lg border-2 border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white gap-2 xs:gap-3"
              >
                {/* Leva strana - info */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Ikona sa gradijentom */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {test.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5">
                        <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {test.questions.length} pitanja
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5">
                        <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {totalPoints} poena
                      </span>
                      <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${
                        difficulty.color === 'green' ? 'bg-green-100 text-green-700' :
                        difficulty.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {difficulty.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desna strana - dugme za pokretanje */}
                <div className="flex items-center gap-2 self-end xs:self-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTest(test.id);
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm group/btn"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    <span>Započni</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* Hover efekat */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-200 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer sa preporukom */}
      <div className="px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-xs text-slate-600">
            Pažljivo pročitajte svako pitanje pre nego što odgovorite. Srećno!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestsList;