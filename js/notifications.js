// Notifications Module

let notificationPermission = false;
let scheduledNotifications = [];

/**
 * Initialize notifications
 */
async function initializeNotifications() {
  notificationPermission = await NotificationUtils.requestPermission();
  
  if (notificationPermission) {
    console.log('✅ Notifications enabled');
    scheduleAllNotifications();
  } else {
    console.log('⚠️ Notifications disabled');
  }
}

/**
 * Schedule all medicine notifications
 */
async function scheduleAllNotifications() {
  const currentUser = AuthUtils.getCurrentUser();
  if (!currentUser || currentUser.role !== 'patient') return;

  // Clear existing notifications
  clearAllNotifications();

  // Get today's medicines
  const result = await getTodaysMedicines(currentUser.id);
  if (!result.success) return;

  result.data.forEach(medicine => {
    scheduleMedicineNotification(medicine);
  });
}

/**
 * Schedule notification for a specific medicine
 */
function scheduleMedicineNotification(medicine) {
  const now = new Date();
  const [hours, minutes] = medicine.time.split(':');
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  // Schedule 5 minutes before
  const notificationTime = new Date(reminderTime.getTime() - (CONFIG.app.reminderAdvanceMinutes * 60000));

  if (notificationTime > now) {
    const timeout = notificationTime - now;
    const timeoutId = setTimeout(() => {
      showMedicineNotification(medicine);
    }, timeout);

    scheduledNotifications.push({
      medicineId: medicine.id,
      timeoutId: timeoutId,
      time: notificationTime
    });

    console.log(`⏰ Scheduled notification for ${medicine.name} at ${DateUtils.formatTime(medicine.time)}`);
  }
}

/**
 * Show medicine notification
 */
async function showMedicineNotification(medicine) {
  // Play sound
  NotificationUtils.playSound();

  // Show browser notification
  const notification = await NotificationUtils.show(
    `Time for ${medicine.name}`,
    {
      body: medicine.instructions || `Don't forget to take your ${medicine.name}`,
      tag: `medicine-${medicine.id}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      requireInteraction: true,
      data: {
        medicineId: medicine.id,
        time: medicine.time
      },
      actions: [
        { action: 'taken', title: '✅ Taken' },
        { action: 'snooze', title: '⏰ Snooze' }
      ]
    }
  );

  // Handle notification click
  if (notification) {
    notification.onclick = () => {
      window.focus();
      showMedicineAlertModal(medicine);
      notification.close();
    };
  }

  // Show in-app modal
  showMedicineAlertModal(medicine);
}

/**
 * Show medicine alert modal
 */
function showMedicineAlertModal(medicine) {
  const modal = document.getElementById('medicineAlertModal');
  if (!modal) return;

  // Fill modal with medicine data
  document.getElementById('alertMedicineName').textContent = `${medicine.name} ${medicine.dosage}`;
  document.getElementById('alertInstructions').textContent = medicine.instructions || 'Take as prescribed';
  document.getElementById('alertStock').textContent = medicine.stock;

  // Show/hide voice player
  const voicePlayer = document.getElementById('voicePlayerContainer');
  if (medicine.voice_file_url) {
    voicePlayer.style.display = 'flex';
    // Setup voice player
    setupVoicePlayer(medicine.voice_file_url);
  } else {
    voicePlayer.style.display = 'none';
  }

  // Setup action buttons
  document.getElementById('markTakenBtn').onclick = async () => {
    await markMedicineAsTaken(medicine.id);
    toast.success('Medicine marked as taken! ✅');
    UIUtils.hideModal('medicineAlertModal');
    refreshDashboard();
  };

  document.getElementById('snoozeBtn').onclick = () => {
    snoozeNotification(medicine);
    UIUtils.hideModal('medicineAlertModal');
  };

  document.getElementById('skipBtn').onclick = async () => {
    if (confirm('Are you sure you want to skip this dose?')) {
      await markMedicineAsSkipped(medicine.id, new Date());
      toast.warning('Dose skipped');
      UIUtils.hideModal('medicineAlertModal');
      refreshDashboard();
    }
  };

  // Show modal
  UIUtils.showModal('medicineAlertModal');
}

/**
 * Snooze notification
 */
function snoozeNotification(medicine) {
  const snoozeTime = CONFIG.app.snoozeDurationMinutes * 60000;
  
  setTimeout(() => {
    showMedicineNotification(medicine);
  }, snoozeTime);

  toast.info(`Snoozed for ${CONFIG.app.snoozeDurationMinutes} minutes`);
}

/**
 * Setup voice player
 */
function setupVoicePlayer(audioUrl) {
  const playBtn = document.getElementById('playVoiceBtn');
  const waveform = document.getElementById('voiceWaveform');
  const duration = document.getElementById('voiceDuration');
  
  let audio = new Audio(audioUrl);
  let isPlaying = false;

  playBtn.onclick = () => {
    if (isPlaying) {
      audio.pause();
      playBtn.textContent = '▶️';
      waveform.classList.remove('playing');
    } else {
      audio.play();
      playBtn.textContent = '⏸️';
      waveform.classList.add('playing');
    }
    isPlaying = !isPlaying;
  };

  audio.onended = () => {
    playBtn.textContent = '▶️';
    waveform.classList.remove('playing');
    isPlaying = false;
  };

  audio.ontimeupdate = () => {
    const current = Math.floor(audio.currentTime);
    const total = Math.floor(audio.duration);
    duration.textContent = `${formatSeconds(current)} / ${formatSeconds(total)}`;
  };
}

/**
 * Format seconds to MM:SS
 */
function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clear all scheduled notifications
 */
function clearAllNotifications() {
  scheduledNotifications.forEach(notif => {
    clearTimeout(notif.timeoutId);
  });
  scheduledNotifications = [];
}

/**
 * Get unread notifications
 */
async function getUnreadNotifications() {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Mark notification read error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to real-time notifications
 */
function subscribeToNotifications() {
  const currentUser = AuthUtils.getCurrentUser();
  if (!currentUser) return;

  const subscription = subscribeToChanges(
    'notifications',
    'INSERT',
    (payload) => {
      const notification = payload.new;
      if (notification.user_id === currentUser.id) {
        showToastNotification(notification);
        updateNotificationBadge();
      }
    },
    { filter: `user_id=eq.${currentUser.id}` }
  );

  return subscription;
}

/**
 * Show toast notification
 */
function showToastNotification(notification) {
  toast.info(notification.message);
}

/**
 * Update notification badge
 */
async function updateNotificationBadge() {
  const result = await getUnreadNotifications();
  const badge = document.getElementById('notificationBadge');
  
  if (badge && result.success) {
    const count = result.data.length;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
  // Trigger refresh event
  window.dispatchEvent(new Event('dashboardRefresh'));
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeNotifications();
    updateNotificationBadge();
    subscribeToNotifications();
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeNotifications,
    scheduleAllNotifications,
    showMedicineNotification,
    getUnreadNotifications,
    markNotificationRead,
    updateNotificationBadge
  };
}
