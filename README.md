# 💊 TabTimer - Smart Medicine Reminder Web Application

> Never miss your medicine with TabTimer - A comprehensive medicine reminder system with voice instructions, real-time tracking, and caregiver management.

![TabTimer](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)

## 🎯 Features

### Core Features
- ✅ **User Authentication** - Secure signup/login for caregivers and patients
- 💊 **Medicine Management** - Add, edit, delete medicines with dosage and timing
- ⏰ **Smart Reminders** - Time-based notifications with snooze functionality
- 🎤 **Voice Instructions** - Record and playback personalized medicine instructions
- 📊 **Progress Tracking** - Detailed adherence reports and analytics
- 📦 **Stock Management** - Automatic low-stock alerts and tracking
- 👨‍⚕️ **Caregiver Dashboard** - Manage multiple patients and their medications
- 🧑 **Patient Dashboard** - Simple interface for medicine intake tracking
- 💰 **UPI Payments** - Premium subscription with unlimited medicines
- 📱 **Progressive Web App** - Installable on mobile and desktop
- 🔄 **Real-time Sync** - Instant updates across all devices
- 🌙 **Dark Mode** - Automatic theme switching

### Technical Features
- Responsive mobile-first design
- Offline capability with service workers
- Browser push notifications
- Google Drive integration for voice storage
- Supabase backend for real-time database
- Modern ES6+ JavaScript
- No framework dependencies (Vanilla JS)

## 🏗️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** PHP 8.x
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Google Drive API
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime Subscriptions
- **PWA:** Service Workers, Web App Manifest

## 📁 Project Structure

```
tabtimer/
├── index.html              # Landing page
├── auth-signup.html        # User registration
├── auth-login.html         # User login
├── auth-reset.html         # Password reset
├── app-caregiver.html      # Caregiver dashboard
├── app-patient.html        # Patient dashboard
├── manifest.json           # PWA manifest
├── .htaccess              # Apache configuration
│
├── css/
│   ├── reset.css          # CSS reset
│   ├── variables.css      # Design system variables
│   ├── components.css     # Reusable components
│   ├── layouts.css        # Layout styles
│   ├── auth.css           # Authentication pages
│   ├── dashboard.css      # Dashboard styles
│   └── responsive.css     # Mobile responsiveness
│
├── js/
│   ├── config.js          # App configuration
│   ├── utils.js           # Utility functions
│   ├── supabase-client.js # Supabase initialization
│   ├── google-drive.js    # Google Drive integration
│   ├── auth.js            # Authentication logic
│   ├── caregiver.js       # Caregiver features
│   ├── patient.js         # Patient features
│   ├── medicine.js        # Medicine management
│   ├── notifications.js   # Notification system
│   ├── payments.js        # Payment integration
│   ├── audio-recorder.js  # Voice recording
│   ├── app.js             # Main app logic
│   └── service-worker.js  # PWA service worker
│
├── php/
│   ├── config.php         # PHP configuration
│   ├── auth.php           # Authentication endpoints
│   ├── medicine.php       # Medicine CRUD operations
│   ├── payment.php        # Payment processing
│   ├── upload.php         # File upload handler
│   └── webhook.php        # Payment webhooks
│
└── assets/
    ├── icons/             # App icons (72px to 512px)
    ├── images/            # Static images
    └── sounds/            # Notification sounds
```

## 🚀 Quick Start

### Prerequisites

