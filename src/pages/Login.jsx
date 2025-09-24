import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';

const { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiInfo } = FiIcons;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 登録は1ステップに統一
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

  const { allergyOptions } = useRestaurant();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // ページ遷移時に重要情報バーまでスクロール
  React.useEffect(() => {
    // トップページから遷移した場合のみスクロール
    if (location.state?.fromHome) {
      setTimeout(() => {
        const importantNotice = document.querySelector('[data-testid="important-notice-bar"]');
        if (importantNotice) {
          importantNotice.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [location]);

  const resendConfirmationEmail = async () => {
    try {
      setAuthError('');
      setInfoMessage('');
      const email = formData.email.trim();
      if (!email) {
        setAuthError('メールアドレスを入力してください');
        return;
      }
      const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/#/login`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      setInfoMessage('確認メールを再送しました。受信トレイをご確認ください。');
    } catch (e) {
      setAuthError(e?.message || '再送に失敗しました');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setAuthError('');
    setInfoMessage('');
    console.log('[Auth] submit start', { isLogin, currentStep });

    try {
      if (isLogin) {
        // ログイン
        console.log('[Auth] signInWithPassword try');
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });
        if (error) throw error;
        console.log('[Auth] signInWithPassword ok');
        // プロフィールUPSERT（初回ログイン時/以降も上書き可）
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
          const metaName = userData?.user?.user_metadata?.name || formData.name || null;
          await supabase
            .from('profiles')
            .upsert({ id: userId, name: metaName }, { onConflict: 'id' });
        }
        setInfoMessage('ログインしました。マイページへ移動します...');
        navigate('/mypage');
      } else {
        // 新規登録（メール確認）
        if (currentStep === 1) {
          if (!formData.name || !formData.email || !formData.password) {
            throw new Error('お名前・メール・パスワードを入力してください');
          }
          if (formData.password.length < 6) {
            throw new Error('パスワードは6文字以上で入力してください');
          }
          const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/#/login`;
          console.log('[Auth] signUp try');
          const { error } = await supabase.auth.signUp({
            email: formData.email.trim(),
            password: formData.password,
            options: {
              data: { name: formData.name },
              emailRedirectTo: redirectTo,
            },
          });
          if (error) throw error;
          console.log('[Auth] signUp ok');
          // 仮登録時点でもprofilesにnameを反映（存在しなければ作成）
          const { data: u } = await supabase.auth.getUser();
          const uid = u?.user?.id;
          if (uid) {
            await supabase.from('profiles').upsert({ id: uid, name: formData.name || null }, { onConflict: 'id' });
          }
          setInfoMessage('確認メールを送信しました。メール内のリンクで有効化してください。');
        }
      }
    } catch (err) {
      setAuthError(err?.message || 'エラーが発生しました');
      console.error('[Auth] submit error', err);
    } finally {
      setSubmitting(false);
      console.log('[Auth] submit end');
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
            {isLogin ? 'ログイン' : '無料会員登録'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'アカウントにログインしてください' : '新しいアカウントを作成してください'}
          </p>
        </div>

        {/* 登録フローは1ステップに統一（プログレス非表示） */}

        {/* Tab Buttons - Only show for step 1 */}
        {currentStep === 1 && (
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
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
          {/* 基本情報（登録はこのステップのみ） */}
          {(
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
                  {/* Terms & Privacy consent (move under confirm password) */}
                  <div className="pt-3 space-y-2">
                    <label className="flex items-start space-x-3">
                      <input type="checkbox" required className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                      <span className="text-sm text-gray-700">
                        <a href="#/terms" className="text-orange-600 hover:text-orange-800 underline">利用規約</a> と
                        <a href="#/privacy" className="text-orange-600 hover:text-orange-800 underline ml-1">プライバシーポリシー</a>
                        に同意します
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
          {/* アレルギー設定ステップはログイン後のマイページで実施 */}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors`}
            >
              {isLogin ? 'ログイン' : '仮登録（メールが届きます）'}
            </motion.button>
          </div>

          {/* Resend confirmation link (registration only) */}
          {!isLogin && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={resendConfirmationEmail}
                className="text-sm text-orange-600 hover:text-orange-800 underline"
              >
                確認メールを再送する
              </button>
            </div>
          )}
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