// User credentials
const users = {
  "csr@gmail.com": { password: "csr", role: "csr", name: "John Smith", initials: "JS" },
  "admin@gmail.com": { password: "admin", role: "admin", name: "Amanda Lee", initials: "AL" },
  "superadmin@gmail.com": { password: "superadmin", role: "superadmin", name: "Robert Chen", initials: "RC" }
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
document.addEventListener('DOMContentLoaded', function() {
  // Show login screen by default
  loginContainer.style.display = 'flex';
  
  // Handle login form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Check credentials
    if (users[email] && users[email].password === password && users[email].role === role) {
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
      loginError.textContent = 'Invalid email, password or role';
      loginError.style.display = 'block';
    }
  });
  
  // Handle logout (update to include header logout button)
  logoutBtn.addEventListener('click', handleLogout);

  // Add event listener for the new header logout button
  const headerLogoutBtn = document.getElementById('header-logout-btn');
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', handleLogout);
  }
  
  // Handle profile dropdown
  profileMenuBtn.addEventListener('click', function() {
    profileDropdown.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });
  
  // Toggle sidebar on mobile
  sidebarToggle.addEventListener('click', function() {
    document.querySelector('aside').classList.toggle('hidden');
  });
  
  // Update date and time
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Handle sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Handle navigation based on data-section
      const section = this.getAttribute('data-section');
      if (section === 'dashboard') {
        // Just show the dashboard, no scrolling needed
        document.getElementById('pipeline-section')?.classList.add('hidden');
        document.getElementById('commission-section')?.classList.add('hidden');
        document.getElementById('in-progress-section').style.display = 'none';
        
        // Show the appropriate dashboard based on role
        if (currentRole === 'admin') {
          adminDashboard.style.display = 'block';
        }
      } else if (section === 'charts') {
        // Scroll to charts section based on current role
        document.getElementById('pipeline-section')?.classList.add('hidden');
        document.getElementById('commission-section')?.classList.add('hidden');
        document.getElementById('in-progress-section').style.display = 'none';
        
        // Show the appropriate dashboard based on role
        if (currentRole === 'admin') {
          adminDashboard.style.display = 'block';
        }
        
        scrollToCharts();
      } else if (section === 'reports') {
        // Scroll to reports/table section based on current role
        document.getElementById('pipeline-section')?.classList.add('hidden');
        document.getElementById('commission-section')?.classList.add('hidden');
        document.getElementById('in-progress-section').style.display = 'none';
        
        // Show the appropriate dashboard based on role
        if (currentRole === 'admin') {
          adminDashboard.style.display = 'block';
        }
        
        scrollToReports();
      } else if (section === 'in-progress' && currentRole === 'admin') {
        // Show in-progress section, hide admin dashboard
        adminDashboard.style.display = 'none';
        document.getElementById('in-progress-section').style.display = 'block';
      } else if (section === 'pipeline' && currentRole === 'superadmin') {
        
        // Show the pipeline section, hide commission section
        document.getElementById('pipeline-section')?.classList.remove('hidden');
        document.getElementById('commission-section')?.classList.add('hidden');
      } else if (section === 'commission' && currentRole === 'superadmin') {
        // Show the commission section, hide pipeline section
        document.getElementById('commission-section')?.classList.remove('hidden');
        document.getElementById('pipeline-section')?.classList.add('hidden');
        // Scroll to commission table
        const commissionTable = document.querySelector('#commission-section table');
        if (commissionTable) {
          commissionTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  addLeadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const clientName = document.getElementById('client-name').value;
    const source = document.getElementById('lead-source').value;
    const amount = document.getElementById('quote-amount').value;
    const status = document.getElementById('lead-status').value;
    const dueDate = formatDate(document.getElementById('due-date').value);
    
    // Add new row to the leads table
    addLeadToTable(clientName, source, amount, status, dueDate);
    
    // Reset form and close modal
    addLeadForm.reset();
    addLeadModal.style.display = 'none';
  });
  
  // Handle update status form submission
  updateStatusForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const leadId = document.getElementById('select-lead').value;
    const newStatus = document.getElementById('new-status').value;
    
    // Update the status in the table
    updateLeadStatus(leadId, newStatus);
    
    // Reset form and close modal
    updateStatusForm.reset();
    updateStatusModal.style.display = 'none';
  });
  
  // Admin action buttons
  const adminActionModal = document.getElementById('admin-action-modal');
  const adminActionTitle = document.getElementById('admin-action-title');
  const adminActionMessage = document.getElementById('admin-action-message');
  
  document.querySelectorAll('#admin-dashboard .flex.justify-between.items-center .space-x-2 button').forEach(button => {
    button.addEventListener('click', function() {
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
    button.addEventListener('click', function() {
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
function addLeadToTable(name, source, amount, status, dueDate) {
  const tableBody = document.querySelector('#csr-dashboard table tbody');
  if (!tableBody) return;
  
  const statusClass = getStatusClass(status);
  
  const newRow = document.createElement('tr');
  newRow.className = 'hover:bg-gray-50';
  newRow.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap">${name}</td>
    <td class="px-6 py-4 whitespace-nowrap">${source}</td>
    <td class="px-6 py-4 whitespace-nowrap">$${amount}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${status}</span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">${dueDate}</td>
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
  const tableRows = document.querySelectorAll('#csr-dashboard table tbody tr');
  if (tableRows.length < leadId) return;
  
  const row = tableRows[leadId - 1];
  const statusCell = row.querySelector('td:nth-child(4)');
  const statusBadge = statusCell.querySelector('span');
  
  // Update status text and class
  statusBadge.textContent = newStatus;
  statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(newStatus)}`;
}

// Scroll to charts section based on current role
function scrollToCharts() {
  let chartElement;
  
  if (currentRole === 'csr') {
    chartElement = document.getElementById('csr-followup-chart');
  } else if (currentRole === 'admin') {
    chartElement = document.getElementById('admin-workflow-chart');
  } else if (currentRole === 'superadmin') {
    chartElement = document.getElementById('revenue-chart');
  }
  
  if (chartElement) {
    chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Scroll to reports/table section based on current role
function scrollToReports() {
  let tableElement;
  
  if (currentRole === 'csr') {
    tableElement = document.querySelector('#csr-dashboard table');
  } else if (currentRole === 'admin') {
    tableElement = document.querySelector('#admin-dashboard table');
  } else if (currentRole === 'superadmin') {
    tableElement = document.querySelector('#superadmin-dashboard table');
  }
  
  if (tableElement) {
    tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  } else if (role === 'admin') {
    adminDashboard.style.display = 'block';
    // Show in-progress navigation item only for admin
    if (inProgressNav) {
      inProgressNav.classList.remove('hidden');
    }
  } else if (role === 'superadmin') {
    superadminDashboard.style.display = 'block';
    
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
