# scripts/test-setup.sh
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if a port is in use
check_port() {
    nc -z localhost $1 > /dev/null 2>&1
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local timeout=30
    local count=0
    
    echo -e "${BLUE}Waiting for server to be ready on port $port...${NC}"
    
    while ! check_port $port; do
        count=$((count + 1))
        if [ $count -gt $timeout ]; then
            echo -e "${RED}Timeout waiting for server${NC}"
            return 1
        fi
        sleep 1
        echo -n "."
    done
    echo -e "\n${GREEN}Server is ready!${NC}"
    return 0
}

# Start the server if it's not running
if ! check_port 8000; then
    echo -e "${BLUE}Starting server...${NC}"
    deno task prod > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    if ! wait_for_server 8000; then
        echo -e "${RED}Failed to start server${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
else
    echo -e "${GREEN}Server is already running${NC}"
fi

# Run the tests
echo -e "${BLUE}Running tests...${NC}"
DENO_ENV=${DENO_ENV:-development} deno test --allow-net --allow-read --allow-env tests/integration/auth.test.ts

TEST_EXIT_CODE=$?

# If we started the server, stop it
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${BLUE}Stopping server...${NC}"
    kill $SERVER_PID 2>/dev/null
fi

exit $TEST_EXIT_CODE