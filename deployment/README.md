# TOff Deployment Guide

This guide covers deploying TOff to Vercel (frontend) and Render (backend + database).

## Prerequisites

- GitHub account with your code repository
- Vercel account
- Render account
- Cloudinary account (for file uploads)

## Backend Deployment (Render)

### 1. Create PostgreSQL Database

1. Login to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `toff-postgres`
   - **Database Name**: `toff_db`
   - **Plan**: Free (or upgrade as needed)
   - **Region**: Oregon (or closest to your users)

### 2. Deploy Backend API

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `toff-api`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (or upgrade as needed)

### 3. Environment Variables

Add these environment variables in Render:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=[Auto-filled from PostgreSQL connection]
JWT_ACCESS_SECRET=[Generate strong secret]
JWT_REFRESH_SECRET=[Generate strong secret]
CORS_ORIGIN=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=[Your Cloudinary cloud name]
CLOUDINARY_API_KEY=[Your Cloudinary API key]
CLOUDINARY_API_SECRET=[Your Cloudinary API secret]
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
```

### 4. Database Setup

After deployment, run database migrations:

```bash
# Connect to your Render shell or use local environment with production DATABASE_URL
npx prisma migrate deploy
npx prisma generate
```

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel

1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables

Add these environment variables in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-api.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Domain Configuration

1. Go to your project settings in Vercel
2. Add your custom domain (optional)
3. Update CORS_ORIGIN in your Render backend to match your domain

## Post-Deployment Setup

### 1. Test the Application

1. Visit your Vercel URL
2. Create a test account
3. Verify authentication works
4. Test real-time features

### 2. Database Seeding (Optional)

Create initial data or test users if needed:

```bash
# Run seeding script
npm run db:seed
```

### 3. Monitoring Setup

1. **Render**: Monitor logs and metrics in dashboard
2. **Vercel**: Set up analytics and error tracking
3. **Database**: Monitor PostgreSQL performance

## Environment-Specific Configurations

### Development
```env
# Backend
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/toff_dev
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Production
```env
# Backend
NODE_ENV=production
DATABASE_URL=[Render PostgreSQL URL]
CORS_ORIGIN=https://your-app.vercel.app

# Frontend
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-api.onrender.com
```

## Security Considerations

1. **JWT Secrets**: Generate strong, unique secrets for production
2. **CORS**: Set specific origins, not wildcards
3. **Rate Limiting**: Adjust limits based on expected usage
4. **File Uploads**: Configure Cloudinary security settings
5. **HTTPS**: Ensure all connections use HTTPS in production

## Scaling Considerations

### Database
- Start with Free tier
- Upgrade to paid plans for production usage
- Consider connection pooling for high traffic

### Backend
- Start with Starter plan
- Scale up based on CPU and memory usage
- Consider horizontal scaling for high traffic

### Frontend
- Vercel handles scaling automatically
- Optimize images and bundle size
- Use CDN for static assets

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL format
2. **CORS Errors**: Verify CORS_ORIGIN matches frontend domain
3. **Socket Connection**: Ensure WebSocket support is enabled
4. **File Uploads**: Verify Cloudinary credentials
5. **Build Failures**: Check logs for dependency issues

### Debugging Steps

1. Check Render logs for backend errors
2. Check Vercel function logs for frontend issues
3. Test API endpoints directly
4. Verify environment variables are set correctly
5. Check network connectivity between services

## Maintenance

### Regular Tasks
- Monitor logs for errors
- Update dependencies
- Backup database regularly
- Review and rotate JWT secrets
- Monitor Cloudinary usage and costs

### Updates
1. Test changes in development
2. Deploy backend changes first
3. Deploy frontend changes
4. Monitor for issues
5. Rollback if needed

## Support

For deployment issues:
1. Check Render documentation
2. Check Vercel documentation
3. Review application logs
4. Test locally with production environment variables
