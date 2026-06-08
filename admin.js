// ============================================================
// FST - Admin Panel
// ============================================================

// --- ADMIN DASHBOARD ---
function showAdminDashboard() {
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-tachometer-alt"></i> Admin Dashboard</h2>
      <p>Welcome back, ${sanitize(window.currentUser.name)}! Manage your FST team from here.</p>
    </div>
    <div id="admin-stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="stat-engineers">-</div>
        <div class="stat-label">Field Engineers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-managers">-</div>
        <div class="stat-label">Managers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-today-att">-</div>
        <div class="stat-label">Present Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-tasks-today">-</div>
        <div class="stat-label">Tasks Today</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="btn btn-primary" onclick="showCreateUser()">
            <i class="fas fa-user-plus"></i> Create User
          </button>
          <button class="btn btn-gold" onclick="showManageUsers()">
            <i class="fas fa-users-cog"></i> Manage Users
          </button>
          <button class="btn btn-outline" onclick="showAttendanceReport()">
            <i class="fas fa-calendar-check"></i> Attendance
          </button>
          <button class="btn btn-outline" onclick="showTaskReport()">
            <i class="fas fa-tasks"></i> Task Report
          </button>
          <button class="btn btn-outline" onclick="showExpenseReport()">
            <i class="fas fa-rupee-sign"></i> Expenses
          </button>
          <button class="btn btn-outline" onclick="showDealerPunchReport()">
            <i class="fas fa-store"></i> Dealer Punch
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-calendar-day"></i> Today's Attendance</h3>
      </div>
      <div class="card-body" id="today-att-list">
        <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
      </div>
    </div>
  `);

  loadAdminDashboardData();
}

async function loadAdminDashboardData() {
  try {
    const [usersRes, attRes] = await Promise.all([
      apiGetAllUsers(),
      apiGetAttendanceReport(getTodayDDMMYYYY(), getTodayDDMMYYYY())
    ]);

    if (usersRes.success) {
      const engineers = usersRes.users.filter(u => u.role === 'Field Engineer' && u.isActive);
      const managers = usersRes.users.filter(u => u.role === 'Manager' && u.isActive);
      document.getElementById('stat-engineers').textContent = engineers.length;
      document.getElementById('stat-managers').textContent = managers.length;
    }

    if (attRes.success) {
      const today = getTodayDDMMYYYY();
      let presentCount = 0;
      let html = '';

      attRes.report.forEach(row => {
        const rec = row[today];
        if (rec && rec.status === 'Present') presentCount++;
        if (rec && rec.status) {
          html += `
            <div class="att-list-item" style="cursor:default;">
              <div>
                <div class="att-list-date">${sanitize(row.engineerName)}</div>
                <div class="att-list-sub">${sanitize(rec.submittedAt)}</div>
              </div>
              <div>${getAttBadge(rec.status)}</div>
            </div>`;
        }
      });

      document.getElementById('stat-today-att').textContent = presentCount;
      document.getElementById('today-att-list').innerHTML = html ||
        '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No attendance submitted today.</p></div>';
    }

    // Tasks today
    try {
      const taskRes = await apiGetTasksReport(getTodayDDMMYYYY(), getTodayDDMMYYYY());
      if (taskRes.success) {
        const total = taskRes.report.reduce((sum, row) => sum + (Number(row.TOTAL) || 0), 0);
        document.getElementById('stat-tasks-today').textContent = total;
      }
    } catch(e) {
      document.getElementById('stat-tasks-today').textContent = '0';
    }

  } catch (err) {
    showToast('Error loading dashboard data.', 'error');
  }
}

// ============================================================
// CREATE USER
// ============================================================
function showCreateUser() {
  setActiveSidebarItem('nav-create-user');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-user-plus"></i> Create New User</h2>
      <p>Add a new Field Engineer or Manager to the system.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="form-group">
          <label><i class="fas fa-id-badge"></i> Role</label>
          <select id="cu-role" class="form-control" onchange="handleRoleChange()">
            <option value="">-- Select Role --</option>
            <option value="Field Engineer">Field Engineer</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div class="form-group">
          <label><i class="fas fa-user"></i> Full Name</label>
          <input type="text" id="cu-name" class="form-control" placeholder="Enter full name">
        </div>
        <div class="form-group">
          <label><i class="fas fa-city"></i> Base City</label>
          <input type="text" id="cu-city" class="form-control" placeholder="Enter base city">
        </div>
        <div class="form-group">
          <label><i class="fas fa-at"></i> Username</label>
          <input type="text" id="cu-username" class="form-control" placeholder="Enter username (no spaces)">
        </div>
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <input type="text" id="cu-password" class="form-control" placeholder="Enter password">
        </div>

        <div id="manager-fields" style="display:none">
          <div class="section-divider"><i class="fas fa-users"></i> Reporting Engineers</div>
          <div class="form-group">
            <label><i class="fas fa-hard-hat"></i> Assign Engineers to this Manager</label>
            <div id="engineer-list-wrap" class="multi-select-wrap">
              <div class="empty-state" style="padding:12px;"><i class="fas fa-spinner fa-spin"></i> Loading engineers...</div>
            </div>
          </div>
        </div>

        <div id="engineer-fields" style="display:none">
          <div class="section-divider"><i class="fas fa-sitemap"></i> Manager Assignment</div>
          <div class="form-group">
            <label><i class="fas fa-user-tie"></i> Assign Managers (can select multiple)</label>
            <div id="manager-list-wrap" class="multi-select-wrap">
              <div class="empty-state" style="padding:12px;"><i class="fas fa-spinner fa-spin"></i> Loading managers...</div>
            </div>
          </div>
        </div>

        <div id="cu-error" class="error-msg" style="display:none"></div>
        <button class="btn btn-primary btn-full" onclick="submitCreateUser()">
          <i class="fas fa-save"></i> Create User
        </button>
      </div>
    </div>
  `);
}

