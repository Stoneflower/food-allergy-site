import React from 'react'
import SupabaseTest from '../components/SupabaseTest'

const SupabaseTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Supabase接続テスト</h1>
        <SupabaseTest />
      </div>
    </div>
  )
}

export default SupabaseTestPage
