import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [player, setPlayer] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [gachaLoading, setGachaLoading] = useState(false)
  const [drop, setDrop] = useState(null)

  useEffect(() => {
    const savedDeviceId = localStorage.getItem('vinyl_device_id');
    if (savedDeviceId) {
      login(savedDeviceId);
    }
  }, []);

  const login = async (existingDeviceId = null) => {
    setLoading(true)
    try {
      // Игнорируем технические события React, принимаем только строку
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
      localStorage.removeItem('vinyl_device_id'); // Очищаем битый ID
    } finally {
      setLoading(false);
    }
  }

  const loadInventory = async (playerId) => {
    try {
      const response = await axios.get(`/api/v1/inventory/${playerId}`);
      setInventory(response.data);
    } catch (error) {
      console.error("Ошибка загрузки инвентаря:", error);
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
      setPlayer(prev => ({ ...prev, balance: prev.balance - 100 }));
      
      loadInventory(playerId);
      
    } catch (error) {
      console.error("Ошибка гачи:", error);
      alert("Не удалось открыть бокс. Проверь баланс.");
    } finally {
      setGachaLoading(false);
    }
  }

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
            <p>ID Игрока: {player.player_id || player.id}</p>
            <p>Баланс: {player.balance} 🪙</p>
            
            <hr style={{ margin: '20px 0' }} />
            
            <button onClick={openBox} disabled={gachaLoading || player.balance < 100}>
              {gachaLoading ? 'Открываем...' : 'Открыть бокс (100 🪙)'}
            </button>

            {drop && (
              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #646cff', borderRadius: '8px' }}>
                <h3>🎉 Выпал предмет! 🎉</h3>
                <pre style={{ textAlign: 'left', fontSize: '12px', overflowX: 'auto' }}>
                  {JSON.stringify(drop, null, 2)}
                </pre>
              </div>
            )}

            <hr style={{ margin: '20px 0' }} />

            <h3>Твой инвентарь ({inventory.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {inventory.length === 0 ? (
                <p>Инвентарь пуст. Открой свой первый бокс!</p>
              ) : (
                inventory.map((item, index) => (
                  <div key={index} style={{ padding: '10px', background: '#1a1a1a', borderRadius: '4px', textAlign: 'left', fontSize: '14px' }}>
                    <strong>{item.item_id || 'Неизвестная пластинка'}</strong> 
                    <br/>
                    Количество: {item.quantity || 1}
                  </div>
                ))
              )}
            </div>

            <hr style={{ margin: '20px 0' }} />
            
            <button onClick={logout} style={{ backgroundColor: '#555', fontSize: '12px' }}>
              Сбросить аккаунт
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default App