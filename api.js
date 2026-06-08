// ============================================================
// FST - API Layer (Fixed)
// ============================================================

async function apiCall(action, data = {}) {

  // Check internet
  if (!navigator.onLine) {
    showToast('No internet connection.', 'error');
    throw new Error('Offline');
  }

  // Build URL with parameters
  const params = new URLSearchParams();
  params.append('action', action);

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, String(value));
    }
  });

  const url = CONFIG.API_URL + '?' + params.toString();

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await response.text();

    // Find JSON in response (handles any extra HTML wrapping)
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON found in response:', text.substring(0, 300));
      throw new Error('Invalid server response');
    }

    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);

  } catch(err) {
    console.error('API Error [' + action + ']:', err.message);
    throw err;
  }
}

// ---- AUTH ----
async function apiLogin(role, username, password) {
  return apiCall('login', { role, username, password });
}

// ---- USERS ----
async function apiCreateUser(userData) {
  return apiCall('createUser', userData);
}
async function apiGetAllUsers() {
  return apiCall('getAllUsers', {});
}
async function apiUpdateUser(userData) {
  return apiCall('updateUser', userData);
}
async function apiDeleteUser(userID) {
  return apiCall('deleteUser', { userID });
}
async function apiGetEngineers() {
  return apiCall('getEngineers', {});
}
async function apiGetManagers() {
  return apiCall('getManagers', {});
}
async function apiGetEngineersByManager(managerUserID) {
  return apiCall('getEngineersByManager', { managerUserID });
}

// ---- ATTENDANCE ----
async function apiSubmitAttendance(data) {
  return apiCall('submitAttendance', data);
}
async function apiGetAttendanceByUser(userID, fromDate, toDate, date) {
  return apiCall('getAttendanceByUser', { userID, fromDate, toDate, date });
}
async function apiGetAttendanceReport(fromDate, toDate) {
  return apiCall('getAttendanceReport', { fromDate, toDate });
}

// ---- DEALER PUNCH ----
async function apiSubmitDealerPunch(data) {
  return apiCall('submitDealerPunch', data);
}
async function apiGetDealerPunchByUser(userID, fromDate, toDate, date) {
  return apiCall('getDealerPunchByUser', { userID, fromDate, toDate, date });
}
async function apiGetDealerPunchReport(fromDate, toDate) {
  return apiCall('getDealerPunchReport', { fromDate, toDate });
}

// ---- DAILY TASKS ----
async function apiSubmitDailyTasks(data) {
  return apiCall('submitDailyTasks', data);
}
async function apiGetDailyTasksByUser(userID, fromDate, toDate, date) {
  return apiCall('getDailyTasksByUser', { userID, fromDate, toDate, date });
}
async function apiCheckDailyTasksExist(userID, date) {
  return apiCall('checkDailyTasksExist', { userID, date });
}
async function apiGetTasksReport(fromDate, toDate) {
  return apiCall('getTasksReport', { fromDate, toDate });
}
async function apiGetEngineerTaskSummary(userID, fromDate, toDate) {
  return apiCall('getEngineerTaskSummary', { userID, fromDate, toDate });
}

// ---- DAILY EXPENSES ----
async function apiSubmitDailyExpenses(data) {
  return apiCall('submitDailyExpenses', data);
}
async function apiGetDailyExpensesByUser(userID, fromDate, toDate, date) {
  return apiCall('getDailyExpensesByUser', { userID, fromDate, toDate, date });
}
async function apiGetExpensesReport(fromDate, toDate, userID) {
  return apiCall('getExpensesReport', { fromDate, toDate, userID });
}

// ---- SPECIAL TASKS ----
async function apiAssignSpecialTask(data) {
  return apiCall('assignSpecialTask', data);
}
async function apiGetSpecialTasksByManager(managerUserID) {
  return apiCall('getSpecialTasksByManager', { managerUserID });
}
async function apiGetSpecialTasksByEngineer(engineerUserID) {
  return apiCall('getSpecialTasksByEngineer', { engineerUserID });
}
async function apiSendChatMessage(data) {
  return apiCall('sendChatMessage', data);
}
async function apiGetChatMessages(specialTaskID) {
  return apiCall('getChatMessages', { specialTaskID });
}
async function apiGetAssignedTasksReport(fromDate, toDate) {
  return apiCall('getAssignedTasksReport', { fromDate, toDate });
}

// ---- FILE UPLOAD ----
async function apiUploadFile(fileData, fileName, mimeType) {
  return apiCall('uploadFile', { fileData, fileName, mimeType });
}

// ---- GEOCODE ----
async function apiReverseGeocode(latitude, longitude) {
  return apiCall('reverseGeocode', { latitude, longitude });
}

// ---- Legacy support ----
async function fetchWithGET(action, data = {}) {
  return apiCall(action, data);
}
async function fetchWithPOST(action, data = {}) {
  return apiCall(action, data);
}
