import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [gachaLoading, setGachaLoading] = useState(false)
  const [drop, setDrop] = useState(null)

  const login = async () => {
    setLoading(true)
    try {
      const testDeviceId = "test-device-" + Math.floor(Math.random() * 10000);
      const response = await axios.post('/api/v1/auth/device', {
        device_id: testDeviceId
      });
      // Сохраняем весь ответ, чтобы посмотреть, какие точно поля приходят
      setPlayer(response.data);
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      alert("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }

  const openBox = async () => {
    if (!player) return;
    setGachaLoading(true);
    setDrop(null);
    try {
      // Отправляем player_id так, как этого ждет твой бэкенд
      const playerId = player.player_id || player.id; 
      
      const response = await axios.post('/api/v1/gacha/open', {
        player_id: playerId
      });
      
      // Записываем выпавший предмет в состояние
      setDrop(response.data);
      
      // Локально вычитаем 100 монет для визуала (или сколько стоит бокс)
      setPlayer(prev => ({ ...prev, balance: prev.balance - 100 }));
    } catch (error) {
      console.error("Ошибка гачи:", error);
      alert("Не удалось открыть бокс. Возможно, не хватает монет.");
    } finally {
      setGachaLoading(false);
    }
  }

  return (
    <>
      <h1>Vinyl Heroes</h1>
      <div className="card">
        {!player ? (
          <button onClick={login} disabled={loading}>
            {loading ? 'Загрузка...' : 'Создать аккаунт / Войти'}
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
                {/* Выводим сырой JSON, чтобы увидеть структуру ответа бэкенда */}
                <pre style={{ textAlign: 'left', fontSize: '12px' }}>
                  {JSON.stringify(drop, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default App