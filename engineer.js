// ============================================================
// FST - Field Engineer Screens
// ============================================================

// ============================================================
// ENGINEER DASHBOARD
// ============================================================
function showEngineerDashboard() {
  setActiveSidebarItem('nav-eng-dashboard');
  const user = window.currentUser;
  const today = getTodayDDMMYYYY();

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-tachometer-alt"></i> My Dashboard</h2>
      <p>Welcome, ${sanitize(user.name)}! Today is ${today}.</p>
    </div>

    <div class="stats-grid" id="eng-stats">
      <div class="stat-card">
        <div class="stat-value" id="eng-stat-att">-</div>
        <div class="stat-label">Today's Attendance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="eng-stat-punch">-</div>
        <div class="stat-label">Today's Punches</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="eng-stat-tasks">-</div>
        <div class="stat-label">Tasks Updated</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="eng-stat-special">-</div>
        <div class="stat-label">Special Tasks</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="btn btn-primary" onclick="showUpdateAttendance()">
            <i class="fas fa-user-check"></i> Attendance
          </button>
          <button class="btn btn-gold" onclick="showUpdateDealerPunch()">
            <i class="fas fa-map-marker-alt"></i> Dealer Punch
          </button>
          <button class="btn btn-outline" onclick="showUpdateDailyTasks()">
            <i class="fas fa-clipboard-check"></i> Daily Tasks
          </button>
          <button class="btn btn-outline" onclick="showUpdateExpenses()">
            <i class="fas fa-receipt"></i> Expenses
          </button>
        </div>
      </div>
    </div>

    <div class="card" id="special-tasks-preview">
      <div class="card-header">
        <h3><i class="fas fa-star"></i> Pending Special Tasks</h3>
        <button class="btn btn-sm btn-gold" onclick="showSpecialTasks()">View All</button>
      </div>
      <div class="card-body" id="special-tasks-preview-body">
        <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
      </div>
    </div>
  `);

  loadEngineerDashboardData();
}

async function loadEngineerDashboardData() {
  const user = window.currentUser;
  const today = getTodayDDMMYYYY();

  try {
    const [attRes, punchRes, taskRes, specialRes] = await Promise.all([
      apiGetAttendanceByUser(user.userID, '', '', today),
      apiGetDealerPunchByUser(user.userID, '', '', today),
      apiGetDailyTasksByUser(user.userID, '', '', today),
      apiGetSpecialTasksByEngineer(user.userID)
    ]);

    if (attRes.success) {
      const rec = attRes.records[0];
      document.getElementById('eng-stat-att').textContent = rec ? rec.attendance : 'None';
      if (rec) document.getElementById('eng-stat-att').style.fontSize = '1rem';
    }
    if (punchRes.success) {
      document.getElementById('eng-stat-punch').textContent = punchRes.records.length;
    }
    if (taskRes.success) {
      document.getElementById('eng-stat-tasks').textContent = taskRes.records.length > 0 ? '✓' : 'No';
      if (taskRes.records.length > 0) document.getElementById('eng-stat-tasks').style.fontSize = '1.5rem';
    }
    if (specialRes.success) {
      const pending = specialRes.tasks.filter(t => t.currentStatus !== 'Complete');
      document.getElementById('eng-stat-special').textContent = pending.length;

      const body = document.getElementById('special-tasks-preview-body');
      if (pending.length === 0) {
        body.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--success);"></i><p>No pending special tasks.</p></div>';
      } else {
        body.innerHTML = pending.slice(0, 3).map(t => `
          <div class="card priority-${(t.priority || '').toLowerCase()}"
               style="margin-bottom:10px;cursor:pointer;"
               onclick="showSpecialTasks()">
            <div class="card-body" style="padding:12px;">
              <div class="flex-between mb-8">
                <span style="font-weight:700;font-size:0.85rem;color:var(--navy);">
                  <i class="fas fa-user-tie" style="color:var(--gold-dark);margin-right:4px;"></i>
                  ${sanitize(t.managerName)}
                </span>
                <div style="display:flex;gap:6px;">
                  ${getPriorityBadge(t.priority)}
                  ${getStatusBadge(t.currentStatus)}
                </div>
              </div>
              <p style="font-size:0.83rem;color:var(--dark-gray);line-height:1.5;
                         overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;
                         -webkit-box-orient:vertical;">
                ${sanitize(t.taskDescription)}
              </p>
              <div style="font-size:0.72rem;color:var(--mid-gray);margin-top:6px;">
                <i class="fas fa-clock"></i> ${sanitize(t.assignedAt)}
              </div>
            </div>
          </div>`).join('');
      }
    }
  } catch(err) {
    console.error('Dashboard load error:', err);
  }
}

// ============================================================
// SPECIAL TASKS
// ============================================================
async function showSpecialTasks() {
  setActiveSidebarItem('nav-special-tasks');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-star"></i> Special Tasks</h2>
      <p>Tasks assigned to you by your manager.</p>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-sm ${!window._spFilter || window._spFilter==='all' ? 'btn-primary':'btn-outline'}"
        onclick="window._spFilter='all';showSpecialTasks()">All</button>
      <button class="btn btn-sm ${window._spFilter==='Pending' ? 'btn-primary':'btn-outline'}"
        onclick="window._spFilter='Pending';showSpecialTasks()">Pending</button>
      <button class="btn btn-sm ${window._spFilter==='In-Progress' ? 'btn-primary':'btn-outline'}"
        onclick="window._spFilter='In-Progress';showSpecialTasks()">In-Progress</button>
      <button class="btn btn-sm ${window._spFilter==='Complete' ? 'btn-primary':'btn-outline'}"
        onclick="window._spFilter='Complete';showSpecialTasks()">Complete</button>
    </div>
    <div id="special-tasks-list">
      <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
    </div>
  `);

  try {
    const res = await apiGetSpecialTasksByEngineer(window.currentUser.userID);
    const container = document.getElementById('special-tasks-list');
    if (!res.success) { container.innerHTML = '<div class="empty-state"><p>Error loading tasks.</p></div>'; return; }

    let tasks = res.tasks;
    const filter = window._spFilter;
    if (filter && filter !== 'all') tasks = tasks.filter(t => t.currentStatus === filter);

    if (tasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No tasks found.</p></div>';
      return;
    }

    container.innerHTML = tasks.map(t => `
      <div class="card priority-${(t.priority || '').toLowerCase()}"
           style="margin-bottom:12px;cursor:pointer;"
           onclick="openSpecialTaskChat('${t.specialTaskID}')">
        <div class="card-body" style="padding:16px;">
          <div class="flex-between mb-8">
            <div>
              <div style="font-weight:700;color:var(--navy);font-size:0.95rem;">
                <i class="fas fa-user-tie" style="color:var(--gold-dark);margin-right:6px;"></i>
                ${sanitize(t.managerName)}
              </div>
              <div style="font-size:0.72rem;color:var(--mid-gray);margin-top:2px;">
                <i class="fas fa-clock"></i> ${sanitize(t.assignedAt)}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
              ${getPriorityBadge(t.priority)}
              ${getStatusBadge(t.currentStatus)}
            </div>
          </div>
          <p style="font-size:0.85rem;color:var(--dark-gray);line-height:1.6;
                     overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;
                     -webkit-box-orient:vertical;">
            ${sanitize(t.taskDescription)}
          </p>
          <div style="margin-top:10px;font-size:0.78rem;color:var(--gold-dark);font-weight:600;">
            <i class="fas fa-comments"></i> Tap to open chat & update status
          </div>
        </div>
      </div>`).join('');
  } catch(err) {
    showToast('Error loading special tasks.', 'error');
  }
}

