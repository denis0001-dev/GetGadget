import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, setupBackButton, hideBackButton, showAlert } from '../telegram';
import { api } from '../api/client';

function Build() {
  const navigate = useNavigate();
  const [parts, setParts] = useState<any>(null);
  const [step, setStep] = useState<'gpu' | 'cpu' | 'mb'>('gpu');
  const [selectedGPU, setSelectedGPU] = useState<number | null>(null);
  const [selectedCPU, setSelectedCPU] = useState<number | null>(null);
  const [selectedMB, setSelectedMB] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
      setParts(response.data);
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
      showAlert(error.response?.data?.detail || 'Ошибка при сборке ПК');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!parts) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Ошибка загрузки</div>;
  }

  const hasAllParts = parts['Graphics Card']?.length > 0 && 
                     parts['Processor']?.length > 0 && 
                     parts['Motherboard']?.length > 0;

  if (!hasAllParts) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🖥️ Сборка ПК</h1>
        <p>У вас нет всех необходимых деталей для сборки ПК.</p>
        <button onClick={() => navigate('/')} style={{ padding: '12px', fontSize: '16px' }}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🖥️ Сборка ПК</h1>
      
      {step === 'gpu' && (
        <div>
          <h2>Шаг 1: Выберите видеокарту</h2>
          {parts['Graphics Card'].map((gpu: any) => (
            <button
              key={gpu.card_id}
              onClick={() => {
                setSelectedGPU(gpu.card_id);
                setStep('cpu');
              }}
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '12px', 
                marginBottom: '10px',
                fontSize: '16px'
              }}
            >
              {gpu.gadget_name} ({gpu.rarity})
            </button>
          ))}
        </div>
      )}

      {step === 'cpu' && selectedGPU && (
        <div>
          <h2>Шаг 2: Выберите процессор</h2>
          <p>Выбрана видеокарта: {parts['Graphics Card'].find((g: any) => g.card_id === selectedGPU)?.gadget_name}</p>
          {parts['Processor'].map((cpu: any) => (
            <button
              key={cpu.card_id}
              onClick={() => {
                setSelectedCPU(cpu.card_id);
                setStep('mb');
              }}
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '12px', 
                marginBottom: '10px',
                fontSize: '16px'
              }}
            >
              {cpu.gadget_name} ({cpu.rarity})
            </button>
          ))}
          <button onClick={() => setStep('gpu')} style={{ padding: '12px', fontSize: '16px', marginTop: '10px' }}>
            Назад
          </button>
        </div>
      )}

      {step === 'mb' && selectedGPU && selectedCPU && (
        <div>
          <h2>Шаг 3: Выберите материнскую плату</h2>
          <p>Видеокарта: {parts['Graphics Card'].find((g: any) => g.card_id === selectedGPU)?.gadget_name}</p>
          <p>Процессор: {parts['Processor'].find((c: any) => c.card_id === selectedCPU)?.gadget_name}</p>
          {parts['Motherboard'].map((mb: any) => (
            <button
              key={mb.card_id}
              onClick={() => {
                setSelectedMB(mb.card_id);
              }}
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '12px', 
                marginBottom: '10px',
                fontSize: '16px',
                backgroundColor: selectedMB === mb.card_id ? '#4CAF50' : undefined
              }}
            >
              {mb.gadget_name} ({mb.rarity})
            </button>
          ))}
          <button onClick={() => setStep('cpu')} style={{ padding: '12px', fontSize: '16px', marginTop: '10px' }}>
            Назад
          </button>
          {selectedMB && (
            <button 
              onClick={handleBuild}
              style={{ 
                padding: '12px', 
                fontSize: '16px', 
                marginTop: '10px',
                width: '100%',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              Собрать ПК
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Build;

