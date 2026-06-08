// ============================================================
// FST - Manager Screens
// ============================================================

// ============================================================
// MANAGER DASHBOARD
// ============================================================
async function showManagerDashboard() {
  setActiveSidebarItem('nav-mgr-dashboard');
  const user = window.currentUser;

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-tachometer-alt"></i> Manager Dashboard</h2>
      <p>Welcome, ${sanitize(user.name)}! Monitor your team's activities.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="mgr-stat-engineers">-</div>
        <div class="stat-label">My Engineers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="mgr-stat-present">-</div>
        <div class="stat-label">Present Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="mgr-stat-tasks">-</div>
        <div class="stat-label">Tasks Assigned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="mgr-stat-pending">-</div>
        <div class="stat-label">Pending Tasks</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="btn btn-primary" onclick="showAssignSpecialTask()">
            <i class="fas fa-paper-plane"></i> Assign Task
          </button>
          <button class="btn btn-gold" onclick="showViewAssignedTasks()">
            <i class="fas fa-clipboard-list"></i> View Tasks
          </button>
          <button class="btn btn-outline" onclick="showManagerViewAllTasks()">
            <i class="fas fa-chart-bar"></i> Task Report
          </button>
          <button class="btn btn-outline" onclick="showManagerTeamAttendance()">
            <i class="fas fa-calendar-check"></i> Team Attendance
          </button>
        </div>
      </div>
    </div>

    <!-- TODAY'S TEAM STATUS -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-users"></i> Today's Team Status</h3>
      </div>
      <div class="card-body" id="mgr-team-today">
        <div class="empty-state">
          <div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div>
        </div>
      </div>
    </div>

    <!-- RECENT SPECIAL TASKS -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-star"></i> Recent Special Tasks</h3>
        <button class="btn btn-sm btn-gold" onclick="showViewAssignedTasks()">View All</button>
      </div>
      <div class="card-body" id="mgr-recent-tasks">
        <div class="empty-state">
          <div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div>
        </div>
      </div>
    </div>
  `);

  await loadManagerDashboardData();
}

async function loadManagerDashboardData() {
  const user = window.currentUser;
  const today = getTodayDDMMYYYY();

  try {
    const [engRes, specialRes] = await Promise.all([
      apiGetEngineersByManager(user.userID),
      apiGetSpecialTasksByManager(user.userID)
    ]);

    const engineers = engRes.success ? engRes.engineers : [];
    document.getElementById('mgr-stat-engineers').textContent = engineers.length;

    // Special tasks stats
    if (specialRes.success) {
      const pending = specialRes.tasks.filter(t =>
        t.currentStatus === 'Pending' || t.currentStatus === 'In-Progress'
      );
      document.getElementById('mgr-stat-tasks').textContent = specialRes.tasks.length;
      document.getElementById('mgr-stat-pending').textContent = pending.length;

      // Recent tasks
      const recentContainer = document.getElementById('mgr-recent-tasks');
      const recent = specialRes.tasks.slice(0, 3);
      if (recent.length === 0) {
        recentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard"></i><p>No tasks assigned yet.</p></div>';
      } else {
        recentContainer.innerHTML = recent.map(t => `
          <div class="card priority-${(t.priority || '').toLowerCase()}"
               style="margin-bottom:10px;cursor:pointer;"
               onclick="openManagerTaskChat('${t.specialTaskID}')">
            <div class="card-body" style="padding:12px;">
              <div class="flex-between mb-8">
                <span style="font-weight:700;font-size:0.85rem;color:var(--navy);">
                  <i class="fas fa-hard-hat" style="color:var(--gold-dark);margin-right:4px;"></i>
                  ${sanitize(t.engineerName)}
                </span>
                <div style="display:flex;gap:6px;">
                  ${getPriorityBadge(t.priority)}
                  ${getStatusBadge(t.currentStatus)}
                </div>
              </div>
              <p style="font-size:0.82rem;color:var(--dark-gray);line-height:1.5;
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

    // Team today attendance
    const teamContainer = document.getElementById('mgr-team-today');
    if (engineers.length === 0) {
      teamContainer.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>No engineers assigned to you.</p></div>';
      document.getElementById('mgr-stat-present').textContent = '0';
      return;
    }

    // Load attendance for each engineer
    let presentCount = 0;
    const attPromises = engineers.map(e =>
      apiGetAttendanceByUser(e.userID, '', '', today).catch(() => ({ success: false, records: [] }))
    );
    const attResults = await Promise.all(attPromises);

    let teamHTML = '';
    engineers.forEach((eng, idx) => {
      const attRes = attResults[idx];
      const rec = attRes.success && attRes.records.length > 0 ? attRes.records[0] : null;
      if (rec && rec.attendance === 'Present') presentCount++;

      teamHTML += `
        <div class="att-list-item" style="cursor:default;">
          <div>
            <div class="att-list-date">
              <i class="fas fa-hard-hat" style="color:var(--gold-dark);margin-right:6px;font-size:0.85rem;"></i>
              ${sanitize(eng.name)}
            </div>
            <div class="att-list-sub">
              ${rec ? sanitize(rec.location) : 'Not submitted'}
              ${rec && rec.dealerCity ? ' &bull; ' + sanitize(rec.dealerCity) : ''}
            </div>
          </div>
          <div>
            ${rec ? getAttBadge(rec.attendance) : '<span class="badge badge-navy">—</span>'}
          </div>
        </div>`;
    });

    document.getElementById('mgr-stat-present').textContent = presentCount;
    teamContainer.innerHTML = teamHTML;

  } catch(err) {
    console.error('Manager dashboard error:', err);
    showToast('Error loading dashboard data.', 'error');
  }
}

