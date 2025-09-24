import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <span className="text-lg">🍦</span>
          <span className="font-semibold text-gray-800">CanIEatOo?</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/terms" state={{ fromHome: true }} className="hover:text-gray-900">利用規約</Link>
          <Link to="/privacy" state={{ fromHome: true }} className="hover:text-gray-900">プライバシーポリシー</Link>
          <Link to="/contact" state={{ fromHome: true }} className="hover:text-gray-900">お問合せ</Link>
        </nav>
        <div className="text-xs text-gray-400">© {new Date().getFullYear()} CanIEatOo?</div>
      </div>
    </footer>
  );
};

export default Footer;


