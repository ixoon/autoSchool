'use client';

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FileText, BookOpen, Award, Play, Loader2, AlertCircle, ChevronRight } from "lucide-react";

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

  const handleStartTest = (testId: string) => {
    router.push(`/student/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
          <p className="text-sm sm:text-base">Učitavanje testova...</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Nema dostupnih testova</h3>
          <p className="text-sm sm:text-base text-gray-500">Molimo sačekajte da administrator doda testove</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dostupni testovi</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Izaberite test za polaganje</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tests.map(test => (
          <div
            key={test.id}
            className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => handleStartTest(test.id)}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {test.name}
                </h2>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Pitanja: <span className="font-semibold">{test.questions.length}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Ukupno bodova: <span className="font-semibold">{getTotalPoints(test.questions)}</span></span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartTest(test.id);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md shadow-blue-600/20"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Započni test</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestsList;