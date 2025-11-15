import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showAlert, getTelegramTheme } from '../telegram';
import { api } from '../api/client';
import { Header, List, Cell, Button, Loading } from '../components';

export function Build() {
    const navigate = useNavigate();
    const [parts, setParts] = useState<any>(null);
    const [step, setStep] = useState<'gpu' | 'cpu' | 'mb'>('gpu');
    const [selectedGPU, setSelectedGPU] = useState<number | null>(null);
    const [selectedCPU, setSelectedCPU] = useState<number | null>(null);
    const [selectedMB, setSelectedMB] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = getTelegramTheme();

    useEffect(() => {
        const telegramUser = getTelegramUser();
        if (!telegramUser) return;

        setupBackButton(() => navigate('/'));
        loadParts(telegramUser.id);

        return () => {
            hideBackButton();
        };
    }, [navigate]);

    const loadParts = async (userId: number) => {
        try {
            const response = await api.getAvailablePCParts(userId);
            setParts(response);
        } catch (error) {
            console.error('Error loading parts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuild = async () => {
        if (!selectedGPU || !selectedCPU || !selectedMB) return;

        const telegramUser = getTelegramUser();
        if (!telegramUser) return;

        try {
            await api.buildPC(telegramUser.id, selectedGPU, selectedCPU, selectedMB);
            showAlert('ПК успешно собран!');
            navigate('/pcs');
        } catch (error: any) {
            showAlert(error.message || 'Ошибка при сборке ПК');
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!parts) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.isDark ? '#ffffff' : '#000000' }}>
                Ошибка загрузки
            </div>
        );
    }

    const hasAllParts = parts['Graphics Card']?.length > 0 && 
                                        parts['Processor']?.length > 0 && 
                                        parts['Motherboard']?.length > 0;

    if (!hasAllParts) {
        return (
            <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
                <Header>🖥️ Сборка ПК</Header>
                <div style={{ padding: '16px' }}>
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: theme.isDark ? '#8e8e93' : '#8e8e93'
                    }}>
                        У вас нет всех необходимых деталей для сборки ПК.
                    </div>
                    <Button onClick={() => navigate('/')} fullWidth>
                        Назад
                    </Button>
                </div>
            </div>
        );
    }

    const getSelectedPartName = (partId: number | null, category: string) => {
        if (!partId || !parts[category]) return null;
        return parts[category].find((p: any) => p.card_id === partId)?.gadget_name;
    };

    return (
        <div style={{ backgroundColor: theme.isDark ? '#000000' : '#f7f7f8', minHeight: '100vh' }}>
            <Header>🖥️ Сборка ПК</Header>
      
            <div style={{ padding: '16px' }}>
                {step === 'gpu' && (
                    <div>
                        <div style={{ 
                            marginBottom: '16px',
                            fontSize: '16px',
                            color: theme.isDark ? '#ffffff' : '#000000'
                        }}>
                            Шаг 1: Выберите видеокарту
                        </div>
                        <List>
                            {parts['Graphics Card'].map((gpu: any, index: number) => (
                                <Cell
                                    key={gpu.card_id}
                                    onClick={() => {
                                        setSelectedGPU(gpu.card_id);
                                        setStep('cpu');
                                    }}
                                    after="→"
                                    index={index}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                            {gpu.gadget_name}
                                        </div>
                                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                            {gpu.rarity}
                                        </div>
                                    </div>
                                </Cell>
                            ))}
                        </List>
                    </div>
                )}

                {step === 'cpu' && selectedGPU && (
                    <div>
                        <div style={{ 
                            marginBottom: '16px',
                            fontSize: '16px',
                            color: theme.isDark ? '#ffffff' : '#000000'
                        }}>
                            Шаг 2: Выберите процессор
                        </div>
                        {getSelectedPartName(selectedGPU, 'Graphics Card') && (
                            <div style={{ 
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: theme.isDark ? '#8e8e93' : '#8e8e93'
                            }}>
                                Выбрана видеокарта: {getSelectedPartName(selectedGPU, 'Graphics Card')}
                            </div>
                        )}
                        <List>
                            {parts['Processor'].map((cpu: any, index: number) => (
                                <Cell
                                    key={cpu.card_id}
                                    onClick={() => {
                                        setSelectedCPU(cpu.card_id);
                                        setStep('mb');
                                    }}
                                    after="→"
                                    index={index}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                            {cpu.gadget_name}
                                        </div>
                                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                            {cpu.rarity}
                                        </div>
                                    </div>
                                </Cell>
                            ))}
                        </List>
                        <Button onClick={() => setStep('gpu')} variant="secondary" fullWidth style={{ marginTop: '16px' }}>
                            Назад
                        </Button>
                    </div>
                )}

                {step === 'mb' && selectedGPU && selectedCPU && (
                    <div>
                        <div style={{ 
                            marginBottom: '16px',
                            fontSize: '16px',
                            color: theme.isDark ? '#ffffff' : '#000000'
                        }}>
                            Шаг 3: Выберите материнскую плату
                        </div>
                        <div style={{ 
                            marginBottom: '12px',
                            padding: '12px',
                            backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: theme.isDark ? '#8e8e93' : '#8e8e93'
                        }}>
                            <div>Видеокарта: {getSelectedPartName(selectedGPU, 'Graphics Card')}</div>
                            <div>Процессор: {getSelectedPartName(selectedCPU, 'Processor')}</div>
                        </div>
                        <List>
                            {parts['Motherboard'].map((mb: any, index: number) => (
                                <Cell
                                    key={mb.card_id}
                                    onClick={() => setSelectedMB(mb.card_id)}
                                    index={index}
                                    after={selectedMB === mb.card_id ? '✓' : undefined}
                                    style={{
                                        backgroundColor: selectedMB === mb.card_id 
                                            ? (theme.isDark ? '#2c2c2e' : '#e5f4ff') 
                                            : undefined
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                            {mb.gadget_name}
                                        </div>
                                        <div style={{ fontSize: '14px', color: theme.isDark ? '#8e8e93' : '#8e8e93' }}>
                                            {mb.rarity}
                                        </div>
                                    </div>
                                </Cell>
                            ))}
                        </List>
                        <Button onClick={() => setStep('cpu')} variant="secondary" fullWidth style={{ marginTop: '16px' }}>
                            Назад
                        </Button>
                        {selectedMB && (
                            <Button 
                                onClick={handleBuild}
                                fullWidth
                                style={{ marginTop: '12px' }}
                            >
                                Собрать ПК
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

