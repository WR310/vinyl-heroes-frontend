import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [workLoading, setWorkLoading] = useState(false)
  const [player, setPlayer] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [gachaLoading, setGachaLoading] = useState(false)
  const [drop, setDrop] = useState(null)

  // Словарь цветов для слотов
  const slotColors = {
    body: '#4a90e2', // Синий
    head: '#e67e22', // Оранжевый
    acc: '#9b59b6',  // Фиолетовый
    default: '#666'
  };

  const getSlotColor = (templateId) => {
    if (!templateId) return slotColors.default;
    const tid = templateId.toLowerCase();
    if (tid.includes('body')) return slotColors.body;
    if (tid.includes('head')) return slotColors.head;
    if (tid.includes('acc')) return slotColors.acc;
    return slotColors.default;
  };

  useEffect(() => {
    const savedDeviceId = localStorage.getItem('vinyl_device_id');
    if (savedDeviceId) {
      login(savedDeviceId);
    }
  }, []);

  const login = async (existingDeviceId = null) => {
    setLoading(true)
    try {
      let deviceId = typeof existingDeviceId === 'string' ? existingDeviceId : null;
      if (!deviceId) {
        deviceId = "device-" + Math.floor(Math.random() * 1000000);
        localStorage.setItem('vinyl_device_id', deviceId);
      }
      
      const response = await axios.post('/api/v1/auth/device', {
        device_id: deviceId
      });
      
      setPlayer(response.data);
      const playerId = response.data.player_id || response.data.id;
      loadInventory(playerId);
      
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      localStorage.removeItem('vinyl_device_id');
    } finally {
      setLoading(false);
    }
  }

  const loadInventory = async (playerId) => {
    try {
      const response = await axios.get(`/api/v1/inventory/${playerId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setInventory(data);
    } catch (error) {
      console.error("Ошибка загрузки инвентаря:", error);
      setInventory([]);
    }
  }

  const openBox = async () => {
    if (!player) return;
    setGachaLoading(true);
    setDrop(null);
    try {
      const playerId = player.player_id || player.id; 
      const response = await axios.post('/api/v1/gacha/open', {
        player_id: playerId
      });
      
      setDrop(response.data);
      // После открытия бокса баланс меняется на бэкенде, 
      // но мы обновляем его локально для мгновенного отклика
      setPlayer(prev => ({ ...prev, balance: prev.balance - 100 }));
      loadInventory(playerId);
      
    } catch (error) {
      console.error("Ошибка гачи:", error);
      alert("Не удалось открыть бокс. Проверь баланс.");
    } finally {
      setGachaLoading(false);
    }
  }

  const equipItem = async (itemId) => {
    if (!player) return;
    try {
      const playerId = player.player_id || player.id;
      const response = await axios.post('/api/v1/inventory/equip', {
        player_id: playerId,
        inventory_item_id: itemId
      });

      if (response.data.status === 'success') {
        loadInventory(playerId);
        setPlayer(prev => ({ ...prev, total_power: response.data.new_total_power }));
      }
    } catch (error) {
      console.error("Ошибка экипировки:", error);
      alert("Не удалось надеть предмет.");
    }
  };

  const handleWork = async () => {
    if (!player || workLoading) return;
    
    console.log("Клик по кнопке 'Работать' засчитан"); // Проверка клика
    setWorkLoading(true);
    
    try {
      const playerId = player.player_id || player.id;
      console.log("Отправляем запрос для ID:", playerId);
      
      const response = await axios.post('/api/v1/player/work', {
        player_id: playerId
      });
      
      console.log("Ответ сервера:", response.data);
      
      if (response.data.status === 'success') {
        setPlayer(prev => ({ ...prev, balance: response.data.new_balance }));
      }
    } catch (error) {
      console.error("Ошибка при работе:", error.response?.data || error.message);
      alert("Ошибка сервера при попытке поработать. Проверь консоль.");
    } finally {
      setWorkLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('vinyl_device_id');
    setPlayer(null);
    setInventory([]);
    setDrop(null);
  }

  return (
    <>
      <h1>Vinyl Heroes 2.0</h1>
      <div className="card">
        {!player ? (
          <button onClick={login} disabled={loading}>
            {loading ? 'Загрузка...' : 'Играть'}
          </button>
        ) : (
          <div>
            <h3>Профиль</h3>
            <p style={{ fontSize: '12px', color: '#888' }}>ID: {player.player_id || player.id}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <span>Баланс: {player.balance} 🪙</span>
                <span>Сила: {player.total_power || 0} 💪</span>
              </div>
              
              <button 
                onClick={handleWork} 
                disabled={workLoading}
                style={{ 
                  backgroundColor: workLoading ? '#ccc' : '#f1c40f', 
                  color: '#000', 
                  fontWeight: 'bold', 
                  width: '100%', 
                  marginTop: '10px',
                  border: 'none',
                  padding: '10px',
                  cursor: workLoading ? 'not-allowed' : 'pointer',
                  opacity: workLoading ? 0.7 : 1
                }}
              >
                {workLoading ? 'Работаем...' : `Работать (+${10 + Math.floor((player.total_power || 0) * 0.1)} 🪙)`}
              </button>
            </div>
            
            <hr style={{ margin: '20px 0' }} />
            
            <button onClick={openBox} disabled={gachaLoading || player.balance < 100} style={{ width: '100%' }}>
              {gachaLoading ? 'Открываем...' : 'Открыть бокс (100 🪙)'}
            </button>

            {drop && drop.reward && (
              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #4CAF50', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>🎉 Выпал предмет! 🎉</h3>
                <div style={{ padding: '5px 0' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>{drop.reward.item_name}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#ccc' }}>
                  <p style={{ margin: '4px 0' }}>Тип: {drop.reward.slot} | Редкость: {drop.reward.rarity}</p>
                  <p style={{ margin: '4px 0' }}>Базовая сила: {drop.reward.base_power}</p>
                </div>
              </div>
            )}

            <hr style={{ margin: '20px 0' }} />

            <h3>Твой инвентарь ({inventory.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {inventory.length === 0 ? (
                <p>Инвентарь пуст. Открой свой первый бокс!</p>
              ) : (
                inventory.map((item, index) => {
                  const itemColor = getSlotColor(item.template_id);
                  return (
                    <div key={index} style={{ 
                      padding: '12px', 
                      background: '#242424', 
                      borderRadius: '8px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      borderLeft: `5px solid ${item.is_equipped ? '#4CAF50' : itemColor}`,
                      boxShadow: item.is_equipped ? '0 0 10px rgba(76, 175, 80, 0.2)' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '16px', textTransform: 'capitalize', color: item.is_equipped ? '#4CAF50' : '#fff' }}>
                          {(item.template_id || 'Неизвестный предмет').replace(/_/g, ' ')}
                        </strong>
                        {item.is_equipped && <span style={{ fontSize: '10px', background: '#4CAF50', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>ЭКИПИРОВАНО</span>}
                      </div>

                      <div style={{ marginTop: '8px', color: '#aaa', fontSize: '12px' }}>
                        <span>ID: {item.item_id?.substring(0, 8)}...</span>
                      </div>

                      {!item.is_equipped && (
                        <button 
                          onClick={() => equipItem(item.item_id)}
                          style={{ 
                            marginTop: '12px', 
                            width: '100%',
                            padding: '8px', 
                            fontSize: '12px', 
                            backgroundColor: itemColor,
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Надеть
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <hr style={{ margin: '20px 0' }} />
            
            <button onClick={logout} style={{ backgroundColor: '#555', fontSize: '11px', opacity: 0.6, width: '100%' }}>
              Сбросить аккаунт
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default App