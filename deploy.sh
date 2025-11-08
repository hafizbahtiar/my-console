#!/bin/bash

# Deployment script for My Console
# This script pulls latest changes, installs dependencies, builds, and reloads PM2
#
# Usage:
#   ./deploy.sh
#
# Make sure the script is executable:
#   chmod +x deploy.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/var/www/my-console"

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# Step 1: Change to project directory
echo -e "${YELLOW}📁 Changing to project directory: ${PROJECT_DIR}${NC}"
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Error: Failed to change to directory ${PROJECT_DIR}${NC}"
    exit 1
}

# Step 2: Pull latest changes from git
echo -e "${YELLOW}📥 Pulling latest changes from git...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful${NC}"
else
    echo -e "${RED}❌ Error: Git pull failed${NC}"
    exit 1
fi

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Error: npm install failed${NC}"
    exit 1
fi

# Step 4: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Error: Build failed${NC}"
    exit 1
fi

# Step 5: Reload PM2
echo -e "${YELLOW}🔄 Reloading PM2...${NC}"
if pm2 reload ecosystem.config.cjs; then
    echo -e "${GREEN}✅ PM2 reloaded successfully${NC}"
else
    echo -e "${RED}❌ Error: PM2 reload failed${NC}"
    exit 1
fi

# Success message
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Check PM2 status with: pm2 status${NC}"
echo -e "${GREEN}📋 Check PM2 logs with: pm2 logs my-console${NC}"