async function handleRoleChange() {
  const role = document.getElementById('cu-role').value;
  document.getElementById('manager-fields').style.display = 'none';
  document.getElementById('engineer-fields').style.display = 'none';

  if (role === 'Manager') {
    document.getElementById('manager-fields').style.display = 'block';
    await loadEngineerListForManager();
  } else if (role === 'Field Engineer') {
    document.getElementById('engineer-fields').style.display = 'block';
    await loadManagerListForEngineer();
  }
}

async function loadEngineerListForManager(selectedIDs = []) {
  const wrap = document.getElementById('engineer-list-wrap');
  try {
    const res = await apiGetEngineers();
    if (res.success && res.engineers.length > 0) {
      wrap.innerHTML = res.engineers.map(e => `
        <div class="multi-select-item">
          <input type="checkbox" id="eng-${e.userID}" value="${e.userID}"
            ${selectedIDs.includes(e.userID) ? 'checked' : ''}>
          <label for="eng-${e.userID}">${sanitize(e.name)} <span class="text-muted">(${sanitize(e.username)})</span></label>
        </div>`).join('');
    } else {
      wrap.innerHTML = '<div style="padding:10px;color:var(--mid-gray);font-size:0.85rem;">No engineers found. Create engineers first.</div>';
    }
  } catch(e) {
    wrap.innerHTML = '<div style="padding:10px;color:var(--danger);font-size:0.85rem;">Error loading engineers.</div>';
  }
}

async function loadManagerListForEngineer(selectedIDs = []) {
  const wrap = document.getElementById('manager-list-wrap');
  try {
    const res = await apiGetManagers();
    if (res.success && res.managers.length > 0) {
      wrap.innerHTML = res.managers.map(m => `
        <div class="multi-select-item">
          <input type="checkbox" id="mgr-${m.userID}" value="${m.userID}"
            ${selectedIDs.includes(m.userID) ? 'checked' : ''}>
          <label for="mgr-${m.userID}">${sanitize(m.name)} <span class="text-muted">(${sanitize(m.username)})</span></label>
        </div>`).join('');
    } else {
      wrap.innerHTML = '<div style="padding:10px;color:var(--mid-gray);font-size:0.85rem;">No managers found. Create managers first.</div>';
    }
  } catch(e) {
    wrap.innerHTML = '<div style="padding:10px;color:var(--danger);font-size:0.85rem;">Error loading managers.</div>';
  }
}

function getCheckedValues(containerID) {
  const container = document.getElementById(containerID);
  if (!container) return [];
  const checked = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checked).map(c => c.value);
}

