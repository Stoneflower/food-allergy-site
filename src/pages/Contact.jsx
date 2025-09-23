import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);
      if (error) throw error;

      // メール転送（Resend via Netlify Functions）
      try {
        await fetch('/.netlify/functions/contact-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        });
      } catch (err) {
        console.warn('メール転送に失敗しました（Resend）:', err);
      }
      setDone(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('お問い合わせ送信エラー:', err);
      alert('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">
          表示に問題があったり、こういうふうにしてほしいなど、ありましたらお送りください。
          お礼のメールもモチベーションに繋がるので、絶賛受付中です。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メール</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="お問い合わせ内容をご記入ください"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-colors ${submitting ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'}`}
            >
              {submitting ? '送信中...' : (done ? '送信しました。ありがとうございます！' : '送信する')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;


