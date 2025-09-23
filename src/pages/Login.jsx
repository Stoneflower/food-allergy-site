import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiInfo } = FiIcons;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: 基本情報, 2: アレルギー設定
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const [allergySettings, setAllergySettings] = useState({
    selectedAllergies: [],
    allowTrace: false, // 微量OK
    allowHeated: true,  // 加熱済みOK
    severityLevel: 'medium' // light, medium, strict
  });

  const { allergyOptions, setUserSettings, setIsLoggedIn } = useRestaurant();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      // ログイン処理
      console.log('ログイン', formData);
      setIsLoggedIn(true);
    } else {
      if (currentStep === 1) {
        // 次のステップへ
        setCurrentStep(2);
      } else {
        // 会員登録完了
        console.log('会員登録', { ...formData, allergySettings });
        setUserSettings(allergySettings);
        setIsLoggedIn(true);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleAllergy = (allergyId) => {
    setAllergySettings(prev => ({
      ...prev,
      selectedAllergies: prev.selectedAllergies.includes(allergyId)
        ? prev.selectedAllergies.filter(id => id !== allergyId)
        : [...prev.selectedAllergies, allergyId]
    }));
  };

  const severityLevels = [
    {
      id: 'light',
      name: '軽度',
      description: '微量でも症状が軽い',
      icon: '😊',
      settings: { allowTrace: true, allowHeated: true }
    },
    {
      id: 'medium',
      name: '中程度',
      description: '注意が必要',
      icon: '😐',
      settings: { allowTrace: false, allowHeated: true }
    },
    {
      id: 'strict',
      name: '重度',
      description: '完全除去が必要',
      icon: '😰',
      settings: { allowTrace: false, allowHeated: false }
    }
  ];

  const handleSeverityChange = (severity) => {
    const level = severityLevels.find(l => l.id === severity);
    setAllergySettings(prev => ({
      ...prev,
      severityLevel: severity,
      ...level.settings
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">🍦</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'ログイン' : (currentStep === 1 ? '無料会員登録' : 'アレルギー設定')}
          </h2>
          <p className="text-gray-600">
            {isLogin 
              ? 'アカウントにログインしてください'
              : currentStep === 1 
                ? '新しいアカウントを作成してください'
                : 'あなたのアレルギー情報を設定してください'
            }
          </p>
        </div>

        {/* Progress Bar for Registration */}
        {!isLogin && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <SafeIcon icon={FiCheck} className="w-4 h-4" /> : step}
                  </div>
                  {step < 2 && (
                    <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-orange-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>基本情報</span>
              <span>アレルギー設定</span>
            </div>
          </div>
        )}

        {/* Tab Buttons - Only show for step 1 */}
        {currentStep === 1 && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              新規登録
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              {/* Name Field (Registration only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="山田太郎"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <div className="relative">
                  <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <div className="relative">
                  <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Registration only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード（確認）
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="••••••••"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Allergy Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Allergy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🚨 あなたのアレルギー成分を選択してください
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {allergyOptions.slice(0, 16).map(allergy => (
                    <button
                      key={allergy.id}
                      type="button"
                      onClick={() => toggleAllergy(allergy.id)}
                      className={`p-3 rounded-lg border-2 text-xs transition-all ${
                        allergySettings.selectedAllergies.includes(allergy.id)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{allergy.icon}</div>
                        <div className="font-medium">{allergy.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎯 アレルギーの重度を選択してください
                </label>
                <div className="space-y-3">
                  {severityLevels.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => handleSeverityChange(level.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        allergySettings.severityLevel === level.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{level.icon}</span>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{level.name}</h5>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                        {allergySettings.severityLevel === level.id && (
                          <SafeIcon icon={FiCheck} className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ⚙️ 詳細設定
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allergySettings.allowTrace}
                      onChange={(e) => setAllergySettings(prev => ({ ...prev, allowTrace: e.target.checked }))}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-1"
                    />
                    <div>
                      <span className="font-medium text-gray-900">⚠️ 微量なら摂取可能</span>
                      <p className="text-sm text-gray-600">
                        「微量」と表示された食品を「OK」として表示します
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allergySettings.allowHeated}
                      onChange={(e) => setAllergySettings(prev => ({ ...prev, allowHeated: e.target.checked }))}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-1"
                    />
                    <div>
                      <span className="font-medium text-gray-900">🔥 加熱済みなら摂取可能</span>
                      <p className="text-sm text-gray-600">
                        加熱で変化する成分を「OK」として表示します
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Settings Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-blue-800 mb-2">設定について</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 設定は後から変更できます</li>
                      <li>• 必ず医師にご相談ください</li>
                      <li>• 症状の変化があった場合は設定を見直してください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
            )}
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${currentStep === 2 ? 'flex-1' : 'w-full'} py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors`}
            >
              {isLogin 
                ? 'ログイン' 
                : currentStep === 1 
                  ? '次へ進む' 
                  : '会員登録完了'
              }
            </motion.button>
          </div>
        </form>

        {/* Additional Links - Only show for step 1 */}
        {currentStep === 1 && (
          <div className="mt-6 text-center space-y-2">
            {isLogin && (
              <a href="#" className="text-sm text-orange-600 hover:text-orange-800">
                パスワードを忘れた方はこちら
              </a>
            )}
            {!isLogin && (
              <p className="text-xs text-gray-500">
                会員登録することで、
                <a href="#" className="text-orange-600 hover:text-orange-800">利用規約</a>
                および
                <a href="#" className="text-orange-600 hover:text-orange-800">プライバシーポリシー</a>
                に同意したものとみなします。
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;