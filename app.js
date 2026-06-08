// ============================================================
// FST - App Router & Sidebar Builder
// ============================================================

function buildSidebarMenu(role) {
  const menu = document.getElementById('sidebar-menu');
  let html = '';

  if (role === 'Admin') {
    html = `
      <div class="sidebar-section-title">Dashboard</div>
      <div class="sidebar-item active" id="nav-admin-dashboard" onclick="showAdminDashboard();closeSidebar();setActiveSidebarItem('nav-admin-dashboard')">
        <i class="fas fa-tachometer-alt"></i><span>Dashboard</span>
      </div>
      <div class="sidebar-section-title">User Management</div>
      <div class="sidebar-item" id="nav-create-user" onclick="showCreateUser();closeSidebar();setActiveSidebarItem('nav-create-user')">
        <i class="fas fa-user-plus"></i><span>Create New User</span>
      </div>
      <div class="sidebar-item" id="nav-manage-users" onclick="showManageUsers();closeSidebar();setActiveSidebarItem('nav-manage-users')">
        <i class="fas fa-users-cog"></i><span>Manage Users</span>
      </div>
      <div class="sidebar-section-title">Reports</div>
      <div class="sidebar-item" id="nav-att-report" onclick="showAttendanceReport();closeSidebar();setActiveSidebarItem('nav-att-report')">
        <i class="fas fa-calendar-check"></i><span>Attendance Report</span>
      </div>
      <div class="sidebar-item" id="nav-task-report" onclick="showTaskReport();closeSidebar();setActiveSidebarItem('nav-task-report')">
        <i class="fas fa-tasks"></i><span>Task Report</span>
      </div>
      <div class="sidebar-item" id="nav-expense-report" onclick="showExpenseReport();closeSidebar();setActiveSidebarItem('nav-expense-report')">
        <i class="fas fa-rupee-sign"></i><span>Expense Report</span>
      </div>
      <div class="sidebar-item" id="nav-dealer-report" onclick="showDealerPunchReport();closeSidebar();setActiveSidebarItem('nav-dealer-report')">
        <i class="fas fa-store"></i><span>Dealer Punch Report</span>
      </div>
      <div class="sidebar-item" id="nav-assigned-report" onclick="showAssignedTasksReport();closeSidebar();setActiveSidebarItem('nav-assigned-report')">
        <i class="fas fa-clipboard-list"></i><span>Assigned Tasks Report</span>
      </div>
    `;
  } else if (role === 'Manager') {
    html = `
      <div class="sidebar-section-title">Dashboard</div>
      <div class="sidebar-item active" id="nav-mgr-dashboard" onclick="showManagerDashboard();closeSidebar();setActiveSidebarItem('nav-mgr-dashboard')">
        <i class="fas fa-tachometer-alt"></i><span>Dashboard</span>
      </div>
      <div class="sidebar-section-title">Tasks</div>
      <div class="sidebar-item" id="nav-assign-task" onclick="showAssignSpecialTask();closeSidebar();setActiveSidebarItem('nav-assign-task')">
        <i class="fas fa-paper-plane"></i><span>Assign Special Task</span>
      </div>
      <div class="sidebar-item" id="nav-view-assigned" onclick="showViewAssignedTasks();closeSidebar();setActiveSidebarItem('nav-view-assigned')">
        <i class="fas fa-clipboard-list"></i><span>View Assigned Tasks</span>
      </div>
      <div class="sidebar-section-title">Reports</div>
      <div class="sidebar-item" id="nav-mgr-view-tasks" onclick="showManagerViewAllTasks();closeSidebar();setActiveSidebarItem('nav-mgr-view-tasks')">
        <i class="fas fa-chart-bar"></i><span>View All Tasks</span>
      </div>
    `;
  } else {
    // Field Engineer
    html = `
      <div class="sidebar-section-title">Dashboard</div>
      <div class="sidebar-item active" id="nav-eng-dashboard" onclick="showEngineerDashboard();closeSidebar();setActiveSidebarItem('nav-eng-dashboard')">
        <i class="fas fa-tachometer-alt"></i><span>Dashboard</span>
      </div>
      <div class="sidebar-section-title">Updates</div>
      <div class="sidebar-item" id="nav-special-tasks" onclick="showSpecialTasks();closeSidebar();setActiveSidebarItem('nav-special-tasks')">
        <i class="fas fa-star"></i><span>Special Tasks</span>
      </div>
      <div class="sidebar-item" id="nav-update-att" onclick="showUpdateAttendance();closeSidebar();setActiveSidebarItem('nav-update-att')">
        <i class="fas fa-user-check"></i><span>Update Attendance</span>
      </div>
      <div class="sidebar-item" id="nav-update-punch" onclick="showUpdateDealerPunch();closeSidebar();setActiveSidebarItem('nav-update-punch')">
        <i class="fas fa-map-marker-alt"></i><span>Update Dealer Punch</span>
      </div>
      <div class="sidebar-item" id="nav-update-tasks" onclick="showUpdateDailyTasks();closeSidebar();setActiveSidebarItem('nav-update-tasks')">
        <i class="fas fa-clipboard-check"></i><span>Update Daily Tasks</span>
      </div>
      <div class="sidebar-item" id="nav-update-expenses" onclick="showUpdateExpenses();closeSidebar();setActiveSidebarItem('nav-update-expenses')">
        <i class="fas fa-receipt"></i><span>Update Daily Expenses</span>
      </div>
      <div class="sidebar-section-title">View My Records</div>
      <div class="sidebar-item" id="nav-view-att" onclick="showViewAttendance();closeSidebar();setActiveSidebarItem('nav-view-att')">
        <i class="fas fa-calendar-alt"></i><span>View Attendance</span>
      </div>
      <div class="sidebar-item" id="nav-view-punch" onclick="showViewDealerPunch();closeSidebar();setActiveSidebarItem('nav-view-punch')">
        <i class="fas fa-store"></i><span>View Dealer Punch</span>
      </div>
      <div class="sidebar-item" id="nav-view-tasks" onclick="showViewTasks();closeSidebar();setActiveSidebarItem('nav-view-tasks')">
        <i class="fas fa-list-alt"></i><span>View Tasks</span>
      </div>
      <div class="sidebar-item" id="nav-view-expenses" onclick="showViewExpenses();closeSidebar();setActiveSidebarItem('nav-view-expenses')">
        <i class="fas fa-rupee-sign"></i><span>View Expenses</span>
      </div>
    `;
  }

  menu.innerHTML = html;
}
