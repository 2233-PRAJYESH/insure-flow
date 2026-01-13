// User credentials
const users = {
  "csr@gmail.com": { password: "csr", role: "csr", name: "csr", initials: "JS" },
  "admin@gmail.com": { password: "admin", role: "admin", name: "admin", initials: "AL" },
  "superadmin@gmail.com": { password: "superadmin", role: "superadmin", name: "superadmin", initials: "RC" }
};

// Chart instances tracking
const charts = {};

// Current user role
let currentRole = "";

// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const csrDashboard = document.getElementById('csr-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const superadminDashboard = document.getElementById('superadmin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const currentDateTime = document.getElementById('current-date-time').querySelector('span');
const profileMenuBtn = document.getElementById('profile-menu-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');
const userName = document.getElementById('user-name');
const userInitials = document.getElementById('user-initials');
const addLeadModal = document.getElementById('add-lead-modal');
const updateStatusModal = document.getElementById('update-status-modal');
const addLeadForm = document.getElementById('add-lead-form');
const updateStatusForm = document.getElementById('update-status-form');

// Initialize
document.addEventListener('DOMContentLoaded', function () {
  // Show login screen by default
  loginContainer.style.display = 'flex';

  // Handle login form submission
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check credentials
    if (users[email] && users[email].password === password) {
      const role = users[email].role;
      // Login successful
      loginContainer.style.display = 'none';
      appContainer.style.display = 'flex';

      // Set user info
      userName.textContent = users[email].name;
      userInitials.textContent = users[email].initials;

      // Store current role
      currentRole = role;

      // Show appropriate dashboard
      showDashboard(role);

      // Initialize charts
      initCharts();
    } else {
      // Login failed
      loginError.textContent = 'Invalid email or password';
      loginError.style.display = 'block';
    }
  });

  // Handle logout (update to include header logout button)
  logoutBtn.addEventListener('click', handleLogout);

  // Add event listener for the new dropdown logout button
  const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', handleLogout);
  }

  // Handle profile dropdown
  profileMenuBtn.addEventListener('click', function () {
    profileDropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking elsewhere
  document.addEventListener('click', function (e) {
    if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  // Toggle sidebar on mobile
  sidebarToggle.addEventListener('click', function () {
    document.querySelector('aside').classList.toggle('hidden');
  });

  // Update date and time
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Handle sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
      // Remove active class from all items
      document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });

      // Add active class to clicked item
      this.classList.add('active');

      const section = this.getAttribute('data-section');

      // Hide special full-page sections by default
      const pipelineSection = document.getElementById('pipeline-section');
      const commissionSection = document.getElementById('commission-section');
      const inProgressSection = document.getElementById('in-progress-section');

      if (pipelineSection) pipelineSection.classList.add('hidden');
      if (commissionSection) commissionSection.classList.add('hidden');
      if (inProgressSection) inProgressSection.style.display = 'none';

      // Standard navigation
      if (['dashboard', 'charts', 'reports'].includes(section)) {
        // Ensure the main dashboard container is visible
        if (currentRole === 'csr') csrDashboard.style.display = 'block';
        if (currentRole === 'admin') adminDashboard.style.display = 'block';
        if (currentRole === 'superadmin') superadminDashboard.style.display = 'block';

        updateDashboardView(currentRole, section);
      }
      // Special Sections
      else if (section === 'in-progress' && currentRole === 'admin') {
        adminDashboard.style.display = 'none';
        inProgressSection.style.display = 'block';
      } else if (section === 'pipeline' && currentRole === 'superadmin') {
        // Pipeline is inside superadmin dashboard container but separate from dashboard/charts/reports
        superadminDashboard.style.display = 'block';
        updateDashboardView(currentRole, 'none'); // Hide standard sections
        pipelineSection.classList.remove('hidden');
      } else if (section === 'commission' && currentRole === 'superadmin') {
        superadminDashboard.style.display = 'block';
        updateDashboardView(currentRole, 'none'); // Hide standard sections
        commissionSection.classList.remove('hidden');
      }
    });
  });

  // Set up modal buttons
  document.querySelectorAll('button').forEach(button => {
    if (button.textContent.includes('Add Lead')) {
      button.addEventListener('click', () => {
        addLeadModal.style.display = 'flex';
      });
    }
    if (button.textContent.includes('Update Status')) {
      button.addEventListener('click', () => {
        updateStatusModal.style.display = 'flex';
      });
    }
  });

  // Close modals with cancel buttons
  document.querySelectorAll('.cancel-modal').forEach(button => {
    button.addEventListener('click', () => {
      addLeadModal.style.display = 'none';
      updateStatusModal.style.display = 'none';
    });
  });

  // Handle add lead form submission
  addLeadForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const clientName = document.getElementById('client-name').value;
    const requestType = document.getElementById('request-type').value;
    const policyType = document.getElementById('policy-type').value;
    const followUpDate = formatDate(document.getElementById('follow-up-date').value);

    // Status is not in the form but we can infer it or default it
    const status = 'New';

    // Add new row to the leads table
    addLeadToTable(clientName, requestType, policyType, status, followUpDate);

    // Reset form and close modal
    addLeadForm.reset();
    addLeadModal.style.display = 'none';
  });

  // Handle update status form submission
  updateStatusForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const leadId = document.getElementById('select-lead').value;
    const newStatus = document.getElementById('new-status').value;

    // Update the status in the table
    updateLeadStatus(leadId, newStatus);

    // Reset form and close modal
    updateStatusForm.reset();
    updateStatusModal.style.display = 'none';
  });

  // Handle updates status modal open from reports
  const reportsUpdateStatusBtn = document.getElementById('reports-update-status-btn');
  if (reportsUpdateStatusBtn) {
    reportsUpdateStatusBtn.addEventListener('click', function () {
      // Populate leads dynamic from table
      const leadSelect = document.getElementById('select-lead');
      const tableRows = document.querySelectorAll('#csr-section-reports table tbody tr');

      leadSelect.innerHTML = '<option value="" selected disabled>Select a lead...</option>';

      tableRows.forEach((row, index) => {
        const clientName = row.querySelector('td:nth-child(1)').textContent;
        // value is the 1-based index to match updateLeadStatus logic
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = clientName;
        leadSelect.appendChild(option);
      });

      updateStatusModal.style.display = 'flex';
    });
  }

  // Handle dynamic status fields
  const statusSelect = document.getElementById('new-status');
  const allStatusFields = document.querySelectorAll('.status-fields');

  if (statusSelect) {
    statusSelect.addEventListener('change', function () {
      // Hide all first
      allStatusFields.forEach(el => el.classList.add('hidden'));

      const val = this.value;
      let targetId = '';

      if (val === 'Quoting in Progress') targetId = 'fields-quoting-in-progress';
      else if (val === 'Quote has been Emailed') targetId = 'fields-quote-emailed';
      else if (val === 'Consent Letter Sent') targetId = 'fields-consent-letter';
      else if (val === 'Completed') targetId = 'fields-completed';
      else if (val === 'Did not bind') targetId = 'fields-did-not-bind';

      if (targetId) {
        document.getElementById(targetId).classList.remove('hidden');
      }
    });
  }

  // Handle X-date calculation
  const renewalDateInput = document.getElementById('renewal-date-input');
  const xDateInput = document.getElementById('x-date-input');

  if (renewalDateInput && xDateInput) {
    renewalDateInput.addEventListener('change', function () {
      const date = new Date(this.value);
      if (!isNaN(date.getTime())) {
        date.setDate(date.getDate() - 60);
        xDateInput.value = date.toISOString().split('T')[0];
      }
    });
  }

  // Admin action buttons
  const adminActionModal = document.getElementById('admin-action-modal');
  const adminActionTitle = document.getElementById('admin-action-title');
  const adminActionMessage = document.getElementById('admin-action-message');

  document.querySelectorAll('#admin-dashboard .flex.justify-between.items-center .space-x-2 button').forEach(button => {
    button.addEventListener('click', function () {
      const action = button.textContent.trim();
      adminActionTitle.textContent = action;
      adminActionMessage.textContent = `The ${action} action was triggered successfully.`;
      adminActionModal.style.display = 'flex';
    });
  });

  document.querySelectorAll('.admin-modal-close').forEach(button => {
    button.addEventListener('click', () => {
      adminActionModal.style.display = 'none';
    });
  });

  // Superadmin action buttons
  const superadminActionModal = document.getElementById('superadmin-action-modal');
  const superadminActionTitle = document.getElementById('superadmin-action-title');
  const superadminActionMessage = document.getElementById('superadmin-action-message');

  document.querySelectorAll('#superadmin-dashboard .flex.justify-between.items-center .space-x-2 button').forEach(button => {
    button.addEventListener('click', function () {
      const action = button.textContent.trim();
      superadminActionTitle.textContent = action;
      superadminActionMessage.textContent = `You've accessed the ${action} functionality. This feature is coming soon.`;
      superadminActionModal.style.display = 'flex';
      console.log(`${action} button clicked in Super Admin dashboard`);
    });
  });

  document.querySelectorAll('.superadmin-modal-close').forEach(button => {
    button.addEventListener('click', () => {
      superadminActionModal.style.display = 'none';
    });
  });
});

