import React from 'react'

const Hero = () => {
  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      
      {/* Mreža kvadrata iza teksta */}
      <div className="absolute inset-0 -z-10 
        bg-[linear-gradient(to_right,rgba(203,213,225,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(203,213,225,0.3)_1px,transparent_1px)]
        bg-size-[4rem_4rem] md:bg-size-[4rem_4rem] sm:bg-size-[3rem_3rem]
        mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]
      " />
      
      {/* Sadržaj */}
      <div className='z-10 text-center max-w-4xl px-4 md:px-6 sm:px-4'>
        <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6'>Vaš put do vozačke</h1>
        <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6'>dozvole počinje <span className='text-blue-500'>ovde</span></h1>
        
        <div className='mb-6 sm:mb-8'>
          <p className='text-gray-400 text-base sm:text-lg md:text-xl mb-1 sm:mb-2'>
            Moderna autoškola sa online testovima, praćenjem napretka i iskusnim
          </p>
          <p className='text-gray-400 text-base sm:text-lg md:text-xl'>
            instruktorima. Učite teoriju od kuće i vežbajte sa najboljima.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4'>
          <button className='bg-blue-500 text-white font-bold rounded-lg p-3 w-full sm:w-auto hover:bg-blue-600 transition-colors'>
            Započni obuku
          </button>
          <button className='bg-gray-100 border border-gray-300 text-blue-500 font-bold rounded-lg p-3 w-full sm:w-auto hover:bg-blue-100 transition-colors'>
            Prijavi se
          </button>
        </div>

        <div className='flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 mt-8 sm:mt-12'>
          <h2 className='text-md sm:text-md font-bold text-gray-500'>✔️Online testovi 24/7</h2>
          <h2 className='text-md sm:text-md font-bold text-gray-500'>✔️Praćenje napretka</h2>
          <h2 className='text-md sm:text-md font-bold text-gray-500'>✔️Iskusni instruktori</h2>
        </div>
      </div>  
    </section>
  )
}

export default Hero