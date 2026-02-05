import React from 'react'

const page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-6 shadow-2xl border-2 border-gray-300 rounded-xl p-10">
        
        <h1 className="text-2xl font-bold text-center">
          🚙AutoŠkola Šampion
        </h1>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-semibold">Registration</h2>
          <p className='text-gray-400'>Enter your details to create an account</p>
        </div>

        <form className="flex flex-col gap-2">
            <label className="text-sm font-medium">Full Name</label>
          <input className='border border-gray-200 rounded-lg py-1 px-1' type="text" placeholder="Joe Smith" />
            <label className="text-sm font-medium">Email address</label>
          <input className='border border-gray-200 rounded-lg py-1 px-1' type="email" placeholder="example@gmail.com" />
            <label className="text-sm font-medium">Password</label>
          <input className='border border-gray-200 rounded-lg py-1 px-1' type="password" placeholder="********" />
          <button className='w-full bg-blue-500 text-white font-bold rounded-lg p-1 hover:bg-blue-600' type="submit">Register</button>
        </form>

        <p className="text-center">
          Already have an account? <a href="/login" className="underline">Login</a>
        </p>

      </div>
    </div>
  )
}

export default page
