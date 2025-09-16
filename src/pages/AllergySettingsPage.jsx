import React from 'react'
import UserAllergySettings from '../components/UserAllergySettings'

const AllergySettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">個人アレルギー設定</h1>
        <UserAllergySettings />
      </div>
    </div>
  )
}

export default AllergySettingsPage
