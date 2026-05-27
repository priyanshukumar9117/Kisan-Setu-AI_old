#!/bin/bash
# Environment-specific deployment helper

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
show_help() {
    echo "Usage: ./deploy.sh [ENVIRONMENT]"
    echo ""
    echo "Environments:"
    echo "  dev              - Local development (full feature set)"
    echo "  prod-minimal     - Render free tier (512MB RAM - minimal)"
    echo "  prod             - Production with ML (1GB+ RAM instance needed)"
    echo "  test-minimal     - Test production-minimal locally"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh dev              # Install development deps"
    echo "  ./deploy.sh prod-minimal     # Install production-minimal deps"
    echo "  ./deploy.sh test-minimal     # Test with production-minimal deps"
    echo ""
}

install_deps() {
    local env=$1
    local reqfile=$2
    
    echo -e "${YELLOW}Installing dependencies for: $env${NC}"
    echo "Requirements file: $reqfile"
    echo ""
    
    if [ ! -f "$reqfile" ]; then
        echo -e "${RED}Error: $reqfile not found${NC}"
        exit 1
    fi
    
    pip install --upgrade pip setuptools wheel
    pip install -r "$reqfile"
    
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

test_imports() {
    echo ""
    echo -e "${YELLOW}Testing core imports...${NC}"
    python3 << 'EOF'
try:
    import django
    print("✓ Django")
    import djangorestframework
    print("✓ Django REST Framework")
    import telegram
    print("✓ python-telegram-bot")
    
    try:
        import torch
        print("✓ PyTorch (heavy - NOT in production-minimal)")
    except ImportError:
        print("✗ PyTorch (expected in production-minimal)")
    
    try:
        import whisper
        print("✓ OpenAI Whisper (heavy - NOT in production-minimal)")
    except ImportError:
        print("✗ OpenAI Whisper (expected in production-minimal)")
    
    try:
        import edge_tts
        print("✓ Edge TTS (lightweight alternative)")
    except ImportError:
        print("✗ Edge TTS")
        
    print("\n✓ Core imports working!")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)
EOF
}

run_migrations() {
    echo ""
    echo -e "${YELLOW}Running Django migrations...${NC}"
    cd backend
    python manage.py migrate
    cd ..
    echo -e "${GREEN}✓ Migrations complete${NC}"
}

# Main script
if [ "$#" -eq 0 ]; then
    show_help
    exit 0
fi

ENV=$1

case "$ENV" in
    dev)
        install_deps "Development (Full Features)" "requirements/development.txt"
        test_imports
        echo ""
        echo -e "${GREEN}Ready for local development${NC}"
        echo "To start: python manage.py runserver"
        ;;
    prod-minimal)
        install_deps "Production - Minimal (512MB RAM)" "requirements/production-minimal.txt"
        test_imports
        echo ""
        echo -e "${GREEN}Ready for Render free tier deployment${NC}"
        echo "Next: git push to deploy"
        ;;
    prod)
        install_deps "Production (Full ML Stack)" "requirements/production.txt"
        test_imports
        echo ""
        echo -e "${YELLOW}Note: Requires 1GB+ RAM instance${NC}"
        echo -e "${GREEN}Ready for production deployment${NC}"
        ;;
    test-minimal)
        echo -e "${YELLOW}Testing production-minimal configuration...${NC}"
        echo ""
        
        # Check current environment
        CURRENT=$(pip freeze | wc -l)
        echo "Current packages installed: $CURRENT"
        
        # Ask for confirmation
        echo ""
        echo -e "${YELLOW}This will install production-minimal dependencies.${NC}"
        echo "Current dev dependencies may conflict. Continue? (y/n)"
        read -r response
        
        if [ "$response" != "y" ]; then
            echo "Cancelled."
            exit 0
        fi
        
        install_deps "Testing Production-Minimal" "requirements/production-minimal.txt"
        test_imports
        run_migrations
        
        echo ""
        echo -e "${GREEN}✓ production-minimal configuration tested successfully!${NC}"
        echo "You can now test the API:"
        echo "  cd backend && python manage.py runserver"
        ;;
    *)
        echo -e "${RED}Unknown environment: $ENV${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