async function submitCreateUser() {
  const role = document.getElementById('cu-role').value;
  const name = document.getElementById('cu-name').value.trim();
  const city = document.getElementById('cu-city').value.trim();
  const username = document.getElementById('cu-username').value.trim();
  const password = document.getElementById('cu-password').value.trim();
  const errorDiv = document.getElementById('cu-error');

  errorDiv.style.display = 'none';

  if (!role) { showCUError('Please select a role.'); return; }
  if (!name) { showCUError('Please enter the full name.'); return; }
  if (!username) { showCUError('Please enter a username.'); return; }
  if (username.includes(' ')) { showCUError('Username cannot contain spaces.'); return; }
  if (!password) { showCUError('Please enter a password.'); return; }
  if (!checkConnectivity()) return;

  let managerIDs = '';

  if (role === 'Manager') {
    const selectedEngineers = getCheckedValues('engineer-list-wrap');
    // Manager doesn't need managerIDs - engineers store the managerID
    // We need to update each selected engineer to add this manager
    showLoading('Creating manager...');
    try {
      const res = await apiCreateUser({ role, name, username, password, baseCity: city, managerIDs: '' });
      if (!res.success) { hideLoading(); showCUError(res.message); return; }

      // Update each selected engineer to add this manager
      const newManagerID = res.userID;
      if (selectedEngineers.length > 0) {
        const engRes = await apiGetEngineers();
        if (engRes.success) {
          for (const engID of selectedEngineers) {
            const eng = engRes.engineers.find(e => e.userID === engID);
            if (eng) {
              let existingMgrIDs = eng.managerIDs ? eng.managerIDs.toString().split(',').map(m => m.trim()).filter(m => m) : [];
              if (!existingMgrIDs.includes(newManagerID)) {
                existingMgrIDs.push(newManagerID);
              }
              await apiUpdateUser({ userID: engID, managerIDs: existingMgrIDs.join(',') });
            }
          }
        }
      }

      hideLoading();
      showToast(`✅ Manager "${name}" created successfully!`, 'success');
      showCreateUser();
    } catch(err) {
      hideLoading();
      showCUError('Error creating user. Please try again.');
    }

  } else if (role === 'Field Engineer') {
    const selectedManagers = getCheckedValues('manager-list-wrap');
    managerIDs = selectedManagers.join(',');
    showLoading('Creating engineer...');
    try {
      const res = await apiCreateUser({ role, name, username, password, baseCity: city, managerIDs });
      hideLoading();
      if (res.success) {
        showToast(`✅ Engineer "${name}" created successfully!`, 'success');
        showCreateUser();
      } else {
        showCUError(res.message);
      }
    } catch(err) {
      hideLoading();
      showCUError('Error creating user. Please try again.');
    }
  }
}