async function openSpecialTaskChat(specialTaskID) {
  showLoading('Loading task...');
  try {
    const [tasksRes, chatsRes] = await Promise.all([
      apiGetSpecialTasksByEngineer(window.currentUser.userID),
      apiGetChatMessages(specialTaskID)
    ]);
    hideLoading();

    const task = tasksRes.tasks.find(t => t.specialTaskID === specialTaskID);
    if (!task) { showToast('Task not found.', 'error'); return; }
    const messages = chatsRes.messages || [];

    openModal(`Special Task - ${task.priority} Priority`, `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        ${getPriorityBadge(task.priority)}
        ${getStatusBadge(task.currentStatus)}
        <span style="font-size:0.75rem;color:var(--mid-gray);">
          <i class="fas fa-user-tie"></i> ${sanitize(task.managerName)}
        </span>
      </div>

      <div class="chat-container" id="chat-messages">
        ${messages.map(m => {
          const isSent = m.senderUserID === window.currentUser.userID;
          return `
            <div style="display:flex;flex-direction:column;align-items:${isSent ? 'flex-end' : 'flex-start'};">
              <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                <div class="chat-sender">${sanitize(m.senderName)} (${sanitize(m.senderRole)})</div>
                <div>${sanitize(m.message)}</div>
                ${m.status ? `<div class="chat-status-tag">${sanitize(m.status)}</div>` : ''}
                <div class="chat-time">${sanitize(m.sentAt)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div class="form-group">
        <label>Update Status</label>
        <div class="radio-group">
          ${['Pending','In-Progress','Complete'].map(s => `
            <div class="radio-pill">
              <input type="radio" name="chat-status" id="cs-${s}" value="${s}"
                ${task.currentStatus === s ? 'checked' : ''}>
              <label for="cs-${s}">${s}</label>
            </div>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <label>Your Response</label>
        <textarea id="chat-message" class="form-control" placeholder="Type your response here..." rows="3"></textarea>
      </div>

      <button class="btn btn-primary btn-full" onclick="sendEngineerChatMessage('${specialTaskID}')">
        <i class="fas fa-paper-plane"></i> Send Response
      </button>
    `);

    // Scroll chat to bottom
    setTimeout(() => {
      const chatDiv = document.getElementById('chat-messages');
      if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight;
    }, 100);

  } catch(err) {
    hideLoading();
    showToast('Error loading task.', 'error');
  }
}

async function sendEngineerChatMessage(specialTaskID) {
  const message = document.getElementById('chat-message').value.trim();
  const statusEl = document.querySelector('input[name="chat-status"]:checked');
  const status = statusEl ? statusEl.value : '';

  if (!message) { showToast('Please type a message.', 'warning'); return; }
  if (!checkConnectivity()) return;

  showLoading('Sending...');
  try {
    const res = await apiSendChatMessage({
      specialTaskID,
      senderUserID: window.currentUser.userID,
      senderName: window.currentUser.name,
      senderRole: 'Field Engineer',
      message,
      status
    });
    hideLoading();
    if (res.success) {
      closeModal();
      showToast('✅ Response sent!', 'success');
      showSpecialTasks();
    } else {
      showToast('Error sending message.', 'error');
    }
  } catch(err) {
    hideLoading();
    showToast('Error sending message.', 'error');
  }
}

// ============================================================
// UPDATE ATTENDANCE
// ============================================================
async function showUpdateAttendance() {
  setActiveSidebarItem('nav-update-att');
  const today = getTodayDDMMYYYY();

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-user-check"></i> Update Attendance</h2>
      <p>Record your attendance for the day.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-calendar"></i> Date</label>
          <input type="date" id="att-date" class="form-control"
            value="${ddmmyyyyToInputFormat(today)}"
            onchange="checkExistingAttendance()">
        </div>

        <div id="att-existing-info"></div>

        <div class="form-group">
          <label><i class="fas fa-clipboard"></i> Attendance</label>
          <select id="att-status" class="form-control">
            <option value="">-- Select --</option>
            <option value="Present">Present</option>
            <option value="Leave">Leave</option>
            <option value="Week-Off">Week-Off</option>
            <option value="Holiday">Holiday</option>
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-map-marker-alt"></i> Location</label>
          <div class="radio-group">
            <div class="radio-pill">
              <input type="radio" name="att-loc" id="al-local" value="Local">
              <label for="al-local"><i class="fas fa-home"></i> Local</label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="att-loc" id="al-out" value="Outstation">
              <label for="al-out"><i class="fas fa-plane"></i> Outstation</label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="att-loc" id="al-travel" value="Travelling">
              <label for="al-travel"><i class="fas fa-car"></i> Travelling</label>
            </div>
          </div>
        </div>

        <div class="section-divider"><i class="fas fa-clipboard-list"></i> Visit Activities</div>
        <div class="checkbox-group" id="visit-activities">
          ${['Dealer Assessment','Warranty Material Inspection','Joint Investigation',
             'Campaign','AdiCare & OE Extended Warranty','Neutral Workshop Visit',
             'Regional Bosch Office','Travelling [Whole Day]','iTrams'].map(a => `
            <div class="check-pill">
              <input type="checkbox" id="va-${a.replace(/\s+/g,'_')}" value="${a}">
              <label for="va-${a.replace(/\s+/g,'_')}">${a}</label>
            </div>`).join('')}
        </div>

        <div class="section-divider"><i class="fas fa-phone"></i> Other Activities</div>
        <div class="checkbox-group" id="other-activities">
          ${['Weekly Data Collection [Reference Injector]','eJC Data Quality Validation',
             'IUW Marketing Calls','AdiCare Marketing Calls','OE Extended Warranty Calls',
             'Warranty Support to BDS/BES','OECD Mapping','AMC'].map(a => `
            <div class="check-pill">
              <input type="checkbox" id="oa-${a.replace(/\s+/g,'_')}" value="${a}">
              <label for="oa-${a.replace(/\s+/g,'_')}">${a}</label>
            </div>`).join('')}
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label><i class="fas fa-store"></i> Dealer Name</label>
          <input type="text" id="att-dealer" class="form-control" placeholder="Enter dealer name (if applicable)">
        </div>
        <div class="form-group">
          <label><i class="fas fa-city"></i> Dealer City</label>
          <input type="text" id="att-dealer-city" class="form-control" placeholder="Enter dealer city">
        </div>
        <div class="form-group">
          <label><i class="fas fa-comment"></i> Comments</label>
          <textarea id="att-comments" class="form-control" placeholder="Any additional comments..." rows="3"></textarea>
        </div>

        <div id="att-error" class="error-msg" style="display:none"></div>
        <button class="btn btn-primary btn-full" id="att-submit-btn" onclick="submitAttendance()">
          <i class="fas fa-save"></i> Submit Attendance
        </button>
      </div>
    </div>
  `);

  await checkExistingAttendance();
}

async function checkExistingAttendance() {
  const dateInput = document.getElementById('att-date');
  if (!dateInput) return;
  const date = inputFormatToDDMMYYYY(dateInput.value);
  if (!date) return;

  try {
    const res = await apiGetAttendanceByUser(window.currentUser.userID, '', '', date);
    const infoDiv = document.getElementById('att-existing-info');
    const submitBtn = document.getElementById('att-submit-btn');

    if (res.success && res.records.length > 0) {
      const rec = res.records[0];
      if (infoDiv) {
        infoDiv.innerHTML = `
          <div class="info-msg">
            <i class="fas fa-info-circle"></i>
            Attendance already submitted for ${date}. You are editing the existing record.
          </div>`;
      }
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Attendance';

      // Pre-fill fields
      const statusEl = document.getElementById('att-status');
      if (statusEl) statusEl.value = rec.attendance || '';

      const locRadio = document.querySelector(`input[name="att-loc"][value="${rec.location}"]`);
      if (locRadio) locRadio.checked = true;

      // Pre-fill activities
      if (rec.plannedActivities) {
        const activities = rec.plannedActivities.split('|').map(a => a.trim());
        activities.forEach(a => {
          const cb = document.getElementById(`va-${a.replace(/\s+/g,'_')}`) ||
                     document.getElementById(`oa-${a.replace(/\s+/g,'_')}`);
          if (cb) cb.checked = true;
        });
      }

      const dealerEl = document.getElementById('att-dealer');
      if (dealerEl) dealerEl.value = rec.dealerName || '';
      const dealerCityEl = document.getElementById('att-dealer-city');
      if (dealerCityEl) dealerCityEl.value = rec.dealerCity || '';
      const commentsEl = document.getElementById('att-comments');
      if (commentsEl) commentsEl.value = rec.comments || '';

    } else {
      if (infoDiv) infoDiv.innerHTML = '';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Submit Attendance';
    }
  } catch(err) {
    console.error('Check attendance error:', err);
  }
}

async function submitAttendance() {
  const dateInput = document.getElementById('att-date').value;
  const date = inputFormatToDDMMYYYY(dateInput);
  const attendance = document.getElementById('att-status').value;
  const locationEl = document.querySelector('input[name="att-loc"]:checked');
  const location = locationEl ? locationEl.value : '';
  const dealerName = document.getElementById('att-dealer').value.trim();
  const dealerCity = document.getElementById('att-dealer-city').value.trim();
  const comments = document.getElementById('att-comments').value.trim();

  // Collect activities
  const allCheckboxes = document.querySelectorAll('#visit-activities input:checked, #other-activities input:checked');
  const activities = Array.from(allCheckboxes).map(c => c.value).join(' | ');

  const errorDiv = document.getElementById('att-error');
  errorDiv.style.display = 'none';

  if (!date) { showAttError('Please select a date.'); return; }
  if (!attendance) { showAttError('Please select attendance status.'); return; }
  if (!location) { showAttError('Please select a location.'); return; }
  if (!checkConnectivity()) return;

  showLoading('Submitting attendance...');
  try {
    const res = await apiSubmitAttendance({
      userID: window.currentUser.userID,
      username: window.currentUser.username,
      engineerName: window.currentUser.name,
      date, attendance, location,
      plannedActivities: activities,
      dealerName, dealerCity, comments
    });
    hideLoading();
    if (res.success) {
      showToast(`✅ ${res.message}`, 'success');
      showUpdateAttendance();
    } else {
      showAttError(res.message || 'Error submitting attendance.');
    }
  } catch(err) {
    hideLoading();
    showAttError('Connection error. Please try again.');
  }
}

function showAttError(msg) {
  const err = document.getElementById('att-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

// ============================================================
// UPDATE DEALER PUNCH
// ============================================================
function showUpdateDealerPunch() {
  setActiveSidebarItem('nav-update-punch');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-map-marker-alt"></i> Update Dealer Punch</h2>
      <p>Record your dealer visit with GPS location.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-store"></i> Dealer Name</label>
          <input type="text" id="dp-dealer" class="form-control" placeholder="Enter dealer name">
        </div>
        <div class="form-group">
          <label><i class="fas fa-city"></i> Dealer City</label>
          <input type="text" id="dp-city" class="form-control" placeholder="Enter dealer city">
        </div>

        <div class="form-group">
          <label><i class="fas fa-map"></i> Current Location</label>
          <div id="map-container"></div>
          <div class="map-coords" id="map-coords">
            <i class="fas fa-spinner fa-spin"></i> Getting your location...
          </div>
          <div id="resolved-address" class="info-msg" style="display:none;">
            <i class="fas fa-map-pin"></i> <span id="address-text"></span>
          </div>
        </div>

        <div id="dp-error" class="error-msg" style="display:none"></div>
        <button class="btn btn-primary btn-full" onclick="submitDealerPunch()">
          <i class="fas fa-map-marker-alt"></i> Submit Punch
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-history"></i> Today's Punches</h3>
      </div>
      <div class="card-body" id="today-punches">
        <div class="empty-state"><div class="spinner" style="margin:0 auto;width:28px;height:28px;"></div></div>
      </div>
    </div>
  `);

  initDealerPunchMap();
  loadTodayPunches();
}

let currentLat = null;
let currentLng = null;
let dealerMap = null;
let dealerMarker = null;

function initDealerPunchMap() {
  // Load Leaflet if not loaded
  if (!window.L) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);
  } else {
    initMap();
  }
}

function initMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  // Default location (India center)
  dealerMap = L.map('map-container').setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(dealerMap);

  // Get current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;

        dealerMap.setView([currentLat, currentLng], 15);

        if (dealerMarker) dealerMap.removeLayer(dealerMarker);
        dealerMarker = L.marker([currentLat, currentLng], {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
          })
        }).addTo(dealerMap).bindPopup('Your Location').openPopup();

        document.getElementById('map-coords').innerHTML =
          `<i class="fas fa-map-pin" style="color:var(--success);"></i>
           Lat: ${currentLat.toFixed(6)}, Lng: ${currentLng.toFixed(6)}`;

        reverseGeocodeLocation(currentLat, currentLng);
      },
      error => {
        document.getElementById('map-coords').innerHTML =
          '<i class="fas fa-exclamation-triangle" style="color:var(--warning);"></i> Location access denied. Please enable GPS.';
        currentLat = null;
        currentLng = null;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  } else {
    document.getElementById('map-coords').innerHTML =
      '<i class="fas fa-times-circle" style="color:var(--danger);"></i> Geolocation not supported.';
  }
}

