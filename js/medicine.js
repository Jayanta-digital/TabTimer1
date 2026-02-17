// Medicine Management Module

/**
 * Get all medicines for a user (patient or caregiver)
 */
async function getMedicines(userId, role = 'patient') {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const filterField = role === 'patient' ? 'patient_id' : 'caregiver_id';
    
    const { data, error } = await supabase
      .from('medicines')
      .select(`
        *,
        patient:patient_id(id, name, email),
        caregiver:caregiver_id(id, name, email)
      `)
      .eq(filterField, userId)
      .eq('status', 'ACTIVE')
      .order('time', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get medicines error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get medicine by ID
 */
async function getMedicineById(medicineId) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .from('medicines')
      .select(`
        *,
        patient:patient_id(id, name, email),
        caregiver:caregiver_id(id, name, email)
      `)
      .eq('id', medicineId)
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Get medicine error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new medicine
 */
async function createMedicine(medicineData) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    // Calculate next reminder time
    const nextReminder = MedicineUtils.calculateNextDose(medicineData.time, medicineData.frequency);

    const { data, error } = await supabase
      .from('medicines')
      .insert([{
        ...medicineData,
        caregiver_id: currentUser.id,
        next_reminder: nextReminder.toISOString(),
        status: 'ACTIVE'
      }])
      .select()
      .single();

    if (error) throw error;

    // Create notification for patient
    await createNotification(
      medicineData.patient_id,
      'medicine_added',
      'New Medicine Added',
      `${medicineData.name} has been added to your schedule at ${DateUtils.formatTime(medicineData.time)}`,
      data.id
    );

    return { success: true, data: data };
  } catch (error) {
    console.error('Create medicine error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update medicine
 */
async function updateMedicine(medicineId, updates) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    // Recalculate next reminder if time changed
    if (updates.time) {
      updates.next_reminder = MedicineUtils.calculateNextDose(updates.time, updates.frequency).toISOString();
    }

    const { data, error } = await supabase
      .from('medicines')
      .update(updates)
      .eq('id', medicineId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Update medicine error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete medicine
 */
async function deleteMedicine(medicineId) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    // Soft delete by setting status to INACTIVE
    const { data, error } = await supabase
      .from('medicines')
      .update({ status: 'INACTIVE' })
      .eq('id', medicineId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Delete medicine error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark medicine as taken
 */
async function markMedicineAsTaken(medicineId, scheduledTime = new Date()) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    // Get medicine details
    const medicine = await getMedicineById(medicineId);
    if (!medicine.success) throw new Error('Medicine not found');

    const newStock = medicine.data.stock - 1;

    // Create log entry
    const { data: logData, error: logError } = await supabase
      .from('medicine_logs')
      .insert([{
        medicine_id: medicineId,
        patient_id: currentUser.id,
        action: 'TAKEN',
        scheduled_time: scheduledTime,
        stock_after: newStock,
        reminder_method: 'manual'
      }])
      .select()
      .single();

    if (logError) throw logError;

    // Update medicine stock and last taken time
    await supabase
      .from('medicines')
      .update({
        stock: newStock,
        last_taken: new Date().toISOString()
      })
      .eq('id', medicineId);

    // Check if low stock
    if (MedicineUtils.isLowStock(newStock, medicine.data.low_stock_threshold)) {
      await createNotification(
        medicine.data.caregiver_id,
        'low_stock',
        'Low Stock Alert',
        `${medicine.data.name} for ${medicine.data.patient.name} is running low (${newStock} remaining)`,
        medicineId
      );
    }

    return { success: true, data: logData };
  } catch (error) {
    console.error('Mark as taken error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark medicine as missed
 */
async function markMedicineAsMissed(medicineId, scheduledTime) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medicine_logs')
      .insert([{
        medicine_id: medicineId,
        patient_id: currentUser.id,
        action: 'MISSED',
        scheduled_time: scheduledTime
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Mark as missed error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark medicine as skipped
 */
async function markMedicineAsSkipped(medicineId, scheduledTime, reason = '') {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medicine_logs')
      .insert([{
        medicine_id: medicineId,
        patient_id: currentUser.id,
        action: 'SKIPPED',
        scheduled_time: scheduledTime,
        notes: reason
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Mark as skipped error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get today's medicines for a patient
 */
async function getTodaysMedicines(patientId) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    // Call database function
    const { data, error } = await supabase
      .rpc('get_todays_medicines', { p_patient_id: patientId });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get todays medicines error:', error);
    // Fallback to manual query if function doesn't exist
    return await getMedicines(patientId, 'patient');
  }
}

/**
 * Get medicine logs
 */
async function getMedicineLogs(medicineId, limit = 50) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('medicine_id', medicineId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get medicine logs error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Calculate adherence rate
 */
async function calculateAdherence(patientId, days = 7) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .rpc('calculate_adherence_rate', { 
        p_patient_id: patientId, 
        p_days: days 
      });

    if (error) throw error;

    return { success: true, data: data || 0 };
  } catch (error) {
    console.error('Calculate adherence error:', error);
    return { success: false, error: error.message, data: 0 };
  }
}

/**
 * Create notification
 */
async function createNotification(userId, type, title, message, medicineId = null) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        medicine_id: medicineId,
        type: type,
        title: title,
        message: message
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    markMedicineAsTaken,
    markMedicineAsMissed,
    markMedicineAsSkipped,
    getTodaysMedicines,
    getMedicineLogs,
    calculateAdherence,
    createNotification
  };
}
