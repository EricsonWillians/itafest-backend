#!/bin/bash

# ===========================================
# Firebase Authentication Testing Script
# Purpose: Test Google SSO integration
# ===========================================

# Configuration
CREDENTIALS_PATH="/home/camilaguedes/Documents/itafest-dev-61e78-firebase-adminsdk-b8a35-b9fc68213b.json"
PROJECT_ID=$(cat $CREDENTIALS_PATH | jq -r '.project_id')
AUTH_EMULATOR="http://127.0.0.1:9099"
BACKEND_URL="http://localhost:8000"
API_VERSION="v1"
API_KEY="AIzaSyD0FMZFFbHczu5HRwi1K6d9-6G9D8afBJc"

# Output formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO] $1${NC}"; }
log_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Environment validation
validate_environment() {
    log_info "Validating environment..."
    
    # Check required tools
    command -v jq >/dev/null 2>&1 || { log_error "jq is required"; exit 1; }
    command -v curl >/dev/null 2>&1 || { log_error "curl is required"; exit 1; }
    command -v nc >/dev/null 2>&1 || { log_error "netcat is required"; exit 1; }

    # Validate service account
    if [ ! -f "$CREDENTIALS_PATH" ]; then
        log_error "Service account file not found at $CREDENTIALS_PATH"
        exit 1
    fi

    # Check services
    nc -z localhost 9099 > /dev/null 2>&1 || { log_error "Firebase Auth Emulator not running"; exit 1; }
    nc -z localhost 8000 > /dev/null 2>&1 || { log_error "Backend server not running"; exit 1; }

    log_success "Environment validation complete"
}

# Test Google Sign-In
test_google_signin() {
    log_info "Testing Google Sign-In..."
    
    # Create a properly escaped JSON token
    FAKE_ID_TOKEN=$(jq -c -n \
        --arg sub "123456789" \
        --arg email "test@example.com" \
        --arg name "Test User" \
        --arg picture "https://example.com/photo.jpg" \
        '{
            sub: $sub,
            email: $email,
            name: $name,
            picture: $picture,
            email_verified: true
        }')

    # Properly escape the token for URL
    ESCAPED_TOKEN=$(echo "$FAKE_ID_TOKEN" | jq -sRr @uri)

    # Sign in with Google
    local response=$(curl -s "${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"postBody\": \"id_token=${ESCAPED_TOKEN}&providerId=google.com\",
            \"requestUri\": \"http://localhost\",
            \"returnSecureToken\": true
        }")

    echo "$response" | jq -r '.idToken' || {
        log_error "Google Sign-In failed"
        echo "Response: $response"
        exit 1
    }
}

# Test SSO endpoint
test_sso_endpoint() {
    local id_token=$1
    log_info "Testing SSO endpoint..."

    local response=$(curl -s -X POST "${BACKEND_URL}/api/${API_VERSION}/auth/google" \
        -H 'Content-Type: application/json' \
        -d "{\"idToken\": \"${id_token}\"}")

    echo "$response" | jq -r '.data.firebaseToken' || {
        log_error "SSO endpoint test failed"
        echo "Response: $response"
        exit 1
    }
}

# Test token verification
test_token_verification() {
    local firebase_token=$1
    log_info "Testing token verification..."

    local response=$(curl -s -X POST "${BACKEND_URL}/api/${API_VERSION}/auth/verify" \
        -H "Authorization: Bearer ${firebase_token}" \
        -H 'Content-Type: application/json')

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Token verification successful"
        echo "$response" | jq '.data.user'
    else
        log_error "Token verification failed"
        echo "Response: $response"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BOLD}Firebase Authentication Test Suite${NC}"
    echo "========================================="

    validate_environment

    # Execute tests
    ID_TOKEN=$(test_google_signin)
    [ $? -eq 0 ] || exit 1
    log_success "Google Sign-In completed"

    FIREBASE_TOKEN=$(test_sso_endpoint "$ID_TOKEN")
    [ $? -eq 0 ] || exit 1
    log_success "SSO endpoint test completed"

    test_token_verification "$FIREBASE_TOKEN"
    [ $? -eq 0 ] || exit 1

    # Test summary
    echo -e "\n${BOLD}Test Summary${NC}"
    echo "----------------------------------------"
    echo -e "${GREEN}✓ Google Sign-In${NC}"
    echo -e "${GREEN}✓ SSO Endpoint${NC}"
    echo -e "${GREEN}✓ Token Verification${NC}"

    # Token information
    echo -e "\n${BOLD}Authentication Tokens${NC}"
    echo "----------------------------------------"
    echo "ID Token: ${ID_TOKEN:0:40}..."
    echo "Firebase Token: ${FIREBASE_TOKEN:0:40}..."
}

# Execute main function
main