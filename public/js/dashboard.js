// Dashboard page logic
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupSidebar();
  await loadDashboard();
});

async function loadDashboard() {
  try {
    const data = await API.get('/dashboard/stats');
    const s = data.data;
    
    // Stat cards
    document.getElementById('totalTasks').textContent = s.totalTasks;
    document.getElementById('inProgressCount').textContent = s.byStatus['In Progress'] || 0;
    document.getElementById('completedCount').textContent = s.byStatus['Done'] || 0;
    document.getElementById('overdueCount').textContent = s.overdueTasks.length;
    document.getElementById('projectCount').textContent = s.projectCount;

    // Status chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['To Do', 'In Progress', 'Done'],
          datasets: [{
            data: [s.byStatus['To Do'], s.byStatus['In Progress'], s.byStatus['Done']],
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
            borderWidth: 0, borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { family: 'Inter' } } } },
          cutout: '65%',
        },
      });
    }

    // Tasks by user chart
    const userCtx = document.getElementById('userChart');
    if (userCtx && s.tasksByUser.length > 0) {
      new Chart(userCtx, {
        type: 'bar',
        data: {
          labels: s.tasksByUser.map(u => u.name),
          datasets: [{
            label: 'Tasks',
            data: s.tasksByUser.map(u => u.count),
            backgroundColor: 'rgba(139,92,246,0.6)',
            borderColor: '#8b5cf6',
            borderWidth: 1, borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          },
        },
      });
    }

    // Overdue tasks list
    const overdueList = document.getElementById('overdueList');
    if (overdueList) {
      if (s.overdueTasks.length === 0) {
        overdueList.innerHTML = '<p class="empty-state" style="padding:20px"><span class="icon">✅</span><br>No overdue tasks!</p>';
      } else {
        overdueList.innerHTML = s.overdueTasks.map(t => `
          <div class="task-card fade-in">
            <h4>${t.title}</h4>
            <div class="task-footer">
              <span class="task-due overdue">📅 Due: ${formatDate(t.dueDate)}</span>
              <span class="task-assignee">${t.assignedTo ? t.assignedTo.name : 'Unassigned'}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Recent tasks
    const recentList = document.getElementById('recentList');
    if (recentList) {
      if (s.recentTasks.length === 0) {
        recentList.innerHTML = '<p class="empty-state" style="padding:20px">No recent tasks yet.</p>';
      } else {
        recentList.innerHTML = s.recentTasks.map(t => `
          <div class="task-card fade-in" style="margin-bottom:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <h4 style="margin:0;font-size:0.85rem">${t.title}</h4>
              <div style="display:flex;gap:6px">${getStatusBadge(t.status)} ${getPriorityBadge(t.priority)}</div>
            </div>
            <div class="task-footer" style="margin-top:8px">
              <span style="font-size:0.75rem;color:var(--text-muted)">${t.project ? t.project.name : ''}</span>
              <span class="task-assignee">${t.assignedTo ? t.assignedTo.name : 'Unassigned'}</span>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}
