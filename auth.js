// ============================================================
// FST - Authentication
// ============================================================

window.currentUser = null;

async function handleLogin() {
  const role = document.getElementById('login-role').value;
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  errorDiv.style.display = 'none';

  if (!role) { showLoginError('Please select your role.'); return; }
  if (!username) { showLoginError('Please enter your username.'); return; }
  if (!password) { showLoginError('Please enter your password.'); return; }

  if (!checkConnectivity()) { showLoginError('No internet connection. Please check your network.'); return; }

  showLoading('Logging in...');

  try {
    const result = await apiLogin(role, username, password);
    hideLoading();

    if (result.success) {
      window.currentUser = result.user;
      initMainApp();
    } else {
      showLoginError(result.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    hideLoading();
    showLoginError('Connection error. Please try again.');
  }
}

function showLoginError(msg) {
  const errorDiv = document.getElementById('login-error');
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  errorDiv.style.display = 'flex';
}

function handleLogout() {
  window.currentUser = null;
  closeModal();
  closeSidebar();
  document.getElementById('login-role').value = '';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  showScreen('screen-login');
  showToast('Logged out successfully.', 'success');
}

function initMainApp() {
  const user = window.currentUser;

  // Set header
  document.getElementById('header-user-name').textContent = user.name;
  document.getElementById('header-user-role').textContent = user.role;

  // Set sidebar
  document.getElementById('sidebar-user-name').textContent = user.name;
  document.getElementById('sidebar-user-role').textContent = user.role;
  document.getElementById('sidebar-user-city').textContent = user.baseCity ? '📍 ' + user.baseCity : '';

  // Build sidebar menu
  buildSidebarMenu(user.role);

  // Show main screen
  showScreen('screen-main');

  // Load default page
  if (user.role === 'Admin') showAdminDashboard();
  else if (user.role === 'Manager') showManagerDashboard();
  else showEngineerDashboard();
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});
