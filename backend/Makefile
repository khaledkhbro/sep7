.PHONY: build run test clean docker-build docker-run

# Build the application
build:
	go build -o bin/main .

# Run the application
run:
	go run .

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Docker commands
docker-build:
	docker build -t microjob-backend .

docker-run:
	docker-compose up --build

docker-down:
	docker-compose down

# Database migrations (if using migrate tool)
migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

# Generate API documentation (if using swag)
docs:
	swag init
