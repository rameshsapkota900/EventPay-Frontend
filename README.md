# 🎫 EventPay Frontend

A modern, responsive digital payment system for managing events with role-based access control, real-time updates, and QR code payments.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** - Secure login with automatic token refresh
- 👥 **Multi-Role System** - 5 distinct user roles with tailored interfaces
- 💳 **Digital Wallet** - Real-time balance management
- 📱 **QR Code Payments** - Scan-to-pay functionality
- 🔄 **Real-time Updates** - WebSocket integration for live data
- 📊 **Analytics Dashboard** - Role-specific metrics and charts
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Premium UI** - Glassmorphism design with smooth animations

### User Capabilities by Role
- **Super Admin**: Platform management, organization oversight
- **Org Admin**: Event management, stall & student administration
- **Stall Owner**: Transaction processing, revenue tracking
- **Volunteer**: Student registration and onboarding
- **Student**: Make payments, view transaction history

## 🛠 Technology Stack

### Core
- **React 18.3.1** - UI library with hooks
- **TypeScript 5.6.2** - Type-safe development
- **Vite 5.4.10** - Fast build tool and dev server
- **React Router DOM 6.22.0** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Recharts 2.12.2** - Data visualization

### Real-time & Data
- **STOMP.js & SockJS** - WebSocket communication
- **React Hook Form** - Form management
- **date-fns** - Date utilities

### Additional
- **QRCode.react** - QR code generation
- **jsQR** - QR code scanning

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 (LTS recommended)
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git** (for version control)

Check your versions:
```bash
node --version
npm --version
```

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd eventpay-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

This will install all required packages (~200MB).

## ⚙️ Environment Setup

### 1. Create Environment File
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` and update the following:

```env
# Backend API URL (without /api/v1 suffix)
VITE_API_URL=http://localhost:8080/api/v1

# WebSocket URL for real-time updates
VITE_WS_URL=http://localhost:8080/ws
```

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api/v1` |
| `VITE_WS_URL` | WebSocket endpoint URL | `http://localhost:8080/ws` |

**Note**: If `VITE_WS_URL` is not set, it will be auto-derived from `VITE_API_URL`.

### 3. Backend Requirements
Ensure your backend server is running and accessible at the configured URL. The backend should provide:
- REST API endpoints at `/api/v1/*`
- WebSocket endpoint at `/ws`
- CORS enabled for your frontend origin

## 💻 Development

### Start Development Server
```bash
npm run dev
```

The application will be available at:
- **URL**: http://localhost:3000
- **Hot Reload**: Enabled
- **API Proxy**: `/api` → `http://localhost:8080`

### Development Features
- ⚡ **Fast HMR** - Instant updates without full reload
- 🔍 **TypeScript Checking** - Real-time type validation
- 🎨 **Tailwind JIT** - On-demand CSS compilation
- 🔄 **Auto Proxy** - API requests automatically proxied

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🏗 Build & Deployment

### Production Build
```bash
npm run build
```

This creates an optimized build in the `dist/` directory:
- Minified JavaScript and CSS
- Code splitting for optimal loading
- Asset optimization
- Source maps for debugging

### Build Output
```
dist/
├── assets/          # JS, CSS, and other assets
├── index.html       # Entry HTML file
└── ...
```

### Preview Production Build
```bash
npm run preview
```

Serves the production build locally at http://localhost:4173

### Deployment Options

