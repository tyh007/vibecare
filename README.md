# VibeCare 🌟

**Your Personal Wellness Companion for College Life**

VibeCare is a comprehensive mental wellness platform designed specifically for college students, combining AI-powered support, mood tracking, and community connection to help you navigate the challenges of student life.

## 🎯 Features

### 🤖 AI Companions
- **Vibe Partner**: Your personalized AI companion (choose from cat, dog, or panda) that provides empathetic support and CBT-based guidance
- **Professional CBT Therapist**: Access evidence-based cognitive behavioral therapy support for deeper mental health needs
- Powered by Google Gemini 2.5 Flash for intelligent, context-aware conversations

### 📊 Wellness Tracking
- **Mood Tracker**: Log your daily moods and track emotional patterns over time
- **Check-in System**: Build healthy habits with daily check-ins and streak rewards
- **Visual Analytics**: See your wellness journey through intuitive charts and insights

### 👥 Community Support
- **Common Room**: AI-monitored safe space to share thoughts and connect with peers
- Real-time messaging with automatic content moderation for user safety
- Crisis detection system that recommends professional help when needed

### 🎨 Personalization & Rewards
- **Avatar Customization**: Create your unique pixel avatar with customizable features (hairstyles, colors, accessories)
- **Shop System**: Earn coins through engagement and purchase avatar items
- **Streak Rewards**: Stay motivated with daily check-in streaks and achievements

### 🔒 Privacy & Security
- End-to-end user authentication with secure data handling
- Row-level security policies protecting all user data
- AI content moderation for community safety

## 🛠️ Technology Stack

**Frontend**
- React 18 with TypeScript
- Vite for lightning-fast development
- Tailwind CSS for modern, responsive design
- shadcn/ui components for beautiful UI
- Recharts for data visualization

**Backend (Lovable Cloud)**
- Supabase for database and authentication
- Edge Functions for serverless AI processing
- Real-time subscriptions for live updates
- Secure secrets management

**AI Integration**
- Lovable AI Gateway
- Google Gemini 2.5 Flash models
- Context-aware conversation handling
- Crisis detection and intervention

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm installed
- A Lovable account (for Cloud features)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd vibecare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# .env file is automatically configured when using Lovable Cloud
# For local development, ensure you have:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in your browser

## 📱 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── mascot/         # Vibe Partner chat components
│   ├── ui/             # shadcn/ui components
│   └── ...
├── pages/              # Application pages
│   ├── Auth.tsx        # Authentication
│   ├── Dashboard.tsx   # Main dashboard
│   ├── MoodTracker.tsx # Mood logging
│   ├── VibePartnerChat.tsx
│   ├── CBTTherapist.tsx
│   ├── CommonRoom.tsx  # Community chat
│   └── Shop.tsx        # Avatar shop
├── hooks/              # Custom React hooks
├── integrations/       # Supabase integration
└── utils/              # Utility functions

supabase/
├── functions/          # Edge Functions
│   ├── vibe-partner-chat/
│   ├── cbt-therapist-chat/
│   └── moderate-message/
└── migrations/         # Database migrations
```

## 🔐 Security Features

- **Authenticated Edge Functions**: All AI endpoints require valid JWT tokens
- **Row-Level Security**: Users can only access their own data
- **Input Validation**: Server-side validation for all user inputs
- **Content Moderation**: AI-powered detection of concerning messages
- **Secure Sessions**: Automatic token refresh and session management

## 🎨 Key Features Explained

### Mood Tracking
Track your emotional state daily and see patterns over time. The system uses a 1-5 scale with visual representations and generates insights about your wellness journey.

### AI Chat Support
- **Vibe Partner**: Casual, friendly support for everyday wellness
- **CBT Therapist**: Professional-level cognitive behavioral therapy techniques
- Both use advanced AI to provide personalized, context-aware responses

### Community Room
A moderated space where students can share experiences. AI monitors messages for concerning content and automatically suggests professional help when needed.

### Rewards System
Earn coins through:
- Daily check-ins
- Maintaining streaks
- Regular engagement

Use coins to customize your avatar with hats, accessories, and more!

## 🚢 Deployment

### Deploy with Lovable (Recommended)
1. Open your project in [Lovable](https://lovable.dev)
2. Click **Publish** in the top right
3. Your app will be deployed to `yourapp.lovable.app`

### Connect Custom Domain
1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow the DNS configuration steps
4. Your app will be available at your custom domain

### Self-Hosting
The codebase is standard React/Vite and can be deployed to any hosting platform:
- Vercel
- Netlify
- AWS Amplify
- Your own server

Note: You'll need to configure Supabase environment variables in your hosting platform.

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database Migrations

Database changes are managed through Supabase migrations in `supabase/migrations/`. The Lovable Cloud integration handles deployment automatically.

### Adding Features

VibeCare is built with modularity in mind. To add new features:

1. Create new components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.tsx`
4. Add database tables via migrations if needed
5. Create edge functions for backend logic

## 🤝 Contributing

This is a Lovable-generated project. Changes can be made by:
- Using the Lovable editor
- Pushing commits to this repository
- Editing directly on GitHub

All changes sync bidirectionally between Lovable and GitHub.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support & Resources

- **Lovable Documentation**: [docs.lovable.dev](https://docs.lovable.dev)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community Discord**: Join the Lovable community for help and discussions

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [Supabase](https://supabase.com)
- AI by [Google Gemini](https://deepmind.google/technologies/gemini/)
- UI components by [shadcn/ui](https://ui.shadcn.com)

---

**Note**: This is a mental wellness support tool, not a replacement for professional mental health care. If you're experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.

**Crisis Resources**:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: [iasp.info](https://www.iasp.info/resources/Crisis_Centres/)
