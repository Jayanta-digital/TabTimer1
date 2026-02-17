// Main App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 TabTimer App Starting...');
  
  const currentUser = AuthUtils.getCurrentUser();
  
  if (currentUser) {
    console.log(`👤 Logged in as: ${currentUser.name} (${currentUser.role})`);
  }
  
  registerServiceWorker();
  
  console.log('✅ TabTimer App Ready');
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/js/service-worker.js')
      .then(() => console.log('✅ Service Worker registered'))
      .catch((err) => console.log('❌ Service Worker registration failed', err));
  }
}
