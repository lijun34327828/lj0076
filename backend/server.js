const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8846;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'orders.json');
const SAMPLE_FILE = path.join(__dirname, 'sample_orders.json');

const FRUITS = [
  { id: 1, name: '苹果', price: 8.5 },
  { id: 2, name: '香蕉', price: 4.5 },
  { id: 3, name: '橙子', price: 6.8 },
  { id: 4, name: '葡萄', price: 12.0 },
  { id: 5, name: '西瓜', price: 3.2 },
  { id: 6, name: '草莓', price: 25.0 },
  { id: 7, name: '芒果', price: 15.0 },
  { id: 8, name: '梨', price: 5.5 },
  { id: 9, name: '桃子', price: 7.8 },
  { id: 10, name: '菠萝', price: 9.0 }
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const orders = generateMockOrders();
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  }
}

function generateMockOrders() {
  const data = fs.readFileSync(SAMPLE_FILE, 'utf-8');
  return JSON.parse(data);
}

function generateRandomTime() {
  const hour = 8 + Math.floor(Math.random() * 12);
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return formatDate(new Date());
}

function getWeekDates() {
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

function getMonthDates() {
  const dates = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    dates.push(formatDate(d));
  }
  return dates;
}

function readOrders() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function filterOrdersByDates(orders, dates) {
  const dateSet = new Set(dates);
  return orders.filter(order => dateSet.has(order.date));
}

function calculateStatistics(orders) {
  if (orders.length === 0) {
    return {
      totalSales: 0,
      orderCount: 0,
      avgOrderValue: 0,
      fruitStats: [],
      topFruits: []
    };
  }

  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const orderCount = orders.length;
  const avgOrderValue = totalSales / orderCount;

  const fruitMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!fruitMap.has(item.fruitId)) {
        fruitMap.set(item.fruitId, {
          fruitId: item.fruitId,
          fruitName: item.fruitName,
          totalQuantity: 0,
          totalAmount: 0,
          price: item.price
        });
      }
      const stat = fruitMap.get(item.fruitId);
      stat.totalQuantity += item.quantity;
      stat.totalAmount += item.subtotal;
    });
  });

  const fruitStats = Array.from(fruitMap.values())
    .map(s => ({
      ...s,
      totalQuantity: parseFloat(s.totalQuantity.toFixed(2)),
      totalAmount: parseFloat(s.totalAmount.toFixed(2))
    }))
    .sort((a, b) => a.fruitName.localeCompare(b.fruitName, 'zh'));

  const topFruits = [...fruitStats]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  const bottomFruits = [...fruitStats]
    .sort((a, b) => a.totalQuantity - b.totalQuantity)
    .slice(0, 3);

  return {
    totalSales: parseFloat(totalSales.toFixed(2)),
    orderCount,
    avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    fruitStats,
    topFruits,
    bottomFruits
  };
}

function generateDailyStats(orders, dates) {
  return dates.map(date => {
    const dayOrders = orders.filter(o => o.date === date);
    const stats = calculateStatistics(dayOrders);
    return {
      date,
      totalSales: stats.totalSales,
      orderCount: stats.orderCount,
      avgOrderValue: stats.avgOrderValue
    };
  });
}

app.get('/api/stats/day', (req, res) => {
  ensureDataFile();
  const orders = readOrders();
  const today = getToday();
  const todayOrders = filterOrdersByDates(orders, [today]);
  const stats = calculateStatistics(todayOrders);

  res.json({
    period: 'day',
    date: today,
    ...stats
  });
});

app.get('/api/stats/week', (req, res) => {
  ensureDataFile();
  const orders = readOrders();
  const weekDates = getWeekDates();
  const weekOrders = filterOrdersByDates(orders, weekDates);
  const stats = calculateStatistics(weekOrders);
  const dailyStats = generateDailyStats(orders, weekDates);

  res.json({
    period: 'week',
    startDate: weekDates[0],
    endDate: weekDates[weekDates.length - 1],
    ...stats,
    dailyStats
  });
});

app.get('/api/stats/month', (req, res) => {
  ensureDataFile();
  const orders = readOrders();
  const monthDates = getMonthDates();
  const monthOrders = filterOrdersByDates(orders, monthDates);
  const stats = calculateStatistics(monthOrders);
  const dailyStats = generateDailyStats(orders, monthDates);

  res.json({
    period: 'month',
    startDate: monthDates[0],
    endDate: monthDates[monthDates.length - 1],
    ...stats,
    dailyStats
  });
});

app.get('/api/orders', (req, res) => {
  ensureDataFile();
  const orders = readOrders();
  res.json(orders);
});

app.get('/api/fruits', (req, res) => {
  res.json(FRUITS);
});

app.post('/api/orders', (req, res) => {
  ensureDataFile();
  const orders = readOrders();
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: '订单商品不能为空' });
  }

  const orderItems = items.map(item => {
    const fruit = FRUITS.find(f => f.id === item.fruitId);
    if (!fruit) {
      throw new Error(`水果ID ${item.fruitId} 不存在`);
    }
    const quantity = parseFloat(item.quantity);
    return {
      fruitId: fruit.id,
      fruitName: fruit.name,
      price: fruit.price,
      quantity: quantity,
      subtotal: parseFloat((fruit.price * quantity).toFixed(2))
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    date: getToday(),
    time: generateRandomTime(),
    items: orderItems,
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };

  orders.push(newOrder);
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  res.status(201).json(newOrder);
});

app.listen(PORT, () => {
  console.log(`社区水果店后端服务已启动: http://localhost:${PORT}`);
  ensureDataFile();
});
