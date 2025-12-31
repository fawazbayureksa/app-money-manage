#!/bin/bash

# Firebase Migration Quick Start Script
# This script helps set up your environment for Firebase migration

echo "🔥 Firebase Migration Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm is installed${NC}"

# Check if Firebase CLI is installed
echo ""
echo "🔧 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Firebase CLI installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Firebase CLI${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Firebase CLI is installed${NC}"
fi

# Install project dependencies
echo ""
echo "📚 Installing project dependencies..."
echo ""

# Install Firebase SDK
echo "Installing firebase..."
npx expo install firebase

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install firebase${NC}"
    exit 1
fi
echo -e "${GREEN}✅ firebase installed${NC}"

# Install notification dependencies (for Phase 5)
echo ""
echo "Installing notification dependencies..."
npx expo install expo-notifications expo-device

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install notification dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Notification dependencies installed${NC}"

# Create firebase.json if it doesn't exist
echo ""
echo "📝 Setting up Firebase configuration files..."

if [ ! -f "firebase.json" ]; then
    echo "Creating firebase.json..."
    cat > firebase.json << 'EOF'
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
EOF
    echo -e "${GREEN}✅ firebase.json created${NC}"
else
    echo -e "${YELLOW}⚠️  firebase.json already exists${NC}"
fi

# Create firestore.indexes.json if it doesn't exist
if [ ! -f "firestore.indexes.json" ]; then
    echo "Creating firestore.indexes.json..."
    cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "budgets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "budget_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "categories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
    echo -e "${GREEN}✅ firestore.indexes.json created${NC}"
else
    echo -e "${YELLOW}⚠️  firestore.indexes.json already exists${NC}"
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Login to Firebase CLI:"
echo "   ${YELLOW}firebase login${NC}"
echo ""
echo "2. Initialize Firebase in your project:"
echo "   ${YELLOW}firebase init${NC}"
echo "   - Select: Firestore, Functions, Emulators"
echo "   - Choose your existing Firebase project"
echo ""
echo "3. Add Firebase config to app.json:"
echo "   - Get config from Firebase Console"
echo "   - Add to 'extra.firebase' in app.json"
echo ""
echo "4. Read the documentation:"
echo "   - ${YELLOW}FIREBASE_README.md${NC} (start here)"
echo "   - ${YELLOW}FIREBASE_SETUP.md${NC} (detailed setup)"
echo "   - ${YELLOW}IMPLEMENTATION_GUIDE.md${NC} (step-by-step)"
echo ""
echo "5. Start the Expo development server:"
echo "   ${YELLOW}npx expo start --clear${NC}"
echo ""
echo "6. (Optional) Start Firebase emulators for testing:"
echo "   ${YELLOW}firebase emulators:start${NC}"
echo ""
echo "📚 Documentation files created:"
echo "   - FIREBASE_README.md"
echo "   - FIREBASE_MIGRATION_PLAN.md"
echo "   - FIREBASE_SETUP.md"
echo "   - IMPLEMENTATION_GUIDE.md"
echo "   - CLOUD_FUNCTIONS_GUIDE.md"
echo "   - MIGRATION_CHECKLIST.md"
echo "   - FIREBASE_PACKAGE_SUMMARY.md"
echo ""
echo "🔧 Configuration files created:"
echo "   - src/config/firebase.ts"
echo "   - src/config/features.ts"
echo "   - src/context/FirebaseAuthContext.tsx"
echo "   - src/context/HybridAuthContext.tsx"
echo "   - firestore.rules"
echo "   - firebase.json"
echo "   - firestore.indexes.json"
echo ""
echo -e "${GREEN}Ready to start your Firebase migration! 🚀${NC}"
echo ""
