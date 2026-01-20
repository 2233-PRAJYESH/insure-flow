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
    const sidebar = document.getElementById('main-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
    // small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
      backdrop.classList.toggle('opacity-0');
    }, 10);
  });

  // Close sidebar when clicking backdrop
  document.getElementById('sidebar-backdrop').addEventListener('click', function () {
    const sidebar = document.getElementById('main-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('opacity-0');
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 300);
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

      // Close mobile sidebar if open
      if (window.innerWidth < 768) {
        const sidebar = document.getElementById('main-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (!sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
          backdrop.classList.add('opacity-0');
          setTimeout(() => {
            backdrop.classList.add('hidden');
          }, 300);
        }
      }

      const section = this.getAttribute('data-section');

      // Hide special full-page sections by default
      const pipelineSection = document.getElementById('pipeline-section');
      const commissionSection = document.getElementById('commission-section');
      const inProgressSection = document.getElementById('in-progress-section');
      const renewalSection = document.getElementById('renewal-pipeline-section');

      if (pipelineSection) pipelineSection.classList.add('hidden');
      if (commissionSection) commissionSection.classList.add('hidden');
      if (inProgressSection) inProgressSection.style.display = 'none';
      if (renewalSection) {
        renewalSection.classList.add('hidden');
        renewalSection.style.display = 'none';
      }

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
      } else if (section === 'renewal-pipeline') {
        // Hide all dashboard containers
        csrDashboard.style.display = 'none';
        adminDashboard.style.display = 'none';
        superadminDashboard.style.display = 'none';

        if (renewalSection) {
          console.log("Showing Renewal Pipeline Section");
          renewalSection.classList.remove('hidden');
          renewalSection.style.display = 'block'; // Force display

          // Use setTimeout to ensure functions are loaded
          setTimeout(() => {
            try {
              if (typeof renderRenewalTable === 'function' && typeof getFilteredAndSortedPolicies === 'function') {
                renderRenewalTable(getFilteredAndSortedPolicies());
              } else {
                console.error("Renewal pipeline functions not found");
              }
            } catch (error) {
              console.error("Error rendering renewal table:", error);
            }
          }, 100);
        } else {
          console.error("Renewal Pipeline Section NOT FOUND");
        }
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

  // Initialize Renewal Pipeline
  initRenewalPipeline();
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
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Quoting in Progress':
    case 'Consent Letter Sent':
    case 'Quote Has been Emailed':
      return 'bg-purple-100 text-purple-800';
    case 'Completed (Same)':
    case 'Completed (Switch)':
      return 'bg-green-100 text-green-800';
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

// --- Renewal Pipeline Logic (Consolidated) ---

// Data definition
let renewalPolicies = [
  { id: 1, name: 'Client 1', policyNum: 'POL-2025-001', type: 'Home', renewalDate: '2026-02-15', carrier: 'Progressive', premium: '$1,200', renewalPremium: '$1,350', csr: 'CSR 1', referral: 'Website', status: 'Active', notes: 'Client requested coverage review.' },
  { id: 2, name: 'Client 2', policyNum: 'POL-2025-002', type: 'Auto', renewalDate: '2026-03-10', carrier: 'Geico', premium: '$850', renewalPremium: '$900', csr: 'CSR 2', referral: 'Email Campaign', status: 'New', notes: 'Sent intro email.' },
  { id: 3, name: 'Client 3', policyNum: 'POL-2025-003', type: 'Condo', renewalDate: '2026-01-20', carrier: 'State Farm', premium: '$600', renewalPremium: '$650', csr: 'CSR 3', referral: 'Cold Call', status: 'Overdue', notes: 'Called twice, no answer.' },
  { id: 4, name: 'Client 4', policyNum: 'POL-2025-004', type: 'Motorcycle', renewalDate: '2026-04-05', carrier: 'Allstate', premium: '$450', renewalPremium: '$480', csr: 'CSR 4', referral: 'Partner', status: 'Completed (Same)', notes: 'Renewal processed.' },
  { id: 5, name: 'Client 5', policyNum: 'POL-2025-005', type: 'Umbrella', renewalDate: '2026-02-28', carrier: 'Liberty Mutual', premium: '$300', renewalPremium: '$320', csr: 'CSR 5', referral: 'Client Ref', status: 'Quoting in Progress', notes: 'Waiting on quotes from Travelers.' },
  { id: 6, name: 'Client 6', policyNum: 'POL-2025-006', type: 'Landlord Home/Condo', renewalDate: '2026-05-12', carrier: 'Chubb', premium: '$2,500', renewalPremium: '$2,700', csr: 'CSR 1', referral: 'Agent', status: 'Consent Letter Sent', notes: 'Consent received via email.' }
];

let currentFilters = {
  month: 'all',
  csr: 'all',
  type: 'all',
  sort: 'renewalDate-asc'
};

function initRenewalPipeline() {
  console.log('Initializing Renewal Pipeline...');
  const tableBody = document.querySelector('#renewal-table-body');
  const monthFilter = document.getElementById('renewal-month-filter');
  const csrFilter = document.getElementById('renewal-csr-filter');
  const typeFilter = document.getElementById('renewal-type-filter');
  const sortSelect = document.getElementById('renewal-sort');
  const importBtn = document.getElementById('import-csv-btn');
  const addPolicyBtn = document.getElementById('add-renewal-policy-btn');

  if (typeof renewalPolicies === 'undefined') {
    console.error('renewalPolicies is undefined!');
    return;
  }

  if (!tableBody) {
    console.error('Renewal Table Body not found!');
    return;
  }

  // Initial Render
  renderRenewalTable(getFilteredAndSortedPolicies());

  /* Update Button & Select Logic */
  const populatePolicySelect = () => {
    const select = document.getElementById('renewal-policy-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select a Lead...</option>';
    renewalPolicies.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} - ${p.policyNum}`;
      select.appendChild(option);
    });
  };

  if (addPolicyBtn) {
    addPolicyBtn.addEventListener('click', () => {
      populatePolicySelect();
      const modal = document.getElementById('renewal-stage-modal');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.getElementById('renewal-stage-form').reset();
      document.querySelectorAll('.renewal-fields').forEach(el => el.classList.add('hidden'));
    });
  }

  const policySelect = document.getElementById('renewal-policy-select');
  if (policySelect) {
    policySelect.addEventListener('change', (e) => {
      if (e.target.value) {
        openRenewalModal(e.target.value);
      } else {
        document.getElementById('renewal-stage-form').reset();
        document.querySelectorAll('.renewal-fields').forEach(el => el.classList.add('hidden'));
      }
    });
  }

  // Filter Listeners
  if (monthFilter) {
    // Cloning to remove old listeners if re-initialized
    const newMonthFilter = monthFilter.cloneNode(true);
    monthFilter.parentNode.replaceChild(newMonthFilter, monthFilter);
    newMonthFilter.addEventListener('change', (e) => {
      currentFilters.month = e.target.value;
      renderRenewalTable(getFilteredAndSortedPolicies());
    });
  }

  if (csrFilter) {
    const newCsrFilter = csrFilter.cloneNode(true);
    csrFilter.parentNode.replaceChild(newCsrFilter, csrFilter);
    newCsrFilter.addEventListener('change', (e) => {
      currentFilters.csr = e.target.value;
      renderRenewalTable(getFilteredAndSortedPolicies());
    });
  }

  if (typeFilter) {
    const newTypeFilter = typeFilter.cloneNode(true);
    typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
    newTypeFilter.addEventListener('change', (e) => {
      currentFilters.type = e.target.value;
      renderRenewalTable(getFilteredAndSortedPolicies());
    });
  }

  if (sortSelect) {
    const newSortFilter = sortSelect.cloneNode(true);
    sortSelect.parentNode.replaceChild(newSortFilter, sortSelect);
    newSortFilter.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      renderRenewalTable(getFilteredAndSortedPolicies());
    });
  }

  if (importBtn) {
    // Avoid duplicate listeners
    const newImportBtn = importBtn.cloneNode(true);
    importBtn.parentNode.replaceChild(newImportBtn, importBtn);
    newImportBtn.addEventListener('click', () => {
      const modal = document.getElementById('csv-import-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
      }
    });
  }

  setupRenewalModal();
  setupCSVImportModal();
}

function getFilteredAndSortedPolicies() {
  let filtered = [...renewalPolicies];

  if (currentFilters.month !== 'all') {
    filtered = filtered.filter(p => {
      const d = new Date(p.renewalDate);
      return d.getMonth() === parseInt(currentFilters.month);
    });
  }

  if (currentFilters.csr !== 'all') {
    filtered = filtered.filter(p => p.csr === currentFilters.csr);
  }

  if (currentFilters.type !== 'all') {
    filtered = filtered.filter(p => p.type === currentFilters.type);
  }

  const [sortField, sortDir] = currentFilters.sort.split('-');
  filtered.sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'renewalDate') {
      aVal = new Date(a.renewalDate);
      bVal = new Date(b.renewalDate);
    } else if (sortField === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortField === 'premium') {
      aVal = parseFloat(a.renewalPremium.replace(/[$,]/g, ''));
      bVal = parseFloat(b.renewalPremium.replace(/[$,]/g, ''));
    }

    if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
    else return aVal < bVal ? 1 : -1;
  });

  return filtered;
}

function renderRenewalTable(policies) {
  const tableBody = document.querySelector('#renewal-table-body');
  const emptyState = document.getElementById('renewal-empty-state');
  const countSpan = document.getElementById('renewal-count');

  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (countSpan) countSpan.textContent = policies.length;

  if (policies.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  policies.forEach(policy => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 transition-colors';

    const renewalDate = new Date(policy.renewalDate);
    const xDate = new Date(renewalDate);
    xDate.setDate(xDate.getDate() - 60);

    // Use global formatDate and getStatusClass from script.js
    row.innerHTML = `
        <td class='px-6 py-4 whitespace-nowrap'>
          <div class='flex items-center'>
            <div class='flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold'>
              ${policy.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div class='ml-3'>
              <div class='text-sm font-medium text-gray-900'>${policy.name}</div>
            </div>
          </div>
        </td>
        <td class='px-6 py-4 whitespace-nowrap'>
          <span class='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-blue-100 text-blue-800'>
            ${policy.type}
          </span>
        </td>
        <td class='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
          <div class='flex flex-col'>
            <span class='font-medium'>${formatDate(policy.renewalDate)}</span>
            <span class='text-xs text-gray-500'>X-Date: ${formatDate(xDate.toISOString().split('T')[0])}</span>
          </div>
        </td>
        <td class='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>${policy.carrier}</td>
        <td class='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600'>${policy.policyNum}</td>
        <td class='px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900'>${policy.premium}</td>
        <td class='px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary'>${policy.renewalPremium}</td>
        <td class='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
          <div class='flex items-center'>
            <i class='fas fa-user-circle text-gray-400 mr-2'></i>
            ${policy.csr}
          </div>
        </td>
        <td class='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>${policy.referral}</td>
        <td class='px-6 py-4 whitespace-nowrap'>
           <span class='px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(policy.status)}'>${policy.status}</span>
        </td>
        <td class='px-6 py-4 text-sm text-gray-500 max-w-xs'>
          <div class='truncate' title='${policy.notes || ''}'>${policy.notes || '-'}</div>
        </td>
      `;
    tableBody.appendChild(row);
  });


}

function openRenewalModal(id) {
  const modal = document.getElementById('renewal-stage-modal');
  const policy = renewalPolicies.find(p => p.id == id);
  if (!policy) return;

  /* Auto-fill X-Date for Cancelled section */
  if (policy.renewalDate) {
    const rDate = new Date(policy.renewalDate);
    const xDate = new Date(rDate);
    xDate.setDate(rDate.getDate() - 60);
    const xDateInput = document.getElementById('cancelled-x-date');
    if (xDateInput) xDateInput.value = xDate.toISOString().split('T')[0];
  }

  document.getElementById('renewal-stage-form').reset();
  document.getElementById('renewal-policy-id').value = id;

  // Set Select Value
  const pSelect = document.getElementById('renewal-policy-select');
  if (pSelect) pSelect.value = id;

  document.querySelectorAll('.renewal-fields').forEach(el => el.classList.add('hidden'));

  const stageSelect = document.getElementById('renewal-new-stage');
  if (Array.from(stageSelect.options).some(option => option.value === policy.status)) {
    stageSelect.value = policy.status;
    stageSelect.dispatchEvent(new Event('change'));
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function setupRenewalModal() {
  const modal = document.getElementById('renewal-stage-modal');
  let form = document.getElementById('renewal-stage-form');

  if (!form) return;

  // Clone form to clear previous listeners (avoid duplicates on re-init)
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  form = newForm;

  // 1. Cancel/Close Button Listener
  const cancelBtn = form.querySelector('.cancel-renewal-modal');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    });
  }

  // 2. Stage Select Change Listener
  const stageSelect = document.getElementById('renewal-new-stage');
  const allFields = document.querySelectorAll('.renewal-fields');

  if (stageSelect) {
    stageSelect.addEventListener('change', function () {
      allFields.forEach(el => el.classList.add('hidden'));
      const val = this.value;
      let targetId = '';
      if (val === 'Quoting in Progress') targetId = 'renewal-fields-quoting';
      else if (val === 'Same Declaration Emailed') targetId = 'renewal-fields-same-decl';
      else if (val === 'Completed (Same)') targetId = 'renewal-fields-completed-same';
      else if (val === 'Quote Has been Emailed') targetId = 'renewal-fields-quote-emailed';
      else if (val === 'Consent Letter Sent') targetId = 'renewal-fields-consent';
      else if (val === 'Completed (Switch)') targetId = 'renewal-fields-completed-switch';
      else if (val === 'Cancelled') targetId = 'renewal-fields-cancelled';

      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.remove('hidden');
      }
    });
  }

  // 3. Form Submit Listener
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('renewal-policy-id').value;
    const currentStageSelect = document.getElementById('renewal-new-stage');
    const newStage = currentStageSelect.value;
    const policy = renewalPolicies.find(p => p.id == id);

    if (policy) {
      policy.status = newStage;

      // Capture Notes and Fields
      let notesId = '';
      if (newStage === 'Quoting in Progress') notesId = 'quoting-notes';
      else if (newStage === 'Same Declaration Emailed') notesId = 'same-decl-notes';
      else if (newStage === 'Completed (Same)') notesId = 'completed-same-notes';
      else if (newStage === 'Quote Has been Emailed') {
        notesId = 'quote-notes';
        const carrier = document.getElementById('quote-carrier');
        const premium = document.getElementById('quote-premium');
        if (carrier && carrier.value) policy.carrier = carrier.value;
        if (premium && premium.value) policy.renewalPremium = premium.value;
      }
      else if (newStage === 'Consent Letter Sent') notesId = 'consent-notes';
      else if (newStage === 'Completed (Switch)') {
        notesId = 'switch-notes';
        const bound = document.getElementById('switch-bound-premium');
        if (bound && bound.value) policy.renewalPremium = bound.value;
      }
      else if (newStage === 'Cancelled') notesId = 'cancelled-notes';

      if (notesId) {
        const notesInput = document.getElementById(notesId);
        if (notesInput) {
          policy.notes = notesInput.value;
        }
      }

      renderRenewalTable(getFilteredAndSortedPolicies());
    }
    modal.style.display = 'none';
    modal.classList.add('hidden');
    form.reset();
    allFields.forEach(el => el.classList.add('hidden'));
  });
}

function setupCSVImportModal() {
  const modal = document.getElementById('csv-import-modal');
  const closeBtns = document.querySelectorAll('.cancel-csv-modal');
  const fileInput = document.getElementById('csv-file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  const fileName = document.getElementById('file-name');
  const processBtn = document.getElementById('process-csv-btn');
  const fieldMapping = document.getElementById('field-mapping-preview');

  closeBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    });
  });

  if (fileInput) {
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    newFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = file.name;
        fileNameDisplay.classList.remove('hidden');
        fieldMapping.classList.remove('hidden');
        processBtn.disabled = false;
      }
    });
  }

  if (processBtn) {
    const newProcessBtn = processBtn.cloneNode(true);
    processBtn.parentNode.replaceChild(newProcessBtn, processBtn);
    newProcessBtn.addEventListener('click', () => {
      const newPolicies = [
        { id: renewalPolicies.length + 1, name: 'Michael Scott', policyNum: 'POL-2025-007', type: 'Home', renewalDate: '2026-06-15', carrier: 'Nationwide', premium: '$1,800', renewalPremium: '$1,950', csr: 'Maria Garcia', referral: 'CSV Import', status: 'New', notes: 'Imported from EZLynx' },
        { id: renewalPolicies.length + 2, name: 'Pam Beesly', policyNum: 'POL-2025-008', type: 'Auto', renewalDate: '2026-07-20', carrier: 'Progressive', premium: '$950', renewalPremium: '$1,000', csr: 'John Smith', referral: 'CSV Import', status: 'New', notes: 'Imported from EZLynx' }
      ];
      renewalPolicies = [...renewalPolicies, ...newPolicies];
      renderRenewalTable(getFilteredAndSortedPolicies());

      modal.style.display = 'none';
      modal.classList.add('hidden');
      alert('Successfully imported policies!');
    });
  }
}
