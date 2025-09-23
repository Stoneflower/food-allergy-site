import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const MyPage = () => {
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState('profile'); // 'profile' | 'allergy'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // profile
  const [profile, setProfile] = useState({ name: '' });

  // allergy settings (user)
  const [allowTrace, setAllowTrace] = useState(false);
  const [allowHeated, setAllowHeated] = useState(true);
  const [severity, setSeverity] = useState('medium'); // light | medium | strict

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id || null;
        setUserId(uid);
        if (!uid) return;

        // load profile
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (prof) setProfile({ name: prof.name || '' });

        // load allergy settings (user)
        const { data: aset } = await supabase
          .from('allergy_settings')
          .select('*')
          .eq('profile_type', 'user')
          .eq('profile_id', uid)
          .maybeSingle();
        if (aset) {
          setAllowTrace(!!aset.allow_trace);
          setAllowHeated(!!aset.allow_heated);
          setSeverity(aset.severity || 'medium');
        }
      } catch (e) {
        setError(e?.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      await supabase.from('profiles').upsert({ id: userId, name: profile.name || null }, { onConflict: 'id' });
    } catch (e) {
      setError(e?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const saveAllergy = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      // upsert: user設定は profile_type='user' + profile_id
      // 既存行があれば更新、なければ挿入
      const { data: existing } = await supabase
        .from('allergy_settings')
        .select('id')
        .eq('profile_type', 'user')
        .eq('profile_id', userId)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('allergy_settings')
          .update({ allow_trace: allowTrace, allow_heated: allowHeated, severity })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('allergy_settings')
          .insert([{ profile_type: 'user', profile_id: userId, allow_trace: allowTrace, allow_heated: allowHeated, severity }]);
      }
    } catch (e) {
      setError(e?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">マイページ</h1>

        <div className="bg-white rounded-xl shadow p-2 mb-6 flex">
          {['profile','allergy'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${tab===t ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {t==='profile' ? '本人プロフィール編集' : 'アレルギー設定'}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading ? (
          <p className="text-gray-600">読み込み中...</p>
        ) : tab === 'profile' ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">本人プロフィール</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e)=>setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={saving}
                className={`px-6 py-2 rounded-lg text-white font-semibold ${saving?'bg-gray-400':'bg-orange-500 hover:bg-orange-600'}`}
              >{saving?'保存中...':'保存する'}</motion.button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">アレルギー設定（本人）</h2>
            <form onSubmit={saveAllergy} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-orange-600" checked={allowTrace} onChange={(e)=>setAllowTrace(e.target.checked)} />
                  <span className="text-sm text-gray-800">微量（trace）なら摂取可能</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-orange-600" checked={allowHeated} onChange={(e)=>setAllowHeated(e.target.checked)} />
                  <span className="text-sm text-gray-800">加熱済みなら摂取可能</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">重度</label>
                <select value={severity} onChange={(e)=>setSeverity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="light">軽度</option>
                  <option value="medium">中程度</option>
                  <option value="strict">重度</option>
                </select>
              </div>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={saving}
                className={`px-6 py-2 rounded-lg text-white font-semibold ${saving?'bg-gray-400':'bg-orange-500 hover:bg-orange-600'}`}
              >{saving?'保存中...':'保存する'}</motion.button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;