function showCUError(msg) {
  const err = document.getElementById('cu-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

// ============================================================
// MANAGE USERS
// ============================================================
async function showManageUsers() {
  setActiveSidebarItem('nav-manage-users');
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-users-cog"></i> Manage Users</h2>
      <p>View, edit or delete all users in the system.</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-sm ${window._userFilter === 'all' || !window._userFilter ? 'btn-primary' : 'btn-outline'}"
        onclick="window._userFilter='all';showManageUsers()">All</button>
      <button class="btn btn-sm ${window._userFilter === 'Field Engineer' ? 'btn-primary' : 'btn-outline'}"
        onclick="window._userFilter='Field Engineer';showManageUsers()">Engineers</button>
      <button class="btn btn-sm ${window._userFilter === 'Manager' ? 'btn-primary' : 'btn-outline'}"
        onclick="window._userFilter='Manager';showManageUsers()">Managers</button>
    </div>

    <div id="users-list">
      <div class="empty-state"><div class="spinner" style="margin:0 auto;width:30px;height:30px;"></div></div>
    </div>
  `);

  try {
    const res = await apiGetAllUsers();
    if (!res.success) { showToast('Error loading users.', 'error'); return; }

    let users = res.users.filter(u => u.role !== 'Admin');
    const filter = window._userFilter;
    if (filter && filter !== 'all') {
      users = users.filter(u => u.role === filter);
    }

    // Get managers for display
    const managers = res.users.filter(u => u.role === 'Manager');

    const container = document.getElementById('users-list');
    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>No users found.</p></div>';
      return;
    }

    container.innerHTML = users.map(u => {
      const isActive = u.isActive === true || u.isActive === 'TRUE' || u.isActive === 'true';
      const roleClass = u.role === 'Manager' ? 'manager' : '';

      let mgrNames = '';
      if (u.role === 'Field Engineer' && u.managerIDs) {
        const mgrIDs = u.managerIDs.toString().split(',').map(m => m.trim()).filter(m => m);
        mgrNames = mgrIDs.map(id => {
          const mgr = managers.find(m => m.userID === id);
          return mgr ? mgr.name : id;
        }).join(', ');
      }

      return `
        <div class="user-card ${roleClass}" onclick="showEditUser('${u.userID}')">
          <div class="user-card-info">
            <div class="user-card-name">${sanitize(u.name)}</div>
            <div class="user-card-sub">
              <span class="badge ${u.role === 'Manager' ? 'badge-gold' : 'badge-navy'}" style="margin-right:6px;">${u.role}</span>
              @${sanitize(u.username)}
            </div>
            ${u.baseCity ? `<div class="user-card-sub">📍 ${sanitize(u.baseCity)}</div>` : ''}
            ${mgrNames ? `<div class="user-card-sub" style="margin-top:4px;">👔 ${sanitize(mgrNames)}</div>` : ''}
          </div>
          <div class="user-card-right">
            ${isActive
              ? '<span class="badge badge-success">Active</span>'
              : '<span class="badge badge-danger">Inactive</span>'}
            <i class="fas fa-chevron-right" style="color:var(--mid-gray);font-size:0.8rem;"></i>
          </div>
        </div>`;
    }).join('');

  } catch(err) {
    showToast('Error loading users.', 'error');
  }
}

async function showEditUser(userID) {
  showLoading('Loading user...');
  try {
    const [userRes, allRes] = await Promise.all([
      fetchWithGET('getUserByID', { userID }),
      apiGetAllUsers()
    ]);
    hideLoading();

    if (!userRes.success) { showToast('User not found.', 'error'); return; }
    const u = userRes.user;
    const allUsers = allRes.users;
    const isActive = u.isActive === true || u.isActive === 'TRUE' || u.isActive === 'true';

    let extraFields = '';
    if (u.role === 'Manager') {
      const engineers = allUsers.filter(x => x.role === 'Field Engineer' && (x.isActive === true || x.isActive === 'TRUE' || x.isActive === 'true'));
      // Find engineers that have this manager assigned
      const assignedEngs = engineers.filter(e => {
        if (!e.managerIDs) return false;
        return e.managerIDs.toString().split(',').map(m => m.trim()).includes(userID);
      }).map(e => e.userID);

      extraFields = `
        <div class="section-divider"><i class="fas fa-users"></i> Assigned Engineers</div>
        <div class="form-group">
          <label>Engineers under this Manager</label>
          <div class="multi-select-wrap" id="edit-eng-list">
            ${engineers.map(e => `
              <div class="multi-select-item">
                <input type="checkbox" id="edit-eng-${e.userID}" value="${e.userID}"
                  ${assignedEngs.includes(e.userID) ? 'checked' : ''}>
                <label for="edit-eng-${e.userID}">${sanitize(e.name)} (${sanitize(e.username)})</label>
              </div>`).join('')}
          </div>
        </div>`;
    } else if (u.role === 'Field Engineer') {
      const managers = allUsers.filter(x => x.role === 'Manager' && (x.isActive === true || x.isActive === 'TRUE' || x.isActive === 'true'));
      const assignedMgrs = u.managerIDs ? u.managerIDs.toString().split(',').map(m => m.trim()).filter(m => m) : [];
      extraFields = `
        <div class="section-divider"><i class="fas fa-sitemap"></i> Manager Assignment</div>
        <div class="form-group">
          <label>Reporting Managers</label>
          <div class="multi-select-wrap" id="edit-mgr-list">
            ${managers.map(m => `
              <div class="multi-select-item">
                <input type="checkbox" id="edit-mgr-${m.userID}" value="${m.userID}"
                  ${assignedMgrs.includes(m.userID) ? 'checked' : ''}>
                <label for="edit-mgr-${m.userID}">${sanitize(m.name)} (${sanitize(m.username)})</label>
              </div>`).join('')}
          </div>
        </div>`;
    }

    openModal(`Edit User: ${sanitize(u.name)}`, `
      <div class="form-group">
        <label>Role</label>
        <input type="text" class="form-control" value="${sanitize(u.role)}" disabled style="background:var(--off-white);">
      </div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="eu-name" class="form-control" value="${sanitize(u.name)}">
      </div>
      <div class="form-group">
        <label>Base City</label>
        <input type="text" id="eu-city" class="form-control" value="${sanitize(u.baseCity || '')}">
      </div>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="eu-username" class="form-control" value="${sanitize(u.username)}">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="text" id="eu-password" class="form-control" value="${sanitize(u.password)}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="eu-active" class="form-control">
          <option value="true" ${isActive ? 'selected' : ''}>Active</option>
          <option value="false" ${!isActive ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
      ${extraFields}
      <div id="eu-error" class="error-msg" style="display:none"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
        <button class="btn btn-danger" onclick="confirmDeleteUser('${userID}', '${sanitize(u.name)}')">
          <i class="fas fa-trash"></i> Delete
        </button>
        <button class="btn btn-primary" onclick="submitEditUser('${userID}', '${u.role}')">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
    `);

  } catch(err) {
    hideLoading();
    showToast('Error loading user.', 'error');
  }
}

async function submitEditUser(userID, role) {
  const name = document.getElementById('eu-name').value.trim();
  const city = document.getElementById('eu-city').value.trim();
  const username = document.getElementById('eu-username').value.trim();
  const password = document.getElementById('eu-password').value.trim();
  const isActive = document.getElementById('eu-active').value === 'true';

  if (!name) { showEUError('Name is required.'); return; }
  if (!username) { showEUError('Username is required.'); return; }
  if (!password) { showEUError('Password is required.'); return; }
  if (!checkConnectivity()) return;

  showLoading('Saving...');

  try {
    if (role === 'Manager') {
      // Update manager user
      await apiUpdateUser({ userID, name, username, password, baseCity: city, isActive });

      // Update engineer assignments
      const allRes = await apiGetAllUsers();
      const engineers = allRes.users.filter(u => u.role === 'Field Engineer');
      const selectedEngs = getCheckedValues('edit-eng-list');

      for (const eng of engineers) {
        let mgrIDs = eng.managerIDs ? eng.managerIDs.toString().split(',').map(m => m.trim()).filter(m => m) : [];
        const shouldHave = selectedEngs.includes(eng.userID);
        const currentlyHas = mgrIDs.includes(userID);

        if (shouldHave && !currentlyHas) {
          mgrIDs.push(userID);
          await apiUpdateUser({ userID: eng.userID, managerIDs: mgrIDs.join(',') });
        } else if (!shouldHave && currentlyHas) {
          mgrIDs = mgrIDs.filter(id => id !== userID);
          await apiUpdateUser({ userID: eng.userID, managerIDs: mgrIDs.join(',') });
        }
      }
    } else if (role === 'Field Engineer') {
      const selectedMgrs = getCheckedValues('edit-mgr-list');
      await apiUpdateUser({ userID, name, username, password, baseCity: city, isActive, managerIDs: selectedMgrs.join(',') });
    } else {
      await apiUpdateUser({ userID, name, username, password, baseCity: city, isActive });
    }

    hideLoading();
    closeModal();
    showToast('✅ User updated successfully!', 'success');
    showManageUsers();
  } catch(err) {
    hideLoading();
    showEUError('Error saving user. Please try again.');
  }
}

function showEUError(msg) {
  const err = document.getElementById('eu-error');
  err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  err.style.display = 'flex';
}

function confirmDeleteUser(userID, name) {
  openModal('Confirm Delete', `
    <div style="text-align:center;padding:16px 0;">
      <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--warning);margin-bottom:16px;"></i>
      <p style="font-size:1rem;font-weight:600;color:var(--dark-gray);">Delete user <strong>${sanitize(name)}</strong>?</p>
      <p style="font-size:0.85rem;color:var(--mid-gray);margin-top:8px;">
        This will deactivate the user. Their records will be preserved.
      </p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="executeDeleteUser('${userID}')">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  `);
}

async function executeDeleteUser(userID) {
  if (!checkConnectivity()) return;
  showLoading('Deleting user...');
  try {
    const res = await apiDeleteUser(userID);
    hideLoading();
    if (res.success) {
      closeModal();
      showToast('✅ User deleted (deactivated) successfully.', 'success');
      showManageUsers();
    } else {
      showToast('Error deleting user.', 'error');
    }
  } catch(err) {
    hideLoading();
    showToast('Error deleting user.', 'error');
  }
}
