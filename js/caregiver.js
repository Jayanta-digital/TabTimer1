// Caregiver Dashboard Module
async function initializeCaregiverDashboard() {
  await loadDashboardStats();
  await loadPatients();
  await loadMedicines();
  await loadRecentActivity();
  setupEventListeners();
}

async function loadDashboardStats() {
  const currentUser = AuthUtils.getCurrentUser();
  if (!currentUser) return;

  document.getElementById('totalPatients').textContent = '0';
  document.getElementById('activeMedicines').textContent = '0';
  document.getElementById('todayReminders').textContent = '0';
  document.getElementById('adherenceRate').textContent = '0%';
}

async function loadPatients() {
  const patientList = document.getElementById('patientList');
  if (!patientList) return;

  patientList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3 class="empty-state-title">No Patients Yet</h3></div>';
}

async function loadMedicines() {
  const medicinesList = document.getElementById('medicinesList');
  if (!medicinesList) return;

  medicinesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💊</div><h3 class="empty-state-title">No Medicines Yet</h3></div>';
}

async function loadRecentActivity() {
  const activityFeed = document.getElementById('activityFeed');
  if (!activityFeed) return;

  activityFeed.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No recent activity</p>';
}

function setupEventListeners() {
  document.querySelectorAll('[id^="addPatient"]').forEach(btn => {
    btn?.addEventListener('click', () => toast.info('Add patient feature coming soon!'));
  });
  
  document.querySelectorAll('[id^="addMedicine"]').forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'app-medicine.html');
  });
}
