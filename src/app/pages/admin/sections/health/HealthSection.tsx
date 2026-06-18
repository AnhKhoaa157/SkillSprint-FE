import { useEffect, useState, useMemo } from "react";
import healthService from "../../../../../api/system/healthService";
import { BrandLogo } from "../../../../components/layout/BrandLogo";

type HistoryItem = { ts: string; payload: any; status: 'up' | 'down' | 'unknown' };

export default function AdminHealth() {
  const [status, setStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [last, setLast] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const off = healthService.subscribeHealth((s: any) => {
      setStatus(s);
    });
    // initial probe
    healthService.probeHealth().then((p) => {
      setLast(p);
      const entry: HistoryItem = { ts: p.timestamp || new Date().toISOString(), payload: p, status: (p.status === 'UP' ? 'up' : 'down') };
      setHistory((h) => [entry, ...h].slice(0, 50));
    }).catch(() => {});
    return () => off();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const p = await healthService.probeHealth();
      setLast(p);
      const entry: HistoryItem = { ts: p.timestamp || new Date().toISOString(), payload: p, status: (p.status === 'UP' ? 'up' : 'down') };
      setHistory((h) => [entry, ...h].slice(0, 50));
    } catch (e) {
      const entry: HistoryItem = { ts: new Date().toISOString(), payload: { error: String(e) }, status: 'down' };
      setHistory((h) => [entry, ...h].slice(0, 50));
      setStatus('down');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = history.length;
    const failures = history.filter(h => h.status === 'down').length;
    return { total, failures };
  }, [history]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size={28} textColor="#0F172A" showText={false} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>System Health</div>
            <div style={{ color: '#6B7280', fontSize: 13 }}>Tổng quan trạng thái hệ thống</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={refresh} disabled={loading} style={{ background: '#FF6B00', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 900ms linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" strokeOpacity="0.18" fill="none" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            )}
            <span>{loading ? 'Đang kiểm tra' : 'Kiểm tra ngay'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E6EEF6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: status === 'up' ? '#22c55e' : status === 'down' ? '#ef4444' : '#94A3B8', boxShadow: status === 'up' ? '0 0 6px #22c55e' : status === 'down' ? '0 0 6px #ef4444' : 'none' }} />
            <div>
              <div style={{ fontWeight: 800 }}>{status === 'up' ? 'Ổn định' : status === 'down' ? 'Sự cố' : 'Đang kiểm tra'}</div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{last?.service ? `${last.service}` : 'Không có dữ liệu chi tiết'}</div>
            </div>
            <div className="sr-only" aria-live="polite">{status === 'up' ? 'Hệ thống ổn định' : status === 'down' ? 'Sự cố hệ thống' : 'Đang kiểm tra'}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Last payload</div>
            <pre style={{ fontSize: 12, background: '#F9FAFB', padding: 10, borderRadius: 8, overflowX: 'auto' }}>{last ? JSON.stringify(last, null, 2) : 'Chưa có kết quả'}</pre>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 12, border: '1px solid #E6EEF6' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Quick stats</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stats.total} checks · {stats.failures} failures</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 12, border: '1px solid #E6EEF6', maxHeight: 240, overflow: 'auto' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>History</div>
            {history.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: 13 }}>Chưa có lịch sử</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((h, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 700 }}>{h.status === 'up' ? 'OK' : 'FAIL'}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(h.ts).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 200, textAlign: 'right' }}>{h.payload?.service || h.payload?.error || ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
