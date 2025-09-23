import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';

const MyPage = () => {
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState('profile'); // 'profile' | 'allergy'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [familyCount, setFamilyCount] = useState(0);
  const navigate = useNavigate();
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', birthday: '', notes: '' });

  // profile
  const [profile, setProfile] = useState({ name: '' });

  // context allergy icons
  const { allergyOptions, applyAllergyTarget, activeAllergyTarget } = useRestaurant();

  // allergy settings (selected target)
  const [selectedTarget, setSelectedTarget] = useState({ profileType: 'user', id: null, label: '本人' });
  const [targets, setTargets] = useState([]); // [{profileType:'user'|'member', id, label}]
  const [selectedAllergies, setSelectedAllergies] = useState([]); // normal
  const [selectedFragranceAllergies, setSelectedFragranceAllergies] = useState([]); // fragrance: collapsed section
  const [fragranceOpen, setFragranceOpen] = useState(false);

  useEffect(() => {
    const loadTargetsAndCounts = async (uid, profName) => {
      // build targets: user + family
      const targetsList = [{ profileType: 'user', id: uid, label: profName || '本人' }];
      const { data: fams } = await supabase
        .from('family_members')
        .select('id,name')
        .eq('user_id', uid)
        .order('id');
      if (Array.isArray(fams)) {
        fams.forEach(f => targetsList.push({ profileType: 'member', id: f.id, label: f.name || `家族${f.id}` }));
      }
      setTargets(targetsList);
      const { count } = await supabase
        .from('family_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid);
      setFamilyCount(count || 0);
    };

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

        await loadTargetsAndCounts(uid, prof?.name);
        setSelectedTarget({ profileType: 'user', id: uid, label: prof?.name || '本人' });

        // load allergy settings for user as initial
        const { data: aset } = await supabase
          .from('allergy_settings')
          .select('selected_allergies')
          .eq('profile_type', 'user')
          .eq('profile_id', uid)
          .maybeSingle();
        if (aset?.selected_allergies) {
          const all = Array.isArray(aset.selected_allergies) ? aset.selected_allergies : [];
          const normal = all.filter(a => typeof a === 'string' && !a.startsWith('fragrance:'));
          const frag = all.filter(a => typeof a === 'string' && a.startsWith('fragrance:')).map(a => a.replace('fragrance:', ''));
          setSelectedAllergies(normal);
          setSelectedFragranceAllergies(frag);
        }
      } catch (e) {
        setError(e?.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    init();
    // 再表示・フォーカス時に家族を再取得
    const onFocus = async () => {
      if (!userId) return;
      const { data: prof } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle();
      await loadTargetsAndCounts(userId, prof?.name);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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
    if (!userId || !selectedTarget?.id) return;
    setSaving(true);
    setError('');
    try {
      const payloadSelected = [
        ...selectedAllergies,
        ...selectedFragranceAllergies.map(a => `fragrance:${a}`)
      ];
      const isUser = selectedTarget.profileType === 'user';
      const match = isUser
        ? { profile_type: 'user', profile_id: selectedTarget.id }
        : { profile_type: 'member', member_id: selectedTarget.id };
      const { data: existing } = await supabase
        .from('allergy_settings')
        .select('id')
        .match(match)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('allergy_settings')
          .update({ selected_allergies: payloadSelected })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('allergy_settings')
          .insert([{ ...match, profile_type: match.profile_type, selected_allergies: payloadSelected }]);
      }
    } catch (e) {
      setError(e?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleTargetChange = async (e) => {
    const key = e.target.value; // e.g., 'user:uuid' or 'member:123'
    const [ptype, idStr] = key.split(':');
    const idVal = ptype === 'user' ? idStr : Number(idStr);
    const label = targets.find(t => t.profileType === ptype && String(t.id) === String(idVal))?.label || '';
    setSelectedTarget({ profileType: ptype, id: idVal, label });
    // load settings for selected target
    try {
      const match = ptype === 'user'
        ? { profile_type: 'user', profile_id: idVal }
        : { profile_type: 'member', member_id: idVal };
      const { data: aset } = await supabase
        .from('allergy_settings')
        .select('selected_allergies')
        .match(match)
        .maybeSingle();
      if (aset?.selected_allergies) {
        const all = Array.isArray(aset.selected_allergies) ? aset.selected_allergies : [];
        const normal = all.filter(a => typeof a === 'string' && !a.startsWith('fragrance:'));
        const frag = all.filter(a => typeof a === 'string' && a.startsWith('fragrance:')).map(a => a.replace('fragrance:', ''));
        setSelectedAllergies(normal);
        setSelectedFragranceAllergies(frag);
      } else {
        setSelectedAllergies([]);
        setSelectedFragranceAllergies([]);
      }
    } catch (_) {
      setSelectedAllergies([]);
      setSelectedFragranceAllergies([]);
    }
  };

  const toggleNormal = (id) => {
    setSelectedAllergies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleFragrance = (id) => {
    setSelectedFragranceAllergies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">本人プロフィール</h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddFamily(true)}
                  disabled={familyCount >= 10}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${familyCount>=10 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                  title={familyCount>=10 ? '家族追加は最大10人までです' : '家族を追加'}
                >
                  ＋ 家族を追加
                </button>
              </div>
            </div>
            {showAddFamily && (
              <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">家族を追加</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">お名前</label>
                    <input value={newMember.name} onChange={(e)=>setNewMember({...newMember, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">お誕生日</label>
                    <input type="date" value={newMember.birthday} onChange={(e)=>setNewMember({...newMember, birthday: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">メモ</label>
                    <input value={newMember.notes} onChange={(e)=>setNewMember({...newMember, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                    onClick={async ()=>{
                      if (!userId || !newMember.name.trim()) return;
                      const { error } = await supabase.from('family_members').insert([{
                        user_id: userId,
                        name: newMember.name.trim(),
                        birthday: newMember.birthday || null,
                        notes: newMember.notes || null
                      }]);
                      if (!error) {
                        setNewMember({ name: '', birthday: '', notes: '' });
                        setShowAddFamily(false);
                        // refresh
                        const { data: prof } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle();
                        // reuse internal loader defined above is out of scope; re-run minimal refresh
                        const { data: fams } = await supabase
                          .from('family_members')
                          .select('id,name')
                          .eq('user_id', userId)
                          .order('id');
                        const targetsList = [{ profileType: 'user', id: userId, label: prof?.name || '本人' }];
                        if (Array.isArray(fams)) fams.forEach(f => targetsList.push({ profileType: 'member', id: f.id, label: f.name || `家族${f.id}` }));
                        setTargets(targetsList);
                        const { count } = await supabase
                          .from('family_members')
                          .select('id', { count: 'exact', head: true })
                          .eq('user_id', userId);
                        setFamilyCount(count || 0);
                      }
                    }}
                  >追加する</button>
                  <button type="button" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={()=>setShowAddFamily(false)}>キャンセル</button>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-700 mb-4">おこさまのお名前を追加し、アレルギー設定を変更できます（最大10人）。現在: {familyCount}人</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">アレルギー設定（本人）</h2>
            <p className="text-sm text-gray-700 mb-2">対象の名前を選択して、アレルギーを除去したいアイコンを選択してください。</p>
            <div className="mb-4 text-xs text-gray-600">
              現在の適用対象: {activeAllergyTarget ? `${activeAllergyTarget.label}` : '設定をしない（未適用）'}
            </div>
            <form onSubmit={saveAllergy} className="space-y-5">
              {/* target selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象</label>
                <select
                  value={`${selectedTarget.profileType}:${selectedTarget.id ?? ''}`}
                  onChange={handleTargetChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={`none:`}>設定をしない</option>
                  {targets.map(t => (
                    <option key={`${t.profileType}:${t.id}`} value={`${t.profileType}:${t.id}`}>{t.label}</option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={()=>applyAllergyTarget(selectedTarget)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">この対象を現在の検索に適用</button>
                  <button type="button" onClick={()=>applyAllergyTarget(null)} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">設定をしない</button>
                </div>
              </div>

              {/* normal allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">除去したいアレルギー</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {allergyOptions.map(a => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleNormal(a.id)}
                      className={`p-2 rounded-lg border-2 text-xs transition-all ${selectedAllergies.includes(a.id) ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 hover:border-red-300'}`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{a.icon}</div>
                        <div className="font-medium">{a.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* fragrance collapsible */}
              <div>
                <button type="button" onClick={()=>setFragranceOpen(prev=>!prev)} className="w-full flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm font-medium text-yellow-900">香料にふくむ</span>
                  <span className="text-xs text-yellow-700">{fragranceOpen ? '閉じる' : 'クリックで表示'}</span>
                </button>
                {fragranceOpen && (
                  <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {allergyOptions.map(a => (
                      <button
                        type="button"
                        key={`frag-${a.id}`}
                        onClick={() => toggleFragrance(a.id)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${selectedFragranceAllergies.includes(a.id) ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white border-gray-200 hover:border-yellow-300'}`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{a.icon}</div>
                          <div className="font-medium">{a.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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