async function reverseGeocodeLocation(lat, lng) {
  try {
    // First try Apps Script geocoding
    const res = await apiReverseGeocode(lat, lng);
    const addrDiv = document.getElementById('resolved-address');
    const addrText = document.getElementById('address-text');
    if (addrDiv && addrText) {
      addrDiv.style.display = 'flex';
      addrText.textContent = res.address || `${lat}, ${lng}`;
    }
    window._resolvedAddress = res.address || `${lat}, ${lng}`;
  } catch(err) {
    // Fallback to Nominatim
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await resp.json();
      const address = data.display_name || `${lat}, ${lng}`;
      const addrDiv = document.getElementById('resolved-address');
      const addrText = document.getElementById('address-text');
      if (addrDiv && addrText) {
        addrDiv.style.display = 'flex';
        addrText.textContent = address;
      }
      window._resolvedAddress = address;
    } catch(e) {
      window._resolvedAddress = `${lat}, ${lng}`;
    }
  }
}

async function submitDealerPunch() {
  const dealerName = document.getElementById('dp-dealer').value.trim();
  const dealerCity = document.getElementById('dp-city').value.trim();
  const errorDiv = document.getElementById('dp-error');
  errorDiv.style.display = 'none';

  if (!dealerName) { showDPError('Please enter dealer name.'); return; }
  if (!dealerCity) { showDPError('Please enter dealer city.'); return; }
  if (!currentLat || !currentLng) { showDPError('Location not available. Please enable GPS and try again.'); return; }
  if (!checkConnectivity()) return;

  showLoading('Submitting dealer punch...');
  try {
    const res = await apiSubmitDealerPunch({
      userID: window.currentUser.userID,
      username: window.currentUser.username,
      engineerName: window.currentUser.name,
      date: getTodayDDMMYYYY(),
      dealerName,
      dealerCity,
      latitude: currentLat,
      longitude: currentLng,
      resolvedAddress: window._resolvedAddress || `${currentLat}, ${currentLng}`
    });
    hideLoading();
    if (res.success) {
      showToast('✅ Dealer punch submitted!', 'success');
      document.getElementById('dp-dealer').value = '';
      document.getElementById('dp-city').value = '';
      loadTodayPunches();
    } else {
      showDPError(res.message || 'Error submitting punch.');
    }
  } catch(err) {
    hideLoading();
    showDPError('Connection error. Please try again.');
  }
}

function showDPError(msg) {
  const err = document.getElementById('dp-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

async function loadTodayPunches() {
  try {
    const res = await apiGetDealerPunchByUser(window.currentUser.userID, '', '', getTodayDDMMYYYY());
    const container = document.getElementById('today-punches');
    if (!container) return;

    if (!res.success || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>No punches today.</p></div>';
      return;
    }

    container.innerHTML = res.records.map((r, i) => `
      <div class="att-list-item" style="cursor:default;">
        <div>
          <div class="att-list-date">${i + 1}. ${sanitize(r.dealerName)}</div>
          <div class="att-list-sub">${sanitize(r.dealerCity)}</div>
          <div class="att-list-sub" style="font-size:0.72rem;margin-top:2px;">
            <i class="fas fa-map-pin"></i> ${sanitize(r.resolvedAddress)}
          </div>
        </div>
        <div class="att-list-right">
          <div style="font-size:0.72rem;color:var(--mid-gray);">${sanitize(r.submittedAt)}</div>
        </div>
      </div>`).join('');
  } catch(err) {
    console.error('Load punches error:', err);
  }
}

// ============================================================
// UPDATE DAILY TASKS
// ============================================================
async function showUpdateDailyTasks() {
  setActiveSidebarItem('nav-update-tasks');
  const today = getTodayDDMMYYYY();

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-clipboard-check"></i> Update Daily Tasks</h2>
      <p>Record all your activities for the day.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-calendar"></i> Date</label>
          <input type="date" id="dt-date" class="form-control"
            value="${ddmmyyyyToInputFormat(today)}"
            onchange="checkExistingTasks()">
        </div>

        <div id="dt-existing-info"></div>

        ${generateTimeSelector('dt-login', '<i class="fas fa-sign-in-alt"></i> Login Time')}

        <div class="form-group">
          <label><i class="fas fa-map-marker-alt"></i> Location</label>
          <div class="radio-group">
            <div class="radio-pill">
              <input type="radio" name="dt-loc" id="dtl-local" value="Local">
              <label for="dtl-local"><i class="fas fa-home"></i> Local</label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="dt-loc" id="dtl-out" value="Outstation">
              <label for="dtl-out"><i class="fas fa-plane"></i> Outstation</label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="dt-loc" id="dtl-travel" value="Travelling">
              <label for="dtl-travel"><i class="fas fa-car"></i> Travelling</label>
            </div>
          </div>
        </div>

        <div class="section-divider"><i class="fas fa-tasks"></i> Performed Tasks</div>
        <p style="font-size:0.82rem;color:var(--mid-gray);margin-bottom:12px;">
          Tap a task to expand and enter details.
        </p>

        <!-- TASK TILES -->
        <div class="task-tiles-grid" id="task-tiles-grid">
          ${buildTaskTiles()}
        </div>

        <!-- TASK DETAIL INPUTS (shown when tile is selected) -->
        <div id="task-details-container"></div>

        <div class="divider"></div>

        ${generateTimeSelector('dt-logout', '<i class="fas fa-sign-out-alt"></i> Logout Time')}

        <div class="form-group">
          <label><i class="fas fa-comment-alt"></i> Task Comments</label>
          <textarea id="dt-comments" class="form-control"
            placeholder="Overall comments for the day..." rows="3"></textarea>
        </div>

        <div id="dt-error" class="error-msg" style="display:none"></div>
        <button class="btn btn-primary btn-full" id="dt-submit-btn" onclick="submitDailyTasks()">
          <i class="fas fa-save"></i> Submit Tasks
        </button>
      </div>
    </div>
  `);

  await checkExistingTasks();
}

function buildTaskTiles() {
  const tasks = getTaskDefinitions();
  return tasks.map(t => `
    <div class="task-tile" id="tile-${t.key}" onclick="toggleTaskTile('${t.key}')">
      <div class="task-tile-check"><i class="fas fa-check"></i></div>
      <i class="fas ${t.icon}"></i>
      <span>${t.label}</span>
    </div>`).join('');
}

function getTaskDefinitions() {
  return [
    { key: 'dsq', label: 'DSQ Audit', icon: 'fa-clipboard-check', section: 'visit' },
    { key: 'segq', label: 'SEG Q Audit', icon: 'fa-clipboard-check', section: 'visit' },
    { key: 'hub', label: 'HUB Audit', icon: 'fa-building', section: 'visit' },
    { key: 'spoke', label: 'SPOKE Audit', icon: 'fa-dot-circle', section: 'visit' },
    { key: 'dsqwarranty', label: 'DSQ Warranty Inspection', icon: 'fa-search', section: 'visit' },
    { key: 'segqwarranty', label: 'SEG Q Warranty Inspection', icon: 'fa-search', section: 'visit' },
    { key: 'ji', label: 'Joint Investigation', icon: 'fa-microscope', section: 'visit' },
    { key: 'campaign', label: 'Campaign', icon: 'fa-bullhorn', section: 'visit' },
    { key: 'itrams', label: 'iTrams', icon: 'fa-ticket-alt', section: 'visit' },
    { key: 'weekly', label: 'Weekly Data Collection', icon: 'fa-database', section: 'other' },
    { key: 'ejc', label: 'eJC Data Validation', icon: 'fa-check-double', section: 'other' },
    { key: 'iuw', label: 'IUW Marketing Calls', icon: 'fa-phone', section: 'other' },
    { key: 'adicare', label: 'AdiCare Marketing Calls', icon: 'fa-phone-alt', section: 'other' },
    { key: 'oe', label: 'OE Extended Warranty', icon: 'fa-file-contract', section: 'other' },
    { key: 'warranty', label: 'Warranty Support BDS/BES', icon: 'fa-tools', section: 'other' },
    { key: 'oecd', label: 'OECD Mapping', icon: 'fa-map', section: 'other' },
    { key: 'amc', label: 'AMC Related', icon: 'fa-file-alt', section: 'other' }
  ];
}

window._selectedTasks = {};

function toggleTaskTile(key) {
  const tile = document.getElementById(`tile-${key}`);
  const isSelected = tile.classList.contains('selected');

  if (isSelected) {
    tile.classList.remove('selected');
    delete window._selectedTasks[key];
    updateTaskDetailsContainer();
  } else {
    tile.classList.add('selected');
    window._selectedTasks[key] = true;
    updateTaskDetailsContainer();
    // Scroll to the details
    setTimeout(() => {
      const detail = document.getElementById(`detail-${key}`);
      if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

function updateTaskDetailsContainer() {
  const container = document.getElementById('task-details-container');
  const selectedKeys = Object.keys(window._selectedTasks);

  if (selectedKeys.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = selectedKeys.map(key => buildTaskDetailBox(key)).join('');
}

function buildTaskDetailBox(key) {
  switch(key) {
    case 'dsq': return buildAuditBox('dsq', 'DSQ Audit', 5);
    case 'segq': return buildAuditBox('segq', 'SEG Q Audit', 5);
    case 'hub': return buildAuditBox('hub', 'HUB Audit', 5);
    case 'spoke': return buildAuditBox('spoke', 'SPOKE Audit', 5);
    case 'dsqwarranty': return buildWarrantyBox('dsqwarranty', 'DSQ Warranty Material Inspection', 5);
    case 'segqwarranty': return buildWarrantyBox('segqwarranty', 'SEG Q Warranty Material Inspection', 5);
    case 'ji': return buildJIBox();
    case 'campaign': return buildCampaignBox();
    case 'itrams': return buildItramsBox();
    case 'weekly': return buildSimpleCountBox('weekly', 'Weekly Data Collection [Reference Injector]', 'Reference Injector Dealer Count');
    case 'ejc': return buildEJCBox();
    case 'iuw': return buildCallBox('iuw', 'IUW Marketing Calls', 'Subscription Count');
    case 'adicare': return buildCallBox('adicare', 'AdiCare Marketing Calls', 'Sales Count');
    case 'oe': return buildCallBox('oe', 'OE Extended Warranty Calls', 'Sales Count');
    case 'warranty': return buildCallCommentBox('warranty', 'Warranty Support to BDS/BES');
    case 'oecd': return buildCallCommentBox('oecd', 'OECD Mapping');
    case 'amc': return buildCallCommentBox('amc', 'AMC Related');
    default: return '';
  }
}

function buildAuditBox(key, label, maxCount) {
  return `
    <div class="task-detail-box" id="detail-${key}">
      <h4><i class="fas fa-clipboard-check"></i> ${label}</h4>
      <div class="form-group">
        <label>Count (Max ${maxCount})</label>
        <input type="number" id="${key}-count" class="form-control" min="0" max="${maxCount}"
          placeholder="Enter count" oninput="updateAuditItems('${key}', ${maxCount})">
      </div>
      <div id="${key}-items"></div>
    </div>`;
}

function updateAuditItems(key, maxCount) {
  const count = Math.min(parseInt(document.getElementById(`${key}-count`).value) || 0, maxCount);
  const container = document.getElementById(`${key}-items`);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="task-detail-item">
        <h5>Entry ${i + 1}</h5>
        <div class="task-detail-row">
          <div class="form-group">
            <label>Dealer Name</label>
            <input type="text" id="${key}-dealer-${i}" class="form-control" placeholder="Dealer name">
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" id="${key}-city-${i}" class="form-control" placeholder="City">
          </div>
          <div class="form-group">
            <label>Score</label>
            <input type="text" id="${key}-score-${i}" class="form-control" placeholder="Score">
          </div>
        </div>
      </div>`;
  }
}

function buildWarrantyBox(key, label, maxCount) {
  return `
    <div class="task-detail-box" id="detail-${key}">
      <h4><i class="fas fa-search"></i> ${label}</h4>
      <div class="inline-form-row">
        <div class="form-group">
          <label>Inspected Dealers (Max ${maxCount})</label>
          <input type="number" id="${key}-count" class="form-control" min="0" max="${maxCount}"
            placeholder="Count" oninput="updateWarrantyItems('${key}', ${maxCount})">
        </div>
        <div class="form-group">
          <label>Materials Inspected Count</label>
          <input type="number" id="${key}-materials" class="form-control" min="0" placeholder="Count">
        </div>
      </div>
      <div id="${key}-items"></div>
    </div>`;
}

function updateWarrantyItems(key, maxCount) {
  const count = Math.min(parseInt(document.getElementById(`${key}-count`).value) || 0, maxCount);
  const container = document.getElementById(`${key}-items`);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="task-detail-item">
        <h5>Dealer ${i + 1}</h5>
        <div class="task-detail-row">
          <div class="form-group">
            <label>Dealer Name</label>
            <input type="text" id="${key}-dealer-${i}" class="form-control" placeholder="Dealer name">
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" id="${key}-city-${i}" class="form-control" placeholder="City">
          </div>
        </div>
      </div>`;
  }
}

function buildJIBox() {
  return `
    <div class="task-detail-box" id="detail-ji">
      <h4><i class="fas fa-microscope"></i> Joint Investigation</h4>
      <div class="form-group">
        <label>JI Count (Max 2)</label>
        <input type="number" id="ji-count" class="form-control" min="0" max="2"
          placeholder="Count" oninput="updateJIItems()">
      </div>
      <div id="ji-items"></div>
    </div>`;
}

function updateJIItems() {
  const count = Math.min(parseInt(document.getElementById('ji-count').value) || 0, 2);
  const container = document.getElementById('ji-items');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="task-detail-item">
        <h5>JI ${i + 1}</h5>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="ji-location-${i}" class="form-control" placeholder="Location">
        </div>
        <div class="form-group">
          <label>JI Details</label>
          <textarea id="ji-details-${i}" class="form-control" rows="2" placeholder="Enter JI details..."></textarea>
        </div>
      </div>`;
  }
}

