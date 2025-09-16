import React from 'react'
import AllergyTableManager from '../components/AllergyTableManager'

const AllergyTablePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">アレルギー28品目データベース</h1>
        <AllergyTableManager />
      </div>
    </div>
  )
}

export default AllergyTablePage
