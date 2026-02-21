'use client';

import { useEffect, useState } from "react";
import { db } from "@/config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
    // kasnije ćemo napraviti ovu stranicu za polaganje
  };

  if (loading) {
    return <p className="p-6">Učitavanje testova...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dostupni testovi</h1>

      {tests.length === 0 ? (
        <p>Nema dostupnih testova.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tests.map(test => (
            <div
              key={test.id}
              className="border rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{test.name}</h2>

              <div className="text-gray-600 mb-3">
                <p>📄 Pitanja: {test.questions.length}</p>
                <p>🎯 Ukupno bodova: {getTotalPoints(test.questions)}</p>
              </div>

              <button
                onClick={() => handleStartTest(test.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Započni test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestsList;
