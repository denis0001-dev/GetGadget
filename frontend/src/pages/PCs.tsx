import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, List, Cell, Loading, Button } from '../components';

export function PCs() {
    const navigate = useNavigate();
    const [pcs, setPCs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = getTelegramTheme();

    useEffect(() => {
        const telegramUser = getTelegramUser();
        if (!telegramUser) return;

        setupBackButton(() => navigate('/'));
        loadPCs(telegramUser.id);

        return () => {
            hideBackButton();
        };
    }, [navigate]);

    const loadPCs = async (userId: number) => {
        try {
            const response = await api.getUserPCs(userId);
            setPCs(response.pcs || []);
        } catch (error) {
            console.error('Error loading PCs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (pcs.length === 0) {
        return (
            <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
                <Header>🖥️ Мои ПК</Header>
                <div style={{ padding: '16px' }}>
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: theme.isDark ? '#8e8e93' : '#8e8e93',
                        marginBottom: '16px'
                    }}>
                        У вас пока нет собранных ПК.
                    </div>
                    <Button onClick={() => navigate('/build')} fullWidth>
                        Собрать ПК
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>🖥️ Мои ПК</Header>
            <div style={{ padding: '16px' }}>
                <List>
                    {pcs.map((pc, index) => (
                        <Cell
                            key={pc.card_id}
                            onClick={() => navigate(`/pcs/${pc.card_id}`)}
                            index={index}
                            after="→"
                        >
                            <div>
                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                    {pc.gadget_name}
                                </div>
                                <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                    {pc.rarity} • {pc.purchase_price} монет
                                </div>
                            </div>
                        </Cell>
                    ))}
                </List>
            </div>
        </div>
    );
}

