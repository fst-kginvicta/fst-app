// ============================================================
// FST - Admin Reports
// ============================================================

// ============================================================
// ATTENDANCE REPORT
// ============================================================
async function showAttendanceReport() {
  setActiveSidebarItem('nav-att-report');
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-calendar-check"></i> Attendance Report</h2>
      <p>View attendance records for all engineers across date ranges.</p>
    </div>

    <div class="date-filter-bar">
      <div class="form-group">
        <label>From Date</label>
        <input type="date" id="att-from" class="form-control"
          value="${ddmmyyyyToInputFormat(today)}" max="${ddmmyyyyToInputFormat(today)}">
      </div>
      <div class="form-group">
        <label>To Date</label>
        <input type="date" id="att-to" class="form-control"
          value="${ddmmyyyyToInputFormat(today)}" max="${ddmmyyyyToInputFormat(today)}">
      </div>
      <button class="btn btn-primary" onclick="loadAttendanceReport()">
        <i class="fas fa-search"></i> Generate
      </button>
    </div>

    <div id="att-report-result"></div>
  `);
}

async function loadAttendanceReport() {
  const fromInput = document.getElementById('att-from').value;
  const toInput = document.getElementById('att-to').value;

  if (!fromInput || !toInput) { showToast('Please select both dates.', 'warning'); return; }

  const fromDate = inputFormatToDDMMYYYY(fromInput);
  const toDate = inputFormatToDDMMYYYY(toInput);

  if (parseDate(fromDate) > parseDate(toDate)) {
    showToast('From date cannot be after To date.', 'warning'); return;
  }

  showLoading('Generating attendance report...');
  try {
    const res = await apiGetAttendanceReport(fromDate, toDate);
    hideLoading();

    if (!res.success) { showToast('Error loading report.', 'error'); return; }

    const { report, dates } = res;
    const container = document.getElementById('att-report-result');

    if (!report || report.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No data found.</p></div>';
      return;
    }

    // Summary counts
    let presentTotal = 0, leaveTotal = 0, absentTotal = 0;
    report.forEach(row => {
      dates.forEach(d => {
        const s = row[d]?.status;
        if (s === 'Present') presentTotal++;
        else if (s === 'Leave') leaveTotal++;
        else if (!s) absentTotal++;
      });
    });

    let tableHTML = `
      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick="exportTableToExcel('att-report-table', 'Attendance_Report')">
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <div class="stat-card" style="flex:1;min-width:100px;">
          <div class="stat-value" style="color:var(--success);">${presentTotal}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:100px;">
          <div class="stat-value" style="color:var(--danger);">${leaveTotal}</div>
          <div class="stat-label">Leave</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:100px;">
          <div class="stat-value" style="color:var(--mid-gray);">${absentTotal}</div>
          <div class="stat-label">Not Submitted</div>
        </div>
      </div>
      <div class="table-wrap">
        <table id="att-report-table" class="att-report-table">
          <thead>
            <tr>
              <th>Engineer Name</th>
              ${dates.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.map(row => `
              <tr>
                <td style="font-weight:600;white-space:nowrap;">${sanitize(row.engineerName)}</td>
                ${dates.map(d => {
                  const rec = row[d];
                  const status = rec?.status || '';
                  const submittedAt = rec?.submittedAt || '';
                  return `<td title="${submittedAt ? 'Submitted: ' + submittedAt : 'Not submitted'}" style="text-align:center;">
                    ${getAttBadge(status)}
                  </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="info-msg mt-12">
        <i class="fas fa-info-circle"></i> Hover over cells to see submission time.
      </div>`;

    container.innerHTML = `<div class="card"><div class="card-body">${tableHTML}</div></div>`;

  } catch(err) {
    hideLoading();
    showToast('Error generating report.', 'error');
  }
}

// ============================================================
// TASK REPORT
// ============================================================
async function showTaskReport() {
  setActiveSidebarItem('nav-task-report');
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-tasks"></i> Task Report</h2>
      <p>PAN India summary and individual engineer task analysis.</p>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="tab-pan-india" onclick="switchTaskTab('pan-india')">
        <i class="fas fa-map-india"></i> PAN India Summary
      </button>
      <button class="tab-btn" id="tab-eng-summary" onclick="switchTaskTab('eng-summary')">
        <i class="fas fa-user-chart"></i> Engineer Summary
      </button>
    </div>

    <!-- PAN INDIA TAB -->
    <div id="tab-content-pan-india">
      <div class="date-filter-bar">
        <div class="form-group">
          <label>From Date</label>
          <input type="date" id="pan-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" id="pan-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <button class="btn btn-primary" onclick="loadPanIndiaTaskReport()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="pan-india-result"></div>
    </div>

    <!-- ENGINEER SUMMARY TAB -->
    <div id="tab-content-eng-summary" style="display:none;">
      <div class="date-filter-bar" style="flex-direction:column;align-items:stretch;">
        <div class="form-group">
          <label>Select Engineer</label>
          <select id="es-engineer" class="form-control">
            <option value="">-- Select Engineer --</option>
          </select>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;">
            <label>From Date</label>
            <input type="date" id="es-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
          </div>
          <div class="form-group" style="flex:1;">
            <label>To Date</label>
            <input type="date" id="es-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
          </div>
        </div>
        <button class="btn btn-primary" onclick="loadEngineerTaskSummaryReport()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="eng-summary-result"></div>
    </div>
  `);

  // Load engineers for dropdown
  try {
    const res = await apiGetEngineers();
    if (res.success) {
      const select = document.getElementById('es-engineer');
      if (select) {
        res.engineers.forEach(e => {
          select.innerHTML += `<option value="${e.userID}">${sanitize(e.name)}</option>`;
        });
      }
    }
  } catch(e) {}
}

function switchTaskTab(tab) {
  document.getElementById('tab-content-pan-india').style.display = tab === 'pan-india' ? 'block' : 'none';
  document.getElementById('tab-content-eng-summary').style.display = tab === 'eng-summary' ? 'block' : 'none';
  document.getElementById('tab-pan-india').className = 'tab-btn' + (tab === 'pan-india' ? ' active' : '');
  document.getElementById('tab-eng-summary').className = 'tab-btn' + (tab === 'eng-summary' ? ' active' : '');
}

async function loadPanIndiaTaskReport() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('pan-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('pan-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Generating PAN India report...');
  try {
    const res = await apiGetTasksReport(fromDate, toDate);
    hideLoading();
    if (!res.success) { showToast('Error loading report.', 'error'); return; }

    const { report, engineers } = res;
    const container = document.getElementById('pan-india-result');

    const taskLabels = [
      'DSQ Audit','SEG Q Audit','HUB Audit','SPOKE Audit',
      'DSQ Warranty Material Inspection','SEG Q Warranty Material Inspection',
      'Joint Investigation','Campaign','iTrams','Weekly Data Collection',
      'eJC Data Quality Validation','DSQ Materials Inspected',
      'SEG Q Materials Inspected','IUW Marketing Calls','AdiCare Marketing Calls',
      'OE Extended Warranty Calls','Warranty Support to BDS/BES','OECD Mapping','AMC Related'
    ];

    // Compute totals per engineer
    const engTotals = {};
    engineers.forEach(eng => { engTotals[eng] = 0; });
    let grandTotal = 0;

    report.forEach(row => {
      engineers.forEach(eng => {
        engTotals[eng] = (engTotals[eng] || 0) + (Number(row[eng]) || 0);
      });
      grandTotal += Number(row.TOTAL) || 0;
    });

    container.innerHTML = `
      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick="exportTableToExcel('pan-india-table', 'PanIndia_Task_Report')">
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>
      <div class="table-wrap">
        <table id="pan-india-table">
          <thead>
            <tr>
              <th>Task</th>
              ${engineers.map(e => `<th>${sanitize(e)}</th>`).join('')}
              <th style="background:var(--gold-dark);">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${report.map((row, idx) => `
              <tr>
                <td style="font-weight:600;white-space:nowrap;">${idx + 1}. ${sanitize(row.taskLabel)}</td>
                ${engineers.map(e => `<td style="text-align:center;">${Number(row[e]) || 0}</td>`).join('')}
                <td style="text-align:center;font-weight:700;color:var(--navy);">${Number(row.TOTAL) || 0}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="tfoot-row">
              <td style="font-weight:700;">TOTAL</td>
              ${engineers.map(e => `<td style="text-align:center;">${engTotals[e] || 0}</td>`).join('')}
              <td style="text-align:center;">${grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  } catch(err) {
    hideLoading();
    showToast('Error generating report.', 'error');
  }
}

async function loadEngineerTaskSummaryReport() {
  const userID = document.getElementById('es-engineer').value;
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('es-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('es-to').value);

  if (!userID) { showToast('Please select an engineer.', 'warning'); return; }
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Generating engineer summary...');
  try {
    const res = await apiGetEngineerTaskSummary(userID, fromDate, toDate);
    hideLoading();
    if (!res.success) { showToast('Error loading summary.', 'error'); return; }

    renderEngineerTaskSummary(res.records, 'eng-summary-result');
  } catch(err) {
    hideLoading();
    showToast('Error generating summary.', 'error');
  }
}

function renderEngineerTaskSummary(records, containerId) {
  const container = document.getElementById(containerId);
  if (!records || records.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No task records found for the selected period.</p></div>';
    return;
  }

  const excelData = [];
  let html = `
    <div class="export-btn-wrap">
      <button class="btn btn-gold btn-sm" onclick="exportEngSummaryToExcel('${containerId}')">
        <i class="fas fa-file-excel"></i> Export to Excel
      </button>
    </div>`;

  records.forEach(task => {
    const details = task.taskDetails || task.details || [];
    const taskItems = buildTaskSummaryItems(task, details);

    html += `
      <div class="summary-day-card" data-date="${task.date}">
        <div class="summary-day-header">
          <div>
            <div class="day-date"><i class="fas fa-calendar-day"></i> ${sanitize(task.date)}</div>
            <div class="day-location">${sanitize(task.engineerName)} &bull; ${sanitize(task.location)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.78rem;color:var(--gold-light);">Login: ${sanitize(task.loginTime)}</div>
            <div style="font-size:0.78rem;color:var(--gold-light);">Logout: ${sanitize(task.logoutTime)}</div>
          </div>
        </div>
        <div class="summary-day-body">
          ${taskItems}
          ${task.taskComments ? `
            <div class="summary-task-item">
              <i class="fas fa-comment summary-task-icon"></i>
              <div>
                <div class="summary-task-label">Comments</div>
                <div class="summary-task-details">${sanitize(task.taskComments)}</div>
              </div>
            </div>` : ''}
        </div>
      </div>`;

    // For Excel
    excelData.push({
      Date: task.date,
      Engineer: task.engineerName,
      Location: task.location,
      LoginTime: task.loginTime,
      LogoutTime: task.logoutTime,
      DSQ_Audit: task.dsqAuditCount,
      SEGQ_Audit: task.segqAuditCount,
      HUB_Audit: task.hubAuditCount,
      SPOKE_Audit: task.spokeAuditCount,
      DSQ_Warranty_Dealers: task.dsqWarrantyInspectedDealers,
      DSQ_Materials_Inspected: task.dsqMaterialsInspectedCount,
      SEGQ_Warranty_Dealers: task.segqWarrantyInspectedDealers,
      SEGQ_Materials_Inspected: task.segqMaterialsInspectedCount,
      JI_Count: task.jiCount,
      Campaign_Count: task.campaignCount,
      iTrams_Tickets: task.itramsTicketCount,
      Weekly_Data_Collection: task.weeklyDataCollectionCount,
      eJC_Count: task.ejcCount,
      eJC_Dealers_Validated: task.ejcDealersValidated,
      IUW_Calls: task.iuwCallCount,
      IUW_Subscriptions: task.iuwSubscriptionCount,
      AdiCare_Calls: task.adicareCallCount,
      AdiCare_Sales: task.adicareSalesCount,
      OE_Calls: task.oeCallCount,
      OE_Sales: task.oeSalesCount,
      Warranty_Calls: task.warrantyCallCount,
      Warranty_Comments: task.warrantyComments,
      OECD_Calls: task.oecdCallCount,
      OECD_Comments: task.oecdComments,
      AMC_Calls: task.amcCallCount,
      AMC_Comments: task.amcComments,
      Task_Comments: task.taskComments
    });
  });

  container.innerHTML = html;
  container._excelData = excelData;
}

function buildTaskSummaryItems(task, details) {
  let html = '';
  const taskMap = [
    { key: 'dsqAuditCount', label: 'DSQ Audit', icon: 'fa-clipboard-check', type: 'audit', detailType: 'DSQ Audit' },
    { key: 'segqAuditCount', label: 'SEG Q Audit', icon: 'fa-clipboard-check', type: 'audit', detailType: 'SEG Q Audit' },
    { key: 'hubAuditCount', label: 'HUB Audit', icon: 'fa-building', type: 'audit', detailType: 'HUB Audit' },
    { key: 'spokeAuditCount', label: 'SPOKE Audit', icon: 'fa-dot-circle', type: 'audit', detailType: 'SPOKE Audit' },
    { key: 'dsqWarrantyInspectedDealers', label: 'DSQ Warranty Inspection', icon: 'fa-search', type: 'warranty', detailType: 'DSQ Warranty' },
    { key: 'segqWarrantyInspectedDealers', label: 'SEG Q Warranty Inspection', icon: 'fa-search', type: 'warranty', detailType: 'SEG Q Warranty' },
    { key: 'jiCount', label: 'Joint Investigation', icon: 'fa-microscope', type: 'ji', detailType: 'Joint Investigation' },
    { key: 'campaignCount', label: 'Campaign', icon: 'fa-bullhorn', type: 'campaign', detailType: 'Campaign' },
    { key: 'itramsTicketCount', label: 'iTrams', icon: 'fa-ticket-alt', type: 'itrams', detailType: 'iTrams' },
    { key: 'weeklyDataCollectionCount', label: 'Weekly Data Collection', icon: 'fa-database', type: 'simple', count: true },
    { key: 'ejcCount', label: 'eJC Data Quality Validation', icon: 'fa-check-double', type: 'ejc' },
    { key: 'iuwCallCount', label: 'IUW Marketing Calls', icon: 'fa-phone', type: 'simple' },
    { key: 'adicareCallCount', label: 'AdiCare Marketing Calls', icon: 'fa-phone-alt', type: 'simple' },
    { key: 'oeCallCount', label: 'OE Extended Warranty Calls', icon: 'fa-file-contract', type: 'simple' },
    { key: 'warrantyCallCount', label: 'Warranty Support BDS/BES', icon: 'fa-tools', type: 'withComment', commentKey: 'warrantyComments' },
    { key: 'oecdCallCount', label: 'OECD Mapping', icon: 'fa-map', type: 'withComment', commentKey: 'oecdComments' },
    { key: 'amcCallCount', label: 'AMC Related', icon: 'fa-file-alt', type: 'withComment', commentKey: 'amcComments' }
  ];

  taskMap.forEach(t => {
    const count = Number(task[t.key]) || 0;
    if (count === 0) return;

    const taskDetails = details.filter(d => d.taskType === t.detailType);

    let detailsText = `Count: ${count}`;

    if (t.type === 'audit' && taskDetails.length > 0) {
      detailsText = taskDetails.map(d =>
        `${sanitize(d.dealerName)} (${sanitize(d.dealerCity)}) - Score: ${sanitize(d.score)}`
      ).join(' | ');
    } else if (t.type === 'warranty' && taskDetails.length > 0) {
      detailsText = `Dealers: ${count} | Materials Inspected: ${task[t.key === 'dsqWarrantyInspectedDealers' ? 'dsqMaterialsInspectedCount' : 'segqMaterialsInspectedCount']}`;
      detailsText += ' | ' + taskDetails.map(d =>
        `${sanitize(d.dealerName)} (${sanitize(d.dealerCity)})`
      ).join(', ');
    } else if (t.type === 'ji' && taskDetails.length > 0) {
      detailsText = taskDetails.map(d =>
        `${sanitize(d.location)}: ${sanitize(d.details)}`
      ).join(' | ');
    } else if (t.type === 'campaign' && taskDetails.length > 0) {
      detailsText = taskDetails.map(d =>
        `${sanitize(d.location)}: ${sanitize(d.details)}`
      ).join(' | ');
    } else if (t.type === 'itrams' && taskDetails.length > 0) {
      detailsText = `Tickets: ${count} | ` + taskDetails.map(d =>
        `${sanitize(d.dealerName)} (${sanitize(d.dealerCity)})`
      ).join(', ');
    } else if (t.type === 'ejc') {
      detailsText = `Count: ${count} | Dealers Validated: ${task.ejcDealersValidated}`;
    } else if (t.type === 'withComment') {
      detailsText = `Calls: ${count}`;
      if (task[t.commentKey]) detailsText += ` | ${sanitize(task[t.commentKey])}`;
    } else if (t.key === 'iuwCallCount') {
      detailsText = `Calls: ${count} | Subscriptions: ${task.iuwSubscriptionCount}`;
    } else if (t.key === 'adicareCallCount') {
      detailsText = `Calls: ${count} | Sales: ${task.adicareSalesCount}`;
    } else if (t.key === 'oeCallCount') {
      detailsText = `Calls: ${count} | Sales: ${task.oeSalesCount}`;
    }

    html += `
      <div class="summary-task-item">
        <i class="fas ${t.icon} summary-task-icon"></i>
        <div>
          <div class="summary-task-label">${t.label}</div>
          <div class="summary-task-details">${detailsText}</div>
        </div>
      </div>`;
  });

  return html || '<div class="empty-state" style="padding:12px;"><p>No tasks recorded.</p></div>';
}

function exportEngSummaryToExcel(containerId) {
  const container = document.getElementById(containerId);
  if (container && container._excelData) {
    exportToExcel(container._excelData, 'Engineer_Task_Summary');
  } else {
    showToast('No data to export.', 'warning');
  }
}

// ============================================================
// EXPENSE REPORT
// ============================================================
async function showExpenseReport() {
  setActiveSidebarItem('nav-expense-report');
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-rupee-sign"></i> Expense Report</h2>
      <p>PAN India expense summary and individual engineer expense breakdown.</p>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="tab-exp-pan" onclick="switchExpTab('pan')">
        <i class="fas fa-map"></i> PAN India Summary
      </button>
      <button class="tab-btn" id="tab-exp-eng" onclick="switchExpTab('eng')">
        <i class="fas fa-user"></i> Engineer Summary
      </button>
    </div>

    <div id="tab-content-exp-pan">
      <div class="date-filter-bar">
        <div class="form-group">
          <label>From Date</label>
          <input type="date" id="exp-pan-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" id="exp-pan-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
        </div>
        <button class="btn btn-primary" onclick="loadPanIndiaExpenseReport()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="exp-pan-result"></div>
    </div>

    <div id="tab-content-exp-eng" style="display:none;">
      <div class="date-filter-bar" style="flex-direction:column;align-items:stretch;">
        <div class="form-group">
          <label>Select Engineer</label>
          <select id="exp-eng-select" class="form-control">
            <option value="">-- Select Engineer --</option>
          </select>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;">
            <label>From Date</label>
            <input type="date" id="exp-eng-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
          </div>
          <div class="form-group" style="flex:1;">
            <label>To Date</label>
            <input type="date" id="exp-eng-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
          </div>
        </div>
        <button class="btn btn-primary" onclick="loadEngExpenseReport()">
          <i class="fas fa-search"></i> Generate
        </button>
      </div>
      <div id="exp-eng-result"></div>
    </div>
  `);

  try {
    const res = await apiGetEngineers();
    if (res.success) {
      const sel = document.getElementById('exp-eng-select');
      if (sel) res.engineers.forEach(e => {
        sel.innerHTML += `<option value="${e.userID}">${sanitize(e.name)}</option>`;
      });
    }
  } catch(e) {}
}

function switchExpTab(tab) {
  document.getElementById('tab-content-exp-pan').style.display = tab === 'pan' ? 'block' : 'none';
  document.getElementById('tab-content-exp-eng').style.display = tab === 'eng' ? 'block' : 'none';
  document.getElementById('tab-exp-pan').className = 'tab-btn' + (tab === 'pan' ? ' active' : '');
  document.getElementById('tab-exp-eng').className = 'tab-btn' + (tab === 'eng' ? ' active' : '');
}

async function loadPanIndiaExpenseReport() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('exp-pan-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('exp-pan-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Generating expense report...');
  try {
    const res = await apiGetExpensesReport(fromDate, toDate, '');
    hideLoading();
    if (!res.success) { showToast('Error loading report.', 'error'); return; }

    const { summary } = res;
    const container = document.getElementById('exp-pan-result');
    if (!summary || summary.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No expense data found.</p></div>';
      return;
    }

    // Totals
    const totals = { localTravelExpense: 0, outstationTravelExpense: 0, lodgingExpense: 0, outstationFoodExpense: 0, outstationLocalTravel: 0, total: 0 };
    summary.forEach(row => {
      Object.keys(totals).forEach(k => { totals[k] += Number(row[k]) || 0; });
    });

    const excelData = summary.map(r => ({
      Engineer: r.engineerName,
      Username: r.username,
      'Local Travel (₹)': r.localTravelExpense,
      'Outstation Travel (₹)': r.outstationTravelExpense,
      'Lodging (₹)': r.lodgingExpense,
      'Outstation Food (₹)': r.outstationFoodExpense,
      'Outstation Local Travel (₹)': r.outstationLocalTravel,
      'Total (₹)': r.total
    }));

    container.innerHTML = `
      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick='exportToExcel(${JSON.stringify(excelData)}, "PanIndia_Expense_Report")'>
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>
      <div class="table-wrap">
        <table id="pan-exp-table">
          <thead>
            <tr>
              <th>Engineer</th>
              <th>Local Travel</th>
              <th>Outstation Travel</th>
              <th>Lodging</th>
              <th>Food</th>
              <th>OS Local Travel</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(row => `
              <tr>
                <td style="font-weight:600;">${sanitize(row.engineerName)}</td>
                <td>${formatCurrency(row.localTravelExpense)}</td>
                <td>${formatCurrency(row.outstationTravelExpense)}</td>
                <td>${formatCurrency(row.lodgingExpense)}</td>
                <td>${formatCurrency(row.outstationFoodExpense)}</td>
                <td>${formatCurrency(row.outstationLocalTravel)}</td>
                <td style="font-weight:700;color:var(--navy);">${formatCurrency(row.total)}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="tfoot-row">
              <td>TOTAL</td>
              <td>${formatCurrency(totals.localTravelExpense)}</td>
              <td>${formatCurrency(totals.outstationTravelExpense)}</td>
              <td>${formatCurrency(totals.lodgingExpense)}</td>
              <td>${formatCurrency(totals.outstationFoodExpense)}</td>
              <td>${formatCurrency(totals.outstationLocalTravel)}</td>
              <td>${formatCurrency(totals.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  } catch(err) {
    hideLoading();
    showToast('Error generating report.', 'error');
  }
}

async function loadEngExpenseReport() {
  const userID = document.getElementById('exp-eng-select').value;
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('exp-eng-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('exp-eng-to').value);

  if (!userID) { showToast('Please select an engineer.', 'warning'); return; }
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Generating engineer expense report...');
  try {
    const res = await apiGetExpensesReport(fromDate, toDate, userID);
    hideLoading();
    if (!res.success) { showToast('Error loading report.', 'error'); return; }

    renderExpenseTable(res.records, 'exp-eng-result');
  } catch(err) {
    hideLoading();
    showToast('Error generating report.', 'error');
  }
}

function renderExpenseTable(records, containerId) {
  const container = document.getElementById(containerId);
  if (!records || records.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No expense records found.</p></div>';
    return;
  }

  // Compute totals
  const totals = { localTravelExpense: 0, outstationTravelExpense: 0, lodgingExpense: 0, outstationFoodExpense: 0, outstationLocalTravel: 0 };
  records.forEach(r => {
    Object.keys(totals).forEach(k => { totals[k] += Number(r[k]) || 0; });
  });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const excelData = records.map(r => ({
    Username: r.username,
    Date: r.date,
    'Location Type': r.locationType,
    'Day Start City': r.dayStartCity,
    'City 1': r.city1,
    'City 2': r.city2,
    'Day End City': r.dayEndCity,
    'Local Travel (₹)': r.localTravelExpense,
    'Outstation Travel (₹)': r.outstationTravelExpense,
    'Lodging (₹)': r.lodgingExpense,
    'Outstation Food (₹)': r.outstationFoodExpense,
    'Outstation Local Travel (₹)': r.outstationLocalTravel,
    'Conveyance Comments': r.conveyanceComments,
    'Travel Comments': r.travelComments
  }));

  container.innerHTML = `
    <div class="export-btn-wrap">
      <button class="btn btn-gold btn-sm" onclick='exportToExcel(${JSON.stringify(excelData)}, "Engineer_Expense_Report")'>
        <i class="fas fa-file-excel"></i> Export to Excel
      </button>
    </div>
    <div class="table-wrap">
      <table id="eng-exp-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Date</th>
            <th>Location</th>
            <th>Start City</th>
            <th>City 1</th>
            <th>City 2</th>
            <th>End City</th>
            <th>Local Travel</th>
            <th>OS Travel</th>
            <th>Lodging</th>
            <th>Food</th>
            <th>OS Local</th>
            <th>Conveyance Notes</th>
            <th>Travel Notes</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td>${sanitize(r.username)}</td>
              <td style="white-space:nowrap;">${sanitize(r.date)}</td>
              <td><span class="badge badge-navy">${sanitize(r.locationType)}</span></td>
              <td>${sanitize(r.dayStartCity)}</td>
              <td>${sanitize(r.city1)}</td>
              <td>${sanitize(r.city2)}</td>
              <td>${sanitize(r.dayEndCity)}</td>
              <td>${formatCurrency(r.localTravelExpense)}</td>
              <td>${formatCurrency(r.outstationTravelExpense)}</td>
              <td>${formatCurrency(r.lodgingExpense)}</td>
              <td>${formatCurrency(r.outstationFoodExpense)}</td>
              <td>${formatCurrency(r.outstationLocalTravel)}</td>
              <td style="max-width:150px;font-size:0.78rem;">${sanitize(r.conveyanceComments)}</td>
              <td style="max-width:150px;font-size:0.78rem;">${sanitize(r.travelComments)}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr class="tfoot-row">
            <td colspan="7">TOTALS</td>
            <td>${formatCurrency(totals.localTravelExpense)}</td>
            <td>${formatCurrency(totals.outstationTravelExpense)}</td>
            <td>${formatCurrency(totals.lodgingExpense)}</td>
            <td>${formatCurrency(totals.outstationFoodExpense)}</td>
            <td>${formatCurrency(totals.outstationLocalTravel)}</td>
            <td colspan="2" style="text-align:right;">Grand Total: ${formatCurrency(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

// ============================================================
// DEALER PUNCH REPORT
// ============================================================
async function showDealerPunchReport() {
  setActiveSidebarItem('nav-dealer-report');
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-store"></i> Dealer Punch Report</h2>
      <p>View all dealer visit punches by date range.</p>
    </div>
    <div class="date-filter-bar">
      <div class="form-group">
        <label>From Date</label>
        <input type="date" id="dp-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <div class="form-group">
        <label>To Date</label>
        <input type="date" id="dp-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <button class="btn btn-primary" onclick="loadDealerPunchReport()">
        <i class="fas fa-search"></i> Generate
      </button>
    </div>
    <div id="dp-result"></div>
  `);
}

async function loadDealerPunchReport() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('dp-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('dp-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading dealer punch report...');
  try {
    const res = await apiGetDealerPunchReport(fromDate, toDate);
    hideLoading();
    const container = document.getElementById('dp-result');

    if (!res.success || !res.records || res.records.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-store-slash"></i><p>No dealer punches found.</p></div>';
      return;
    }

    const excelData = res.records.map(r => ({
      'Punch ID': r.punchID,
      'Engineer Name': r.engineerName,
      'Username': r.username,
      'Date': r.date,
      'Dealer Name': r.dealerName,
      'Dealer City': r.dealerCity,
      'Latitude': r.latitude,
      'Longitude': r.longitude,
      'Resolved Address': r.resolvedAddress,
      'Submitted At': r.submittedAt
    }));

    container.innerHTML = `
      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick='exportToExcel(${JSON.stringify(excelData)}, "Dealer_Punch_Report")'>
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Engineer</th>
              <th>Date</th>
              <th>Dealer Name</th>
              <th>Dealer City</th>
              <th>Address (Google)</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            ${res.records.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight:600;">${sanitize(r.engineerName)}</td>
                <td style="white-space:nowrap;">${sanitize(r.date)}</td>
                <td>${sanitize(r.dealerName)}</td>
                <td>${sanitize(r.dealerCity)}</td>
                <td style="font-size:0.8rem;">${sanitize(r.resolvedAddress)}</td>
                <td style="font-size:0.78rem;white-space:nowrap;">${sanitize(r.submittedAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(err) {
    hideLoading();
    showToast('Error loading report.', 'error');
  }
}

// ============================================================
// ASSIGNED TASKS REPORT
// ============================================================
async function showAssignedTasksReport() {
  setActiveSidebarItem('nav-assigned-report');
  const today = getTodayDDMMYYYY();
  setContent(`
    <div class="page-header">
      <h2><i class="fas fa-clipboard-list"></i> Assigned Tasks Report</h2>
      <p>Overview of all special tasks assigned by managers to engineers.</p>
    </div>
    <div class="date-filter-bar">
      <div class="form-group">
        <label>From Date</label>
        <input type="date" id="at-from" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <div class="form-group">
        <label>To Date</label>
        <input type="date" id="at-to" class="form-control" value="${ddmmyyyyToInputFormat(today)}">
      </div>
      <button class="btn btn-primary" onclick="loadAssignedTasksReport()">
        <i class="fas fa-search"></i> Generate
      </button>
    </div>
    <div id="at-result"></div>
  `);
}

async function loadAssignedTasksReport() {
  const fromDate = inputFormatToDDMMYYYY(document.getElementById('at-from').value);
  const toDate = inputFormatToDDMMYYYY(document.getElementById('at-to').value);
  if (!fromDate || !toDate) { showToast('Please select both dates.', 'warning'); return; }

  showLoading('Loading assigned tasks report...');
  try {
    const res = await apiGetAssignedTasksReport(fromDate, toDate);
    hideLoading();
    const container = document.getElementById('at-result');

    if (!res.success || !res.tasks || res.tasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No assigned tasks found.</p></div>';
      return;
    }

    // Stats
    const stats = { total: res.tasks.length, pending: 0, inProgress: 0, complete: 0 };
    res.tasks.forEach(t => {
      if (t.currentStatus === 'Pending') stats.pending++;
      else if (t.currentStatus === 'In-Progress') stats.inProgress++;
      else if (t.currentStatus === 'Complete') stats.complete++;
    });

    const excelData = res.tasks.map(t => ({
      'Task ID': t.specialTaskID,
      'Manager': t.managerName,
      'Engineer': t.engineerName,
      'Task Description': t.taskDescription,
      'Priority': t.priority,
      'Status': t.currentStatus,
      'Assigned At': t.assignedAt,
      'Last Updated': t.lastUpdatedAt,
      'Chat Messages': (t.chatMessages || []).length
    }));

    container.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <div class="stat-card" style="flex:1;">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card" style="flex:1;">
          <div class="stat-value" style="color:var(--warning);">${stats.pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card" style="flex:1;">
          <div class="stat-value" style="color:var(--info);">${stats.inProgress}</div>
          <div class="stat-label">In-Progress</div>
        </div>
        <div class="stat-card" style="flex:1;">
          <div class="stat-value" style="color:var(--success);">${stats.complete}</div>
          <div class="stat-label">Complete</div>
        </div>
      </div>

      <div class="export-btn-wrap">
        <button class="btn btn-gold btn-sm" onclick='exportToExcel(${JSON.stringify(excelData)}, "Assigned_Tasks_Report")'>
          <i class="fas fa-file-excel"></i> Export to Excel
        </button>
      </div>

      ${res.tasks.map(t => `
        <div class="card priority-${(t.priority || '').toLowerCase()}" style="margin-bottom:12px;">
          <div class="card-body" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
              <div>
                <div style="font-weight:700;color:var(--navy);margin-bottom:4px;">
                  <i class="fas fa-user-tie" style="color:var(--gold-dark);margin-right:6px;"></i>
                  ${sanitize(t.managerName)}
                  <i class="fas fa-arrow-right" style="margin:0 8px;color:var(--mid-gray);font-size:0.8rem;"></i>
                  <i class="fas fa-hard-hat" style="color:var(--navy);margin-right:6px;"></i>
                  ${sanitize(t.engineerName)}
                </div>
                <div style="font-size:0.78rem;color:var(--mid-gray);">${sanitize(t.assignedAt)}</div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${getPriorityBadge(t.priority)}
                ${getStatusBadge(t.currentStatus)}
              </div>
            </div>
            <div style="background:var(--off-white);padding:12px;border-radius:8px;font-size:0.87rem;color:var(--dark-gray);margin-bottom:10px;line-height:1.6;">
              ${sanitize(t.taskDescription)}
            </div>
            ${t.chatMessages && t.chatMessages.length > 1 ? `
              <div style="font-size:0.78rem;color:var(--mid-gray);">
                <i class="fas fa-comments"></i> ${t.chatMessages.length} messages &bull; Last updated: ${sanitize(t.lastUpdatedAt)}
              </div>` : ''}
          </div>
        </div>`).join('')}`;
  } catch(err) {
    hideLoading();
    showToast('Error loading report.', 'error');
  }
}