// ============================================================
// ASSIGN SPECIAL TASK
// ============================================================
async function showAssignSpecialTask() {
  setActiveSidebarItem('nav-assign-task');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-paper-plane"></i> Assign Special Task</h2>
      <p>Assign a task to one of your engineers with priority.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-hard-hat"></i> Select Engineer</label>
          <select id="ast-engineer" class="form-control">
            <option value="">-- Select Engineer --</option>
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-exclamation-circle"></i> Priority</label>
          <div class="radio-group">
            <div class="radio-pill">
              <input type="radio" name="ast-priority" id="pri-low" value="Low">
              <label for="pri-low" style="border-color:var(--success);color:var(--success);">
                <i class="fas fa-arrow-down"></i> Low
              </label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="ast-priority" id="pri-med" value="Medium" checked>
              <label for="pri-med" style="border-color:var(--warning);color:#856404;">
                <i class="fas fa-equals"></i> Medium
              </label>
            </div>
            <div class="radio-pill">
              <input type="radio" name="ast-priority" id="pri-high" value="High">
              <label for="pri-high" style="border-color:var(--danger);color:var(--danger);">
                <i class="fas fa-arrow-up"></i> High
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label><i class="fas fa-tasks"></i> Task Description</label>
          <textarea id="ast-description" class="form-control"
            placeholder="Describe the task in detail. Be specific about expectations, deadlines, and deliverables..."
            rows="6"></textarea>
          <div style="text-align:right;font-size:0.75rem;color:var(--mid-gray);margin-top:4px;">
            <span id="ast-char-count">0</span> characters
          </div>
        </div>

        <div id="ast-preview" style="display:none;" class="card" style="margin-bottom:0;">
          <div class="card-header" style="padding:12px 16px;">
            <h3 style="font-size:0.9rem;"><i class="fas fa-eye"></i> Task Preview</h3>
          </div>
          <div class="card-body" style="padding:14px;" id="ast-preview-body"></div>
        </div>

        <div id="ast-error" class="error-msg" style="display:none;margin-top:12px;"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
          <button class="btn btn-outline" onclick="previewTask()">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="btn btn-primary" onclick="submitSpecialTask()">
            <i class="fas fa-paper-plane"></i> Assign Task
          </button>
        </div>
      </div>
    </div>
  `);

  // Load engineers
  try {
    const res = await apiGetEngineersByManager(window.currentUser.userID);
    const select = document.getElementById('ast-engineer');
    if (res.success && res.engineers.length > 0) {
      res.engineers.forEach(e => {
        select.innerHTML += `<option value="${e.userID}" data-name="${sanitize(e.name)}">
          ${sanitize(e.name)}
        </option>`;
      });
    } else {
      select.innerHTML = '<option value="">No engineers assigned to you</option>';
    }
  } catch(e) {
    showToast('Error loading engineers.', 'error');
  }

  // Character counter
  const textarea = document.getElementById('ast-description');
  if (textarea) {
    textarea.addEventListener('input', () => {
      document.getElementById('ast-char-count').textContent = textarea.value.length;
    });
  }
}

function previewTask() {
  const engSelect = document.getElementById('ast-engineer');
  const engineerName = engSelect.options[engSelect.selectedIndex]?.dataset?.name || '';
  const priority = document.querySelector('input[name="ast-priority"]:checked')?.value || 'Medium';
  const description = document.getElementById('ast-description').value.trim();

  if (!engineerName || !description) {
    showToast('Please fill in engineer and description to preview.', 'warning');
    return;
  }

  const preview = document.getElementById('ast-preview');
  const previewBody = document.getElementById('ast-preview-body');
  preview.style.display = 'block';
  previewBody.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      ${getPriorityBadge(priority)}
      <span class="badge badge-navy">
        <i class="fas fa-hard-hat"></i> ${sanitize(engineerName)}
      </span>
      <span class="badge badge-info">
        <i class="fas fa-clock"></i> ${getTodayDDMMYYYY()}
      </span>
    </div>
    <div style="background:var(--off-white);padding:12px;border-radius:8px;
                font-size:0.87rem;color:var(--dark-gray);line-height:1.7;
                white-space:pre-wrap;">
      ${sanitize(description)}
    </div>`;

  preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function submitSpecialTask() {
  const engSelect = document.getElementById('ast-engineer');
  const engineerUserID = engSelect.value;
  const engineerName = engSelect.options[engSelect.selectedIndex]?.dataset?.name || '';
  const priority = document.querySelector('input[name="ast-priority"]:checked')?.value || '';
  const description = document.getElementById('ast-description').value.trim();
  const errorDiv = document.getElementById('ast-error');
  errorDiv.style.display = 'none';

  if (!engineerUserID) { showASTError('Please select an engineer.'); return; }
  if (!priority) { showASTError('Please select a priority.'); return; }
  if (!description) { showASTError('Please enter a task description.'); return; }
  if (description.length < 10) { showASTError('Task description is too short. Please be more specific.'); return; }
  if (!checkConnectivity()) return;

  showLoading('Assigning task...');
  try {
    const res = await apiAssignSpecialTask({
      managerUserID: window.currentUser.userID,
      managerName: window.currentUser.name,
      engineerUserID,
      engineerName,
      taskDescription: description,
      priority
    });

    hideLoading();
    if (res.success) {
      showToast('✅ Special task assigned successfully!', 'success');
      showAssignSpecialTask();
    } else {
      showASTError(res.message || 'Error assigning task.');
    }
  } catch(err) {
    hideLoading();
    showASTError('Connection error. Please try again.');
  }
}

function showASTError(msg) {
  const err = document.getElementById('ast-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

// ============================================================
// VIEW ASSIGNED SPECIAL TASKS
// ============================================================
async function showViewAssignedTasks() {
  setActiveSidebarItem('nav-view-assigned');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-clipboard-list"></i> View Assigned Tasks</h2>
      <p>All special tasks you have assigned to your engineers.</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-sm ${!window._mgrTaskFilter || window._mgrTaskFilter==='all' ? 'btn-primary':'btn-outline'}"
        onclick="window._mgrTaskFilter='all';showViewAssignedTasks()">All</button>
      <button class="btn btn-sm ${window._mgrTaskFilter==='Pending' ? 'btn-primary':'btn-outline'}"
        onclick="window._mgrTaskFilter='Pending';showViewAssignedTasks()">Pending</button>
      <button class="btn btn-sm ${window._mgrTaskFilter==='In-Progress' ? 'btn-primary':'btn-outline'}"
        onclick="window._mgrTaskFilter='In-Progress';showViewAssignedTasks()">In-Progress</button>
      <button class="btn btn-sm ${window._mgrTaskFilter==='Complete' ? 'btn-primary':'btn-outline'}"
        onclick="window._mgrTaskFilter='Complete';showViewAssignedTasks()">Complete</button>
    </div>

    <!-- Filter by engineer -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-body" style="padding:12px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0;flex:1;min-width:150px;">
            <select id="mgr-eng-filter" class="form-control" onchange="filterAssignedByEngineer()">
              <option value="">All Engineers</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;flex:1;min-width:120px;">
            <input type="date" id="mgr-task-date-filter" class="form-control"
              placeholder="Filter by date" onchange="filterAssignedByEngineer()">
          </div>
        </div>
      </div>
    </div>

    <div id="assigned-tasks-list">
      <div class="empty-state">
        <div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div>
      </div>
    </div>
  `);

  try {
    // Load engineers for filter
    const engRes = await apiGetEngineersByManager(window.currentUser.userID);
    const engSelect = document.getElementById('mgr-eng-filter');
    if (engRes.success && engSelect) {
      engRes.engineers.forEach(e => {
        engSelect.innerHTML += `<option value="${e.userID}">${sanitize(e.name)}</option>`;
      });
    }

    await loadAssignedTasksList();
  } catch(err) {
    showToast('Error loading tasks.', 'error');
  }
}

async function loadAssignedTasksList() {
  const container = document.getElementById('assigned-tasks-list');
  try {
    const res = await apiGetSpecialTasksByManager(window.currentUser.userID);
    if (!res.success) {
      container.innerHTML = '<div class="empty-state"><p>Error loading tasks.</p></div>';
      return;
    }

    window._mgrAllTasks = res.tasks;
    filterAssignedByEngineer();
  } catch(err) {
    container.innerHTML = '<div class="empty-state"><p>Error loading tasks.</p></div>';
  }
}

function filterAssignedByEngineer() {
  const tasks = window._mgrAllTasks || [];
  const engFilter = (document.getElementById('mgr-eng-filter') || {}).value || '';
  const dateFilter = (document.getElementById('mgr-task-date-filter') || {}).value || '';
  const statusFilter = window._mgrTaskFilter || 'all';
  const container = document.getElementById('assigned-tasks-list');

  let filtered = tasks;
  if (statusFilter !== 'all') filtered = filtered.filter(t => t.currentStatus === statusFilter);
  if (engFilter) filtered = filtered.filter(t => t.engineerUserID === engFilter);
  if (dateFilter) {
    const filterDate = inputFormatToDDMMYYYY(dateFilter);
    filtered = filtered.filter(t => t.assignedAt && t.assignedAt.startsWith(filterDate));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No tasks found.</p></div>';
    return;
  }

  // Group by date
  const grouped = {};
  filtered.forEach(t => {
    const dateStr = t.assignedAt ? t.assignedAt.split(' ')[0] : 'Unknown';
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(t);
  });

  container.innerHTML = Object.entries(grouped).map(([date, dateTasks]) => `
    <div style="margin-bottom:20px;">
      <div class="section-divider">
        <i class="fas fa-calendar-day"></i> ${date}
        <span class="badge badge-gold" style="margin-left:auto;">${dateTasks.length} task${dateTasks.length > 1 ? 's' : ''}</span>
      </div>
      ${dateTasks.map(t => `
        <div class="card priority-${(t.priority || '').toLowerCase()}"
             style="margin-bottom:10px;cursor:pointer;"
             onclick="openManagerTaskChat('${t.specialTaskID}')">
          <div class="card-body" style="padding:14px;">
            <div class="flex-between mb-8">
              <div>
                <div style="font-weight:700;color:var(--navy);font-size:0.9rem;">
                  <i class="fas fa-hard-hat" style="color:var(--gold-dark);margin-right:6px;"></i>
                  ${sanitize(t.engineerName)}
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
            <p style="font-size:0.84rem;color:var(--dark-gray);line-height:1.6;
                       overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;
                       -webkit-box-orient:vertical;">
              ${sanitize(t.taskDescription)}
            </p>
            <div style="margin-top:10px;font-size:0.78rem;color:var(--gold-dark);font-weight:600;">
              <i class="fas fa-comments"></i> Tap to view chat & update
              <span style="float:right;color:var(--mid-gray);">
                Last: ${sanitize(t.lastUpdatedAt)}
              </span>
            </div>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

// ============================================================
// MANAGER TASK CHAT
// ============================================================
async function openManagerTaskChat(specialTaskID) {
  showLoading('Loading task chat...');
  try {
    const [allTasks, chatsRes] = await Promise.all([
      apiGetSpecialTasksByManager(window.currentUser.userID),
      apiGetChatMessages(specialTaskID)
    ]);
    hideLoading();

    const task = allTasks.tasks.find(t => t.specialTaskID === specialTaskID);
    if (!task) { showToast('Task not found.', 'error'); return; }
    const messages = chatsRes.messages || [];

    openModal(`Task Chat — ${sanitize(task.engineerName)}`, `
      <!-- Task Info Banner -->
      <div style="background:linear-gradient(135deg,var(--navy),var(--navy-light));
                  border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="color:var(--white);font-weight:700;font-size:0.9rem;margin-bottom:4px;">
              <i class="fas fa-hard-hat" style="color:var(--gold);margin-right:6px;"></i>
              ${sanitize(task.engineerName)}
            </div>
            <div style="color:rgba(255,255,255,0.6);font-size:0.72rem;">
              Assigned: ${sanitize(task.assignedAt)}
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${getPriorityBadge(task.priority)}
            ${getStatusBadge(task.currentStatus)}
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-container" id="mgr-chat-messages">
        ${messages.length === 0
          ? '<div class="empty-state" style="padding:20px;"><i class="fas fa-comments"></i><p>No messages yet.</p></div>'
          : messages.map(m => {
              const isSent = m.senderUserID === window.currentUser.userID;
              return `
                <div style="display:flex;flex-direction:column;
                            align-items:${isSent ? 'flex-end' : 'flex-start'};">
                  <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                    <div class="chat-sender">
                      ${sanitize(m.senderName)}
                      <span style="opacity:0.7;font-weight:400;">(${sanitize(m.senderRole)})</span>
                    </div>
                    <div style="white-space:pre-wrap;">${sanitize(m.message)}</div>
                    ${m.status ? `<div class="chat-status-tag">${sanitize(m.status)}</div>` : ''}
                    <div class="chat-time">${sanitize(m.sentAt)}</div>
                  </div>
                </div>`;
            }).join('')}
      </div>

      <!-- Reply Form -->
      <div style="border-top:2px solid var(--light-gray);padding-top:14px;margin-top:4px;">
        <div class="form-group">
          <label><i class="fas fa-reply"></i> Your Reply</label>
          <textarea id="mgr-chat-reply" class="form-control"
            placeholder="Type your reply or instructions here..."
            rows="3"></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <button class="btn btn-outline" onclick="closeModal()">
            <i class="fas fa-times"></i> Close
          </button>
          <button class="btn btn-primary" onclick="sendManagerReply('${specialTaskID}')">
            <i class="fas fa-paper-plane"></i> Send Reply
          </button>
        </div>
      </div>
    `);

    // Scroll chat to bottom
    setTimeout(() => {
      const chatDiv = document.getElementById('mgr-chat-messages');
      if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight;
    }, 100);

  } catch(err) {
    hideLoading();
    showToast('Error loading task chat.', 'error');
  }
}

async function sendManagerReply(specialTaskID) {
  const message = document.getElementById('mgr-chat-reply').value.trim();
  if (!message) { showToast('Please type a reply.', 'warning'); return; }
  if (!checkConnectivity()) return;

  showLoading('Sending reply...');
  try {
    const res = await apiSendChatMessage({
      specialTaskID,
      senderUserID: window.currentUser.userID,
      senderName: window.currentUser.name,
      senderRole: 'Manager',
      message,
      status: ''
    });
    hideLoading();
    if (res.success) {
      closeModal();
      showToast('✅ Reply sent!', 'success');
      showViewAssignedTasks();
    } else {
      showToast('Error sending reply.', 'error');
    }
  } catch(err) {
    hideLoading();
    showToast('Connection error. Please try again.', 'error');
  }
}

// ============================================================
// VIEW ALL TASKS (Engineer Summary for Manager)
// ============================================================
async function showManagerViewAllTasks() {
  setActiveSidebarItem('nav-mgr-view-tasks');
  const today = getTodayDDMMYYYY();

  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-chart-bar"></i> View All Tasks</h2>
      <p>Review your engineers' task activities by date range.</p>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-hard-hat"></i> Select Engineer</label>
          <select id="mgr-vt-engineer" class="form-control">
            <option value="">-- Select Engineer --</option>
          </select>
        </div>
        <div class="inline-form-row">
          <div class="form-group">
            <label>From Date</label>
            <input type="date" id="mgr-vt-from" class="form-control"
              value="${ddmmyyyyToInputFormat(today)}">
          </div>
          <div class="form-group">
            <label>To Date</label>
            <input type="date" id="mgr-vt-to" class="form-control"
              value="${ddmmyyyyToInputFormat(today)}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <button class="btn btn-primary" onclick="loadManagerTaskSummary()">
            <i class="fas fa-search"></i> View Summary
          </button>
          <button class="btn btn-outline" onclick="loadManagerTaskCount()">
            <i class="fas fa-chart-bar"></i> View Count
          </button>
        </div>
      </div>
    </div>

    <div id="mgr-task-result"></div>
  `);

  // Load engineers
  try {
    const res = await apiGetEngineersByManager(window.currentUser.userID);
    const select = document.getElementById('mgr-vt-engineer');
    if (res.success && res.engineers.length > 0) {
      res.engineers.forEach(e => {
        select.innerHTML += `<option value="${e.userID}">${sanitize(e.name)}</option>`;
      });
    } else {
      select.innerHTML = '<option value="">No engineers assigned to you</option>';
    }
  } catch(e) {
    showToast('Error loading engineers.', 'error');
  }
}

async function loadManagerTaskSummary() {
  const userID = document.getElementById('mgr-vt-engineer').value;
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('mgr-vt-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('mgr-vt-to').value);

  if (!userID) { showToast('Please select an engineer.', 'warning'); return; }
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading task summary...');
  try {
    const res = await apiGetEngineerTaskSummary(userID, fromDate, toDate);
    hideLoading();
    if (!res.success) { showToast('Error loading summary.', 'error'); return; }
    renderEngineerTaskSummary(res.records, 'mgr-task-result');
  } catch(err) {
    hideLoading();
    showToast('Error loading summary.', 'error');
  }
}

async function loadManagerTaskCount() {
  const userID = document.getElementById('mgr-vt-engineer').value;
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('mgr-vt-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('mgr-vt-to').value);

  if (!userID) { showToast('Please select an engineer.', 'warning'); return; }
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading task counts...');
  try {
    const res = await apiGetDailyTasksByUser(userID, fromDate, toDate, '');
    hideLoading();

    const container = document.getElementById('mgr-task-result');
    if (!res.success || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard"></i><p>No task records found.</p></div>';
      return;
    }

    const tasks = res.records;
    const engineerName = tasks[0].engineerName;

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
      { sl: 10, label: 'Weekly Data Collection', key: 'weeklyDataCollectionCount' },
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

    const excelData = countData.map(t => ({
      'Sl': t.sl,
      'Task': t.label,
      'Total Count': t.total
    }));

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-user-hard-hat"></i> ${sanitize(engineerName)} — Task Count</h3>
          <span class="badge badge-gold">${fromDate} to ${toDate}</span>
        </div>
        <div style="padding:12px;">
          <div class="export-btn-wrap">
            <button class="btn btn-gold btn-sm"
              onclick='exportToExcel(${JSON.stringify(excelData)}, "Engineer_Task_Count")'>
              <i class="fas fa-file-excel"></i> Export
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>Task</th>
                <th style="text-align:center;">Total Count</th>
              </tr>
            </thead>
            <tbody>
              ${countData.map(t => `
                <tr>
                  <td style="text-align:center;font-weight:600;color:var(--mid-gray);">${t.sl}</td>
                  <td>${t.label}</td>
                  <td style="text-align:center;font-weight:700;
                              color:${t.total > 0 ? 'var(--navy)' : 'var(--light-gray)'};">
                    ${t.total || '—'}
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

// ============================================================
// MANAGER - TEAM ATTENDANCE VIEW
// ============================================================
async function showManagerTeamAttendance() {
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-calendar-check"></i> Team Attendance</h2>
      <p>View your team's attendance by date range.</p>
    </div>
    <div class="date-filter-bar">
      <div class="form-group">
        <label>From Date</label>
        <input type="date" id="mta-from" class="form-control"
          value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <div class="form-group">
        <label>To Date</label>
        <input type="date" id="mta-to" class="form-control"
          value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <button class="btn btn-primary" onclick="loadManagerTeamAttendance()">
        <i class="fas fa-search"></i> View
      </button>
    </div>
    <div id="mta-result"></div>
  `);
}

async function loadManagerTeamAttendance() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('mta-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('mta-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading team attendance...');
  try {
    const engRes = await apiGetEngineersByManager(window.currentUser.userID);
    if (!engRes.success || engRes.engineers.length === 0) {
      hideLoading();
      document.getElementById('mta-result').innerHTML =
        '<div class="empty-state"><i class="fas fa-users-slash"></i><p>No engineers assigned.</p></div>';
      return;
    }

    const engineers = engRes.engineers;
    const dates = generateDateRange(fromDate, toDate);

    // Load attendance for all engineers
    const attPromises = engineers.map(e =>
      apiGetAttendanceByUser(e.userID, fromDate, toDate, '').catch(() => ({ success: false, records: [] }))
    );
    const attResults = await Promise.all(attPromises);
    hideLoading();

    const container = document.getElementById('mta-result');

    // Build report data
    const report = engineers.map((eng, idx) => {
      const records = attResults[idx].success ? attResults[idx].records : [];
      const row = { engineerName: eng.name };
      dates.forEach(d => {
        const rec = records.find(r => r.date === d);
        row[d] = rec ? { status: rec.attendance, submittedAt: rec.submittedAt } : { status: '', submittedAt: '' };
      });
      return row;
    });

    container.innerHTML = `
      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick="exportTableToExcel('mta-table', 'Team_Attendance')">
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>
      <div class="table-wrap">
        <table id="mta-table" class="att-report-table">
          <thead>
            <tr>
              <th>Engineer</th>
              ${dates.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.map(row => `
              <tr>
                <td style="font-weight:600;white-space:nowrap;">${sanitize(row.engineerName)}</td>
                ${dates.map(d => {
                  const rec = row[d];
                  return `<td title="${rec.submittedAt ? 'Submitted: ' + rec.submittedAt : 'Not submitted'}"
                              style="text-align:center;">
                    ${getAttBadge(rec.status)}
                  </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="info-msg mt-12">
        <i class="fas fa-info-circle"></i> Hover over cells to see submission time.
      </div>`;
  } catch(err) {
    hideLoading();
    showToast('Error loading team attendance.', 'error');
  }
}
