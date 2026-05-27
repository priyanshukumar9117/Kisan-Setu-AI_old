#!/bin/bash
# Production deployment script for Render
# This script prepares the application for production deployment

set -e

echo "🚀 Kisan Setu AI - Production Deployment Setup"
echo "================================================"

# 1. Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 2. Run migrations
echo "🗄️ Running database migrations..."
cd backend
python manage.py migrate
python manage.py migrate api
python manage.py migrate frontend

# 3. Collect static files
echo "📂 Collecting static files..."
python manage.py collectstatic --noinput

# 4. Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs

# 5. Optional: Build RAG database (comment out if too large)
# echo "🧠 Building RAG vector database..."
# cd ..
# python build_rag.py

echo ""
echo "✅ Deployment setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Ensure all environment variables are set in Render dashboard"
echo "2. Create superuser: python manage.py createsuperuser"
echo "3. Monitor logs: Render Dashboard > Service > Logs"
echo ""
