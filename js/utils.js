// Utility Functions for TabTimer

/**
 * Toast Notification Manager
 */
class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close">×</button>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    });
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

// Initialize global toast manager
const toast = new ToastManager();

/**
 * Form Validation Utilities
 */
const FormValidator = {
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePassword(password) {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return re.test(password);
  },

  validatePhone(phone) {
    const re = /^[\d\s\+\-\(\)]+$/;
    return phone.length >= 10 && re.test(phone);
  },

  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
};

/**
 * Date and Time Utilities
 */
const DateUtils = {
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  },

  formatDateTime(datetime) {
    return new Date(datetime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getTimeUntil(targetTime) {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = target - now;
    
    if (diff < 0) return 'Past due';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes}m`;
    }
  },

  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  },

  getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
  }
};

/**
 * Local Storage Utilities
 */
const StorageUtils = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
};

/**
 * Authentication Utilities
 */
const AuthUtils = {
  getCurrentUser() {
    return StorageUtils.get('currentUser');
  },

  setCurrentUser(user) {
    return StorageUtils.set('currentUser', user);
  },

  getAuthToken() {
    return localStorage.getItem('authToken');
  },

  setAuthToken(token) {
    return localStorage.setItem('authToken', token);
  },

  isAuthenticated() {
    return !!this.getAuthToken() && !!this.getCurrentUser();
  },

  logout() {
    StorageUtils.remove('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'auth-login.html';
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'auth-login.html';
      return false;
    }
    return true;
  }
};

/**
 * UI Utilities
 */
const UIUtils = {
  showLoading(element, text = 'Loading...') {
    if (element) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.innerHTML = `<span class="spinner"></span> ${text}`;
    }
  },

  hideLoading(element) {
    if (element && element.dataset.originalText) {
      element.disabled = false;
      element.textContent = element.dataset.originalText;
      delete element.dataset.originalText;
    }
  },

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(err => {
      toast.error('Failed to copy');
    });
  },

  createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }
};

/**
 * Medicine Utilities
 */
const MedicineUtils = {
  getStockPercentage(current, total = 30) {
    return Math.round((current / total) * 100);
  },

  isLowStock(current, threshold = CONFIG.app.lowStockThreshold) {
    return current <= threshold;
  },

  getStockColor(current, threshold = CONFIG.app.lowStockThreshold) {
    if (current === 0) return 'var(--danger)';
    if (current <= threshold) return 'var(--warning)';
    return 'var(--success)';
  },

  calculateNextDose(time, frequency = 'daily') {
    const now = new Date();
    const [hours, minutes] = time.split(':');
    const nextDose = new Date();
    nextDose.setHours(hours, minutes, 0, 0);

    if (nextDose <= now) {
      // If time has passed today, schedule for tomorrow
      nextDose.setDate(nextDose.getDate() + 1);
    }

    return nextDose;
  },

  getMedicineColor(colorName) {
    const colors = {
      red: '#ef4444',
      pink: '#ec4899',
      purple: '#a855f7',
      blue: '#3b82f6',
      cyan: '#06b6d4',
      teal: '#14b8a6',
      green: '#10b981',
      orange: '#f97316',
      amber: '#f59e0b'
    };
    return colors[colorName] || colors.blue;
  }
};

/**
 * Notification Utilities
 */
const NotificationUtils = {
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  async show(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        ...options
      });

      return notification;
    }
    return null;
  },

  playSound(soundFile = '/assets/sounds/notification.mp3') {
    try {
      const audio = new Audio(soundFile);
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }
};

/**
 * Export utilities
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ToastManager,
    FormValidator,
    DateUtils,
    StorageUtils,
    AuthUtils,
    UIUtils,
    MedicineUtils,
    NotificationUtils
  };
}
