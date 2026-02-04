import React, { useEffect, useMemo, useRef, useState } from 'react';

// 汎用カルーセル: 自動再生、スワイプ、矢印対応
// props:
// - items: 表示する要素配列（任意のJSX要素）
// - autoIntervalMs: 自動送り間隔（ミリ秒）
// - itemsPerViewDesktop: PC表示での同時表示数
// - itemsPerViewMobile: モバイル表示での同時表示数（通常1）
// - className: ラッパーの追加クラス
export default function AutoCarousel({
  items = [],
  autoIntervalMs = 5000,
  itemsPerViewDesktop = 3,
  itemsPerViewMobile = 1,
  className = ''
}) {
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const isMobile = viewportWidth < 768; // tailwind mdブレークポイントに準拠

  const itemsPerView = isMobile ? itemsPerViewMobile : itemsPerViewDesktop;
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerView)));
  const [pageIndex, setPageIndex] = useState(0);

  const pages = useMemo(() => {
    if (items.length === 0) return [];
    const result = [];
    for (let i = 0; i < items.length; i += itemsPerView) {
      result.push(items.slice(i, i + itemsPerView));
    }
    return result;
  }, [items, itemsPerView]);

  // 自動送り
  useEffect(() => {
    if (totalPages <= 1) return; // ページが1枚なら不要
    if (isHovering) return; // ホバー中は停止
    const id = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages);
    }, autoIntervalMs);
    return () => clearInterval(id);
  }, [autoIntervalMs, totalPages, isHovering]);

  // リサイズ
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // スワイプ対応（モバイル）
  const touchStartXRef = useRef(null);
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    // ここでは位置だけ記録（慣性等は不要）
  };
  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    const startX = touchStartXRef.current;
    if (startX == null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = endX - startX;
    const threshold = 40; // スワイプ判定
    if (delta > threshold) {
      // 右スワイプ → 前ページ
      setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
    } else if (delta < -threshold) {
      // 左スワイプ → 次ページ
      setPageIndex((prev) => (prev + 1) % totalPages);
    }
    touchStartXRef.current = null;
  };

  // 矢印操作
  const goPrev = () => setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const goNext = () => setPageIndex((prev) => (prev + 1) % totalPages);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      ref={containerRef}
    >
      {/* スライド本体 */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${pageIndex * 100}%)` }}
        >
          {pages.map((pageItems, idx) => (
            <div key={idx} className="flex-none w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
              {pageItems.map((el, i) => (
                <div key={i} className="w-full md:h-full flex flex-col">
                  {el}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 矢印 */}
      {totalPages > 1 && (
        <>
          <button
            type="button"
            aria-label="previous"
            onClick={goPrev}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow"
          >
            <span className="text-xl">&#8249;</span>
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={goNext}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow"
          >
            <span className="text-xl">&#8250;</span>
          </button>
        </>
      )}

      {/* ページドット（モバイル表示補助） */}
      {totalPages > 1 && (
        <div className="mt-4 flex md:hidden items-center justify-center space-x-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPageIndex(i)}
              className={`w-2.5 h-2.5 rounded-full ${i === pageIndex ? 'bg-gray-800' : 'bg-gray-300'}`}
              aria-label={`page-${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


