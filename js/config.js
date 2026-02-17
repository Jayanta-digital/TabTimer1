// TabTimer Configuration
// ✅ Supabase credentials are configured

const CONFIG = {
  // ✅ Supabase Configuration - CONNECTED
  supabase: {
    url: 'https://tgpxefccobzlfyazqxwq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncHhlZmNjb2J6bGZ5YXpxeHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTYxMTYsImV4cCI6MjA4Njg3MjExNn0.qaaxXMOHWAnEljal3Uh6FseKdo9ZDEHQ10JdrGAIw9c',
    serviceKey: 'YOUR_SUPABASE_SERVICE_KEY' // ⚠️ Only use server-side (PHP), never expose in frontend
  },

  // Google Drive API Configuration
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    apiKey: 'YOUR_GOOGLE_API_KEY',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scope: 'https://www.googleapis.com/auth/drive.file',
    folderId: 'YOUR_GOOGLE_DRIVE_FOLDER_ID' // Folder for voice recordings
  },

  // Payment Configuration
  payment: {
    upiId: 'jayantakumarkakati1999@oksbi',
    merchantName: 'TabTimer Medicine Reminder',
    currency: 'INR',
    plans: {
      monthly: {
        amount: 49,
        validityDays: 30,
        maxMedicines: -1 // Unlimited
      },
      yearly: {
        amount: 490,
        validityDays: 365,
        maxMedicines: -1 // Unlimited
      }
    }
  },

  // App Configuration
  app: {
    name: 'TabTimer',
    version: '1.0.0',
    maxFreeMedicines: 3,
    reminderAdvanceMinutes: 5,
    snoozeDurationMinutes: 10,
    lowStockThreshold: 5,
    maxVoiceDurationSeconds: 120,
    timezone: 'Asia/Kolkata'
  },

  // API Endpoints
  api: {
    baseUrl: '/php',
    endpoints: {
      auth: '/php/auth.php',
      medicine: '/php/medicine.php',
      payment: '/php/payment.php',
      upload: '/php/upload.php',
      webhook: '/php/webhook.php'
    }
  },

  // Feature Flags
  features: {
    googleAuth: true,
    voiceRecording: true,
    offlineMode: true,
    pushNotifications: true,
    darkMode: true,
    analytics: false
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
