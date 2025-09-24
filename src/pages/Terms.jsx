import React from 'react';
import { useLocation } from 'react-router-dom';

const Terms = () => {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">利用規約</h1>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-sm leading-7 text-gray-800">
          <p>本利用規約（以下「本規約」）は、CanIEatOo?（以下「本サービス」）の提供条件および本サービスの利用に関する当社と利用者との間の権利義務関係を定めるものです。</p>
          <h2 className="font-semibold mt-4">1. 適用</h2>
          <p>本規約は、本サービスの利用に関わる一切の関係に適用されます。</p>
          <h2 className="font-semibold mt-4">2. アカウント</h2>
          <p>利用者は、正確な情報をもってアカウントを作成し、自己の責任で管理するものとします。</p>
          <h2 className="font-semibold mt-4">3. 禁止事項</h2>
          <ul className="list-disc pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>当社、他の利用者または第三者の権利を侵害する行為</li>
            <li>本サービスの運営を妨害する行為</li>
          </ul>
          <h2 className="font-semibold mt-4">4. 免責</h2>
          <p>当社は、本サービスに関して、正確性・完全性・有用性等につき保証するものではありません。利用者は自己責任で本サービスを利用するものとします。</p>
          <h2 className="font-semibold mt-4">5. 規約の変更</h2>
          <p>当社は、必要と判断した場合、本規約を変更できるものとします。変更後の規約は、本サービス上に表示した時点から効力を生じます。</p>
          <h2 className="font-semibold mt-4">6. 準拠法・裁判管轄</h2>
          <p>本規約は日本法に準拠し、紛争は当社所在地を管轄する裁判所を第一審の専属的合意管轄とします。</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;