function buildCampaignBox() {
  return `
    <div class="task-detail-box" id="detail-campaign">
      <h4><i class="fas fa-bullhorn"></i> Campaign</h4>
      <div class="form-group">
        <label>Campaign Count (Max 1)</label>
        <input type="number" id="campaign-count" class="form-control" min="0" max="1"
          placeholder="Count" oninput="updateCampaignItems()">
      </div>
      <div id="campaign-items"></div>
    </div>`;
}

function updateCampaignItems() {
  const count = Math.min(parseInt(document.getElementById('campaign-count').value) || 0, 1);
  const container = document.getElementById('campaign-items');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="task-detail-item">
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="campaign-location-0" class="form-control" placeholder="Location">
        </div>
        <div class="form-group">
          <label>Campaign Details</label>
          <textarea id="campaign-details-0" class="form-control" rows="2" placeholder="Campaign details..."></textarea>
        </div>
      </div>`;
  }
}

function buildItramsBox() {
  return `
    <div class="task-detail-box" id="detail-itrams">
      <h4><i class="fas fa-ticket-alt"></i> iTrams</h4>
      <div class="form-group">
        <label>Ticket Count (Max 3)</label>
        <input type="number" id="itrams-count" class="form-control" min="0" max="3"
          placeholder="Count" oninput="updateItramsItems()">
      </div>
      <div id="itrams-items"></div>
    </div>`;
}

function updateItramsItems() {
  const count = Math.min(parseInt(document.getElementById('itrams-count').value) || 0, 3);
  const container = document.getElementById('itrams-items');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="task-detail-item">
        <h5>Ticket ${i + 1}</h5>
        <div class="task-detail-row">
          <div class="form-group">
            <label>Dealer Name</label>
            <input type="text" id="itrams-dealer-${i}" class="form-control" placeholder="Dealer name">
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" id="itrams-city-${i}" class="form-control" placeholder="City">
          </div>
        </div>
      </div>`;
  }
}

function buildSimpleCountBox(key, label, countLabel) {
  return `
    <div class="task-detail-box" id="detail-${key}">
      <h4><i class="fas fa-database"></i> ${label}</h4>
      <div class="form-group">
        <label>${countLabel}</label>
        <input type="number" id="${key}-count" class="form-control" min="0" placeholder="Enter count">
      </div>
    </div>`;
}

function buildEJCBox() {
  return `
    <div class="task-detail-box" id="detail-ejc">
      <h4><i class="fas fa-check-double"></i> eJC Data Quality Validation</h4>
      <div class="inline-form-row">
        <div class="form-group">
          <label>eJC Count</label>
          <input type="number" id="ejc-count" class="form-control" min="0" placeholder="Count">
        </div>
        <div class="form-group">
          <label>No. of Dealers Validated</label>
          <input type="number" id="ejc-dealers" class="form-control" min="0" placeholder="Count">
        </div>
      </div>
    </div>`;
}

function buildCallBox(key, label, secondLabel) {
  return `
    <div class="task-detail-box" id="detail-${key}">
      <h4><i class="fas fa-phone"></i> ${label}</h4>
      <div class="inline-form-row">
        <div class="form-group">
          <label>Call Count</label>
          <input type="number" id="${key}-count" class="form-control" min="0" placeholder="Count">
        </div>
        <div class="form-group">
          <label>${secondLabel}</label>
          <input type="number" id="${key}-second" class="form-control" min="0" placeholder="Count">
        </div>
      </div>
    </div>`;
}

function buildCallCommentBox(key, label) {
  return `
    <div class="task-detail-box" id="detail-${key}">
      <h4><i class="fas fa-tools"></i> ${label}</h4>
      <div class="inline-form-row">
        <div class="form-group">
          <label>Call Count</label>
          <input type="number" id="${key}-count" class="form-control" min="0" placeholder="Count">
        </div>
      </div>
      <div class="form-group">
        <label>Comments</label>
        <textarea id="${key}-comment" class="form-control" rows="2" placeholder="Enter comments..."></textarea>
      </div>
    </div>`;
}

async function checkExistingTasks() {
  const dateInput = document.getElementById('dt-date');
  if (!dateInput) return;
  const date = inputFormatToDDMMYYYY(dateInput.value);
  if (!date) return;

  try {
    const res = await apiGetDailyTasksByUser(window.currentUser.userID, '', '', date);
    const infoDiv = document.getElementById('dt-existing-info');
    const submitBtn = document.getElementById('dt-submit-btn');

    if (res.success && res.records.length > 0) {
      const task = res.records[0];
      if (infoDiv) {
        infoDiv.innerHTML = `
          <div class="info-msg">
            <i class="fas fa-info-circle"></i>
            Tasks already submitted for ${date}. You are editing the existing record.
          </div>`;
      }
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Tasks';

      // Pre-fill time
      setTimeValue('dt-login', task.loginTime);
      setTimeValue('dt-logout', task.logoutTime);

      // Location
      const locRadio = document.querySelector(`input[name="dt-loc"][value="${task.location}"]`);
      if (locRadio) locRadio.checked = true;

      // Comments
      const commentsEl = document.getElementById('dt-comments');
      if (commentsEl) commentsEl.value = task.taskComments || '';

      // Pre-select tiles and fill data
      window._selectedTasks = {};
      prefillTaskTiles(task, task.details || []);

    } else {
      if (infoDiv) infoDiv.innerHTML = '';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Submit Tasks';
      window._selectedTasks = {};
      updateTaskDetailsContainer();
    }
  } catch(err) {
    console.error('Check tasks error:', err);
  }
}

