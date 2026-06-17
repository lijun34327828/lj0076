const API_BASE = 'http://localhost:8846/api';

let currentPeriod = 'day';

async function fetchStats(period) {
  const url = period === 'day' 
    ? `${API_BASE}/stats/day` 
    : `${API_BASE}/stats/week`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  return response.json();
}

function formatCurrency(value) {
  return `¥${value.toFixed(2)}`;
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
}

function renderDateInfo(data) {
  const dateInfoEl = document.getElementById('dateInfo');
  const dateLabelEl = document.getElementById('dateLabel');
  
  if (data.period === 'day') {
    dateLabelEl.textContent = `📅 ${formatDateLabel(data.date)}`;
  } else {
    dateLabelEl.textContent = `📅 ${formatDateLabel(data.startDate)} ~ ${formatDateLabel(data.endDate)}`;
  }
}

function renderStatsCards(data) {
  document.getElementById('totalSales').textContent = formatCurrency(data.totalSales);
  document.getElementById('orderCount').textContent = data.orderCount;
  document.getElementById('avgOrderValue').textContent = formatCurrency(data.avgOrderValue);
}

function renderTopFruits(topFruits) {
  const listEl = document.getElementById('topFruitsList');
  
  if (!topFruits || topFruits.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无销售数据</div>';
    return;
  }

  listEl.innerHTML = topFruits.map((fruit, index) => `
    <div class="top-item">
      <div class="top-rank">${index + 1}</div>
      <div class="top-info">
        <div class="top-name">${fruit.fruitName}</div>
        <div class="top-sub">单价 ¥${fruit.price.toFixed(2)}/斤</div>
      </div>
      <div class="top-amount">
        <div><span class="quantity">${fruit.totalQuantity}</span><span class="unit">斤</span></div>
        <div class="amount">¥${fruit.totalAmount.toFixed(2)}</div>
      </div>
    </div>
  `).join('');
}

function renderFruitTable(fruitStats) {
  const tbodyEl = document.getElementById('fruitTableBody');
  
  if (!fruitStats || fruitStats.length === 0) {
    tbodyEl.innerHTML = '<tr><td colspan="4" class="empty-state">暂无销售数据</td></tr>';
    return;
  }

  tbodyEl.innerHTML = fruitStats.map(fruit => `
    <tr>
      <td class="fruit-name">${fruit.fruitName}</td>
      <td>¥${fruit.price.toFixed(2)}</td>
      <td class="quantity-cell">${fruit.totalQuantity} 斤</td>
      <td class="amount-cell">¥${fruit.totalAmount.toFixed(2)}</td>
    </tr>
  `).join('');
}

function renderWeekChart(dailyStats) {
  const panelEl = document.getElementById('weekChartPanel');
  const chartEl = document.getElementById('weekChart');
  
  if (currentPeriod !== 'week') {
    panelEl.style.display = 'none';
    return;
  }

  panelEl.style.display = 'block';

  if (!dailyStats || dailyStats.length === 0) {
    chartEl.innerHTML = '<div class="empty-state">暂无数据</div>';
    return;
  }

  const maxSales = Math.max(...dailyStats.map(d => d.totalSales), 1);

  chartEl.innerHTML = dailyStats.map(day => {
    const heightPercent = (day.totalSales / maxSales) * 100;
    const date = new Date(day.date);
    const month = date.getMonth() + 1;
    const dayNum = date.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];

    return `
      <div class="week-bar-wrapper">
        <div class="week-bar" style="height: ${Math.max(heightPercent, 2)}%;">
          <div class="week-bar-value">¥${day.totalSales.toFixed(0)}</div>
        </div>
        <div class="week-bar-date">${month}/${dayNum} 周${weekDay}</div>
      </div>
    `;
  }).join('');
}

async function loadData() {
  try {
    const data = await fetchStats(currentPeriod);
    
    renderDateInfo(data);
    renderStatsCards(data);
    renderTopFruits(data.topFruits);
    renderFruitTable(data.fruitStats);
    
    if (data.period === 'week') {
      renderWeekChart(data.dailyStats);
    } else {
      document.getElementById('weekChartPanel').style.display = 'none';
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    document.getElementById('totalSales').textContent = '加载失败';
    document.getElementById('orderCount').textContent = '-';
    document.getElementById('avgOrderValue').textContent = '-';
    document.getElementById('topFruitsList').innerHTML = 
      '<div class="empty-state">数据加载失败，请确认后端服务已启动</div>';
    document.getElementById('fruitTableBody').innerHTML = 
      '<tr><td colspan="4" class="empty-state">数据加载失败，请确认后端服务已启动</td></tr>';
  }
}

function setupPeriodSwitcher() {
  const buttons = document.querySelectorAll('.period-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      loadData();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupPeriodSwitcher();
  loadData();
  
  setInterval(loadData, 30000);
});
