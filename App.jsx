```jsx
import { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('checklist');
  const [completedItems, setCompletedItems] = useState({});
  const [trades, setTrades] = useState([]);
  const [newTrade, setNewTrade] = useState({
    date: '',
    instrument: '',
    timeframe: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    direction: 'long',
    status: 'open',
    outcome: '',
    checklistCompliance: false,
    notes: ''
  });

  useEffect(() => {
    const savedTrades = localStorage.getItem('waicoffTrades');
    const savedItems = localStorage.getItem('waicoffChecklist');
    
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (e) {
        console.error('Error parsing trades:', e);
      }
    }
    
    if (savedItems) {
      try {
        setCompletedItems(JSON.parse(savedItems));
      } catch (e) {
        console.error('Error parsing checklist items:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('waicoffTrades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('waicoffChecklist', JSON.stringify(completedItems));
  }, [completedItems]);

  const toggleItem = (itemId) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const resetChecklist = () => {
    setCompletedItems({});
  };

  const addTrade = (e) => {
    e.preventDefault();
    if (newTrade.instrument && newTrade.entryPrice) {
      const trade = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...newTrade
      };
      setTrades(prev => [trade, ...prev]);
      setNewTrade({
        date: '',
        instrument: '',
        timeframe: '',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        direction: 'long',
        status: 'open',
        outcome: '',
        checklistCompliance: false,
        notes: ''
      });
    }
  };

  const updateTradeStatus = (tradeId, field, value) => {
    setTrades(prev => prev.map(trade => 
      trade.id === tradeId ? { ...trade, [field]: value } : trade
    ));
  };

  const deleteTrade = (tradeId) => {
    setTrades(prev => prev.filter(trade => trade.id !== tradeId));
  };

  const getStatistics = () => {
    const total = trades.length;
    const open = trades.filter(t => t.status === 'open').length;
    const closed = trades.filter(t => t.status === 'closed').length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const winRate = closed > 0 ? Math.round((wins / closed) * 100) : 0;
    
    const riskRewardRatios = trades
      .filter(t => t.entryPrice && t.stopLoss && t.takeProfit)
      .map(t => {
        const entry = parseFloat(t.entryPrice);
        const stop = parseFloat(t.stopLoss);
        const take = parseFloat(t.takeProfit);
        if (t.direction === 'long') {
          const risk = entry - stop;
          const reward = take - entry;
          return reward > 0 ? reward / risk : 0;
        } else {
          const risk = stop - entry;
          const reward = entry - take;
          return reward > 0 ? reward / risk : 0;
        }
      });
      
    const avgRiskReward = riskRewardRatios.length > 0 
      ? riskRewardRatios.reduce((a, b) => a + b, 0) / riskRewardRatios.length 
      : 0;

    return { 
      total, 
      open, 
      closed, 
      wins, 
      losses, 
      winRate, 
      avgRiskReward: avgRiskReward.toFixed(2),
      complianceRate: total > 0 ? Math.round(trades.filter(t => t.checklistCompliance).length / total * 100) : 0
    };
  };

  const checklistData = [
    {
      id: 'market-assessment',
      title: '1. Оценка рынка и старшего ТФ',
      items: [
        { id: 'higher-tf', text: 'Проверить старший таймфрейм (оценка/диапазон)' },
        { id: 'trend-range', text: 'Определить: тренд или диапазон?' },
        { id: 'lower-boundary', text: 'Находимся близко к нижней границе диапазона?' },
        { id: 'upper-boundary', text: 'Находимся близко к верхней границе диапазона?' },
        { id: 'support-resistance', text: 'Выделить ключевые уровни поддержки и сопротивления' },
        { id: 'volume-analysis', text: 'Проанализировать объем на старшем ТФ (усилие vs результат)' }
      ]
    },
    {
      id: 'current-tf',
      title: '2. Анализ текущего таймфрейма',
      items: [
        { id: 'accumulation', text: 'Выявить признаки фазы накопления (аккумуляции)' },
        { id: 'distribution', text: 'Выявить признаки фазы распределения' },
        { id: 'continuation', text: 'Модель продолжения (ренакопление/редистрибуция)' },
        { id: 'phase-c', text: 'Сформирована ли фаза "С" (наступление)?' },
        { id: 'not-formed', text: 'Если не сформировано → ждать подтверждения' }
      ]
    },
    {
      id: 'long-setup',
      title: '3. Условия для входа в лонг',
      items: [
        { id: 'spring-single', text: 'Однобарный Spring: закрытие бара внутри диапазона?' },
        { id: 'spring-buyers', text: 'Оценить покупателей в баре, где закрытие бара?' },
        { id: 'spring-double', text: 'Двубарный Spring: подтверждение отскока?' },
        { id: 'false-breakout', text: 'Ложный пробой → входа нет. Проверить старший ТФ.' },
        { id: 'lps-creek-bar', text: 'LPS Creek: отбойный бар (бар покупок)' },
        { id: 'lps-creek-no-entry', text: 'Входа нет.' },
        { id: 'lps-creek-lower-tf', text: 'Возможен вход на меньшем ТФ → требует фильтрации и корректировки рисков' },
        { id: 'lps-creek-higher-tf', text: 'Возможен вход на старшем ТФ' },
        { id: 'lps-boundary-bar', text: 'LPS границы: отбойный бар (бар покупок)' },
        { id: 'lps-boundary-no-entry', text: 'Входа нет.' },
        { id: 'lps-boundary-lower-tf', text: 'Возможен вход на меньшем ТФ → требует фильтрации и корректировки рисков' },
        { id: 'lps-boundary-higher-tf', text: 'Возможен вход на старшем ТФ' }
      ]
    },
    {
      id: 'short-setup',
      title: '4. Условия для входа в шорт',
      items: [
        { id: 'upthrust-single', text: 'Однобарный Upthrust: закрытие бара внутри диапазона?' },
        { id: 'upthrust-in-bar', text: 'Закрытие бара внутри предыдущего бара?' },
        { id: 'upthrust-double', text: 'Двубарный Upthrust: подтверждение отката?' },
        { id: 'false-breakout-short', text: 'Ложный пробой → входа нет. Проверить старший ТФ.' },
        { id: 'lpsy-ice-bar', text: 'LPSY Ice: отбойный бар (бар продаж)' },
        { id: 'lpsy-ice-no-entry', text: 'Входа нет.' },
        { id: 'lpsy-ice-lower-tf', text: 'Возможен вход на меньшем ТФ → требует фильтрации и корректировки рисков' },
        { id: 'lpsy-ice-higher-tf', text: 'Возможен вход на старшем ТФ' },
        { id: 'lpsy-boundary-bar', text: 'LPSY границы: отбойный бар (бар продаж)' },
        { id: 'lpsy-boundary-no-entry', text: 'Входа нет.' },
        { id: 'lpsy-boundary-lower-tf', text: 'Возможен вход на меньшем ТФ → требует фильтрации и корректировки рисков' },
        { id: 'lpsy-boundary-higher-tf', text: 'Возможен вход на старшем ТФ' }
      ]
    },
    {
      id: 'risk-management',
      title: '5. Обязательные действия перед входом',
      items: [
        { id: 'stop-loss', text: '🛑 Stop-loss установлен' },
        { id: 'take-profit', text: '🎯 Take-profit задан (минимум 1:2)' },
        { id: 'position-size', text: '📊 Размер позиции ≤ 2% от депозита' },
        { id: 'partial-exit', text: '🔁 Планируется частичный выход' }
      ]
    }
  ];

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Чек-лист Вайкофф</h1>
          <p className="text-xl text-teal-700 mb-6">Система входа в позицию + История торговли и Статистика</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[
            { id: 'checklist', label: 'Чек-лист', icon: '📋' },
            { id: 'trading', label: 'Торговля', icon: '📊' },
            { id: 'statistics', label: 'Статистика', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/80 text-teal-700 hover:bg-teal-100 hover:text-teal-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'checklist' && (
          <div className="space-y-4 mb-8">
            {checklistData.map((section) => (
              <div key={section.id} className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-teal-200 shadow-xl">
                <div className="px-6 py-4 border-b border-teal-200">
                  <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-xl hover:bg-teal-50 cursor-pointer group border border-gray-100">
                        <input
                          type="checkbox"
                          checked={!!completedItems[item.id]}
                          onChange={() => toggleItem(item.id)}
                          className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className={`text-sm ${completedItems[item.id] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center">
              <button onClick={resetChecklist} className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                Сбросить чек-лист
              </button>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">📝 Добавить сделку</h2>
              <form onSubmit={addTrade} className="space-y-4">
                <input
                  type="text"
                  value={newTrade.instrument}
                  onChange={(e) => setNewTrade({...newTrade, instrument: e.target.value})}
                  placeholder="Инструмент"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <select
                  value={newTrade.direction}
                  onChange={(e) => setNewTrade({...newTrade, direction: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="long">Лонг</option>
                  <option value="short">Шорт</option>
                </select>
                <input
                  type="text"
                  value={newTrade.timeframe}
                  onChange={(e) => setNewTrade({...newTrade, timeframe: e.target.value})}
                  placeholder="Таймфрейм"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="any"
                  value={newTrade.entryPrice}
                  onChange={(e) => setNewTrade({...newTrade, entryPrice: e.target.value})}
                  placeholder="Цена входа"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={newTrade.stopLoss}
                  onChange={(e) => setNewTrade({...newTrade, stopLoss: e.target.value})}
                  placeholder="Stop-Loss"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="any"
                  value={newTrade.takeProfit}
                  onChange={(e) => setNewTrade({...newTrade, takeProfit: e.target.value})}
                  placeholder="Take-Profit"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTrade.checklistCompliance}
                    onChange={(e) => setNewTrade({...newTrade, checklistCompliance: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label>Сделка по чек-листу</label>
                </div>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  placeholder="Заметки"
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <button type="submit" className="w-full bg-emerald-500 text-white p-3 rounded font-semibold">
                  Добавить сделку
                </button>
              </form>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 История ({trades.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {trades.map(trade => (
                  <div key={trade.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex justify-between">
                      <strong>{trade.instrument}</strong>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.direction === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction === 'long' ? 'Лонг' : 'Шорт'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Вход: {trade.entryPrice}</div>
                    {trade.status === 'open' && (
                      <select
                        onChange={(e) => updateTradeStatus(trade.id, 'outcome', e.target.value)}
                        className="text-xs w-full mt-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Результат</option>
                        <option value="win">Прибыль</option>
                        <option value="loss">Убыток</option>
                      </select>
                    )}
                    <div className="mt-2">
                      <button onClick={() => updateTradeStatus(trade.id, 'status', 'closed')} className="text-blue-600 text-xs mr-2">CloseOperation</button>
                      <button onClick={() => deleteTrade(trade.id)} className="text-red-600 text-xs">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Всего', value: stats.total, color: 'blue' },
                { label: 'Прибыль', value: stats.wins, color: 'green' },
                { label: 'Win Rate', value: `${stats.winRate}%`, color: 'purple' }
              ].map((s, i) => (
                <div key={i} className="text-center p-4 bg-white rounded shadow">
                  <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
                  <div className="text-sm text-gray-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 bg-white/80 rounded-full px-6 py-3 border border-teal-200 shadow-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-teal-700">Готовый чек-лист Вайкофф • Работает на всех устройствах</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```
