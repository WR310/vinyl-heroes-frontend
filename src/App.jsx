import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    try {
      // Генерируем случайный ID устройства для теста
      const testDeviceId = "test-device-" + Math.floor(Math.random() * 10000);
      
      // Отправляем POST-запрос на наш бэкенд
      const response = await axios.post('/api/v1/auth/device', {
        device_id: testDeviceId
      });
      
      // Сохраняем ответ сервера в состояние React
      setPlayer(response.data);
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      alert("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
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
            <h3>Успешный вход!</h3>
            <p>ID Игрока: {player.id}</p>
            <p>Баланс: {player.balance} 🪙</p>
            <p>Уровень: {player.level}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default App