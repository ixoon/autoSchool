import React from 'react'
import { BookOpen, Car, Clock, Shield, Trophy, Users,  } from 'lucide-react'

const WhyUs = () => {
  return (
    <div className='bg-gray-50 py-12 sm:py-16 md:py-20'>
        <div className='text-center px-4 sm:px-6'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold'>Zašto izabrati nas?</h1>
            <p className='text-base sm:text-lg md:text-xl text-gray-500 mt-2 sm:mt-3 max-w-2xl mx-auto'>
                Pružamo sve što vam je potrebno za uspešno polaganje vozačkog ispita
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center items-center gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10 p-4 sm:p-8 md:p-20'>
                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <BookOpen className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Online testovi</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Vežbajte teoriju sa našim online testovima dostupnim 24/7
                    </p>
                </div>

                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <Clock className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Fleksibilno vreme</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Zakažite časove vožnje prema vašem rasporedu.
                    </p>
                </div>

                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <Users className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Iskusni instruktori</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Naš tim čine profesionalci sa dugogodišnjim iskustvom.
                    </p>
                </div>

                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <Trophy className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Visoka prolaznost</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Preko 95% naših kandidata prolazi iz prvog pokušaja.
                    </p>
                </div>

                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <Car className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Moderna vozila</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Obuka na novim vozilima sa svom potrebnom opremom.
                    </p>
                </div>

                <div className='bg-white p-5 sm:p-6 rounded-lg shadow-md w-full max-w-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl'>
                    <Shield className='mt-4 sm:mt-6 w-9 h-9 sm:w-11 sm:h-11 text-blue-500 bg-blue-200 rounded-lg p-2'/>
                    <h2 className='text-base sm:text-lg font-bold mb-1 sm:mb-2 text-start mt-4 sm:mt-6'>Sigurnost na prvom mestu</h2>
                    <p className='text-sm sm:text-base text-gray-500 w-full text-start'>
                        Fokus na bezbednoj vožnji i pravilima saobraćaja.
                    </p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default WhyUs;