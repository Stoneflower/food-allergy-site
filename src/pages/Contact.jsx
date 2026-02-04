import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const Contact = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const location = useLocation();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);
      if (error) throw error;

      // メール転送（Resend直接接続）
      try {
        const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
        const MAIL_TO = import.meta.env.VITE_MAIL_TO;
        const MAIL_FROM = import.meta.env.VITE_MAIL_FROM || 'noreply@onresend.com';
        
        if (RESEND_API_KEY && MAIL_TO) {
          const subject = `【お問い合わせ】EATtoo から`;
          const header = '表示に問題があったり、こういうふうにしてほしいなど、ありましたらお送りください。\nお礼のメールもモチベーションに繋がるので、絶賛受付中です。\n\n';
          const text = `${header}お名前: ${name}\nメール: ${email}\n\n本文:\n${message}`;
          const html = `
            <div>
              <p>${header.replace(/\n/g, '<br/>')}</p>
              <p><strong>お名前:</strong> ${name}<br/>
              <strong>メール:</strong> ${email}</p>
              <p><strong>本文:</strong><br/>${(message || '').replace(/\n/g, '<br/>')}</p>
            </div>
          `;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: MAIL_FROM,
              to: MAIL_TO,
              subject,
              text,
              html,
            }),
          });
        }
      } catch (err) {
        console.warn(t('contact.messages.emailForwardFailed'), err);
      }
      setDone(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error(t('contact.messages.submitError'), err);
      alert(t('contact.messages.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('contact.title')}</h1>
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">
          {t('contact.description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={t('contact.form.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={t('contact.form.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.message')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={t('contact.form.messagePlaceholder')}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-colors ${submitting ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'}`}
            >
              {submitting ? t('contact.buttons.submitting') : (done ? t('contact.buttons.submitted') : t('contact.buttons.submit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;


