// ============================================================
// FST - API Communication Layer (Fixed)
// ============================================================

const API_URL = CONFIG.API_URL;

// ---- MAIN API FUNCTION ----
// Google Apps Script only works with GET for reading
// and GET with parameters for writing too (due to CORS)
async function apiCall(action, data = {}) {
  if (!isOnline()) {
    showToast('⚠️ No internet. Please check your connection.', 'error', 5000);
    throw new Error('No internet connection');
  }

  // Flatten all data into URL parameters
  const params = new URLSearchParams();
  params.append('action', action);

  // Handle nested objects and arrays
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, value);
    }
  });

  const url = `${API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await response.text();

    // Try to parse JSON
    try {
      return JSON.parse(text);
    } catch(e) {
      console.error('Response was not JSON:', text);
      throw new Error('Invalid response from server');
    }

  } catch(err) {
    console.error('API Error:', err);
    throw err;
  }
}

// ---- ALL API FUNCTIONS USE SAME METHOD ----

// AUTH
async function apiLogin(role, username, password) {
  return apiCall('login', { role, username, password });
}

// USERS
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

// ATTENDANCE
async function apiSubmitAttendance(data) {
  return apiCall('submitAttendance', data);
}
async function apiGetAttendanceByUser(userID, fromDate, toDate, date) {
  return apiCall('getAttendanceByUser', { userID, fromDate, toDate, date });
}
async function apiGetAttendanceReport(fromDate, toDate) {
  return apiCall('getAttendanceReport', { fromDate, toDate });
}

// DEALER PUNCH
async function apiSubmitDealerPunch(data) {
  return apiCall('submitDealerPunch', data);
}
async function apiGetDealerPunchByUser(userID, fromDate, toDate, date) {
  return apiCall('getDealerPunchByUser', { userID, fromDate, toDate, date });
}
async function apiGetDealerPunchReport(fromDate, toDate) {
  return apiCall('getDealerPunchReport', { fromDate, toDate });
}

// DAILY TASKS
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

// DAILY EXPENSES
async function apiSubmitDailyExpenses(data) {
  return apiCall('submitDailyExpenses', data);
}
async function apiGetDailyExpensesByUser(userID, fromDate, toDate, date) {
  return apiCall('getDailyExpensesByUser', { userID, fromDate, toDate, date });
}
async function apiGetExpensesReport(fromDate, toDate, userID) {
  return apiCall('getExpensesReport', { fromDate, toDate, userID });
}

// SPECIAL TASKS
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

// FILE UPLOAD
async function apiUploadFile(fileData, fileName, mimeType) {
  return apiCall('uploadFile', { fileData, fileName, mimeType });
}

// GEOCODE
async function apiReverseGeocode(latitude, longitude) {
  return apiCall('reverseGeocode', { latitude, longitude });
}

// Legacy support - keep these so nothing breaks
async function fetchWithGET(action, data = {}) {
  return apiCall(action, data);
}
async function fetchWithPOST(action, data = {}) {
  return apiCall(action, data);
}
