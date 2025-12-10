# 🎥 OBS Studio Pro - Professional Streaming Platform

<div align="center">

![OBS Studio Pro](https://img.shields.io/badge/OBS-Studio%20Pro-blueviolet?style=for-the-badge&logo=obs-studio)
![Angular](https://img.shields.io/badge/Angular-20-red?style=for-the-badge&logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Nx](https://img.shields.io/badge/Nx-Monorepo-143055?style=for-the-badge&logo=nx)

**The most advanced open-source streaming studio built with Angular 20, Firebase, AI, and cutting-edge web technologies.**

[Features](#features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🎬 Core Streaming
- **Multi-Platform Streaming**: Simultaneously stream to Twitch, YouTube, Facebook, Kick, TikTok, and custom RTMP
- **Scene Management**: Unlimited scenes with smooth transitions
- **Source Management**: Support for webcams, screen capture, images, videos, browser sources, and more
- **Audio Mixer**: Professional multi-channel audio mixing with filters and effects
- **Video Preview**: Real-time preview with performance monitoring
- **Studio Mode**: Preview and program output with transitions

### ☁️ Cloud Integration (Firebase)
- **Authentication**: Email/password and Google OAuth
- **Cloud Scene Storage**: Sync scenes across devices
- **Scene Sharing**: Collaborate with other users
- **Stream Analytics**: Comprehensive streaming statistics
- **Real-time Collaboration**: Multi-user scene editing
- **Cloud Functions**: Server less backend processing
- **Remote Config**: Dynamic feature flags and configuration
- **Performance Monitoring**: Track app performance in real-time
- **Crashlytics**: Automatic error reporting
- **App Check**: Security and abuse prevention
- **Dynamic Links**: Deep linking support
- **Push Notifications (FCM)**: Stream alerts and notifications
- **ML Kit**: Machine learning capabilities

### 🤖 AI-Powered Features
- **Auto-Captions**: Real-time speech-to-text transcription
- **Scene Recommendations**: AI suggests optimal scene setups
- **Chat Moderation**: Intelligent content filtering
- **Audio Enhancement**: AI-powered noise reduction and voice enhancement
- **Title Generation**: AI-generated engaging stream titles
- **Chatbot**: Automated chat responses
- **Multi-Provider Support**: OpenAI (GPT-4), Google Gemini, Anthropic Claude

### 🎵 Royalty-Free Music Library
- **Integrated Music Browser**: Browse thousands of royalty-free tracks
- **Multi-API Support**: Pixabay, Free Music Archive, Incompetech, Bensound
- **Smart Filtering**: Filter by genre, mood, BPM, duration, license
- **Playlist Management**: Create and manage custom playlists
- **Built-in Player**: Full audio playback controls
- **5 Default Tracks**: Ready to use out of the box

### 💬 Advanced Chat Integration
- **Multi-Platform Chat**: Unified chat from Twitch, YouTube, Facebook, Discord
- **Chat Overlays**: Display chat on stream
- **Chat Filtering**: Search and filter messages
- **Chat Moderation**: Automated and manual moderation tools
- **Chat Export**: Save chat logs

### 🔔 Alerts & Notifications
- **Customizable Alerts**: Followers, subscribers, donations, raids, hosts, cheers
- **Alert Queue**: Manage alert display order
- **Alert Templates**: Pre-made templates with customization
- **Alert History**: Track all alerts
- **Test Mode**: Preview alerts before going live

### 🎨 Overlays Manager
- **Multiple Overlay Types**: Webcam, text, images, videos, browser sources, alert boxes, chat boxes, timers, scoreboards, logos
- **Drag & Drop**: Intuitive overlay positioning
- **Layer Management**: Full control over overlay stacking
- **Preset System**: Save and load overlay configurations

### 📊 Analytics & Statistics
- **Stream Statistics**: Real-time FPS, bitrate, dropped frames
- **Viewer Analytics**: Peak viewers, average viewers, engagement metrics
- **Performance Metrics**: CPU usage, memory usage, network stats
- **Historical Data**: Track performance over time
- **Export Reports**: Download analytics in various formats

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Angular CLI >= 17.0.0
Firebase CLI >= 13.0.0
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/obs-studio-pro.git
cd obs-studio-pro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your credentials in .env.local
# See SETUP.md for detailed configuration instructions

# Start development server
npx nx serve studio

# Build for production
npx nx build studio --configuration=production
```

### Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy to Firebase Hosting
npm run deploy
```

---

## 📚 Documentation

### Core Documentation
- **[SETUP.md](./SETUP.md)** - Complete setup and configuration guide
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API reference for all services
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns

### Service Documentation
- **Firebase Service** - Cloud integration, authentication, storage
- **AI Service** - Machine learning and AI capabilities
- **Music Library Service** - Royalty-free music integration
- **Streaming Service** - Multi-platform streaming
- **Audio Service** - Audio processing and mixing
- **Scene Service** - Scene and source management

---

## 🏗️ Architecture

```
obs-studio-pro/
├── apps/
│   ├── studio/              # Main streaming application
│   ├── shop/                # E-commerce (optional)
│   └── api/                 # Backend API
├── libs/
│   └── streaming/
│       └── core/
│           ├── components/  # UI Components
│           │   ├── alerts-system/
│           │   ├── chat-integration/
│           │   ├── cloud-sync/
│           │   ├── multistream/
│           │   ├── overlays-manager/
│           │   └── ...
│           ├── services/    # Business Logic
│           │   ├── firebase.service.ts
│           │   ├── firebase-enhanced.service.ts
│           │   ├── ai.service.ts
│           │   ├── music-library.service.ts
│           │   ├── streaming.service.ts
│           │   └── ...
│           └── models/      # Data Models
├── functions/               # Firebase Cloud Functions
├── firebase.json            # Firebase configuration
├── .env.example             # Environment template
└── README.md
```

---

## 🔐 Environment Configuration

See `.env.example` for a complete list of environment variables. Key configurations include:

### Firebase
```bash
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_APP_ID=your-app-id
```

### AI Services
```bash
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

### Music APIs
```bash
PIXABAY_API_KEY=...
BENSOUND_LICENSE_KEY=...
```

### Streaming Platforms
```bash
TWITCH_CLIENT_ID=...
YOUTUBE_API_KEY=...
FACEBOOK_APP_ID=...
```

---

## 🛠️ Development

### Commands

```bash
# Development
npx nx serve studio                    # Start dev server
npx nx test streaming-core            # Run unit tests
npx nx lint studio                     # Lint code
npx nx build studio                    # Build app

# Firebase
firebase emulators:start              # Start Firebase emulators
firebase deploy                        # Deploy to Firebase
firebase deploy --only hosting        # Deploy hosting only
firebase deploy --only functions      # Deploy functions only

# Testing
npx nx test streaming-core            # Unit tests
npx nx e2e studio-e2e                 # E2E tests
npx nx affected -t test               # Test affected projects

# Code Generation
npx nx g @nx/angular:component        # Generate component
npx nx g @nx/angular:service          # Generate service
npx nx g @nx/angular:library          # Generate library
```

### Project Structure

```typescript
// libs/streaming/core/src/index.ts
export * from './lib/services/firebase.service';
export * from './lib/services/ai.service';
export * from './lib/services/music-library.service';
export * from './lib/components/cloud-sync/cloud-sync';
// ... more exports
```

---

## 📱 Firebase Features

### Authentication
```typescript
import { FirebaseService } from '@org/streaming-core';

// Sign in with email
await firebase.signInWithEmail(email, password);

// Sign in with Google
await firebase.signInWithGoogle();

// Sign out
await firebase.signOut();
```

### Cloud Storage
```typescript
// Save scene to cloud
const cloudScene = await firebase.saveSceneToCloud(scene, true);

// Load scene from cloud
const scene = await firebase.loadSceneFromCloud(sceneId);

// Share scene
await firebase.shareScene(sceneId, ['user@example.com']);
```

### Analytics
```typescript
// Start tracking stream
const sessionId = await firebase.startStreamSession('My Stream', 'Twitch');

// End stream session
await firebase.endStreamSession(sessionId);

// Get analytics
const analytics = await firebase.fetchAnalytics();
```

### Cloud Messaging (FCM)
```typescript
import { FirebaseEnhancedService } from '@org/streaming-core';

// Request notification permission
await firebaseEnhanced.requestNotificationPermission();

// Get FCM token
const token = await firebaseEnhanced.getFCMToken();

// Send notification
await firebaseEnhanced.sendNotification({
  title: 'New Follower!',
  body: 'You have a new follower',
  imageUrl: 'https://...',
});

// Subscribe to topic
await firebaseEnhanced.subscribeToTopic('stream-alerts');
```

### Remote Config
```typescript
// Fetch remote config
await firebaseEnhanced.fetchRemoteConfig();

// Get config values
const aiEnabled = firebaseEnhanced.getRemoteConfigBoolean('feature_ai_enabled', true);
const maxQuality = firebaseEnhanced.getRemoteConfigString('max_stream_quality', '1080p');
```

### Performance Monitoring
```typescript
// Start performance trace
const trace = firebaseEnhanced.startTrace('stream_setup');

// Add metrics
firebaseEnhanced.addTraceMetric('stream_setup', 'scene_count', 5);

// Stop trace
firebaseEnhanced.stopTrace('stream_setup');

// Track network request
firebaseEnhanced.trackNetworkRequest('/api/scenes', 250, 200);
```

### Crashlytics
```typescript
// Log crash
firebaseEnhanced.logCrash('Fatal error occurred', stackTrace, { userId: '123' });

// Log non-fatal error
firebaseEnhanced.logNonFatalError(error);

// Set user ID
firebaseEnhanced.setUserId('user-123');
```

---

## 🤖 AI Features

### Auto-Captions
```typescript
import { AIService } from '@org/streaming-core';

// Generate captions
const captions = await ai.generateCaptions(audioBlob);

// Use captions
captions.forEach(segment => {
  console.log(`${segment.start}s - ${segment.end}s: ${segment.text}`);
});
```

### Scene Recommendations
```typescript
// Get AI scene recommendations
const recommendations = await ai.getSceneRecommendations({
  currentScenes: ['Main', 'BRB'],
  streamType: 'gaming',
  audience: 'casual',
});

recommendations.forEach(rec => {
  console.log(`${rec.sceneName}: ${rec.reason} (${rec.confidence * 100}%)`);
});
```

### Audio Enhancement
```typescript
// Enhance audio
const result = await ai.enhanceAudio(audioBlob, {
  reduceNoise: true,
  normalizeVolume: true,
  enhanceVoice: true,
});
```

---

## 🎵 Music Library

### Search Music
```typescript
import { MusicLibraryService } from '@org/streaming-core';

// Search Pixabay
const tracks = await music.searchPixabay('electronic', { minDuration: 120 });

// Search Free Music Archive
const fmaTracks = await music.searchFreeMusicArchive('gaming', 'Electronic');

// Filter tracks
music.setFilters({
  genre: 'Electronic',
  mood: 'energetic',
  bpm: { min: 120, max: 140 },
  license: 'CC0',
});
```

### Playback Control
```typescript
// Play track
music.play(track);

// Pause
music.pause();

// Next track
music.playNext();

// Set volume
music.setVolume(0.8);
```

### Playlist Management
```typescript
// Create playlist
const playlist = music.createPlaylist('Gaming Music', 'High-energy tracks');

// Add to playlist
music.addToPlaylist(playlist.id, track);

// Play playlist
music.playPlaylist(playlist.id);
```

---

## 🔥 Firebase Cloud Functions

Deploy serverless backend functions:

```bash
cd functions
npm install
firebase deploy --only functions
```

Example Cloud Function:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onStreamStart = functions.firestore
  .document('streams/{streamId}')
  .onCreate(async (snap, context) => {
    const stream = snap.data();

    // Send FCM notification
    await admin.messaging().send({
      topic: 'stream-alerts',
      notification: {
        title: `${stream.username} is live!`,
        body: stream.title,
      },
    });

    return null;
  });
```

---

## 🧪 Testing

### Unit Tests
```bash
npx nx test streaming-core
npx nx test studio
```

### E2E Tests
```bash
npx nx e2e studio-e2e
npx nx e2e studio-e2e --watch
```

### Firebase Emulators
```bash
firebase emulators:start
```

---

## 📦 Deployment

### Firebase Hosting
```bash
# Build for production
npx nx build studio --configuration=production

# Deploy
firebase deploy --only hosting

# Deploy with custom message
firebase deploy -m "Release v1.0.0"
```

### Docker
```bash
# Build Docker image
docker build -t obs-studio-pro .

# Run container
docker run -p 4200:80 obs-studio-pro
```

### Kubernetes
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Firebase** - Backend infrastructure
- **Angular** - Frontend framework
- **Nx** - Monorepo tools
- **OpenAI** - AI capabilities
- **Pixabay** - Royalty-free music
- **Kevin MacLeod** - Incompetech music

---

## 📞 Support

- **Documentation**: [docs.obs-studio-pro.com](https://docs.obs-studio-pro.com)
- **Discord**: [Join our community](https://discord.gg/obs-studio-pro)
- **Email**: support@obs-studio-pro.com
- **Issues**: [GitHub Issues](https://github.com/your-username/obs-studio-pro/issues)

---

<div align="center">

**Made with ❤️ by the OBS Studio Pro Team**

[⭐ Star us on GitHub](https://github.com/your-username/obs-studio-pro) • [🐦 Follow on Twitter](https://twitter.com/obsstudiopro)

</div>

---

# Original Nx Repository Documentation

---

# Nx Angular Repository

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ A repository showcasing key [Nx](https://nx.dev) features for Angular monorepos ✨

## 📦 Project Overview

This repository demonstrates a production-ready Angular monorepo with:

- **2 Applications**

  - `studio` - Professional streaming studio application
  - `shop` - Angular e-commerce application with product listings and detail views
  - `api` - Backend API with Docker support serving product data

- **Libraries**

  - `@org/streaming-core` - Core streaming functionality with Firebase, AI, and Music integration
  - `@org/feature-products` - Product listing feature (Angular)
  - `@org/feature-product-detail` - Product detail feature (Angular)
  - `@org/data` - Data access layer for shop features
  - `@org/shared-ui` - Shared UI components
  - `@org/models` - Shared data models
  - `@org/products` - API product service library

- **E2E Testing**
  - `shop-e2e` - Playwright tests for the shop application
  - `studio-e2e` - Playwright tests for the streaming studio

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-fork-url>
cd <your-repository-name>

# Install dependencies
npm install

# Serve the streaming studio
npx nx serve studio

# Serve the Angular shop application
npx nx serve shop

# ...or you can serve the API separately
npx nx serve api

# Build all projects
npx nx run-many -t build

# Run tests
npx nx run-many -t test

# Lint all projects
npx nx run-many -t lint

# Run e2e tests
npx nx e2e shop-e2e

# Run tasks in parallel
npx nx run-many -t lint test build e2e --parallel=3

# Visualize the project graph
npx nx graph
```

## ⭐ Featured Nx Capabilities

This repository showcases several powerful Nx features:

### 1. 🔒 Module Boundaries

Enforces architectural constraints using tags. Each project has specific dependencies it can use:

- `scope:shared` - Can be used by all projects
- `scope:shop` - Shop-specific libraries
- `scope:api` - API-specific libraries
- `scope:streaming` - Streaming-specific libraries
- `type:feature` - Feature libraries
- `type:data` - Data access libraries
- `type:ui` - UI component libraries

**Try it out:**

```bash
# See the current project graph and boundaries
npx nx graph

# View a specific project's details
npx nx show project studio --web
```

[Learn more about module boundaries →](https://nx.dev/features/enforce-module-boundaries)

### 2. 🐳 Docker Integration

The API project includes Docker support with automated targets and release management:

```bash
# Build Docker image
npx nx docker:build api

# Run Docker container
npx nx docker:run api

# Release with automatic Docker image versioning
npx nx release
```

**Nx Release for Docker:** The repository is configured to use Nx Release for managing Docker image versioning and publishing. When running `nx release`, Docker images for the API project are automatically versioned and published based on the release configuration in `nx.json`. This integrates seamlessly with semantic versioning and changelog generation.

[Learn more about Docker integration →](https://nx.dev/recipes/nx-release/release-docker-images)

### 3. 🎭 Playwright E2E Testing

End-to-end testing with Playwright is pre-configured:

```bash
# Run e2e tests
npx nx e2e shop-e2e
npx nx e2e studio-e2e

# Run e2e tests in CI mode
npx nx e2e-ci shop-e2e
```

[Learn more about E2E testing →](https://nx.dev/technologies/test-tools/playwright/introduction#e2e-testing)

### 4. ⚡ Vitest for Unit Testing

Fast unit testing with Vite for Angular libraries:

```bash
# Test a specific library
npx nx test streaming-core
npx nx test data

# Test all projects
npx nx run-many -t test
```

[Learn more about Vite testing →](https://nx.dev/recipes/vite)

### 5. 🔧 Self-Healing CI

The CI pipeline includes `nx fix-ci` which automatically identifies and suggests fixes for common issues:

```bash
# In CI, this command provides automated fixes
npx nx fix-ci
```

This feature helps maintain a healthy CI pipeline by automatically detecting and suggesting solutions for:

- Missing dependencies
- Incorrect task configurations
- Cache invalidation issues
- Common build failures

[Learn more about self-healing CI →](https://nx.dev/ci/features/self-healing-ci)

## 📁 Project Structure

```
├── apps/
│   ├── studio/         [scope:streaming]   - Professional streaming studio
│   ├── shop/           [scope:shop]        - Angular e-commerce app
│   ├── shop-e2e/                           - E2E tests for shop
│   ├── studio-e2e/                         - E2E tests for studio
│   └── api/            [scope:api]         - Backend API with Docker
├── libs/
│   ├── streaming/
│   │   └── core/                           - Streaming core library
│   ├── shop/
│   │   ├── feature-products/               - Product listing
│   │   ├── feature-product-detail/         - Product details
│   │   ├── data/                           - Data access
│   │   └── shared-ui/                      - UI components
│   ├── api/
│   │   └── products/                       - Product service
│   └── shared/
│       └── models/                         - Shared models
├── functions/          - Firebase Cloud Functions
├── firebase.json       - Firebase configuration
├── .firebaserc         - Firebase projects
├── .env.example        - Environment template
├── nx.json             - Nx configuration
├── tsconfig.json       - TypeScript configuration
└── eslint.config.mjs   - ESLint with module boundary rules
```

## 🏷️ Understanding Tags

This repository uses tags to enforce module boundaries:

| Project          | Tags                              | Can Import From                       |
| ---------------- | --------------------------------- | ------------------------------------- |
| `studio`         | `scope:streaming`                 | `scope:streaming`, `scope:shared`     |
| `shop`           | `scope:shop`                      | `scope:shop`, `scope:shared`          |
| `api`            | `scope:api`                       | `scope:api`, `scope:shared`           |
| `streaming-core` | `scope:streaming`, `type:feature` | `scope:streaming`, `scope:shared`     |
| `data`           | `scope:shop`, `type:data`         | `scope:shared`                        |
| `models`         | `scope:shared`, `type:data`       | Nothing (base library)                |

## 📚 Useful Commands

```bash
# Project exploration
npx nx graph                                    # Interactive dependency graph
npx nx list                                     # List installed plugins
npx nx show project studio --web               # View project details

# Development
npx nx serve studio                            # Serve streaming studio
npx nx serve shop                              # Serve Angular shop
npx nx serve api                               # Serve backend API
npx nx build studio                            # Build streaming studio
npx nx test streaming-core                     # Test streaming library
npx nx lint studio                             # Lint streaming studio

# Running multiple tasks
npx nx run-many -t build                       # Build all projects
npx nx run-many -t test --parallel=3          # Test in parallel
npx nx run-many -t lint test build            # Run multiple targets

# Affected commands (great for CI)
npx nx affected -t build                       # Build only affected projects
npx nx affected -t test                        # Test only affected projects

# Docker operations
npx nx docker:build api                        # Build Docker image
npx nx docker:run api                          # Run Docker container

# Firebase operations
firebase emulators:start                       # Start Firebase emulators
firebase deploy                                # Deploy to Firebase
firebase deploy --only hosting                 # Deploy hosting only
firebase deploy --only functions               # Deploy functions only
```

## 🎯 Adding New Features

### Generate a new Angular application:

```bash
npx nx g @nx/angular:app my-app
```

### Generate a new Angular library:

```bash
npx nx g @nx/angular:lib my-lib
```

### Generate a new Angular component:

```bash
npx nx g @nx/angular:component my-component --project=my-lib
```

### Generate a new API library:

```bash
npx nx g @nx/node:lib my-api-lib
```

### Generate a Firebase Cloud Function:

```bash
cd functions
firebase functions:shell
```

You can use `npx nx list` to see all available plugins and `npx nx list <plugin-name>` to see all generators for a specific plugin.

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🔗 Learn More

- [Nx Documentation](https://nx.dev)
- [Angular Monorepo Tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial)
- [Module Boundaries](https://nx.dev/features/enforce-module-boundaries)
- [Docker Integration](https://nx.dev/recipes/nx-release/release-docker-images)
- [Playwright Testing](https://nx.dev/technologies/test-tools/playwright/introduction#e2e-testing)
- [Vite with Angular](https://nx.dev/recipes/vite)
- [Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud)
- [Releasing Packages](https://nx.dev/features/manage-releases)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Documentation](https://angular.dev)

## 💬 Community

Join the Nx community:

- [Discord](https://go.nx.dev/community)
- [X (Twitter)](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
- [Blog](https://nx.dev/blog)

---

<div align="center">

**Built with ❤️ using Nx, Angular, Firebase, and AI**

</div>