// Function to handle logout
function handleLogout() {
  appContainer.style.display = 'none';
  loginContainer.style.display = 'flex';
  loginForm.reset();
  loginError.style.display = 'none';

  // Clean up charts
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  // Clear charts object
  for (const key in charts) {
    delete charts[key];
  }

  currentRole = "";
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Add new lead to table
function addLeadToTable(name, type, policy, status, followUpDate) {
  const tableBody = document.querySelector('#csr-section-reports table tbody');
  if (!tableBody) return;

  const statusClass = getStatusClass(status);

  const newRow = document.createElement('tr');
  newRow.className = 'hover:bg-gray-50';
  newRow.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap">${name}</td>
    <td class="px-6 py-4 whitespace-nowrap">${type}</td>
    <td class="px-6 py-4 whitespace-nowrap">${policy}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${status}</span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">${followUpDate}</td>
  `;

  tableBody.insertBefore(newRow, tableBody.firstChild);
}

// Get CSS class for status badge
function getStatusClass(status) {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800';
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Update lead status in table
function updateLeadStatus(leadId, newStatus) {
  // Target the Pipeline (Reports) table
  const tableRows = document.querySelectorAll('#csr-section-reports table tbody tr');
  if (tableRows.length < leadId) return;

  const row = tableRows[leadId - 1];
  const statusCell = row.querySelector('td:nth-child(4)');
  const statusBadge = statusCell.querySelector('span');

  // Update status text and class
  statusBadge.textContent = newStatus;
  statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(newStatus)}`;
}

// Update Dashboard internal view (Dashboard, Charts, Reports)
function updateDashboardView(role, view) {
  const sections = ['dashboard', 'charts', 'reports'];
  sections.forEach(s => {
    const el = document.getElementById(`${role}-section-${s}`);
    if (el) {
      if (s === view) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Resize charts if switching to charts view
  if (view === 'charts') {
    setTimeout(() => {
      Object.values(charts).forEach(chart => {
        if (chart) chart.resize();
      });
    }, 50);
  }
}

// Show appropriate dashboard based on role
function showDashboard(role) {
  // Destroy all charts first to prevent errors
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });

  csrDashboard.style.display = 'none';
  adminDashboard.style.display = 'none';
  superadminDashboard.style.display = 'none';
  document.getElementById('in-progress-section').style.display = 'none';

  // Hide pipeline navigation item by default
  const pipelineNav = document.getElementById('pipeline-nav');
  if (pipelineNav) {
    pipelineNav.classList.add('hidden');
  }

  // Hide commission navigation item by default
  const commissionNav = document.getElementById('commission-nav');
  if (commissionNav) {
    commissionNav.classList.add('hidden');
  }

  // Hide in-progress navigation item by default
  const inProgressNav = document.getElementById('in-progress-nav');
  if (inProgressNav) {
    inProgressNav.classList.add('hidden');
  }

  if (role === 'csr') {
    csrDashboard.style.display = 'block';
    updateDashboardView('csr', 'dashboard'); // Default view
  } else if (role === 'admin') {
    adminDashboard.style.display = 'block';
    updateDashboardView('admin', 'dashboard'); // Default view
    // Show in-progress navigation item only for admin
    if (inProgressNav) {
      inProgressNav.classList.remove('hidden');
    }
  } else if (role === 'superadmin') {
    superadminDashboard.style.display = 'block';
    updateDashboardView('superadmin', 'dashboard'); // Default view

    // Show pipeline navigation item only for superadmin
    if (pipelineNav) {
      pipelineNav.classList.remove('hidden');
    }

    // Show commission navigation item only for superadmin
    if (commissionNav) {
      commissionNav.classList.remove('hidden');
    }
  }
}

// Update date and time display
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  currentDateTime.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize all charts
function initCharts() {
  // CSR Follow-up Chart
  const csrCtx = document.getElementById('csr-followup-chart');
  if (csrCtx) {
    // Destroy existing chart if present
    if (charts['csr-followup-chart']) {
      charts['csr-followup-chart'].destroy();
    }
    charts['csr-followup-chart'] = new Chart(csrCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Completed',
          data: [12, 19, 8, 15, 10],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4
        }, {
          label: 'Pending',
          data: [5, 8, 12, 7, 9],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Admin Workflow Chart
  const adminCtx = document.getElementById('admin-workflow-chart');
  if (adminCtx) {
    // Destroy existing chart if present
    if (charts['admin-workflow-chart']) {
      charts['admin-workflow-chart'].destroy();
    }
    charts['admin-workflow-chart'] = new Chart(adminCtx, {
      type: 'pie',
      data: {
        labels: ['Complete', 'In Progress', 'Not Started'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#ef4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // Super Admin Charts
  // Revenue Chart
  const revenueCtx = document.getElementById('revenue-chart');
  if (revenueCtx) {
    // Destroy existing chart if present
    if (charts['revenue-chart']) {
      charts['revenue-chart'].destroy();
    }
    charts['revenue-chart'] = new Chart(revenueCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: [42, 49, 65, 58, 87, 92],
          backgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // SLA Chart
  const slaCtx = document.getElementById('sla-chart');
  if (slaCtx) {
    // Destroy existing chart if present
    if (charts['sla-chart']) {
      charts['sla-chart'].destroy();
    }
    charts['sla-chart'] = new Chart(slaCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'SLA Compliance',
          data: [92, 88, 95, 89, 94, 97],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  // Role Activity Chart
  const roleCtx = document.getElementById('role-activity-chart');
  if (roleCtx) {
    // Destroy existing chart if present
    if (charts['role-activity-chart']) {
      charts['role-activity-chart'].destroy();
    }
    charts['role-activity-chart'] = new Chart(roleCtx, {
      type: 'doughnut',
      data: {
        labels: ['Admin', 'Manager', 'CSR'],
        datasets: [{
          data: [25, 35, 40],
          backgroundColor: [
            '#3b82f6',
            '#8b5cf6',
            '#10b981'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}
