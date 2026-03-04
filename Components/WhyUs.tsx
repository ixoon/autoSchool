import React from 'react'
import { BookOpen, Car, Clock, Shield, Trophy, Users, ArrowRight } from 'lucide-react'

const WhyUs = () => {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            Zašto mi?
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Zašto izabrati nas?
          </h1>
          <p className="text-lg sm:text-xl text-slate-600">
            Pružamo sve što vam je potrebno za uspešno polaganje vozačkog ispita
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Online testovi */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Online testovi
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Vežbajte teoriju sa našim online testovima dostupnim 24/7
                </p>
              </div>
            </div>
          </div>

          {/* Fleksibilno vreme */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Fleksibilno vreme
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Zakažite časove vožnje prema vašem rasporedu
                </p>
              </div>
            </div>
          </div>

          {/* Iskusni instruktori */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Iskusni instruktori
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Naš tim čine profesionalci sa dugogodišnjim iskustvom
                </p>
              </div>
            </div>
          </div>

          {/* Visoka prolaznost */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Visoka prolaznost
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Preko 95% naših kandidata prolazi iz prvog pokušaja
                </p>
              </div>
            </div>
          </div>

          {/* Moderna vozila */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Car className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Moderna vozila
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Obuka na novim vozilima sa svom potrebnom opremom
                </p>
              </div>
            </div>
          </div>

          {/* Sigurnost na prvom mestu */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Sigurnost na prvom mestu
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Fokus na bezbednoj vožnji i pravilima saobraćaja
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button - umesto dva dugmeta */}
        <div className="text-center mt-12 sm:mt-16">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1">
            Započni prijavu
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-500 mt-4">
            Besplatne konsultacije i probni čas
          </p>
        </div>
      </div>
    </div>
  )
}

export default WhyUs