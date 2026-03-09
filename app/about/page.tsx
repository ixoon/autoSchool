// app/o-nama/page.tsx
'use client';

import React from 'react';
import { 
  Users, Award, Car, BookOpen, Clock, Shield, 
  Target, Heart, Star, ChevronRight, CheckCircle,
  Phone, Mail, MapPin, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/Components/Navbar';

const AboutPage = () => {
  const stats = [
    { value: '15+', label: 'Godina iskustva', icon: Calendar },
    { value: '5000+', label: 'Zadovoljnih polaznika', icon: Users },
    { value: '98%', label: 'Prolaznost na prvom pokušaju', icon: Award },
    { value: '20+', label: 'Instruktora', icon: Users },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Sigurnost na prvom mestu',
      description: 'Bezbednost naših polaznika je najvažnija. Učimo odgovornoj vožnji.'
    },
    {
      icon: Target,
      title: 'Posvećenost kvalitetu',
      description: 'Konstantno unapređujemo program obuke i pratimo savremene trendove.'
    },
    {
      icon: Heart,
      title: 'Individualni pristup',
      description: 'Svakom polazniku prilagođavamo tempo i metodologiju učenja.'
    },
    {
      icon: Star,
      title: 'Stručni tim',
      description: 'Naši instruktori su profesionalci sa dugogodišnjim iskustvom.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero sekcija sa mrežom */}
      <Navbar />
      <div className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        {/* Mreža kvadrata pozadi */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(203,213,225,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(203,213,225,0.3)_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] md:bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>
        </div>

        {/* Sadržaj heroja */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-700">O nama</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
            AutoŠkola Šampion
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
            Vaš pouzdan partner na putu do vozačke dozvole. Tradicija, kvalitet i 
            sigurnost već više od 15 godina.
          </p>
        </div>
      </div>

      {/* Naša misija */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                  Naša misija
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Osnovani 2010. godine sa ciljem da podignemo kvalitet obuke vozača. 
                  Verujemo da je dobar vozač onaj koji ne samo da zna 
                  saobraćajne propise, već i bezbedno i odgovorno učestvuje u saobraćaju.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Kroz godine rada, razvili smo jedinstveni pristup učenju koji 
                  kombinuje savremene tehnologije, individualni rad i praktičnu 
                  obuku na najvišem nivou.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
                  <Target className="w-20 h-20 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Naše vrednosti */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Naše vrednosti
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Principi koji nas vode u radu sa polaznicima
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-600">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zašto baš mi */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10 md:p-12">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                Zašto izabrati baš nas?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Moderna vozila sa svom potrebnom opremom</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Online testovi i praćenje napretka</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Fleksibilno zakazivanje časova</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Iskusni i strpljivi instruktori</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Individualni pristup svakom polazniku</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Visoka prolaznost na ispitu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontakt CTA */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Započnite svoju vozačku priču
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
                Kontaktirajte nas i zakažite probni čas. Tu smo za sva vaša pitanja.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Kontaktirajte nas
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;