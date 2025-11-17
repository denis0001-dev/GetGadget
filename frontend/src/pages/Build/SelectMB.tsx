import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, AvailableParts } from '@/lib/api';

export default function SelectMB() {
    const [parts, setParts] = useState<AvailableParts | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params] = useSearchParams();
    const gpu = Number(params.get('gpu') || 0);
    const cpu = Number(params.get('cpu') || 0);
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

    const mbs = useMemo(() => (parts?.['Motherboard'] ?? []), [parts]);

    const onSelect = async (mbId: number) => {
        try {
            const r = await api.buildPC(gpu, cpu, mbId);
            navigate(`/pcs/${r.pc.card_id}`);
        } catch (e: unknown) {
            const error = e instanceof Error ? e : new Error(String(e));
            setError(error.message || 'Error');
        }
    };

    return (
        <div style={{ display: 'grid', gap: 10 }}>
            <div className="surface" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Шаг 3: Выбери материнскую плату</h3>
            </div>
            {loading && <div className="surface" style={{ padding: 16 }}>Загрузка...</div>}
            {error && <div className="surface" style={{ padding: 16, color: '#f55' }}>{error}</div>}
            {mbs.map((c) => (
                <button key={c.card_id} className="surface" style={{ padding: 16, textAlign: 'left' }} onClick={() => onSelect(c.card_id)}>
                {c.gadget_name} — {c.rarity}
                </button>
            ))}
            <button className="btn" onClick={() => navigate(`/build/cpu?gpu=${gpu}`)}>Назад</button>
        </div>
    );
}


