// Caregiver Dashboard Module - Full Supabase Integration

let supabaseClient = null;
let currentCaregiver = null;
let allPatients = [];
let allMedicines = [];

// ─── INIT ────────────────────────────────────────────────────────────────────

async function initializeCaregiverDashboard() {
  supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  currentCaregiver = AuthUtils.getCurrentUser();
  if (!currentCaregiver) return;

  setupEventListeners();
  await loadDashboardStats();
  await loadPatients();
  await loadMedicines();
  await loadRecentActivity();
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

async function loadDashboardStats() {
  try {
    const { data: patients } = await supabaseClient
      .from('users')
      .select('id')
      .eq('caregiver_id', currentCaregiver.id)
      .eq('role', 'patient');

    const patientIds = (patients || []).map(p => p.id);
    document.getElementById('totalPatients').textContent = patientIds.length;

    if (patientIds.length === 0) {
      document.getElementById('activeMedicines').textContent = '0';
      document.getElementById('todayReminders').textContent = '0';
      document.getElementById('adherenceRate').textContent = '0%';
      return;
    }

    const { data: medicines } = await supabaseClient
      .from('medicines')
      .select('id, time')
      .eq('caregiver_id', currentCaregiver.id)
      .eq('status', 'ACTIVE');

    document.getElementById('activeMedicines').textContent = (medicines || []).length;

    const now = new Date();
    const todayMeds = (medicines || []).filter(m => {
      if (!m.time) return false;
      const [h, min] = m.time.split(':');
      const medTime = new Date();
      medTime.setHours(parseInt(h), parseInt(min), 0, 0);
      return medTime >= now;
    });
    document.getElementById('todayReminders').textContent = todayMeds.length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: logs } = await supabaseClient
      .from('medicine_logs')
      .select('action')
      .in('patient_id', patientIds)
      .gte('taken_at', weekAgo.toISOString());

    if (logs && logs.length > 0) {
      const taken = logs.filter(l => l.action === 'TAKEN').length;
      document.getElementById('adherenceRate').textContent = Math.round((taken / logs.length) * 100) + '%';
    } else {
      document.getElementById('adherenceRate').textContent = 'N/A';
    }

  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────

async function loadPatients() {
  const patientList = document.getElementById('patientList');
  if (!patientList) return;
  patientList.innerHTML = '<p style="text-align:center;padding:2rem;color:#6b7280">Loading patients...</p>';

  try {
    const { data: patients, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('caregiver_id', currentCaregiver.id)
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allPatients = patients || [];
    renderPatients(allPatients);
    populatePatientFilter(allPatients);
  } catch (err) {
    patientList.innerHTML = `<p style="color:red;text-align:center;padding:2rem">Error loading patients: ${err.message}</p>`;
  }
}

function renderPatients(patients) {
  const patientList = document.getElementById('patientList');
  if (!patientList) return;

  if (patients.length === 0) {
    patientList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3 class="empty-state-title">No Patients Yet</h3>
        <p class="empty-state-description">Add your first patient to get started</p>
        <button class="btn btn-primary" onclick="openAddPatientModal()">+ Add Patient</button>
      </div>`;
    return;
  }

  patientList.innerHTML = patients.map(p => `
    <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#4b45f5,#7c3aed);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;flex-shrink:0;">
          ${p.name ? p.name.substring(0,2).toUpperCase() : 'PT'}
        </div>
        <div>
          <h4 style="margin:0 0 2px;font-size:15px;font-weight:600;">${p.name || 'Unknown'}</h4>
          <p style="margin:0;font-size:13px;color:#6b7280;">✉️ ${p.email}</p>
          ${p.phone ? `<p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">📞 ${p.phone}</p>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="viewPatientMedicines('${p.id}')" style="background:#f0f4ff;color:#4b45f5;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">💊 Medicines</button>
        <button onclick="deletePatient('${p.id}','${(p.name||'').replace(/'/g,"\\'")}') " style="background:#fef2f2;color:#dc2626;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">🗑️ Remove</button>
      </div>
    </div>`).join('');
}

function populatePatientFilter(patients) {
  const select = document.getElementById('patientFilter');
  if (!select) return;
  select.innerHTML = '<option value="">All Patients</option>' +
    patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function viewPatientMedicines(patientId) {
  document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector('[data-page="medicines"]').classList.add('active');
  document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
  document.getElementById('medicinesPage').style.display = 'block';
  const filter = document.getElementById('patientFilter');
  if (filter) { filter.value = patientId; filter.dispatchEvent(new Event('change')); }
}

async function deletePatient(patientId, patientName) {
  if (!confirm(`Remove "${patientName}" as your patient?`)) return;
  try {
    const { error } = await supabaseClient
      .from('users').update({ caregiver_id: null }).eq('id', patientId);
    if (error) throw error;
    toast.success(`${patientName} removed`);
    await loadPatients();
    await loadDashboardStats();
  } catch (err) {
    toast.error('Failed: ' + err.message);
  }
}

// ─── ADD PATIENT MODAL ────────────────────────────────────────────────────────

function openAddPatientModal() {
  document.getElementById('addPatientModal').style.display = 'flex';
  document.getElementById('addPatientForm').reset();
  document.getElementById('patientFormError').style.display = 'none';
}

function closeAddPatientModal() {
  document.getElementById('addPatientModal').style.display = 'none';
}

async function submitAddPatient(e) {
  e.preventDefault();
  const name     = document.getElementById('patientName').value.trim();
  const email    = document.getElementById('patientEmail').value.trim();
  const phone    = document.getElementById('patientPhone').value.trim();
  const password = document.getElementById('patientPassword').value;

  const errDiv    = document.getElementById('patientFormError');
  const submitBtn = document.getElementById('patientSubmitBtn');
  errDiv.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    // Create auth account for patient using a secondary client so caregiver stays logged in
    const tempClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    const { data: authData, error: signUpError } = await tempClient.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Failed to create patient account');

    // Insert patient profile linked to this caregiver
    const { error: profileError } = await supabaseClient
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role: 'patient',
        phone: phone || null,
        caregiver_id: currentCaregiver.id
      }]);
    if (profileError) throw profileError;

    // Default settings row
    await supabaseClient.from('settings').insert([{ user_id: authData.user.id }]);

    toast.success(`✅ Patient "${name}" added! They can now log in with their email & password.`);
    closeAddPatientModal();
    await loadPatients();
    await loadDashboardStats();

  } catch (err) {
    let msg = err.message || 'Failed to add patient';
    if (msg.includes('already registered')) msg = 'This email is already registered. Use a different email.';
    errDiv.textContent = '❌ ' + msg;
    errDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Patient';
  }
}

// ─── MEDICINES ────────────────────────────────────────────────────────────────

async function loadMedicines() {
  const medicinesList = document.getElementById('medicinesList');
  if (!medicinesList) return;
  medicinesList.innerHTML = '<p style="text-align:center;padding:2rem;color:#6b7280">Loading medicines...</p>';

  try {
    const { data: medicines, error } = await supabaseClient
      .from('medicines')
      .select('*, users!medicines_patient_id_fkey(name)')
      .eq('caregiver_id', currentCaregiver.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    allMedicines = medicines || [];
    renderMedicines(allMedicines);
    checkLowStock(allMedicines);
  } catch (err) {
    medicinesList.innerHTML = `<p style="color:red;text-align:center;padding:2rem">Error: ${err.message}</p>`;
  }
}

function renderMedicines(medicines) {
  const medicinesList = document.getElementById('medicinesList');
  if (!medicinesList) return;

  if (medicines.length === 0) {
    medicinesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💊</div>
        <h3 class="empty-state-title">No Medicines Yet</h3>
        <p class="empty-state-description">Add medicines for your patients</p>
        <button class="btn btn-primary" onclick="window.location.href='app-medicine.html'">+ Add Medicine</button>
      </div>`;
    return;
  }

  medicinesList.innerHTML = medicines.map(m => {
    const stockPct   = Math.min(100, Math.round((m.stock / 30) * 100));
    const stockColor = m.stock <= 5 ? '#dc2626' : m.stock <= 10 ? '#f59e0b' : '#10b981';
    const timeStr    = m.time ? formatTime(m.time) : '';
    const patient    = m.users?.name || 'Unknown Patient';

    return `
      <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${m.color||'#4b45f5'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h4 style="margin:0 0 4px;font-size:15px;font-weight:600;">💊 ${m.name}</h4>
            <p style="margin:0;font-size:13px;color:#6b7280;">👤 ${patient}${m.dosage ? ' · ' + m.dosage : ''}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#4b45f5;">⏰ ${timeStr} · ${m.frequency || 'daily'}</p>
          </div>
          <span style="background:${m.status==='ACTIVE'?'#d1fae5':'#f3f4f6'};color:${m.status==='ACTIVE'?'#065f46':'#6b7280'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">
            ${m.status || 'ACTIVE'}
          </span>
        </div>
        <div style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:4px;">
            <span>Stock</span><span style="color:${stockColor};font-weight:600;">${m.stock} pills</span>
          </div>
          <div style="background:#f3f4f6;border-radius:4px;height:6px;">
            <div style="background:${stockColor};width:${stockPct}%;height:6px;border-radius:4px;"></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button onclick="window.location.href='app-medicine.html?edit=${m.id}'" style="flex:1;background:#f0f4ff;color:#4b45f5;border:none;padding:7px;border-radius:8px;cursor:pointer;font-size:13px;">✏️ Edit</button>
          <button onclick="deleteMedicine('${m.id}','${(m.name||'').replace(/'/g,"\\'")}') " style="flex:1;background:#fef2f2;color:#dc2626;border:none;padding:7px;border-radius:8px;cursor:pointer;font-size:13px;">🗑️ Delete</button>
        </div>
      </div>`;
  }).join('');
}

function formatTime(time) {
  const [h, min] = time.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function checkLowStock(medicines) {
  const low     = medicines.filter(m => m.stock <= (m.low_stock_threshold || 5) && m.status === 'ACTIVE');
  const section = document.getElementById('lowStockSection');
  const alerts  = document.getElementById('lowStockAlerts');
  if (!section || !alerts) return;
  if (low.length > 0) {
    section.style.display = 'block';
    alerts.innerHTML = low.map(m => `
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span>⚠️ <strong>${m.name}</strong> — only <strong>${m.stock} pills</strong> left</span>
        <span style="font-size:12px;color:#92400e;">Restock needed</span>
      </div>`).join('');
  } else {
    section.style.display = 'none';
  }
}

async function deleteMedicine(medicineId, medicineName) {
  if (!confirm(`Delete "${medicineName}"? This cannot be undone.`)) return;
  try {
    const { error } = await supabaseClient.from('medicines').delete().eq('id', medicineId);
    if (error) throw error;
    toast.success(`${medicineName} deleted`);
    await loadMedicines();
    await loadDashboardStats();
  } catch (err) {
    toast.error('Failed: ' + err.message);
  }
}

// ─── RECENT ACTIVITY ──────────────────────────────────────────────────────────

async function loadRecentActivity() {
  const activityFeed = document.getElementById('activityFeed');
  if (!activityFeed) return;

  try {
    const { data: patients } = await supabaseClient
      .from('users').select('id').eq('caregiver_id', currentCaregiver.id).eq('role', 'patient');

    const patientIds = (patients || []).map(p => p.id);
    if (patientIds.length === 0) {
      activityFeed.innerHTML = '<p style="text-align:center;color:#6b7280;padding:2rem;">No activity yet. Add a patient to get started.</p>';
      return;
    }

    const { data: logs, error } = await supabaseClient
      .from('medicine_logs')
      .select('*, medicines(name), users!medicine_logs_patient_id_fkey(name)')
      .in('patient_id', patientIds)
      .order('taken_at', { ascending: false })
      .limit(10);

    if (error || !logs || logs.length === 0) {
      activityFeed.innerHTML = '<p style="text-align:center;color:#6b7280;padding:2rem;">No recent activity</p>';
      return;
    }

    const icons  = { TAKEN: '✅', MISSED: '❌', SKIPPED: '⏭️' };
    const colors = { TAKEN: '#d1fae5', MISSED: '#fee2e2', SKIPPED: '#f3f4f6' };

    activityFeed.innerHTML = logs.map(log => {
      const time = new Date(log.taken_at).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <div style="width:36px;height:36px;border-radius:50%;background:${colors[log.action]||'#f3f4f6'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
            ${icons[log.action]||'•'}
          </div>
          <div>
            <p style="margin:0;font-size:14px;"><strong>${log.users?.name||'Patient'}</strong> ${log.action.toLowerCase()} <strong>${log.medicines?.name||'medicine'}</strong></p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">${time}</p>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    activityFeed.innerHTML = '<p style="text-align:center;color:#6b7280;padding:2rem;">No recent activity</p>';
  }
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────

function setupEventListeners() {
  document.querySelectorAll('[id^="addPatient"]').forEach(btn => {
    btn?.addEventListener('click', () => openAddPatientModal());
  });

  document.querySelectorAll('[id^="addMedicine"]').forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'app-medicine.html');
  });

  document.getElementById('patientSearch')?.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    renderPatients(allPatients.filter(p =>
      p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    ));
  });

  document.getElementById('patientFilter')?.addEventListener('change', function() {
    renderMedicines(this.value ? allMedicines.filter(m => m.patient_id === this.value) : allMedicines);
  });

  document.getElementById('statusFilter')?.addEventListener('change', function() {
    renderMedicines(this.value ? allMedicines.filter(m => m.status === this.value) : allMedicines);
  });

  document.getElementById('viewReportsBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-page="reports"]').classList.add('active');
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.getElementById('reportsPage').style.display = 'block';
  });
}
