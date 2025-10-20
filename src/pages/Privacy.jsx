import React from 'react';
import { useLocation } from 'react-router-dom';

const Privacy = () => {
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
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-sm leading-7 text-gray-800">
          <p>本プライバシーポリシーは、EATtoo（以下「本サービス」）における利用者の個人情報の取扱い方針を定めるものです。</p>
          <h2 className="font-semibold mt-4">1. 収集する情報</h2>
          <p>メールアドレス、氏名、アレルギー設定、問い合わせ内容等を取得する場合があります。</p>
          <h2 className="font-semibold mt-4">2. 利用目的</h2>
          <ul className="list-disc pl-5">
            <li>アカウントの作成と認証</li>
            <li>本サービスの提供・改善</li>
            <li>問い合わせ対応</li>
          </ul>
          <h2 className="font-semibold mt-4">3. 第三者提供</h2>
          <p>法令に基づく場合を除き、本人の同意なく第三者に提供しません。</p>
          <h2 className="font-semibold mt-4">4. セキュリティ</h2>
          <p>適切な安全管理措置を講じ、個人情報の漏えい等の防止に努めます。</p>
          <h2 className="font-semibold mt-4">5. 開示・訂正・削除</h2>
          <p>本人からの請求に応じ、保有個人データの開示・訂正・削除等に対応します。</p>
          <h2 className="font-semibold mt-4">6. 改定</h2>
          <p>本ポリシーは予告なく改定される場合があります。改定後は本サービス上に掲示した時点で効力を生じます。</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;


