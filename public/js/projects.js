// Projects page logic
let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupSidebar();
  setupProjectModals();
  await loadProjects();
});

function setupProjectModals() {
  // Create project modal
  document.getElementById('createProjectBtn')?.addEventListener('click', () => openModal('createProjectModal'));
  document.getElementById('createProjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await API.post('/projects', {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDesc').value,
      });
      closeModal('createProjectModal');
      e.target.reset();
      showToast('Project created!', 'success');
      await loadProjects();
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Add member form
  document.getElementById('addMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProject) return;
    try {
      await API.post(`/projects/${currentProject}/members`, {
        email: document.getElementById('memberEmail').value,
        role: document.getElementById('memberRole').value,
      });
      document.getElementById('memberEmail').value = '';
      showToast('Member added!', 'success');
      await loadProjectDetail(currentProject);
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  try {
    const data = await API.get('/projects');
    const projects = data.data.projects;
    if (projects.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">📁</div><h3>No projects yet</h3><p>Create your first project to get started</p></div>`;
      return;
    }
    grid.innerHTML = projects.map(p => {
      const progress = p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
      return `
        <div class="project-card fade-in" onclick="openProjectDetail('${p._id}')">
          <h3>${p.name}</h3>
          <p class="desc">${p.description || 'No description'}</p>
          <div class="project-meta">
            <span>👥 ${p.members.length} member${p.members.length !== 1 ? 's' : ''}</span>
            <span>📋 ${p.taskCount} task${p.taskCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="project-progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
            <div class="progress-text">${progress}% complete</div>
          </div>
        </div>`;
    }).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function openProjectDetail(id) {
  currentProject = id;
  await loadProjectDetail(id);
  openModal('projectDetailModal');
}

async function loadProjectDetail(id) {
  try {
    const data = await API.get(`/projects/${id}`);
    const p = data.data.project;
    document.getElementById('detailProjectName').textContent = p.name;
    document.getElementById('detailProjectDesc').textContent = p.description || 'No description';

    const isAdmin = p.userRole === 'Admin';
    const adminSection = document.getElementById('adminSection');
    if (adminSection) adminSection.style.display = isAdmin ? 'block' : 'none';

    // Members list
    const membersList = document.getElementById('membersList');
    if (membersList) {
      membersList.innerHTML = p.members.map(m => `
        <div class="member-item">
          <div class="user-avatar">${getInitials(m.user.name)}</div>
          <div class="member-info">
            <div class="name">${m.user.name}</div>
            <div class="email">${m.user.email}</div>
          </div>
          ${getRoleBadge(m.role)}
          ${isAdmin && m.user._id !== API.getUser().id ? `<button class="btn-icon" onclick="removeMember('${id}','${m.user._id}')" title="Remove">✕</button>` : ''}
        </div>`).join('');
    }

    // Action buttons
    const viewTasksBtn = document.getElementById('viewTasksBtn');
    if (viewTasksBtn) viewTasksBtn.onclick = () => { window.location.href = `/tasks.html?project=${id}`; };
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    if (deleteProjectBtn) {
      deleteProjectBtn.style.display = isAdmin ? 'inline-flex' : 'none';
      deleteProjectBtn.onclick = () => deleteProject(id);
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeMember(projectId, userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await API.delete(`/projects/${projectId}/members/${userId}`);
    showToast('Member removed', 'success');
    await loadProjectDetail(projectId);
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteProject(id) {
  if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
  try {
    await API.delete(`/projects/${id}`);
    closeModal('projectDetailModal');
    showToast('Project deleted', 'success');
    await loadProjects();
  } catch (err) { showToast(err.message, 'error'); }
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}
