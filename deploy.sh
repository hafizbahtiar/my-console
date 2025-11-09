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
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/var/www/my-console"
START_TIME=$(date +%s)

# Function to print section header
print_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check required tools
check_requirements() {
    print_section "🔍 Checking Requirements"
    
    local missing_tools=()
    
    if ! command_exists bun; then
        missing_tools+=("bun")
    else
        echo -e "${GREEN}✅ Bun is installed${NC} ($(bun --version))"
    fi
    
    if ! command_exists git; then
        missing_tools+=("git")
    else
        echo -e "${GREEN}✅ Git is installed${NC} ($(git --version | cut -d' ' -f3))"
    fi
    
    if ! command_exists pm2; then
        missing_tools+=("pm2")
    else
        echo -e "${GREEN}✅ PM2 is installed${NC} ($(pm2 --version))"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        exit 1
    fi
}

# Function to check environment file
check_env_file() {
    if [ ! -f "$PROJECT_DIR/.env.local" ] && [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${YELLOW}⚠️  Warning: No .env or .env.local file found${NC}"
        echo -e "${YELLOW}   Make sure environment variables are set${NC}"
    else
        echo -e "${GREEN}✅ Environment file found${NC}"
    fi
}

# Function to get elapsed time
get_elapsed_time() {
    local end_time=$(date +%s)
    local elapsed=$((end_time - START_TIME))
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))
    echo "${minutes}m ${seconds}s"
}

# Main deployment
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🚀 My Console Deployment Script 🚀            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo -e "${BLUE}Started at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"

# Step 1: Check requirements
check_requirements

# Step 2: Change to project directory
print_section "📁 Project Directory"
echo -e "${YELLOW}Changing to project directory: ${PROJECT_DIR}${NC}"
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Error: Failed to change to directory ${PROJECT_DIR}${NC}"
    exit 1
}
echo -e "${GREEN}✅ Current directory: $(pwd)${NC}"

# Step 3: Check environment file
check_env_file

# Step 4: Check git status
print_section "📥 Git Operations"
echo -e "${YELLOW}Checking git status...${NC}"
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
        echo -e "${YELLOW}   Consider committing or stashing changes before deployment${NC}"
    fi
    
    echo -e "${YELLOW}Pulling latest changes from git...${NC}"
    if git pull origin "$CURRENT_BRANCH" 2>&1; then
        LATEST_COMMIT=$(git log -1 --oneline)
        echo -e "${GREEN}✅ Git pull successful${NC}"
        echo -e "${BLUE}Latest commit: ${LATEST_COMMIT}${NC}"
    else
        echo -e "${RED}❌ Error: Git pull failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    exit 1
fi

# Step 5: Clean previous build
print_section "🧹 Cleanup"
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✅ Removed .next directory${NC}"
fi
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo -e "${GREEN}✅ Cleared node_modules cache${NC}"
fi

# Step 6: Install dependencies
print_section "📦 Installing Dependencies"
echo -e "${YELLOW}Installing dependencies with Bun...${NC}"
INSTALL_START=$(date +%s)
if bun install --frozen-lockfile 2>&1; then
    INSTALL_END=$(date +%s)
    INSTALL_TIME=$((INSTALL_END - INSTALL_START))
    echo -e "${GREEN}✅ Dependencies installed successfully${NC} (${INSTALL_TIME}s)"
    
    # Show dependency count
    if [ -f "package.json" ]; then
        DEP_COUNT=$(grep -c '"' package.json || echo "0")
        echo -e "${BLUE}📊 Package.json found with dependencies${NC}"
    fi
else
    echo -e "${RED}❌ Error: Bun install failed${NC}"
    echo -e "${YELLOW}💡 Tip: Try running 'bun install' manually to see detailed errors${NC}"
    exit 1
fi

# Step 7: Build the application
print_section "🔨 Building Application"
echo -e "${YELLOW}Building application with Next.js...${NC}"
BUILD_START=$(date +%s)
if bun run build 2>&1; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    echo -e "${GREEN}✅ Build successful${NC} (${BUILD_TIME}s)"
    
    # Check if .next directory exists
    if [ -d ".next" ]; then
        NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        echo -e "${BLUE}📊 Build output size: ${NEXT_SIZE}${NC}"
    fi
else
    echo -e "${RED}❌ Error: Build failed${NC}"
    echo -e "${YELLOW}💡 Tip: Check the build output above for detailed errors${NC}"
    exit 1
fi

# Step 8: Reload PM2
print_section "🔄 PM2 Reload"
echo -e "${YELLOW}Reloading PM2 process...${NC}"
if pm2 reload ecosystem.config.cjs 2>&1; then
    echo -e "${GREEN}✅ PM2 reloaded successfully${NC}"
    
    # Wait a moment for PM2 to stabilize
    sleep 2
    
    # Check PM2 status
    if pm2 list | grep -q "my-console"; then
        PM2_STATUS=$(pm2 jlist | grep -A 5 "my-console" | grep "pm2_env.status" | cut -d'"' -f4 || echo "unknown")
        echo -e "${BLUE}📊 PM2 Status: ${PM2_STATUS}${NC}"
    fi
else
    echo -e "${RED}❌ Error: PM2 reload failed${NC}"
    echo -e "${YELLOW}💡 Tip: Try 'pm2 restart ecosystem.config.cjs' manually${NC}"
    exit 1
fi

# Success message
print_section "🎉 Deployment Complete"
ELAPSED=$(get_elapsed_time)
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}⏱️  Total time: ${ELAPSED}${NC}"
echo -e "${BLUE}Finished at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "  ${YELLOW}📊 Check PM2 status:${NC}  pm2 status"
echo -e "  ${YELLOW}📋 View PM2 logs:${NC}    pm2 logs my-console"
echo -e "  ${YELLOW}📈 Monitor PM2:${NC}     pm2 monit"
echo -e "  ${YELLOW}🔄 Restart PM2:${NC}      pm2 restart ecosystem.config.cjs"
echo ""

