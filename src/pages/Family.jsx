import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const Family = () => {
  const [userId, setUserId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', birthday: '', notes: '' });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id || null;
        setUserId(uid);
        if (uid) {
          await loadMembers(uid);
        }
      } catch (e) {
        setError(e?.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadMembers = async (uid) => {
    const { data, error: err } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', uid)
      .order('id', { ascending: true });
    if (!err) setMembers(data || []);
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.name.trim()) {
      setError('お子さまのお名前を入力してください');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        user_id: userId,
        name: form.name.trim(),
        birthday: form.birthday || null,
        notes: form.notes || null,
      };
      const { error: insErr } = await supabase.from('family_members').insert([payload]);
      if (insErr) throw insErr;
      setForm({ name: '', birthday: '', notes: '' });
      await loadMembers(userId);
    } catch (e) {
      setError(e?.message || '追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (id) => {
    if (!confirm('削除してよろしいですか？')) return;
    try {
      const { error: delErr } = await supabase.from('family_members').delete().eq('id', id);
      if (delErr) throw delErr;
      await loadMembers(userId);
    } catch (e) {
      alert(e?.message || '削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">家族管理</h1>
        <p className="text-sm text-gray-600 mb-6">お子さまの情報を追加して、アレルギー設定を個別に管理できます。</p>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">お子さまを追加</h2>
          <form onSubmit={addMember} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お名前（必須）</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例）太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例）アレルギー症状の傾向など"
              />
            </div>
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${submitting ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {submitting ? '追加中...' : '追加する'}
              </motion.button>
            </div>
          </form>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">登録済み</h2>
          {loading ? (
            <p className="text-gray-600">読み込み中...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-600">まだ登録がありません。</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {members.map((m) => (
                <li key={m.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-sm text-gray-500">{m.birthday || '—'}</div>
                    {m.notes && <div className="text-sm text-gray-600 mt-1">{m.notes}</div>}
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Family;


