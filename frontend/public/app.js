const API_BASE = 'http://localhost:8846/api';

let currentPeriod = 'day';

async function fetchStats(period) {
  let url;
  if (period === 'day') {
    url = `${API_BASE}/stats/day`;
  } else if (period === 'week') {
    url = `${API_BASE}/stats/week`;
  } else {
    url = `${API_BASE}/stats/month`;
  }
  
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

function formatMonthLabel(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
}

function renderDateInfo(data) {
  const dateLabelEl = document.getElementById('dateLabel');
  
  if (data.period === 'day') {
    dateLabelEl.textContent = `📅 ${formatDateLabel(data.date)}`;
  } else if (data.period === 'week') {
    dateLabelEl.textContent = `📅 ${formatDateLabel(data.startDate)} ~ ${formatDateLabel(data.endDate)}`;
  } else {
    dateLabelEl.textContent = `📅 ${formatMonthLabel(data.startDate)}`;
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

function renderBottomFruits(bottomFruits) {
  const listEl = document.getElementById('bottomFruitsList');
  
  if (!bottomFruits || bottomFruits.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无销售数据</div>';
    return;
  }

  listEl.innerHTML = bottomFruits.map((fruit, index) => `
    <div class="bottom-item">
      <div class="bottom-rank">${index + 1}</div>
      <div class="bottom-info">
        <div class="bottom-name">${fruit.fruitName}</div>
        <div class="bottom-sub">单价 ¥${fruit.price.toFixed(2)}/斤</div>
      </div>
      <div class="bottom-amount">
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

function renderTrendChart(dailyStats, period) {
  const panelEl = document.getElementById('trendChartPanel');
  const chartEl = document.getElementById('trendChart');
  const titleEl = document.getElementById('trendChartTitle');
  
  if (period === 'day') {
    panelEl.style.display = 'none';
    return;
  }

  panelEl.style.display = 'block';

  if (period === 'week') {
    titleEl.textContent = '📈 近7天销售趋势';
  } else {
    titleEl.textContent = '📈 本月销售趋势';
  }

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

    let dateLabel;
    if (period === 'week') {
      dateLabel = `${month}/${dayNum} 周${weekDay}`;
    } else {
      dateLabel = `${month}/${dayNum}`;
    }

    return `
      <div class="trend-bar-wrapper">
        <div class="trend-bar" style="height: ${Math.max(heightPercent, 2)}%;">
          <div class="trend-bar-value">¥${day.totalSales.toFixed(0)}</div>
        </div>
        <div class="trend-bar-date">${dateLabel}</div>
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
    renderBottomFruits(data.bottomFruits);
    renderFruitTable(data.fruitStats);
    
    if (data.period === 'week' || data.period === 'month') {
      renderTrendChart(data.dailyStats, data.period);
    } else {
      document.getElementById('trendChartPanel').style.display = 'none';
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    document.getElementById('totalSales').textContent = '加载失败';
    document.getElementById('orderCount').textContent = '-';
    document.getElementById('avgOrderValue').textContent = '-';
    document.getElementById('topFruitsList').innerHTML = 
      '<div class="empty-state">数据加载失败，请确认后端服务已启动</div>';
    document.getElementById('bottomFruitsList').innerHTML = 
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