#### Static Hosting (Recommended)
Deploy the `dist/` folder to:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist/` folder
- **AWS S3 + CloudFront**: Upload to S3 bucket
- **GitHub Pages**: Use `gh-pages` package

#### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Builds

For different environments, create separate `.env` files:
- `.env.development` - Development
- `.env.staging` - Staging
- `.env.production` - Production

## 📁 Project Structure

```
eventpay-frontend/
├── public/
│   └── background.png          # Static assets
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard widgets
│   │   │   ├── metric-card.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   ├── org-admin/          # Org admin dialogs
│   │   ├── stall-owner/        # Stall owner components
│   │   ├── super-admin/        # Super admin dialogs
│   │   └── ui/                 # Reusable UI components (22)
│   ├── constants/
│   │   ├── config.ts           # App configuration
│   │   └── index.ts
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth-context.tsx    # Authentication
│   │   ├── notification-context.tsx
│   │   ├── realtime.ts         # WebSocket
│   │   └── utils.ts
│   ├── pages/
│   │   ├── super-admin/        # Super admin pages
│   │   ├── org-admin/          # Org admin pages
│   │   ├── stall-owner/        # Stall owner pages
│   │   ├── volunteer/          # Volunteer pages
│   │   ├── student/            # Student pages
│   │   ├── login.tsx
│   │   └── ...
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
├── .gitignore
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML template
├── package.json                # Dependencies
├── postcss.config.cjs          # PostCSS config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── README.md
```

## 👥 User Roles

### 1. Super Admin (`SUPER_ADMIN`)
**Access**: Platform-wide management
- Dashboard with system metrics
- Manage organizations
- View all users
- Generate system reports

**Routes**: `/super-admin/*`

### 2. Organization Admin (`ORG_ADMIN`)
**Access**: Organization-level management
- Dashboard with org metrics
- Manage events
- Manage stalls and owners
- Manage students
- Manage volunteers
- View transactions
- Manage users
- Generate reports

**Routes**: `/org-admin/*`

### 3. Stall Owner (`STALL_OWNER`)
**Access**: Stall operations
- Dashboard with revenue stats
- Process payments from students
- View transaction history
- Manage profile

**Routes**: `/stall-owner/*`

### 4. Volunteer (`VOLUNTEER`)
**Access**: Student registration
- Dashboard
- Register new students
- View registration history

**Routes**: `/volunteer/*`

### 5. Student (`STUDENT`)
**Access**: Payment operations
- Dashboard with wallet balance
- Make payments via QR code
- View transaction history
- Manage profile

**Routes**: `/student/*`

## 🔌 API Integration

### API Client
The application uses a custom API client (`src/lib/api.ts`) with:
- Automatic JWT token management
- Token refresh on 401 errors
- Request/response interceptors
- Type-safe endpoints

### Authentication Flow
1. User logs in with email/phone + password
2. Backend returns JWT access token + refresh token
3. Access token stored in localStorage
4. Automatic refresh when token expires
5. Redirect to login on refresh failure

### WebSocket Integration
Real-time updates for:
- Wallet balance changes
- Stall revenue updates
- Transaction notifications

### API Endpoints Structure
```
/api/v1/
├── auth/
│   ├── login
│   ├── logout
│   ├── refresh
│   └── ...
├── super-admin/
├── org-admin/
├── stall-owner/
├── volunteer/
└── student/
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep navy blue (`#0F172A`)
- **Accent**: Warm amber (`#F59E0B`)
- **Background**: White/Navy (light/dark mode)

### Typography
- **Font**: Poppins (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
22 reusable UI components built with Radix UI:
- Buttons, Cards, Dialogs, Forms
- Tables, Tabs, Tooltips
- Alerts, Badges, Skeletons
- And more...

## 🧪 Testing

### Manual Testing
1. Start the dev server: `npm run dev`
2. Test each user role with appropriate credentials
3. Verify real-time updates
4. Test responsive design on different devices

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 3001
```

#### API Connection Failed
- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Ensure CORS is enabled on backend
- Check network/firewall settings

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

#### TypeScript Errors
```bash
# Rebuild TypeScript
npm run build
```

## 📝 Contributing

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Run linter: `npm run lint`
4. Build to verify: `npm run build`
5. Commit with clear messages
6. Push and create pull request

### Code Style
- Use TypeScript for all new files
- Follow existing component patterns
- Use Tailwind for styling
- Add comments for complex logic
- Keep components small and focused

## 📄 License

[Add your license information here]

## 🤝 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
