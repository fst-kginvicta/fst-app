// ============================================================
// FST - API Communication Layer
// ============================================================

async function apiCall(action, data = {}) {
  if (!isOnline()) {
    showToast('⚠️ No internet. Please check your connection.', 'error', 5000);
    throw new Error('No internet connection');
  }

  const payload = { action, ...data };
  const url = CONFIG.API_URL;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    // Since no-cors returns opaque response, we use GET with params for reads
    // and POST for writes
    return await fetchWithGET(action, data);
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

async function fetchWithGET(action, data = {}) {
  const params = new URLSearchParams({ action, ...flattenObject(data) });
  const url = `${CONFIG.API_URL}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
}

async function fetchWithPOST(action, data = {}) {
  const payload = { action, ...data };
  const url = CONFIG.API_URL;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
}

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, newKey));
    } else if (Array.isArray(val)) {
      result[newKey] = JSON.stringify(val);
    } else {
      result[newKey] = val;
    }
  }
  return result;
}

// ---- SPECIFIC API FUNCTIONS ----

// AUTH
async function apiLogin(role, username, password) {
  return fetchWithGET('login', { role, username, password });
}

// USERS
async function apiCreateUser(userData) {
  return fetchWithPOST('createUser', userData);
}
async function apiGetAllUsers() {
  return fetchWithGET('getAllUsers', {});
}
async function apiUpdateUser(userData) {
  return fetchWithPOST('updateUser', userData);
}
async function apiDeleteUser(userID) {
  return fetchWithGET('deleteUser', { userID });
}
async function apiGetEngineers() {
  return fetchWithGET('getEngineers', {});
}
async function apiGetManagers() {
  return fetchWithGET('getManagers', {});
}
async function apiGetEngineersByManager(managerUserID) {
  return fetchWithGET('getEngineersByManager', { managerUserID });
}

// ATTENDANCE
async function apiSubmitAttendance(data) {
  return fetchWithPOST('submitAttendance', data);
}
async function apiGetAttendanceByUser(userID, fromDate, toDate, date) {
  return fetchWithGET('getAttendanceByUser', { userID, fromDate, toDate, date });
}
async function apiGetAttendanceReport(fromDate, toDate) {
  return fetchWithGET('getAttendanceReport', { fromDate, toDate });
}

// DEALER PUNCH
async function apiSubmitDealerPunch(data) {
  return fetchWithPOST('submitDealerPunch', data);
}
async function apiGetDealerPunchByUser(userID, fromDate, toDate, date) {
  return fetchWithGET('getDealerPunchByUser', { userID, fromDate, toDate, date });
}
async function apiGetDealerPunchReport(fromDate, toDate) {
  return fetchWithGET('getDealerPunchReport', { fromDate, toDate });
}

// DAILY TASKS
async function apiSubmitDailyTasks(data) {
  return fetchWithPOST('submitDailyTasks', data);
}
async function apiGetDailyTasksByUser(userID, fromDate, toDate, date) {
  return fetchWithGET('getDailyTasksByUser', { userID, fromDate, toDate, date });
}
async function apiCheckDailyTasksExist(userID, date) {
  return fetchWithGET('checkDailyTasksExist', { userID, date });
}
async function apiGetTasksReport(fromDate, toDate) {
  return fetchWithGET('getTasksReport', { fromDate, toDate });
}
async function apiGetEngineerTaskSummary(userID, fromDate, toDate) {
  return fetchWithGET('getEngineerTaskSummary', { userID, fromDate, toDate });
}

// DAILY EXPENSES
async function apiSubmitDailyExpenses(data) {
  return fetchWithPOST('submitDailyExpenses', data);
}
async function apiGetDailyExpensesByUser(userID, fromDate, toDate, date) {
  return fetchWithGET('getDailyExpensesByUser', { userID, fromDate, toDate, date });
}
async function apiGetExpensesReport(fromDate, toDate, userID) {
  return fetchWithGET('getExpensesReport', { fromDate, toDate, userID });
}

// SPECIAL TASKS
async function apiAssignSpecialTask(data) {
  return fetchWithPOST('assignSpecialTask', data);
}
async function apiGetSpecialTasksByManager(managerUserID) {
  return fetchWithGET('getSpecialTasksByManager', { managerUserID });
}
async function apiGetSpecialTasksByEngineer(engineerUserID) {
  return fetchWithGET('getSpecialTasksByEngineer', { engineerUserID });
}
async function apiSendChatMessage(data) {
  return fetchWithPOST('sendChatMessage', data);
}
async function apiGetChatMessages(specialTaskID) {
  return fetchWithGET('getChatMessages', { specialTaskID });
}
async function apiGetAssignedTasksReport(fromDate, toDate) {
  return fetchWithGET('getAssignedTasksReport', { fromDate, toDate });
}

// FILE UPLOAD
async function apiUploadFile(fileData, fileName, mimeType) {
  return fetchWithPOST('uploadFile', { fileData, fileName, mimeType });
}

// GEOCODE
async function apiReverseGeocode(latitude, longitude) {
  return fetchWithGET('reverseGeocode', { latitude, longitude });
}
