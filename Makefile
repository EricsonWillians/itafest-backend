.PHONY: dev

dev:
	@echo "Starting Firebase Emulators..."
	firebase emulators:start --only auth &
	@echo "Waiting for emulators to start..."
	sleep 5
	@echo "Starting Deno development server..."
	deno task dev