function prefillTaskTiles(task, details) {
  const keyMap = {
    'dsq': 'dsqAuditCount', 'segq': 'segqAuditCount',
    'hub': 'hubAuditCount', 'spoke': 'spokeAuditCount',
    'dsqwarranty': 'dsqWarrantyInspectedDealers', 'segqwarranty': 'segqWarrantyInspectedDealers',
    'ji': 'jiCount', 'campaign': 'campaignCount', 'itrams': 'itramsTicketCount',
    'weekly': 'weeklyDataCollectionCount', 'ejc': 'ejcCount',
    'iuw': 'iuwCallCount', 'adicare': 'adicareCallCount',
    'oe': 'oeCallCount', 'warranty': 'warrantyCallCount',
    'oecd': 'oecdCallCount', 'amc': 'amcCallCount'
  };

  Object.entries(keyMap).forEach(([key, field]) => {
    if (Number(task[field]) > 0) {
      window._selectedTasks[key] = true;
      const tile = document.getElementById(`tile-${key}`);
      if (tile) tile.classList.add('selected');
    }
  });

  updateTaskDetailsContainer();

  // Now fill values after DOM is updated
  setTimeout(() => {
    // Audit types
    ['dsq','segq','hub','spoke'].forEach(key => {
      const countField = key + 'AuditCount';
      const count = Number(task[countField]) || 0;
      const el = document.getElementById(`${key}-count`);
      if (el) { el.value = count; updateAuditItems(key, 5); }
      // Fill dealer items from details
      const taskDetails = details.filter(d => d.taskType === key.toUpperCase() + ' Audit' ||
        d.taskType === (key === 'dsq' ? 'DSQ Audit' : key === 'segq' ? 'SEG Q Audit' :
          key === 'hub' ? 'HUB Audit' : 'SPOKE Audit'));
      taskDetails.forEach((d, i) => {
        const dealerEl = document.getElementById(`${key}-dealer-${i}`);
        const cityEl = document.getElementById(`${key}-city-${i}`);
        const scoreEl = document.getElementById(`${key}-score-${i}`);
        if (dealerEl) dealerEl.value = d.dealerName || '';
        if (cityEl) cityEl.value = d.dealerCity || '';
        if (scoreEl) scoreEl.value = d.score || '';
      });
    });

    // Warranty
    ['dsqwarranty','segqwarranty'].forEach(key => {
      const isDSQ = key === 'dsqwarranty';
      const count = Number(task[isDSQ ? 'dsqWarrantyInspectedDealers' : 'segqWarrantyInspectedDealers']) || 0;
      const matsCount = Number(task[isDSQ ? 'dsqMaterialsInspectedCount' : 'segqMaterialsInspectedCount']) || 0;
      const cEl = document.getElementById(`${key}-count`);
      const mEl = document.getElementById(`${key}-materials`);
      if (cEl) { cEl.value = count; updateWarrantyItems(key, 5); }
      if (mEl) mEl.value = matsCount;
    });

    // JI
    const jiCount = Number(task.jiCount) || 0;
    const jiEl = document.getElementById('ji-count');
    if (jiEl) { jiEl.value = jiCount; updateJIItems(); }

    // Campaign
    const campCount = Number(task.campaignCount) || 0;
    const campEl = document.getElementById('campaign-count');
    if (campEl) { campEl.value = campCount; updateCampaignItems(); }

    // iTrams
    const itramsCount = Number(task.itramsTicketCount) || 0;
    const itramsEl = document.getElementById('itrams-count');
    if (itramsEl) { itramsEl.value = itramsCount; updateItramsItems(); }

    // Simple
    const weeklyEl = document.getElementById('weekly-count');
    if (weeklyEl) weeklyEl.value = task.weeklyDataCollectionCount || 0;

    const ejcEl = document.getElementById('ejc-count');
    if (ejcEl) ejcEl.value = task.ejcCount || 0;
    const ejcDealersEl = document.getElementById('ejc-dealers');
    if (ejcDealersEl) ejcDealersEl.value = task.ejcDealersValidated || 0;

    const iuwEl = document.getElementById('iuw-count');
    if (iuwEl) iuwEl.value = task.iuwCallCount || 0;
    const iuwSecEl = document.getElementById('iuw-second');
    if (iuwSecEl) iuwSecEl.value = task.iuwSubscriptionCount || 0;

    const adicareEl = document.getElementById('adicare-count');
    if (adicareEl) adicareEl.value = task.adicareCallCount || 0;
    const adicareSecEl = document.getElementById('adicare-second');
    if (adicareSecEl) adicareSecEl.value = task.adicareSalesCount || 0;

    const oeEl = document.getElementById('oe-count');
    if (oeEl) oeEl.value = task.oeCallCount || 0;
    const oeSecEl = document.getElementById('oe-second');
    if (oeSecEl) oeSecEl.value = task.oeSalesCount || 0;

    const warEl = document.getElementById('warranty-count');
    if (warEl) warEl.value = task.warrantyCallCount || 0;
    const warComEl = document.getElementById('warranty-comment');
    if (warComEl) warComEl.value = task.warrantyComments || '';

    const oecdEl = document.getElementById('oecd-count');
    if (oecdEl) oecdEl.value = task.oecdCallCount || 0;
    const oecdComEl = document.getElementById('oecd-comment');
    if (oecdComEl) oecdComEl.value = task.oecdComments || '';

    const amcEl = document.getElementById('amc-count');
    if (amcEl) amcEl.value = task.amcCallCount || 0;
    const amcComEl = document.getElementById('amc-comment');
    if (amcComEl) amcComEl.value = task.amcComments || '';

  }, 200);
}

function collectTaskData() {
  const data = {};
  const taskDetails = [];

  // Audit tasks
  ['dsq','segq','hub','spoke'].forEach(key => {
    const el = document.getElementById(`${key}-count`);
    const count = el ? Math.min(parseInt(el.value) || 0, 5) : 0;
    const labelMap = { dsq: 'DSQ Audit', segq: 'SEG Q Audit', hub: 'HUB Audit', spoke: 'SPOKE Audit' };
    const fieldMap = { dsq: 'dsqAuditCount', segq: 'segqAuditCount', hub: 'hubAuditCount', spoke: 'spokeAuditCount' };
    data[fieldMap[key]] = window._selectedTasks[key] ? count : 0;
    if (window._selectedTasks[key]) {
      for (let i = 0; i < count; i++) {
        taskDetails.push({
          taskType: labelMap[key],
          itemIndex: i,
          dealerName: (document.getElementById(`${key}-dealer-${i}`) || {}).value || '',
          dealerCity: (document.getElementById(`${key}-city-${i}`) || {}).value || '',
          score: (document.getElementById(`${key}-score-${i}`) || {}).value || ''
        });
      }
    }
  });

  // Warranty
  ['dsqwarranty','segqwarranty'].forEach(key => {
    const isDSQ = key === 'dsqwarranty';
    const cEl = document.getElementById(`${key}-count`);
    const mEl = document.getElementById(`${key}-materials`);
    const count = cEl ? Math.min(parseInt(cEl.value) || 0, 5) : 0;
    const matsCount = mEl ? parseInt(mEl.value) || 0 : 0;
    data[isDSQ ? 'dsqWarrantyInspectedDealers' : 'segqWarrantyInspectedDealers'] = window._selectedTasks[key] ? count : 0;
    data[isDSQ ? 'dsqMaterialsInspectedCount' : 'segqMaterialsInspectedCount'] = window._selectedTasks[key] ? matsCount : 0;
    if (window._selectedTasks[key]) {
      for (let i = 0; i < count; i++) {
        taskDetails.push({
          taskType: isDSQ ? 'DSQ Warranty' : 'SEG Q Warranty',
          itemIndex: i,
          dealerName: (document.getElementById(`${key}-dealer-${i}`) || {}).value || '',
          dealerCity: (document.getElementById(`${key}-city-${i}`) || {}).value || '',
          materialsInspectedCount: matsCount
        });
      }
    }
  });

  // JI
  const jiCount = window._selectedTasks['ji'] ? Math.min(parseInt((document.getElementById('ji-count') || {}).value) || 0, 2) : 0;
  data.jiCount = jiCount;
  for (let i = 0; i < jiCount; i++) {
    taskDetails.push({
      taskType: 'Joint Investigation',
      itemIndex: i,
      location: (document.getElementById(`ji-location-${i}`) || {}).value || '',
      details: (document.getElementById(`ji-details-${i}`) || {}).value || ''
    });
  }

  // Campaign
  const campCount = window._selectedTasks['campaign'] ? Math.min(parseInt((document.getElementById('campaign-count') || {}).value) || 0, 1) : 0;
  data.campaignCount = campCount;
  if (campCount > 0) {
    taskDetails.push({
      taskType: 'Campaign',
      itemIndex: 0,
      location: (document.getElementById('campaign-location-0') || {}).value || '',
      details: (document.getElementById('campaign-details-0') || {}).value || ''
    });
  }

  // iTrams
  const itramsCount = window._selectedTasks['itrams'] ? Math.min(parseInt((document.getElementById('itrams-count') || {}).value) || 0, 3) : 0;
  data.itramsTicketCount = itramsCount;
  for (let i = 0; i < itramsCount; i++) {
    taskDetails.push({
      taskType: 'iTrams',
      itemIndex: i,
      dealerName: (document.getElementById(`itrams-dealer-${i}`) || {}).value || '',
      dealerCity: (document.getElementById(`itrams-city-${i}`) || {}).value || ''
    });
  }

  // Simple counts
  data.weeklyDataCollectionCount = window._selectedTasks['weekly'] ? parseInt((document.getElementById('weekly-count') || {}).value) || 0 : 0;
  data.ejcCount = window._selectedTasks['ejc'] ? parseInt((document.getElementById('ejc-count') || {}).value) || 0 : 0;
  data.ejcDealersValidated = window._selectedTasks['ejc'] ? parseInt((document.getElementById('ejc-dealers') || {}).value) || 0 : 0;
  data.iuwCallCount = window._selectedTasks['iuw'] ? parseInt((document.getElementById('iuw-count') || {}).value) || 0 : 0;
  data.iuwSubscriptionCount = window._selectedTasks['iuw'] ? parseInt((document.getElementById('iuw-second') || {}).value) || 0 : 0;
  data.adicareCallCount = window._selectedTasks['adicare'] ? parseInt((document.getElementById('adicare-count') || {}).value) || 0 : 0;
  data.adicareSalesCount = window._selectedTasks['adicare'] ? parseInt((document.getElementById('adicare-second') || {}).value) || 0 : 0;
  data.oeCallCount = window._selectedTasks['oe'] ? parseInt((document.getElementById('oe-count') || {}).value) || 0 : 0;
  data.oeSalesCount = window._selectedTasks['oe'] ? parseInt((document.getElementById('oe-second') || {}).value) || 0 : 0;
  data.warrantyCallCount = window._selectedTasks['warranty'] ? parseInt((document.getElementById('warranty-count') || {}).value) || 0 : 0;
  data.warrantyComments = window._selectedTasks['warranty'] ? (document.getElementById('warranty-comment') || {}).value || '' : '';
  data.oecdCallCount = window._selectedTasks['oecd'] ? parseInt((document.getElementById('oecd-count') || {}).value) || 0 : 0;
  data.oecdComments = window._selectedTasks['oecd'] ? (document.getElementById('oecd-comment') || {}).value || '' : '';
  data.amcCallCount = window._selectedTasks['amc'] ? parseInt((document.getElementById('amc-count') || {}).value) || 0 : 0;
  data.amcComments = window._selectedTasks['amc'] ? (document.getElementById('amc-comment') || {}).value || '' : '';

  return { data, taskDetails };
}

