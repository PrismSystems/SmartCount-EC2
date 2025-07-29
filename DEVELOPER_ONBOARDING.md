# Smart Count - Developer Onboarding Guide

Welcome to the Smart Count project! This guide will help you get up and running with the codebase, understand the architecture, and deploy the application.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Key Features](#key-features)
6. [Development Workflow](#development-workflow)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Project Overview

Smart Count is a web-based takeoff application for electrical contractors. It allows users to:
- Upload PDF floor plans
- Create and manage electrical symbols
- Count and place symbols on PDFs
- Generate reports and export data
- Manage DALI lighting networks
- Export projects to PDF with legends

**Tagline:** "Your takeoff 🚀, accelerated."

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **PDF.js** for PDF rendering and manipulation
- **@google/genai** for AI features

### Backend
- **Node.js** with Express
- **PostgreSQL** for database
- **AWS SDK** for file storage
- **JWT** for authentication
- **bcryptjs** for password hashing

### Deployment
- **Nginx** as reverse proxy
- **PM2** for process management
- **Let's Encrypt** for SSL certificates
- **Ubuntu** server environment

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd smart-count
```

2. **Install dependencies:**
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

3. **Environment Setup:**
   Create `.env` files for both frontend and backend:

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Backend `server/.env`:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/smartcount
JWT_SECRET=your_jwt_secret_here
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

4. **Start development servers:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
smart-count/
├── src/
│   ├── components/          # React components
│   │   ├── ProjectScreen.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── SymbolCard.tsx
│   │   └── icons.tsx
│   ├── services/           # API and utility services
│   │   ├── api.ts
│   │   ├── pdfExportService.ts
│   │   └── storageService.ts
│   ├── types.ts           # TypeScript type definitions
│   ├── constants.ts       # App constants
│   ├── App.tsx           # Main app component
│   └── main.tsx          # App entry point
├── server/               # Backend Express server
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── .env            # Backend environment variables
├── deploy/              # Deployment configuration
│   ├── ecosystem.config.js  # PM2 configuration
│   ├── nginx.conf          # Nginx configuration
│   └── install.sh         # Server setup script
├── public/              # Static assets
├── Dockerfile          # Docker configuration
└── package.json        # Frontend dependencies
```

## Key Features

### 1. Project Management
- Create projects with multiple PDF floor plans
- Assign levels to PDFs (L01, L02, etc.)
- Use existing projects as templates
- Local storage for project data

### 2. Symbol System
- Create custom electrical symbols
- Upload custom images for symbols
- Organize symbols by discipline (Power, Lighting, etc.)
- Color-coded symbol categories

### 3. PDF Interaction
- Zoom and pan PDF documents
- Place symbols on PDFs with click/drag
- Multi-select symbols for bulk operations
- Undo/redo functionality

### 4. DALI Lighting Networks
- Create DALI networks with ECG/ECD devices
- Automatic address assignment
- Current calculations
- Network topology management

### 5. Export & Reporting
- Export projects to PDF with legends
- Generate symbol count reports
- Include measurements and calculations

## Development Workflow

### Code Style
- Use TypeScript for type safety
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Keep components small and focused

### State Management
- Local state with React hooks
- Project data stored in localStorage
- Real-time updates with immediate persistence

### API Integration
- RESTful API design
- JWT authentication
- Error handling with user feedback
- File uploads for PDFs and images

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check
```

## Deployment

### Production Server Setup

1. **Initial Server Setup:**
```bash
# Run the installation script
chmod +x deploy/install.sh
./deploy/install.sh
```

This installs:
- Node.js 18
- PM2 process manager
- Nginx web server
- Creates app directory at `/var/www/smartcount`

2. **Deploy Application:**
```bash
# Copy files to server
scp -r . ubuntu@your-server:/var/www/smartcount/

# SSH into server
ssh ubuntu@your-server

# Navigate to app directory
cd /var/www/smartcount

# Install dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# Configure PM2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

3. **Configure Nginx:**
```bash
# Copy nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/smartcount

# Enable site
sudo ln -sf /etc/nginx/sites-available/smartcount /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

4. **SSL Certificate:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already set up by certbot)
sudo crontab -l | grep certbot
```

### Environment Variables (Production)

**Server environment:**
```bash
# Set in /var/www/smartcount/server/.env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/smartcount_prod
JWT_SECRET=your_production_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=smartcount-prod
```

### Deployment Commands

```bash
# Update application
cd /var/www/smartcount
git pull origin main
npm install
npm run build
pm2 restart smartcount-server

# View logs
pm2 logs smartcount-server

# Monitor processes
pm2 monit

# Restart nginx
sudo systemctl restart nginx
```

### Database Setup (if using PostgreSQL)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE smartcount_prod;
CREATE USER smartcount_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE smartcount_prod TO smartcount_user;
\q
```

## Configuration Files

### PM2 Configuration (`deploy/ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'smartcount-server',
    script: './server/server.js',
    cwd: '/var/www/smartcount',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Nginx Configuration (`deploy/nginx.conf`)
- Serves static files from `/var/www/smartcount/dist`
- Proxies API requests to `localhost:3001`
- Handles SSL termination
- Sets appropriate headers and timeouts

## Troubleshooting

### Common Issues

1. **"Request Entity Too Large" Error:**
    - Increase `client_max_body_size` in nginx.conf
    - Increase Express payload limits in server.js

2. **SSL Certificate Issues:**
    - Ensure domain points to server IP
    - Check nginx configuration syntax
    - Verify certificate files exist

3. **PM2 Process Not Starting:**
    - Check server logs: `pm2 logs smartcount-server`
    - Verify environment variables
    - Check file permissions

4. **PDF Upload/Processing Issues:**
    - Verify file size limits
    - Check browser console for errors
    - Ensure PDF.js is properly loaded

### Useful Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# View application logs
pm2 logs smartcount-server --lines 100

# Restart everything
pm2 restart all
sudo systemctl restart nginx

# Check disk space
df -h

# Check memory usage
free -h

# Monitor real-time logs
tail -f /var/log/nginx/access.log
```

### Development Tips

1. **Hot Reloading:** Use `npm run dev` for frontend hot reloading
2. **API Testing:** Use tools like Postman or curl to test API endpoints
3. **Browser DevTools:** Use React DevTools extension for debugging
4. **Console Logging:** Check browser console for client-side errors
5. **Network Tab:** Monitor API requests and responses

### Getting Help

- Check the browser console for client-side errors
- Check PM2 logs for server-side errors: `pm2 logs`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Review this documentation for common solutions

## Next Steps

After completing setup:
1. Familiarize yourself with the codebase structure
2. Run the application locally and test key features
3. Review the type definitions in `types.ts`
4. Understand the PDF rendering pipeline
5. Test the deployment process in a staging environment

Welcome to the team! 🚀