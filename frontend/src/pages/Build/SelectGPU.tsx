import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AvailableParts } from '@/lib/api';

export default function SelectGPU() {
  const [parts, setParts] = useState<AvailableParts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getAvailableParts()
      .then((data) => setParts(data.parts))
      .catch((e: unknown) => {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error.message || 'Error');
      })
      .finally(() => setLoading(false));
  }, []);

  const gpus = useMemo(() => (parts?.['Graphics Card'] ?? []), [parts]);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="surface" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Шаг 1: Выбери видеокарту</h3>
      </div>
      {loading && <div className="surface" style={{ padding: 16 }}>Загрузка...</div>}
      {error && <div className="surface" style={{ padding: 16, color: '#f55' }}>{error}</div>}
      {gpus.map((c) => (
        <button key={c.card_id} className="surface" style={{ padding: 16, textAlign: 'left' }} onClick={() => navigate(`/build/cpu?gpu=${c.card_id}`)}>
          {c.gadget_name} — {c.rarity}
        </button>
      ))}
    </div>
  );
}