async function submitDailyTasks() {
  const dateInput = document.getElementById('dt-date').value;
  const date = inputFormatToDDMMYYYY(dateInput);
  const locationEl = document.querySelector('input[name="dt-loc"]:checked');
  const location = locationEl ? locationEl.value : '';
  const loginTime = getTimeValue('dt-login');
  const logoutTime = getTimeValue('dt-logout');
  const taskComments = document.getElementById('dt-comments').value.trim();
  const errorDiv = document.getElementById('dt-error');
  errorDiv.style.display = 'none';

  if (!date) { showDTError('Please select a date.'); return; }
  if (!location) { showDTError('Please select a location.'); return; }
  if (Object.keys(window._selectedTasks).length === 0) {
    showDTError('Please select at least one task.'); return;
  }
  if (!checkConnectivity()) return;

  const { data, taskDetails } = collectTaskData();

  showLoading('Submitting daily tasks...');
  try {
    const res = await apiSubmitDailyTasks({
      userID: window.currentUser.userID,
      username: window.currentUser.username,
      engineerName: window.currentUser.name,
      date, loginTime, location, logoutTime, taskComments,
      ...data,
      taskDetails
    });
    hideLoading();
    if (res.success) {
      showToast(`✅ ${res.message}`, 'success');
      window._selectedTasks = {};
      showUpdateDailyTasks();
    } else {
      showDTError(res.message || 'Error submitting tasks.');
    }
  } catch(err) {
    hideLoading();
    showDTError('Connection error. Please try again.');
  }
}

