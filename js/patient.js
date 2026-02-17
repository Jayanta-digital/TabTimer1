// Patient Dashboard Module
async function initializePatientDashboard() {
  await loadTodaysSummary();
  await loadMedicineTimeline();
  await loadAllMedicines();
  setupPatientEventListeners();
}

async function loadTodaysSummary() {
  const currentUser = AuthUtils.getCurrentUser();
  if (!currentUser) return;

  document.getElementById('takenCount').textContent = '0';
  document.getElementById('totalCount').textContent = '0';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('summaryText').textContent = 'No medicines for today';
}

async function loadMedicineTimeline() {
  const timeline = document.getElementById('medicineTimeline');
  if (!timeline) return;

  timeline.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No medicines scheduled for today</p>';
}

async function loadAllMedicines() {
  const grid = document.getElementById('medicinesGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💊</div><h3 class="empty-state-title">No Medicines Yet</h3></div>';
}

function setupPatientEventListeners() {
  window.addEventListener('dashboardRefresh', () => {
    initializePatientDashboard();
  });
}
