import React from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

const Hero = () => {
  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50'>
      
      {/* Mreža kvadrata iza teksta */}
      <div className="absolute inset-0 -z-10 
        bg-[linear-gradient(to_right,rgba(203,213,225,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(203,213,225,0.3)_1px,transparent_1px)]
        bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] md:bg-[size:5rem_5rem]
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_50%,transparent_100%)]
      " />
      
      {/* Glow efekat */}
      <div className="absolute top-0 -z-10 h-[30rem] w-full bg-gradient-to-b from-blue-50/50 to-transparent" />
      
      {/* Sadržaj */}
      <div className='relative z-10 text-center max-w-5xl px-4 sm:px-6 lg:px-8'>
        {/* Badge */}
        <div className='inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-5 sm:mb-6 md:mb-8'>
          <span className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse' />
          <span className='text-xs sm:text-sm font-medium text-blue-700'>Online autoškola</span>
        </div>

        {/* Naslov */}
        <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-3 md:mb-4 text-slate-800'>
          Vaš put do vozačke
        </h1>
        <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-slate-800'>
          dozvole počinje <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>ovde</span>
        </h1>
        
        {/* Opis */}
        <div className='mb-6 sm:mb-7 md:mb-8 lg:mb-10'>
          <p className='text-slate-600 text-sm sm:text-base md:text-lg lg:text-xl mb-1 px-2'>
            Moderna autoškola sa online testovima, praćenjem napretka i iskusnim
          </p>
          <p className='text-slate-600 text-sm sm:text-base md:text-lg lg:text-xl px-2'>
            instruktorima. Učite teoriju od kuće i vežbajte sa najboljima.
          </p>
        </div>

        {/* CTA Dugmad */}
        <div className='flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4'>
          <button className='group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 w-full sm:w-auto text-sm sm:text-base hover:shadow-xl hover:shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2'>
            Započni besplatnu prijavu
            <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform' />
          </button>
          
          <a href='/requests' className='w-full sm:w-auto'>
            <button className='group w-full bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-lg sm:rounded-xl px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2'>
              Pogledaj cene
              <span className='text-base sm:text-lg group-hover:translate-x-1 transition-transform'>→</span>
            </button>
          </a>
        </div>

        {/* Dodatni CTA za već postojeće korisnike */}
        <div className='mt-4 sm:mt-5 md:mt-6'>
          <a href='/requests' className='text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors underline underline-offset-4'>
            Već imate nalog? Prijavite se
          </a>
        </div>

        {/* Feature liste */}
        <div className='flex flex-col xs:flex-row sm:flex-row justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-8 sm:mt-10 md:mt-12 lg:mt-16'>
          <div className='flex items-center gap-1.5 sm:gap-2 text-slate-600'>
            <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0' />
            <span className='text-xs sm:text-sm md:text-base font-medium'>Online testovi 24/7</span>
          </div>
          <div className='flex items-center gap-1.5 sm:gap-2 text-slate-600'>
            <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0' />
            <span className='text-xs sm:text-sm md:text-base font-medium'>Praćenje napretka</span>
          </div>
          <div className='flex items-center gap-1.5 sm:gap-2 text-slate-600'>
            <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0' />
            <span className='text-xs sm:text-sm md:text-base font-medium'>Iskusni instruktori</span>
          </div>
        </div>
      </div>  
    </section>
  )
}

export default Hero