function showDTError(msg) {
  const err = document.getElementById('dt-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

// ============================================================
// UPDATE DAILY EXPENSES
// ============================================================
async function showUpdateExpenses() {
  setActiveSidebarItem('nav-update-expenses');
  const today = getTodayDDMMYYYY();

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-receipt"></i> Update Daily Expenses</h2>
      <p>Record your expenses for the day.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-calendar"></i> Date</label>
          <input type="date" id="exp-date" class="form-control"
            value="${ddmmyyyyToInputFormat(today)}"
            onchange="checkExpensesDate()">
        </div>
        <div id="exp-date-check"></div>
        <div id="exp-form-body" style="display:none;">
          <div id="exp-existing-info"></div>
          <div id="exp-location-display" class="info-msg" style="margin-bottom:16px;">
            <i class="fas fa-map-marker-alt"></i>
            <span id="exp-location-text">Location: Loading...</span>
          </div>
          <div id="exp-local-fields"></div>
          <div id="exp-outstation-fields"></div>
          <div class="form-group">
            <label><i class="fas fa-comment-alt"></i> Conveyance Comments</label>
            <textarea id="exp-conv-comments" class="form-control" rows="2"
              placeholder="Conveyance related comments..."></textarea>
          </div>
          <div class="form-group">
            <label><i class="fas fa-comment-alt"></i> Travel Comments</label>
            <textarea id="exp-travel-comments" class="form-control" rows="2"
              placeholder="Travel related comments..."></textarea>
          </div>
          <div id="exp-error" class="error-msg" style="display:none"></div>
          <button class="btn btn-primary btn-full" id="exp-submit-btn" onclick="submitDailyExpenses()">
            <i class="fas fa-save"></i> Submit Expenses
          </button>
        </div>
      </div>
    </div>
  `);

  await checkExpensesDate();
}

async function checkExpensesDate() {
  const dateInput = document.getElementById('exp-date');
  if (!dateInput) return;
  const date = inputFormatToDDMMYYYY(dateInput.value);
  if (!date) return;

  const checkDiv = document.getElementById('exp-date-check');
  const formBody = document.getElementById('exp-form-body');

  checkDiv.innerHTML = '<div class="info-msg"><i class="fas fa-spinner fa-spin"></i> Checking tasks for this date...</div>';
  formBody.style.display = 'none';

  try {
    // Check if daily tasks exist for this date
    const taskCheck = await apiCheckDailyTasksExist(window.currentUser.userID, date);

    if (!taskCheck.exists) {
      checkDiv.innerHTML = `
        <div class="error-msg">
          <i class="fas fa-exclamation-circle"></i>
          Daily Tasks not updated for <strong>${date}</strong>.
          Please update your Daily Tasks first before entering expenses.
        </div>
        <button class="btn btn-primary btn-full mt-12" onclick="showUpdateDailyTasks()">
          <i class="fas fa-clipboard-check"></i> Go to Daily Tasks
        </button>`;
      return;
    }

    checkDiv.innerHTML = '';
    formBody.style.display = 'block';

    // Get the task to determine location
    const taskRes = await apiGetDailyTasksByUser(window.currentUser.userID, '', '', date);
    let locationType = 'Local';
    if (taskRes.success && taskRes.records.length > 0) {
      locationType = taskRes.records[0].location || 'Local';
    }

    // Display location
    document.getElementById('exp-location-text').textContent = `Location: ${locationType}`;
    window._expLocationType = locationType;

    // Show fields based on location
    renderExpenseFields(locationType);

    // Check existing expenses
    const expRes = await apiGetDailyExpensesByUser(window.currentUser.userID, '', '', date);
    const existingInfo = document.getElementById('exp-existing-info');
    const submitBtn = document.getElementById('exp-submit-btn');

    if (expRes.success && expRes.records.length > 0) {
      const rec = expRes.records[0];
      existingInfo.innerHTML = `
        <div class="info-msg">
          <i class="fas fa-info-circle"></i>
          Expenses already submitted for ${date}. You are editing the existing record.
        </div>`;
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Expenses';

      // Pre-fill
      prefillExpenseFields(rec, locationType);
    } else {
      existingInfo.innerHTML = '';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Submit Expenses';
      // Set default food expense
      const foodEl = document.getElementById('exp-food');
      if (foodEl) foodEl.value = CONFIG.DEFAULT_FOOD_EXPENSE;
    }

  } catch(err) {
    checkDiv.innerHTML = '<div class="error-msg"><i class="fas fa-exclamation-circle"></i> Error checking data. Please try again.</div>';
  }
}

function renderExpenseFields(locationType) {
  const isOutstation = locationType === 'Outstation' || locationType === 'Travelling';
  const localDiv = document.getElementById('exp-local-fields');
  const outstationDiv = document.getElementById('exp-outstation-fields');

  if (!isOutstation) {
    // Local only
    localDiv.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-city"></i> Day Start City</label>
        <input type="text" id="exp-start-city" class="form-control" placeholder="Enter city">
      </div>
      <div class="form-group">
        <label><i class="fas fa-rupee-sign"></i> Local Travel Expense
          <span style="font-size:0.75rem;color:var(--mid-gray);">(Max ₹${CONFIG.MAX_LOCAL_TRAVEL})</span>
        </label>
        <input type="number" id="exp-local-travel" class="form-control"
          min="0" max="${CONFIG.MAX_LOCAL_TRAVEL}" placeholder="₹0"
          oninput="validateMax(this, ${CONFIG.MAX_LOCAL_TRAVEL})">
      </div>`;
    outstationDiv.innerHTML = '';
  } else {
    // Outstation fields
    localDiv.innerHTML = '';
    outstationDiv.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-city"></i> Day Start City</label>
        <input type="text" id="exp-start-city" class="form-control" placeholder="Enter start city">
      </div>
      <div class="form-group">
        <label><i class="fas fa-map-marker"></i> City 1 (Visited)</label>
        <input type="text" id="exp-city1" class="form-control" placeholder="Enter city 1">
      </div>
      <div class="form-group">
        <label><i class="fas fa-map-marker"></i> City 2 (Visited)</label>
        <input type="text" id="exp-city2" class="form-control" placeholder="Enter city 2 (if applicable)">
      </div>
      <div class="form-group">
        <label><i class="fas fa-flag-checkered"></i> Day End City</label>
        <input type="text" id="exp-end-city" class="form-control" placeholder="Enter end city">
      </div>

      <div class="form-group">
        <label><i class="fas fa-rupee-sign"></i> Outstation Travel Expense</label>
        <input type="number" id="exp-os-travel" class="form-control" min="0" placeholder="₹0">
      </div>

      <div class="form-group">
        <label><i class="fas fa-ticket-alt"></i> Attach Travel Ticket</label>
        <div class="file-upload-wrap" onclick="document.getElementById('exp-travel-file').click()">
          <input type="file" id="exp-travel-file" accept="image/*,application/pdf"
            onchange="handleFileSelect('exp-travel-file','exp-travel-file-name')">
          <label>
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Tap to upload travel ticket</span>
          </label>
          <div id="exp-travel-file-name" class="file-name-display" style="display:none;">
            <i class="fas fa-check-circle"></i> <span></span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label><i class="fas fa-rupee-sign"></i> Lodging Expenses
          <span style="font-size:0.75rem;color:var(--mid-gray);">(Max ₹${CONFIG.MAX_LODGING})</span>
        </label>
        <input type="number" id="exp-lodging" class="form-control"
          min="0" max="${CONFIG.MAX_LODGING}" placeholder="₹0"
          oninput="validateMax(this, ${CONFIG.MAX_LODGING})">
      </div>

      <div class="form-group">
        <label><i class="fas fa-file-invoice"></i> Attach Lodging Bill</label>
        <div class="file-upload-wrap" onclick="document.getElementById('exp-lodging-file').click()">
          <input type="file" id="exp-lodging-file" accept="image/*,application/pdf"
            onchange="handleFileSelect('exp-lodging-file','exp-lodging-file-name')">
          <label>
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Tap to upload lodging bill</span>
          </label>
          <div id="exp-lodging-file-name" class="file-name-display" style="display:none;">
            <i class="fas fa-check-circle"></i> <span></span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label><i class="fas fa-utensils"></i> Outstation Food Expenses
          <span style="font-size:0.75rem;color:var(--gold-dark);">(Default ₹${CONFIG.DEFAULT_FOOD_EXPENSE})</span>
        </label>
        <input type="number" id="exp-food" class="form-control"
          value="${CONFIG.DEFAULT_FOOD_EXPENSE}" min="0" placeholder="₹500">
      </div>

      <div class="form-group">
        <label><i class="fas fa-car"></i> Outstation Local Travel
          <span style="font-size:0.75rem;color:var(--mid-gray);">(Max ₹${CONFIG.MAX_OUTSTATION_LOCAL})</span>
        </label>
        <input type="number" id="exp-os-local" class="form-control"
          min="0" max="${CONFIG.MAX_OUTSTATION_LOCAL}" placeholder="₹0"
          oninput="validateMax(this, ${CONFIG.MAX_OUTSTATION_LOCAL})">
      </div>`;
  }
}

function validateMax(input, max) {
  const val = parseFloat(input.value);
  if (val > max) {
    input.value = max;
    showToast(`⚠️ Maximum allowed is ₹${max}`, 'warning');
  }
}

function handleFileSelect(inputId, displayId) {
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (input && input.files.length > 0 && display) {
    display.style.display = 'flex';
    display.querySelector('span').textContent = input.files[0].name;
  }
}

function prefillExpenseFields(rec, locationType) {
  const startCityEl = document.getElementById('exp-start-city');
  if (startCityEl) startCityEl.value = rec.dayStartCity || '';

  if (locationType === 'Local') {
    const localEl = document.getElementById('exp-local-travel');
    if (localEl) localEl.value = rec.localTravelExpense || 0;
  } else {
    const fields = {
      'exp-city1': rec.city1,
      'exp-city2': rec.city2,
      'exp-end-city': rec.dayEndCity,
      'exp-os-travel': rec.outstationTravelExpense,
      'exp-lodging': rec.lodgingExpense,
      'exp-food': rec.outstationFoodExpense || CONFIG.DEFAULT_FOOD_EXPENSE,
      'exp-os-local': rec.outstationLocalTravel
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    });
  }

  const convEl = document.getElementById('exp-conv-comments');
  if (convEl) convEl.value = rec.conveyanceComments || '';
  const travelEl = document.getElementById('exp-travel-comments');
  if (travelEl) travelEl.value = rec.travelComments || '';
}

async function submitDailyExpenses() {
  const dateInput = document.getElementById('exp-date').value;
  const date = inputFormatToDDMMYYYY(dateInput);
  const locationType = window._expLocationType || 'Local';
  const isOutstation = locationType === 'Outstation' || locationType === 'Travelling';
  const errorDiv = document.getElementById('exp-error');
  errorDiv.style.display = 'none';

  if (!date) { showExpError('Please select a date.'); return; }
  if (!checkConnectivity()) return;

  const startCity = (document.getElementById('exp-start-city') || {}).value || '';

  let expenseData = {
    userID: window.currentUser.userID,
    username: window.currentUser.username,
    engineerName: window.currentUser.name,
    date, locationType,
    dayStartCity: startCity,
    city1: '', city2: '', dayEndCity: '',
    localTravelExpense: 0,
    outstationTravelExpense: 0,
    lodgingExpense: 0,
    outstationFoodExpense: 0,
    outstationLocalTravel: 0,
    travelTicketPath: '',
    lodgingBillPath: '',
    conveyanceComments: (document.getElementById('exp-conv-comments') || {}).value || '',
    travelComments: (document.getElementById('exp-travel-comments') || {}).value || ''
  };

  if (!isOutstation) {
    const localTravel = parseFloat((document.getElementById('exp-local-travel') || {}).value) || 0;
    if (localTravel > CONFIG.MAX_LOCAL_TRAVEL) {
      showExpError(`Local travel expense cannot exceed ₹${CONFIG.MAX_LOCAL_TRAVEL}.`); return;
    }
    expenseData.localTravelExpense = localTravel;
  } else {
    const city1 = (document.getElementById('exp-city1') || {}).value || '';
    const city2 = (document.getElementById('exp-city2') || {}).value || '';
    const endCity = (document.getElementById('exp-end-city') || {}).value || '';
    const osTravel = parseFloat((document.getElementById('exp-os-travel') || {}).value) || 0;
    const lodging = parseFloat((document.getElementById('exp-lodging') || {}).value) || 0;
    const food = parseFloat((document.getElementById('exp-food') || {}).value) || CONFIG.DEFAULT_FOOD_EXPENSE;
    const osLocal = parseFloat((document.getElementById('exp-os-local') || {}).value) || 0;

    if (lodging > CONFIG.MAX_LODGING) {
      showExpError(`Lodging expense cannot exceed ₹${CONFIG.MAX_LODGING}.`); return;
    }
    if (osLocal > CONFIG.MAX_OUTSTATION_LOCAL) {
      showExpError(`Outstation local travel cannot exceed ₹${CONFIG.MAX_OUTSTATION_LOCAL}.`); return;
    }

    expenseData = { ...expenseData, city1, city2, dayEndCity: endCity,
      outstationTravelExpense: osTravel, lodgingExpense: lodging,
      outstationFoodExpense: food, outstationLocalTravel: osLocal };

    // Handle file uploads
    showLoading('Uploading files...');
    try {
      const travelFile = document.getElementById('exp-travel-file');
      if (travelFile && travelFile.files.length > 0) {
        const file = travelFile.files[0];
        const base64 = await fileToBase64(file);
        const fileName = `${window.currentUser.name}_${date.replace(/\//g,'-')}_Travel_${file.name}`;
        const uploadRes = await apiUploadFile(base64, fileName, file.type);
        if (uploadRes.success) expenseData.travelTicketPath = uploadRes.fileURL;
      }

      const lodgingFile = document.getElementById('exp-lodging-file');
      if (lodgingFile && lodgingFile.files.length > 0) {
        const file = lodgingFile.files[0];
        const base64 = await fileToBase64(file);
        const fileName = `${window.currentUser.name}_${date.replace(/\//g,'-')}_Lodging_${file.name}`;
        const uploadRes = await apiUploadFile(base64, fileName, file.type);
        if (uploadRes.success) expenseData.lodgingBillPath = uploadRes.fileURL;
      }
    } catch(uploadErr) {
      console.error('File upload error:', uploadErr);
      showToast('⚠️ File upload failed, submitting without attachment.', 'warning');
    }
  }

  showLoading('Submitting expenses...');
  try {
    const res = await apiSubmitDailyExpenses(expenseData);
    hideLoading();
    if (res.success) {
      showToast(`✅ ${res.message}`, 'success');
      showUpdateExpenses();
    } else {
      showExpError(res.message || 'Error submitting expenses.');
    }
  } catch(err) {
    hideLoading();
    showExpError('Connection error. Please try again.');
  }
}

function showExpError(msg) {
  const err = document.getElementById('exp-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

// ============================================================
// VIEW ATTENDANCE
// ============================================================
async function showViewAttendance() {
  setActiveSidebarItem('nav-view-att');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-calendar-alt"></i> My Attendance</h2>
      <p>View your attendance records.</p>
    </div>
    <div id="att-view-list">
      <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
    </div>
  `);

  try {
    const res = await apiGetAttendanceByUser(window.currentUser.userID, '', '', '');
    const container = document.getElementById('att-view-list');
    if (!res.success || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No attendance records found.</p></div>';
      return;
    }

    container.innerHTML = `<div class="card"><div style="padding:0;">
      ${res.records.map(r => `
        <div class="att-list-item" onclick="viewAttendanceDetail('${r.attendanceID}')">
          <div>
            <div class="att-list-date">${sanitize(r.date)}</div>
            <div class="att-list-sub">${sanitize(r.location)} ${r.dealerName ? '&bull; ' + sanitize(r.dealerName) : ''}</div>
          </div>
          <div class="att-list-right">
            ${getAttBadge(r.attendance)}
            <i class="fas fa-chevron-right" style="color:var(--mid-gray);font-size:0.8rem;margin-top:4px;"></i>
          </div>
        </div>`).join('')}
    </div></div>`;

    window._attRecords = res.records;
  } catch(err) {
    showToast('Error loading attendance.', 'error');
  }
}

function viewAttendanceDetail(attID) {
  const rec = (window._attRecords || []).find(r => r.attendanceID === attID);
  if (!rec) return;
  openModal(`Attendance - ${rec.date}`, `
    <div style="display:grid;gap:12px;">
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Date</span>
        <span class="fw-bold">${sanitize(rec.date)}</span>
      </div>
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Attendance</span>
        ${getAttBadge(rec.attendance)}
      </div>
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Location</span>
        <span class="fw-bold">${sanitize(rec.location)}</span>
      </div>
      ${rec.plannedActivities ? `
      <div style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Planned Activities</span>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
          ${rec.plannedActivities.split('|').map(a => `<span class="badge badge-navy">${sanitize(a.trim())}</span>`).join('')}
        </div>
      </div>` : ''}
      ${rec.dealerName ? `
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Dealer</span>
        <span class="fw-bold">${sanitize(rec.dealerName)}, ${sanitize(rec.dealerCity)}</span>
      </div>` : ''}
      ${rec.comments ? `
      <div style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Comments</span>
        <p style="margin-top:6px;font-size:0.87rem;color:var(--dark-gray);">${sanitize(rec.comments)}</p>
      </div>` : ''}
      <div class="flex-between" style="padding:8px 0;">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Submitted At</span>
        <span style="font-size:0.8rem;">${sanitize(rec.submittedAt)}</span>
      </div>
    </div>
  `);
}

// ============================================================
// VIEW DEALER PUNCH
// ============================================================
async function showViewDealerPunch() {
  setActiveSidebarItem('nav-view-punch');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-store"></i> My Dealer Punches</h2>
      <p>View all your dealer visit records.</p>
    </div>
    <div id="punch-view-list">
      <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
    </div>
  `);

  try {
    const res = await apiGetDealerPunchByUser(window.currentUser.userID, '', '', '');
    const container = document.getElementById('punch-view-list');
    if (!res.success || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-store-slash"></i><p>No dealer punch records found.</p></div>';
      return;
    }

    // Group by date
    const grouped = {};
    res.records.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });

    container.innerHTML = Object.entries(grouped).map(([date, punches]) => `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-header">
          <h3><i class="fas fa-calendar-day"></i> ${date}</h3>
          <span class="badge badge-gold">${punches.length} punch${punches.length > 1 ? 'es' : ''}</span>
        </div>
        <div style="padding:0;">
          ${punches.map((p, i) => `
            <div class="att-list-item" onclick="viewPunchDetail('${p.punchID}')" style="cursor:pointer;">
              <div>
                <div class="att-list-date">${i + 1}. ${sanitize(p.dealerName)}</div>
                <div class="att-list-sub">${sanitize(p.dealerCity)}</div>
                <div class="att-list-sub" style="font-size:0.72rem;">
                  <i class="fas fa-map-pin"></i> ${sanitize(p.resolvedAddress || 'Address pending')}
                </div>
              </div>
              <div><i class="fas fa-chevron-right" style="color:var(--mid-gray);"></i></div>
            </div>`).join('')}
        </div>
      </div>`).join('');

    window._punchRecords = res.records;
  } catch(err) {
    showToast('Error loading dealer punches.', 'error');
  }
}