- Web server (Apache/Nginx)
- PHP 8.0 or higher
- Supabase account
- Google Cloud account (for Drive API)
- UPI ID for payments

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tabtimer.git
cd tabtimer
```

2. **Configure Supabase**

Create a Supabase project at https://supabase.com

Run the following SQL in your Supabase SQL editor:

```sql
-- See SETUP.md for complete database schema
```

3. **Configure Google Drive API**

- Go to Google Cloud Console
- Create a new project
- Enable Google Drive API
- Create OAuth 2.0 credentials
- Create a folder for voice recordings
- Note the folder ID

4. **Update Configuration**

Edit `js/config.js`:
```javascript
const CONFIG = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    apiKey: 'YOUR_GOOGLE_API_KEY',
    folderId: 'YOUR_DRIVE_FOLDER_ID'
  },
  payment: {
    upiId: 'jayantakumarkakati1999@oksbi'
  }
};
```

Edit `php/config.php`:
```php
<?php
define('SUPABASE_URL', 'YOUR_SUPABASE_URL');
define('SUPABASE_KEY', 'YOUR_SUPABASE_KEY');
// ... other configs
?>
```

5. **Deploy to Web Server**

Upload all files to your web server's public directory.

6. **Set Permissions**
```bash
chmod 755 php/
chmod 644 php/*.php
```

7. **Access the Application**

Open your browser and navigate to:
```
https://yourdomain.com/tabtimer
```

## 📖 User Guide

### For Caregivers

1. **Sign Up** as a Caregiver
2. **Add Patients** with their details
3. **Add Medicines** for each patient
   - Set medicine name, dosage, time
   - Record voice instructions (optional)
   - Set stock quantity and low-stock threshold
4. **Monitor Adherence** through dashboard and reports
5. **Manage Stock** and receive low-stock alerts
6. **View Reports** for weekly adherence analysis

### For Patients

1. **Sign Up** as a Patient (or get credentials from caregiver)
2. **View Today's Schedule** on dashboard
3. **Receive Notifications** when medicine time arrives
4. **Mark Medicine as Taken/Skipped**
5. **Listen to Voice Instructions** for each medicine
6. **Track Your Progress** with adherence statistics

## 🔒 Security Features

- Password hashing with Argon2ID
- CSRF protection on all forms
- XSS prevention with input sanitization
- SQL injection prevention (Supabase handles this)
- Secure session management
- Rate limiting on authentication
- HTTPS enforcement
- Content Security Policy headers

## 💳 Payment Integration

### Free Plan
- Up to 3 medicines
- All basic features
- Voice instructions
- Mobile app

### Premium Plan
- Unlimited medicines
- Priority support
- Advanced reports
- Family sharing (coming soon)

**Monthly:** ₹49/month
**Yearly:** ₹490/year (save ₹98)

### Payment Process

1. User selects premium plan
2. UPI payment URL generated
3. User completes payment in their UPI app
4. User confirms payment
5. Admin verifies transaction
6. Account upgraded to premium

## 🎨 Design System

### Colors
- Primary: `#4b45f5` (Medical Blue)
- Success: `#16a34a` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#dc2626` (Red)

### Typography
- Display: Crimson Pro (serif)
- Body: DM Sans (sans-serif)

### Spacing
8px base unit system (xs, sm, md, lg, xl, 2xl)

## 📱 PWA Features

- Installable on home screen
- Works offline
- Background sync
- Push notifications
- App shortcuts
- Splash screen

## 🔧 Development

### Local Development

```bash
# Start PHP built-in server
php -S localhost:8000

# Or use any local server
python -m http.server 8000
```

### Build for Production

```bash
# Minify CSS
npx cssnano css/*.css --output dist/css/

# Minify JavaScript
npx terser js/*.js --compress --mangle --output dist/js/

# Optimize images
npx imagemin assets/** --out-dir=dist/assets
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] User signup (caregiver & patient)
- [ ] User login
- [ ] Add medicine with voice recording
- [ ] Edit medicine
- [ ] Delete medicine
- [ ] Medicine reminders trigger correctly
- [ ] Mark medicine as taken
- [ ] Low stock alerts appear
- [ ] Weekly reports generate
- [ ] Payment flow works
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Responsive on mobile/tablet/desktop

## 🚨 Troubleshooting

### Common Issues

**Notifications not working**
- Check browser notification permissions
- Ensure HTTPS is enabled
- Verify service worker is registered

**Voice recording fails**
- Check microphone permissions
- Ensure Google Drive API is configured
- Verify folder permissions

**Database connection errors**
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies are configured

## 📊 Performance

- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 500KB

## 🗺️ Roadmap

- [ ] SMS notifications via Twilio
- [ ] Email reminders via SendGrid
- [ ] Multi-language support (i18n)
- [ ] Medicine interaction checker
- [ ] Doctor appointment scheduling
- [ ] Health reports export (PDF)
- [ ] Family sharing (multiple caregivers)
- [ ] iOS and Android native apps

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Jayanta Kumar Kakati**
- UPI: jayantakumarkakati1999@oksbi
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Font: DM Sans by Google Fonts
- Icons: Emoji (cross-platform compatible)
- Database: Supabase
- Storage: Google Drive

## 📞 Support

For support, email support@tabtimer.com or create an issue on GitHub.

## 🔄 Updates

### Version 1.0.0 (2026-02-17)
- Initial release
- Core medicine reminder functionality
- Caregiver and patient dashboards
- Voice recording integration
- UPI payment system
- PWA support

---

**Made with ❤️ for better health management**
