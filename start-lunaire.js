#!/usr/bin/env node

/**
 * LUNAIRE COUNTRY CLUB - STARTUP SCRIPT (Node.js ES Module)
 * "Where jurisprudential excellence meets lunar hospitality"
 *
 * Startup script to launch the Lunaire themed Law Quizzer
 * - Loads environment variables from .env using dotenv
 * - Starts the Flask backend API on port 5001
 * - Serves the Lunaire frontend on port 3000
 * - Opens the Lunaire entry point in the browser
 */

import { spawn } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[✗]${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}[!]${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// Configuration
const SCRIPT_DIR = __dirname;
const ENV_FILE = path.join(SCRIPT_DIR, ".env");
const BACKEND_PORT = process.env.PORT || 5001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const LUNAIRE_ENTRY = "index-lunaire.html";

let apiProcess = null;
let serverProcess = null;

/**
 * Load environment variables from .env file
 */
function loadEnvironment() {
  if (fs.existsSync(ENV_FILE)) {
    log.success(`Loading environment from .env`);
    const envConfig = dotenv.config({ path: ENV_FILE });

    if (envConfig.error) {
      log.warn(`Error reading .env file: ${envConfig.error.message}`);
    } else {
      log.success(
        `Loaded ${
          Object.keys(envConfig.parsed || {}).length
        } environment variables`,
      );
    }
  } else {
    log.warn(`No .env file found at ${ENV_FILE}`);
    log.info("Some features may not work without environment variables");
  }
}

/**
 * Check if a command exists
 */
function commandExists(cmd) {
  const { execSync } = require("child_process");
  try {
    execSync(`command -v ${cmd}`, { shell: true, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify dependencies
 */
function verifyDependencies() {
  log.info("Checking dependencies...");

  const deps = [
    { name: "Python 3", cmd: "python3", flag: "--version" },
    { name: "Node.js", cmd: "node", flag: "--version" },
    { name: "NPM", cmd: "npm", flag: "--version" },
  ];

  for (const dep of deps) {
    if (!commandExists(dep.cmd)) {
      log.error(`${dep.name} is not installed`);
      process.exit(1);
    }
    const { execSync } = require("child_process");
    const version = execSync(`${dep.cmd} ${dep.flag}`, {
      encoding: "utf8",
    }).trim();
    log.success(`${dep.name} found: ${version}`);
  }
}

/**
 * Install dependencies
 */
function installDependencies() {
  log.info("Checking Node.js dependencies...");

  const nodeModulesPath = path.join(SCRIPT_DIR, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    log.info("Running npm install...");
    const { execSync } = require("child_process");
    execSync("npm install", { cwd: SCRIPT_DIR, stdio: "inherit" });
    log.success("NPM dependencies installed");
  } else {
    log.success("NPM dependencies already installed");
  }
}

/**
 * Start the Flask API
 */
function startFlaskAPI() {
  return new Promise((resolve, reject) => {
    log.info(`Starting Flask API on port ${BACKEND_PORT}...`);

    apiProcess = spawn("python3", ["backend/server.py"], {
      cwd: SCRIPT_DIR,
      env: { ...process.env, FLASK_ENV: "development" },
    });

    let apiStarted = false;

    apiProcess.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`  ${output}`);
      }
      if (
        !apiStarted &&
        (output.includes("Running on") || output.includes("development server"))
      ) {
        apiStarted = true;
        log.success(`Flask API started (PID ${apiProcess.pid})`);
        resolve();
      }
    });

    apiProcess.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output && !output.includes("DEBUG")) {
        console.error(`  ${output}`);
      }
    });

    apiProcess.on("error", (err) => {
      log.error(`Failed to start Flask API: ${err.message}`);
      reject(err);
    });

    apiProcess.on("exit", (code) => {
      if (code !== 0 && code !== null && !apiStarted) {
        log.error(`Flask API exited with code ${code}`);
        reject(new Error(`Flask API exited with code ${code}`));
      }
    });

    // Timeout after 15 seconds if no response
    setTimeout(() => {
      if (!apiStarted && apiProcess.pid) {
        log.success(`Flask API started (PID ${apiProcess.pid})`);
        resolve();
      }
    }, 15000);
  });
}

/**
 * Start the static server
 */
function startStaticServer() {
  return new Promise((resolve, reject) => {
    log.info(`Starting static server on port ${FRONTEND_PORT}...`);

    const srcPath = path.join(SCRIPT_DIR, "src");
    serverProcess = spawn(
      "npx",
      ["serve", srcPath, "--port", FRONTEND_PORT.toString(), "--single"],
      {
        cwd: SCRIPT_DIR,
        stdio: "inherit",
      },
    );

    serverProcess.on("error", (err) => {
      log.error(`Failed to start static server: ${err.message}`);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        log.error(`Static server exited with code ${code}`);
      }
    });

    // Give server time to start
    setTimeout(() => {
      log.success(`Static server started (PID ${serverProcess.pid})`);
      resolve();
    }, 2000);
  });
}

/**
 * Display startup information
 */
function displayStartupInfo() {
  log.header("================================");
  log.header("   LUNAIRE COUNTRY CLUB LIVE   ");
  log.header("================================");

  console.log(
    `${colors.blue}Backend API:${colors.reset}  http://localhost:${BACKEND_PORT}/api`,
  );
  console.log(
    `${colors.blue}Frontend:${colors.reset}     http://localhost:${FRONTEND_PORT}`,
  );
  console.log(
    `${colors.blue}Lunaire:${colors.reset}      http://localhost:${FRONTEND_PORT}/${LUNAIRE_ENTRY}`,
  );
  console.log("");

  console.log("Environment Information:");
  if (process.env.OPENAI_API_KEY) {
    log.success("OpenAI API Key: Configured");
  } else {
    log.warn("OpenAI API Key: Not configured (AI features disabled)");
  }

  console.log(
    `${colors.blue}Database:${colors.reset} ${path.join(
      SCRIPT_DIR,
      "law_quiz.db",
    )}`,
  );
  console.log("");
  console.log(
    `${colors.yellow}Press Ctrl+C to stop all services${colors.reset}`,
  );
  console.log("");
}

/**
 * Cleanup function
 */
function cleanup() {
  log.info("Shutting down services...");

  if (apiProcess && !apiProcess.killed) {
    log.info(`Stopping Flask API (PID ${apiProcess.pid})...`);
    apiProcess.kill();
  }

  if (serverProcess && !serverProcess.killed) {
    log.info(`Stopping static server (PID ${serverProcess.pid})...`);
    serverProcess.kill();
  }

  log.success("Cleanup complete");
  process.exit(0);
}

/**
 * Main startup function
 */
async function main() {
  try {
    log.header("================================");
    log.header("    LUNAIRE COUNTRY CLUB      ");
    log.header("Launching the Lunar Bar Exam");
    log.header("================================");
    console.log("");

    // Load environment variables
    loadEnvironment();
    console.log("");

    // Verify dependencies
    verifyDependencies();
    console.log("");

    // Install dependencies
    installDependencies();
    console.log("");

    // Setup signal handlers
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Start services
    await startFlaskAPI();
    console.log("");

    await startStaticServer();
    console.log("");

    // Display info
    displayStartupInfo();

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    log.error(`Startup failed: ${error.message}`);
    cleanup();
  }
}

// Start the application
main();
