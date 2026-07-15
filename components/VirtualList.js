import { useState, useRef, useMemo } from 'react';

function computeVisibleRange(scrollTop, viewportHeight, itemHeight, totalItems, overscan = 5) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
  return { startIndex, endIndex, offsetTop: startIndex * itemHeight, totalHeight: totalItems * itemHeight };
}

// VirtualList: render mượt danh sách lớn (1000+ dòng) bằng cách CHỈ vẽ đúng
// phần đang hiển thị trên màn hình + 1 lớp đệm an toàn (overscan), thay vì vẽ
// toàn bộ danh sách vào DOM cùng lúc (nguyên nhân chính gây giật/lag).
export default function VirtualList({ items, itemHeight = 80, viewportHeight = 600, renderItem }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const { startIndex, endIndex, offsetTop, totalHeight } = useMemo(
    () => computeVisibleRange(scrollTop, viewportHeight, itemHeight, items.length),
    [scrollTop, viewportHeight, itemHeight, items.length]
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height: viewportHeight, overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetTop, left: 0, right: 0 }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
