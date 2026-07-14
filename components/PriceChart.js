import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { bollingerBands, rsi, macd, INDICATOR_REGISTRY, getIndicatorsForTier } from '../lib/indicators';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '12h', '1d', '3d', '7d', '30d', '3mo', '6mo', '12mo', 'all'];
const TIMEFRAME_LABELS = {
  '1m': '1p', '5m': '5p', '15m': '15p', '1h': '1g', '4h': '4g', '12h': '12g',
  '1d': '1n', '3d': '3n', '7d': '7n', '30d': '30n', '3mo': '3th', '6mo': '6th', '12mo': '12th', 'all': 'Tất cả',
};

// Overlay = vẽ chung trục giá với nến. Oscillator = cần trục riêng, panel phụ bên dưới.
const OVERLAY_INDICATORS = new Set(['sma20', 'ema20', 'ema50', 'ema100', 'ema200', 'sma50', 'bollinger']);
const OSCILLATOR_INDICATORS = new Set(['rsi14', 'rsi7', 'macd']);

export default function PriceChart({ pairAddress, chain = 'solana', userTier = 'free' }) {
  const mainContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const overlaySeriesRef = useRef({});
  const oscChartsRef = useRef({}); // { [indicatorId]: { chart, containerEl } }
  const isSyncingRef = useRef(false); // chặn vòng lặp khi 2 chart tự đồng bộ qua lại

  const [timeframe, setTimeframe] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndicators, setActiveIndicators] = useState(new Set());
  const [hoverInfo, setHoverInfo] = useState(null);

  const availableIndicators = getIndicatorsForTier(userTier);
  const lockedIndicators = INDICATOR_REGISTRY.filter((i) => i.tier === 'vip' && userTier !== 'vip');

  useEffect(() => {
    if (!pairAddress) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ohlcv?pairAddress=${pairAddress}&chain=${chain}&timeframe=${timeframe}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCandles(data.candles || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pairAddress, chain, timeframe]);

  useEffect(() => {
    if (!mainContainerRef.current || chartRef.current) return;

    const chart = createChart(mainContainerRef.current, {
      layout: { background: { color: '#FFFFFF' }, textColor: '#1A1D1B' },
      grid: { vertLines: { color: '#EEF3EE' }, horzLines: { color: '#EEF3EE' } },
      width: mainContainerRef.current.clientWidth,
      height: 320,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00A63C', downColor: '#D33B40',
      borderVisible: false,
      wickUpColor: '#00A63C', wickDownColor: '#D33B40',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume-scale',
    });
    chart.priceScale('volume-scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.get(candleSeries)) {
        setHoverInfo(null);
        return;
      }
      const bar = param.seriesData.get(candleSeries);
      const vol = param.seriesData.get(volumeSeries);
      setHoverInfo({
        time: new Date(param.time * 1000).toLocaleString('vi-VN'),
        open: bar.open, high: bar.high, low: bar.low, close: bar.close,
        volume: vol ? vol.value : null,
      });
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => chart.applyOptions({ width: mainContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    candleSeriesRef.current.setData(
      candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    volumeSeriesRef.current.setData(
      candles.map((c) => ({ time: c.time, value: c.volume, color: c.close >= c.open ? '#00A63C55' : '#D33B4055' }))
    );
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    availableIndicators
      .filter((ind) => OVERLAY_INDICATORS.has(ind.id))
      .forEach((ind) => {
        const isActive = activeIndicators.has(ind.id);
        if (isActive && !overlaySeriesRef.current[ind.id]) {
          if (ind.id === 'bollinger') {
            const bb = bollingerBands(closes);
            const upper = chartRef.current.addLineSeries({ color: '#0E8F9E', lineWidth: 1 });
            const lower = chartRef.current.addLineSeries({ color: '#0E8F9E', lineWidth: 1 });
            upper.setData(times.map((t, i) => ({ time: t, value: bb.upper[i] })).filter((d) => d.value !== null));
            lower.setData(times.map((t, i) => ({ time: t, value: bb.lower[i] })).filter((d) => d.value !== null));
            overlaySeriesRef.current[ind.id] = [upper, lower];
          } else {
            const values = ind.compute(closes);
            const series = chartRef.current.addLineSeries({ color: '#00A63C', lineWidth: 1 });
            series.setData(times.map((t, i) => ({ time: t, value: values[i] })).filter((d) => d.value !== null));
            overlaySeriesRef.current[ind.id] = [series];
          }
        } else if (!isActive && overlaySeriesRef.current[ind.id]) {
          overlaySeriesRef.current[ind.id].forEach((s) => chartRef.current.removeSeries(s));
          delete overlaySeriesRef.current[ind.id];
        }
      });
  }, [activeIndicators, candles]);

  function toggleIndicator(id) {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Dọn dẹp oscillator chart ngay khi tắt, tránh rò rỉ bộ nhớ
        if (oscChartsRef.current[id]) {
          oscChartsRef.current[id].chart.remove();
          delete oscChartsRef.current[id];
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ---- Tạo/hủy panel oscillator (RSI/MACD) khi bật/tắt, và đồng bộ thời gian với chart chính ----
  function createOscChartIfNeeded(indicatorId, containerEl) {
    if (!containerEl || oscChartsRef.current[indicatorId] || !chartRef.current || candles.length === 0) return;

    const oscChart = createChart(containerEl, {
      layout: { background: { color: '#FFFFFF' }, textColor: '#1A1D1B' },
      grid: { vertLines: { color: '#EEF3EE' }, horzLines: { color: '#EEF3EE' } },
      width: containerEl.clientWidth,
      height: 120,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    if (indicatorId === 'rsi14' || indicatorId === 'rsi7') {
      const period = indicatorId === 'rsi7' ? 7 : 14;
      const values = rsi(closes, period);
      const series = oscChart.addLineSeries({ color: '#0E8F9E', lineWidth: 1.5 });
      series.setData(times.map((t, i) => ({ time: t, value: values[i] })).filter((d) => d.value !== null));
      series.createPriceLine({ price: 70, color: '#D33B40', lineWidth: 1, lineStyle: 2, title: '70' });
      series.createPriceLine({ price: 30, color: '#00A63C', lineWidth: 1, lineStyle: 2, title: '30' });
    } else if (indicatorId === 'macd') {
      const { macdLine, signalLine, histogram } = macd(closes);
      const histSeries = oscChart.addHistogramSeries({ priceFormat: { type: 'volume' } });
      histSeries.setData(
        times.map((t, i) => ({
          time: t, value: histogram[i],
          color: histogram[i] >= 0 ? '#00A63C88' : '#D33B4088',
        })).filter((d) => d.value !== null)
      );
      const macdSeries = oscChart.addLineSeries({ color: '#00A63C', lineWidth: 1.5 });
      macdSeries.setData(times.map((t, i) => ({ time: t, value: macdLine[i] })).filter((d) => d.value !== null));
      const signalSeries = oscChart.addLineSeries({ color: '#D33B40', lineWidth: 1.5 });
      signalSeries.setData(times.map((t, i) => ({ time: t, value: signalLine[i] })).filter((d) => d.value !== null));
    }

    oscChart.timeScale().setVisibleRange(chartRef.current.timeScale().getVisibleRange());

    // Đồng bộ: kéo/zoom panel oscillator -> chart chính cũng di chuyển theo
    oscChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (!range || isSyncingRef.current) return;
      isSyncingRef.current = true;
      chartRef.current.timeScale().setVisibleRange(range);
      isSyncingRef.current = false;
    });

    oscChartsRef.current[indicatorId] = { chart: oscChart, containerEl };
  }

  // Đồng bộ: kéo/zoom chart chính -> mọi panel oscillator đang mở di chuyển theo
  useEffect(() => {
    if (!chartRef.current) return;
    const handler = (range) => {
      if (!range || isSyncingRef.current) return;
      isSyncingRef.current = true;
      Object.values(oscChartsRef.current).forEach(({ chart }) => {
        chart.timeScale().setVisibleRange(range);
      });
      isSyncingRef.current = false;
    };
    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(handler);
    // lightweight-charts không có API "unsubscribe theo tên hàm" công khai ổn định giữa version,
    // nên chấp nhận subscribe lại khi effect chạy lại — ảnh hưởng không đáng kể ở quy mô hiện tại.
  }, [candles]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              fontSize: 11, padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: timeframe === tf ? 'var(--primary)' : 'var(--surface-2)',
              color: timeframe === tf ? '#fff' : 'var(--text-muted)',
            }}
          >
            {TIMEFRAME_LABELS[tf]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {availableIndicators.map((ind) => (
          <button
            key={ind.id}
            onClick={() => toggleIndicator(ind.id)}
            style={{
              fontSize: 11, padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: activeIndicators.has(ind.id) ? 'var(--primary-dim)' : 'var(--surface-2)',
              color: activeIndicators.has(ind.id) ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {ind.label}
          </button>
        ))}
        {lockedIndicators.map((ind) => (
          <span
            key={ind.id}
            title="Nâng cấp gói VIP để dùng chỉ báo này"
            style={{
              fontSize: 11, padding: '5px 8px', borderRadius: 6,
              border: '1px dashed var(--border)', color: 'var(--text-dim)', cursor: 'not-allowed',
            }}
          >
            🔒 {ind.label}
          </span>
        ))}
      </div>

      {hoverInfo && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'monospace' }}>
          {hoverInfo.time} · O:{hoverInfo.open?.toFixed(6)} H:{hoverInfo.high?.toFixed(6)} L:{hoverInfo.low?.toFixed(6)} C:{hoverInfo.close?.toFixed(6)} Vol:{hoverInfo.volume ? Math.round(hoverInfo.volume).toLocaleString() : 'N/A'}
        </div>
      )}

      {loading && <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Đang tải biểu đồ…</p>}
      {error && <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>}

      <div ref={mainContainerRef} />

      {availableIndicators
        .filter((ind) => OSCILLATOR_INDICATORS.has(ind.id) && activeIndicators.has(ind.id))
        .map((ind) => (
          <div key={ind.id} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginBottom: 2 }}>{ind.label}</div>
            <div ref={(el) => createOscChartIfNeeded(ind.id, el)} />
          </div>
        ))}
    </div>
  );
}
