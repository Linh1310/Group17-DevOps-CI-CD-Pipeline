# Group 17 – DevOps CI/CD Pipeline

## Project Overview
This project is a Task Management application developed using Node.js and Express, running on Ubuntu/Linux.

## Requirements
- Ubuntu/Linux
- Node.js
- npm

## Install Dependencies
From the repository root:

```bash
cd app
npm ci
```

## Run Application
From the `app` directory:

```bash
node src/server.js
```

The application runs on port 8000.

Access the application at:
http://localhost:8000

Health check:
http://localhost:8000/health

## Run Unit Tests
From the repository root:

```bash
cd app
npm ci
npm test
```

Test file: `app/tests/server.test.js`

The current test verifies that the Health API returns OK.

## Jenkins CI Commands
Run these commands from the repository root:

```bash
cd app
npm ci
npm test
```

The Jenkins pipeline should fail when the test command exits with an error.

## Docker
Docker configuration files are available in the `docker/` directory.

## Security
Security scanning scripts and Trivy reports are available in the `security/` directory.

## Environment Variables
The application currently does not require a `.env` file based on the checked source configuration.

Do not commit passwords, API keys, or private `.env` files.# Group17_Linux_DevOps_cicd_project
Đồ án Linux: Configure and Deploy DevOps Services
