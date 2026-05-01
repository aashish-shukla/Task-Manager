// Toast notification system & shared utilities
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() ;
}

function getStatusBadge(status) {
  const map = { 'To Do': 'badge-todo', 'In Progress': 'badge-progress', 'Done': 'badge-done' };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function getPriorityBadge(priority) {
  const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return `<span class="badge ${map[priority] || ''}">${priority}</span>`;
}

function getRoleBadge(role) {
  const map = { 'Admin': 'badge-admin', 'Member': 'badge-member' };
  return `<span class="badge ${map[role] || ''}">${role}</span>`;
}

// Auth guard
function requireAuth() {
  if (!API.getToken()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Setup sidebar user info & logout
function setupSidebar() {
  const user = API.getUser();
  if (user) {
    const avatar = document.getElementById('sidebarAvatar');
    const name = document.getElementById('sidebarName');
    const email = document.getElementById('sidebarEmail');
    if (avatar) avatar.textContent = getInitials(user.name);
    if (name) name.textContent = user.name;
    if (email) email.textContent = user.email;
  }
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.removeToken();
      window.location.href = '/index.html';
    });
  }
  // Active nav
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === currentPage || item.getAttribute('href') === '/' + currentPage) {
      item.classList.add('active');
    }
  });
  // Mobile toggle
  const toggle = document.getElementById('mobileToggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('open');
    });
  }
}
