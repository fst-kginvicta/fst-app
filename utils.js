// ============================================================
// FST - Utility Functions
// ============================================================

// --- DATE FORMATTING ---
function formatDateDDMMYYYY(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getTodayDDMMYYYY() {
  return formatDateDDMMYYYY(new Date());
}

function ddmmyyyyToInputFormat(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function inputFormatToDDMMYYYY(yyyymmdd) {
  if (!yyyymmdd) return '';
  const parts = yyyymmdd.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function parseDate(ddmmyyyy) {
  const parts = ddmmyyyy.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function isDateInRange(dateStr, fromStr, toStr) {
  const date = parseDate(dateStr);
  const from = parseDate(fromStr);
  const to = parseDate(toStr);
  to.setHours(23, 59, 59);
  return date >= from && date <= to;
}

function generateDateRange(fromDDMMYYYY, toDDMMYYYY) {
  const dates = [];
  const from = parseDate(fromDDMMYYYY);
  const to = parseDate(toDDMMYYYY);
  const current = new Date(from);
  while (current <= to) {
    dates.push(formatDateDDMMYYYY(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// --- SHOW/HIDE LOADING ---
function showLoading(text = 'Please wait...') {
  document.getElementById('loading').style.display = 'flex';
  document.querySelector('.loading-text').textContent = text;
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// --- TOAST ---
function showToast(message, type = 'default', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = `toast ${type}`; }, duration);
}

// --- MODAL ---
function openModal(title, bodyHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// --- SCREEN NAVIGATION ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// --- SIDEBAR ---
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// --- TOGGLE PASSWORD ---
function togglePassword() {
  const pwd = document.getElementById('login-password');
  const btn = document.querySelector('.pwd-toggle i');
  if (pwd.type === 'password') {
    pwd.type = 'text';
    btn.className = 'fas fa-eye-slash';
  } else {
    pwd.type = 'password';
    btn.className = 'fas fa-eye';
  }
}

// --- CONTENT RENDERING ---
function setContent(html) {
  document.getElementById('content-area').innerHTML = html;
}

function setActiveSidebarItem(id) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const item = document.getElementById(id);
  if (item) item.classList.add('active');
}

// --- CURRENCY FORMAT ---
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// --- OFFLINE CHECK ---
function isOnline() {
  return navigator.onLine;
}

function checkConnectivity() {
  if (!isOnline()) {
    showToast('⚠️ No internet connection. Data not submitted.', 'error', 5000);
    return false;
  }
  return true;
}

// Setup offline banner
window.addEventListener('offline', () => {
  if (!document.getElementById('offline-banner')) {
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner';
    banner.innerHTML = '<i class="fas fa-wifi"></i> You are offline. Please check your connection.';
    document.getElementById('screen-main').prepend(banner);
  }
});

window.addEventListener('online', () => {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.remove();
  showToast('✅ Connection restored!', 'success');
});

// --- EXCEL EXPORT ---
function exportToExcel(data, filename, sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    showToast('No data to export.', 'warning');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename + '_' + getTodayDDMMYYYY().replace(/\//g, '-') + '.xlsx');
  showToast('✅ Excel exported successfully!', 'success');
}

function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) { showToast('Table not found.', 'error'); return; }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename + '_' + getTodayDDMMYYYY().replace(/\//g, '-') + '.xlsx');
  showToast('✅ Excel exported successfully!', 'success');
}

// --- TIME FORMAT ---
function formatTime12h(hours, minutes, ampm) {
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')} ${ampm}`;
}

// --- GENERATE TIME SELECTOR HTML ---
function generateTimeSelector(prefix, label) {
  let hoursOptions = '';
  for (let h = 1; h <= 12; h++) {
    hoursOptions += `<option value="${h}">${String(h).padStart(2,'0')}</option>`;
  }
  let minuteOptions = '';
  ['00','15','30','45'].forEach(m => {
    minuteOptions += `<option value="${m}">${m}</option>`;
  });

  return `
    <div class="form-group">
      <label>${label}</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="${prefix}-hours" class="form-control" style="flex:1">${hoursOptions}</select>
        <span style="font-weight:700;color:var(--navy)">:</span>
        <select id="${prefix}-minutes" class="form-control" style="flex:1">${minuteOptions}</select>
        <select id="${prefix}-ampm" class="form-control" style="flex:1">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  `;
}

function getTimeValue(prefix) {
  const h = document.getElementById(`${prefix}-hours`).value;
  const m = document.getElementById(`${prefix}-minutes`).value;
  const ap = document.getElementById(`${prefix}-ampm`).value;
  return `${String(h).padStart(2,'0')}:${m} ${ap}`;
}

function setTimeValue(prefix, timeStr) {
  if (!timeStr) return;
  const parts = timeStr.split(' ');
  if (parts.length !== 2) return;
  const timeParts = parts[0].split(':');
  document.getElementById(`${prefix}-hours`).value = parseInt(timeParts[0]);
  document.getElementById(`${prefix}-minutes`).value = timeParts[1];
  document.getElementById(`${prefix}-ampm`).value = parts[1];
}

// --- BADGE HELPERS ---
function getPriorityBadge(priority) {
  const classes = { 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
  return `<span class="badge ${classes[priority] || 'badge-navy'}">${priority}</span>`;
}

function getStatusBadge(status) {
  const classes = {
    'Pending': 'badge-warning',
    'In-Progress': 'badge-info',
    'Complete': 'badge-success',
    'Assigned': 'badge-navy'
  };
  return `<span class="badge ${classes[status] || 'badge-navy'}">${status}</span>`;
}

function getAttBadge(att) {
  if (!att) return '<span class="empty">-</span>';
  const map = {
    'Present': 'present',
    'Leave': 'leave',
    'Holiday': 'holiday',
    'Week-Off': 'week-off'
  };
  return `<span class="${map[att] || ''}">${att}</span>`;
}

// --- USER PROFILE MODAL ---
function showUserProfile() {
  const user = window.currentUser;
  if (!user) return;
  openModal('My Profile', `
    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:4rem;color:var(--gold-dark);margin-bottom:12px;">
        <i class="fas fa-user-circle"></i>
      </div>
      <h3 style="color:var(--navy);margin-bottom:4px;">${user.name}</h3>
      <p style="color:var(--mid-gray);font-size:0.85rem;">${user.role}</p>
    </div>
    <div class="divider"></div>
    <div style="display:grid;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span style="font-size:0.82rem;color:var(--mid-gray);font-weight:600;text-transform:uppercase;">Username</span>
        <span style="font-weight:600;color:var(--navy);">${user.username}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span style="font-size:0.82rem;color:var(--mid-gray);font-weight:600;text-transform:uppercase;">Base City</span>
        <span style="font-weight:600;color:var(--navy);">${user.baseCity || 'N/A'}</span>
      </div>
      ${user.role === 'Field Engineer' && user.managerNames && user.managerNames.length > 0 ? `
      <div style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span style="font-size:0.82rem;color:var(--mid-gray);font-weight:600;text-transform:uppercase;">Reporting To</span>
        <div style="margin-top:6px;">
          ${user.managerNames.map(m => `<span class="badge badge-gold" style="margin:2px;">${m}</span>`).join('')}
        </div>
      </div>` : ''}
    </div>
    <div class="divider"></div>
    <button class="btn btn-danger btn-full" onclick="handleLogout()">
      <i class="fas fa-sign-out-alt"></i> Logout
    </button>
  `);
}

// --- FILE TO BASE64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// --- SANITIZE ---
function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
