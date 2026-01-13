# Fragments - Social Media Mobile App 🚀

A modern, Twitter-like social media application built with React Native, Expo, and Supabase. Features real-time updates, comprehensive authentication, and a polished user interface.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

### 🔐 Authentication System
- **Secure Registration & Login** with email validation
- **Password Strength Validation** with real-time feedback
- **Forgot Password** functionality with email reset
- **Session Management** with automatic token refresh
- **Security Monitoring** with rate limiting and suspicious activity detection

### 👤 Profile Management
- **Profile Editing** with real-time validation
- **Avatar Support** with URL validation and live preview
- **Profile Statistics** showing posts, followers, following
- **User Handle Generation** and verification badges

### 📝 Post Management (CRUD)
- **Create Posts** with text and image support
- **Edit Posts** with inline editing modal
- **Delete Posts** with confirmation dialogs
- **Real-time Updates** across all connected clients
- **Character Limits** and content validation

### 💬 Comments System
- **Threaded Comments** on all posts
- **Real-time Comment Updates** with live notifications
- **Comment Editing & Deletion** with proper permissions
- **User Attribution** with avatars and timestamps

### 🎨 Modern UI/UX
- **Twitter-like Interface** with familiar interactions
- **Dark/Light Theme Support** with system preference detection
- **Smooth Animations** and micro-interactions
- **Responsive Design** for all screen sizes
- **Accessibility Support** with screen reader compatibility

### ⚡ Performance & Security
- **Optimized Animations** with React Native Reanimated
- **Bundle Optimization** with code splitting
- **Input Validation** and XSS protection
- **Rate Limiting** and abuse prevention
- **Error Boundaries** with graceful fallbacks

## 🛠️ Tech Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **State Management:** React Context + Reducers
- **Navigation:** Expo Router (file-based routing)
- **Styling:** StyleSheet with design system
- **Animations:** React Native Reanimated
- **Testing:** Jest, React Native Testing Library
- **Security:** Custom validation and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fragments-mobile-app.git
   cd fragments-mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your preferred platform**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator  
   - Press `w` for Web Browser
   - Scan QR code with Expo Go app

## 📱 Platform Support

- ✅ **iOS** (iPhone & iPad)
- ✅ **Android** (Phone & Tablet)
- ✅ **Web** (Progressive Web App)

## 🗄️ Database Setup

The app uses Supabase for backend services. See [SETUP.md](./SETUP.md) for detailed database configuration.

### Quick Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in `/supabase/` folder
3. Configure Row Level Security (RLS) policies
4. Update environment variables

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 📁 Project Structure

```
fragments-test/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── post/              # Post detail screens
├── components/            # Reusable UI components
├── contexts/              # React Context providers
├── lib/                   # Utilities and services
│   ├── services/          # API services
│   ├── security/          # Security utilities
│   └── utils/             # Helper functions
├── design-system/         # Design tokens and components
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── __tests__/             # Test files
└── supabase/              # Database schemas and migrations
```

## 🔧 Configuration

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Key Configuration Files
- `app.config.js` - Expo configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Testing configuration
- `babel.config.js` - Babel transpilation

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Authentication Guide](./SECURITY_ENHANCEMENTS_SUMMARY.md) - Security features
- [UI Components](./TWITTER_UI_INTEGRATION_COMPLETE.md) - Design system
- [Performance Guide](./PERFORMANCE_OPTIMIZATIONS_SUMMARY.md) - Optimization details
- [Testing Guide](./__tests__/README.md) - Testing strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev) for the amazing development platform
- [Supabase](https://supabase.com) for backend-as-a-service
- [React Native](https://reactnative.dev) community for excellent libraries
- Design inspiration from Twitter/X interface

## 📞 Support

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/fragments-mobile-app/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/fragments-mobile-app/discussions)

---

**Built with ❤️ using React Native and Expo**