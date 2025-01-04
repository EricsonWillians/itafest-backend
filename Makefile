.PHONY: dev

dev:
	@echo "\033[1;34m>>> Starting Firebase Emulators...\033[0m"
	@firebase emulators:start &

	@echo "\033[1;33m>>> Waiting for emulators to start...\033[0m"
	@sleep 2

	@echo "\033[1;32m>>> Starting Deno development server...\033[0m"
	@deno task dev