function viewPunchDetail(punchID) {
  const rec = (window._punchRecords || []).find(r => r.punchID === punchID);
  if (!rec) return;
  openModal(`Dealer Punch - ${rec.date}`, `
    <div style="display:grid;gap:12px;">
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Date</span>
        <span class="fw-bold">${sanitize(rec.date)}</span>
      </div>
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Dealer Name</span>
        <span class="fw-bold">${sanitize(rec.dealerName)}</span>
      </div>
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Dealer City</span>
        <span class="fw-bold">${sanitize(rec.dealerCity)}</span>
      </div>
      <div style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Resolved Address</span>
        <p style="margin-top:6px;font-size:0.85rem;">${sanitize(rec.resolvedAddress)}</p>
      </div>
      <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--light-gray);">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Coordinates</span>
        <span style="font-size:0.8rem;">${rec.latitude}, ${rec.longitude}</span>
      </div>
      <div class="flex-between" style="padding:8px 0;">
        <span class="text-muted" style="font-size:0.82rem;font-weight:600;text-transform:uppercase;">Submitted At</span>
        <span style="font-size:0.8rem;">${sanitize(rec.submittedAt)}</span>
      </div>
    </div>
  `);
}

// ============================================================
// VIEW TASKS
// ============================================================
async function showViewTasks() {
  setActiveSidebarItem('nav-view-tasks');
  const today = getTodayDDMMYYYY();
  const firstOfMonth = `01/${today.split('/')[1]}/${today.split('/')[2]}`;

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-list-alt"></i> My Tasks</h2>
      <p>View your task records and summary.</p>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="tab-my-count" onclick="switchMyTaskTab('count')">
        <i class="fas fa-chart-bar"></i> Task Count
      </button>
      <button class="tab-btn" id="tab-my-summary" onclick="switchMyTaskTab('summary')">
        <i class="fas fa-list"></i> Task Summary
      </button>
    </div>

    <!-- TASK COUNT TAB -->
    <div id="tab-content-my-count">
      <div class="date-filter-bar">
        <div class="form-group">
          <label>From Date</label>
          <input type="date" id="tc-from" class="form-control" value="${ddmmyyyyToInputFormat(firstOfMonth)}">
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" id="tc-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <button class="btn btn-primary" onclick="loadMyTaskCount()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="my-task-count-result"></div>
    </div>

    <!-- TASK SUMMARY TAB -->
    <div id="tab-content-my-summary" style="display:none;">
      <div class="date-filter-bar">
        <div class="form-group">
          <label>From Date</label>
          <input type="date" id="ts-from" class="form-control" value="${ddmmyyyyToInputFormat(firstOfMonth)}">
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" id="ts-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <button class="btn btn-primary" onclick="loadMyTaskSummary()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="my-task-summary-result"></div>
    </div>
  `);
}

function switchMyTaskTab(tab) {
  document.getElementById('tab-content-my-count').style.display = tab === 'count' ? 'block' : 'none';
  document.getElementById('tab-content-my-summary').style.display = tab === 'summary' ? 'block' : 'none';
  document.getElementById('tab-my-count').className = 'tab-btn' + (tab === 'count' ? ' active' : '');
  document.getElementById('tab-my-summary').className = 'tab-btn' + (tab === 'summary' ? ' active' : '');
}

async function loadMyTaskCount() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('tc-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('tc-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading task counts...');
  try {
    const res = await apiGetDailyTasksByUser(window.currentUser.userID, fromDate, toDate, '');
    hideLoading();

    const container = document.getElementById('my-task-count-result');
    if (!res.success || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard"></i><p>No task records found.</p></div>';
      return;
    }

    const tasks = res.records;
    const taskCountDefs = [
      { sl: 1, label: 'DSQ Audit', key: 'dsqAuditCount' },
      { sl: 2, label: 'SEG Q Audit', key: 'segqAuditCount' },
      { sl: 3, label: 'HUB Audit', key: 'hubAuditCount' },
      { sl: 4, label: 'SPOKE Audit', key: 'spokeAuditCount' },
      { sl: 5, label: 'DSQ Warranty Material Inspection', key: 'dsqWarrantyInspectedDealers' },
      { sl: 6, label: 'SEG Q Warranty Material Inspection', key: 'segqWarrantyInspectedDealers' },
      { sl: 7, label: 'Joint Investigation', key: 'jiCount' },
      { sl: 8, label: 'Campaign', key: 'campaignCount' },
      { sl: 9, label: 'iTrams', key: 'itramsTicketCount' },
      { sl: 10, label: 'Weekly Data Collection [Reference Injector]', key: 'weeklyDataCollectionCount' },
      { sl: 11, label: 'eJC Data Quality Validation', key: 'ejcCount' },
      { sl: 12, label: 'DSQ Materials Inspected', key: 'dsqMaterialsInspectedCount' },
      { sl: 13, label: 'SEG Q Materials Inspected', key: 'segqMaterialsInspectedCount' },
      { sl: 14, label: 'IUW Marketing Calls', key: 'iuwCallCount' },
      { sl: 15, label: 'AdiCare Marketing Calls', key: 'adicareCallCount' },
      { sl: 16, label: 'OE Extended Warranty Calls', key: 'oeCallCount' },
      { sl: 17, label: 'Warranty Support to BDS/BES', key: 'warrantyCallCount' },
      { sl: 18, label: 'OECD Mapping', key: 'oecdCallCount' },
      { sl: 19, label: 'AMC Related', key: 'amcCallCount' }
    ];

    let grandTotal = 0;
    const countData = taskCountDefs.map(t => {
      const total = tasks.reduce((sum, r) => sum + (Number(r[t.key]) || 0), 0);
      grandTotal += total;
      return { ...t, total };
    });

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-chart-bar"></i> My Tasks Count: ${fromDate} to ${toDate}</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>Task</th>
                <th>Total Count</th>
              </tr>
            </thead>
            <tbody>
              ${countData.map(t => `
                <tr>
                  <td style="text-align:center;font-weight:600;">${t.sl}</td>
                  <td>${t.label}</td>
                  <td style="text-align:center;font-weight:700;color:${t.total > 0 ? 'var(--navy)' : 'var(--mid-gray)'};">
                    ${t.total}
                  </td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr class="tfoot-row">
                <td colspan="2" style="font-weight:700;">TOTAL TASKS</td>
                <td style="text-align:center;font-size:1.1rem;">${grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;
  } catch(err) {
    hideLoading();
    showToast('Error loading task counts.', 'error');
  }
}

async function loadMyTaskSummary() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('ts-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('ts-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading task summary...');
  try {
    const res = await apiGetEngineerTaskSummary(window.currentUser.userID, fromDate, toDate);
    hideLoading();
    renderEngineerTaskSummary(res.records, 'my-task-summary-result');
  } catch(err) {
    hideLoading();
    showToast('Error loading task summary.', 'error');
  }
}

// ============================================================
// VIEW EXPENSES
// ============================================================
async function showViewExpenses() {
  setActiveSidebarItem('nav-view-expenses');
  const today = getTodayDDMMYYYY();
  const firstOfMonth = `01/${today.split('/')[1]}/${today.split('/')[2]}`;

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-rupee-sign"></i> My Expenses</h2>
      <p>View your expense records.</p>
    </div>
    <div class="date-filter-bar">
      <div class="form-group">
        <label>From Date</label>
        <input type="date" id="ve-from" class="form-control" value="${ddmmyyyyToInputFormat(firstOfMonth)}">
      </div>
      <div class="form-group">
        <label>To Date</label>
        <input type="date" id="ve-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <button class="btn btn-primary" onclick="loadMyExpenses()">
        <i class="fas fa-search"></i> View
      </button>
    </div>
    <div id="my-expenses-result"></div>
  `);
}

async function loadMyExpenses() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('ve-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('ve-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading expenses...');
  try {
    const res = await apiGetExpensesReport(fromDate, toDate, window.currentUser.userID);
    hideLoading();

    const container = document.getElementById('my-expenses-result');
    if (!res.success || !res.records || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No expense records found.</p></div>';
      return;
    }

    renderExpenseTable(res.records, 'my-expenses-result');
  } catch(err) {
    hideLoading();
    showToast('Error loading expenses.', 'error');
  }
}
