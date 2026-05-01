// Tasks page logic (Kanban board)
let projectId = null;
let projectMembers = [];
let userRole = 'Member';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupSidebar();
  const params = new URLSearchParams(window.location.search);
  projectId = params.get('project');
  if (!projectId) { window.location.href = '/projects.html'; return; }
  setupTaskModals();
  await loadProjectInfo();
  await loadTasks();
});

async function loadProjectInfo() {
  try {
    const data = await API.get(`/projects/${projectId}`);
    const p = data.data.project;
    document.getElementById('projectTitle').textContent = p.name;
    userRole = p.userRole;
    projectMembers = p.members;
    const createBtn = document.getElementById('createTaskBtn');
    if (createBtn) createBtn.style.display = userRole === 'Admin' ? 'inline-flex' : 'none';
    // Populate assignee select
    const sel = document.getElementById('taskAssignee');
    if (sel) {
      sel.innerHTML = '<option value="">Unassigned</option>' + p.members.map(m => `<option value="${m.user._id}">${m.user.name}</option>`).join('');
    }
    const editSel = document.getElementById('editTaskAssignee');
    if (editSel) {
      editSel.innerHTML = '<option value="">Unassigned</option>' + p.members.map(m => `<option value="${m.user._id}">${m.user.name}</option>`).join('');
    }
  } catch (err) { showToast(err.message, 'error'); }
}

function setupTaskModals() {
  document.getElementById('createTaskBtn')?.addEventListener('click', () => openModal('createTaskModal'));
  document.getElementById('createTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await API.post('/tasks', {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        project: projectId,
        assignedTo: document.getElementById('taskAssignee').value || null,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value || null,
      });
      closeModal('createTaskModal');
      e.target.reset();
      showToast('Task created!', 'success');
      await loadTasks();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('editTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('editTaskId').value;
    try {
      const body = userRole === 'Admin' ? {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDesc').value,
        assignedTo: document.getElementById('editTaskAssignee').value || null,
        status: document.getElementById('editTaskStatus').value,
        priority: document.getElementById('editTaskPriority').value,
        dueDate: document.getElementById('editTaskDueDate').value || null,
      } : { status: document.getElementById('editTaskStatus').value };
      await API.put(`/tasks/${taskId}`, body);
      closeModal('editTaskModal');
      showToast('Task updated!', 'success');
      await loadTasks();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function loadTasks() {
  try {
    const data = await API.get(`/tasks?project=${projectId}`);
    const tasks = data.data.tasks;
    renderKanban(tasks);
  } catch (err) { showToast(err.message, 'error'); }
}

function renderKanban(tasks) {
  const cols = { 'To Do': [], 'In Progress': [], 'Done': [] };
  tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

  ['To Do', 'In Progress', 'Done'].forEach(status => {
    const colId = status === 'To Do' ? 'todoTasks' : status === 'In Progress' ? 'progressTasks' : 'doneTasks';
    const countId = status === 'To Do' ? 'todoCount' : status === 'In Progress' ? 'progressCount' : 'doneCount';
    const container = document.getElementById(colId);
    const counter = document.getElementById(countId);
    if (counter) counter.textContent = cols[status].length;
    if (!container) return;

    if (cols[status].length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:0.85rem">No tasks</p>';
      return;
    }
    container.innerHTML = cols[status].map(t => {
      const due = t.dueDate ? formatDate(t.dueDate) : '';
      const od = t.status !== 'Done' && isOverdue(t.dueDate) ? 'overdue' : '';
      return `
        <div class="task-card fade-in" onclick="openEditTask('${t._id}')">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:4px">
            ${getPriorityBadge(t.priority)}
            ${userRole === 'Admin' ? `<button class="btn-icon" style="width:24px;height:24px;font-size:0.7rem" onclick="event.stopPropagation();deleteTask('${t._id}')" title="Delete">✕</button>` : ''}
          </div>
          <h4>${t.title}</h4>
          ${t.description ? `<p class="task-desc">${t.description}</p>` : ''}
          <div class="task-footer">
            <div class="task-assignee">
              ${t.assignedTo ? `<span class="avatar-sm">${getInitials(t.assignedTo.name)}</span><span>${t.assignedTo.name}</span>` : '<span style="color:var(--text-muted)">Unassigned</span>'}
            </div>
            ${due ? `<span class="task-due ${od}">📅 ${due}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  });
}

async function openEditTask(taskId) {
  try {
    const data = await API.get(`/tasks/${taskId}`);
    const t = data.data.task;
    document.getElementById('editTaskId').value = t._id;
    document.getElementById('editTaskTitle').value = t.title;
    document.getElementById('editTaskDesc').value = t.description || '';
    document.getElementById('editTaskStatus').value = t.status;
    document.getElementById('editTaskPriority').value = t.priority;
    document.getElementById('editTaskDueDate').value = t.dueDate ? t.dueDate.slice(0, 10) : '';
    if (t.assignedTo) document.getElementById('editTaskAssignee').value = t.assignedTo._id;
    else document.getElementById('editTaskAssignee').value = '';

    // Member restrictions: hide fields they can't edit
    const adminFields = document.querySelectorAll('.admin-only-field');
    adminFields.forEach(f => f.style.display = userRole === 'Admin' ? 'block' : 'none');
    openModal('editTaskModal');
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    await API.delete(`/tasks/${taskId}`);
    showToast('Task deleted', 'success');
    await loadTasks();
  } catch (err) { showToast(err.message, 'error'); }
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
