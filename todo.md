# OZ Mobile App - Implementation TODO

## Phase 1: Core Packages Implementation
- [x] Terminal Manager Package ✅ COMPLETE
  - [x] SSH Connection Handler
  - [x] Cloudflare Tunnel Integration
  - [x] TTY Server
  - [x] Command Execution Engine
  - [x] Unit Tests (16/16 passing)
  - [x] Hard Test Debugging

- [x] Agent Orchestrator Package ✅ COMPLETE
  - [x] Agent Pool Manager
  - [x] Communication Bus
  - [x] Debate Engine
  - [x] Agent Lifecycle Management
  - [x] Unit Tests (15/15 passing)
  - [x] Hard Test Debugging

- [x] Identity Manager Package ✅ COMPLETE
  - [x] User Profile Service
  - [x] Bot Identity Binding (แก้ปัญหา ID ค้าง)
  - [x] Email/GitHub/Google/SSO Authentication
  - [x] OTP Verification
  - [x] Unit Tests (24/24 passing)
  - [x] Hard Test Debugging

- [x] LLM Router Package ✅ COMPLETE
  - [x] Model Selection Logic
  - [x] Prompt Routing (7 types)
  - [x] Manus/ChatGPT Integration
  - [x] Claude AI Integration
  - [x] Gemini AI Integration
  - [x] DeepSeek Integration
  - [x] Unit Tests (27/27 passing)
  - [x] Hard Test Debugging

- [x] Tool Executor Package ✅ COMPLETE
  - [x] Tool Registry (6 built-in tools)
  - [x] Execution Engine (with retry logic)
  - [x] Tool Chaining (multi-step execution)
  - [x] Error Handling (continue/stop/retry)
  - [x] Unit Tests (24/24 passing)
  - [x] Hard Test Debugging

- [x] OZ CLI Package ✅ COMPLETE
  - [x] Command Parser (arguments, validation, help)
  - [x] CLI Engine (session management, response formatting)
  - [x] 6 Built-in Commands (Terminal, Agent, Identity, LLM, Tool, Config)
  - [x] Warp Terminal Integration
  - [x] Interactive Shell Support
  - [x] Unit Tests (34/34 passing)
  - [x] Hard Test Debugging

## Phase 3: Mobile App Screens
- [ ] Auth Screen (Warp-style)
  - [ ] Email/Password Login
  - [ ] GitHub OAuth
  - [ ] Google OAuth
  - [ ] SSO Integration
  - [ ] Remember Me (2 weeks)
  - [ ] OTP Verification
- [ ] Terminal Screen
  - [ ] Terminal Connection UI
  - [ ] Command Input
  - [ ] Output Display
  - [ ] Session Management
- [ ] War Room Screen
  - [ ] Agent List
  - [ ] Debate Interface
  - [ ] Real-time Messaging
  - [ ] Debate History
- [ ] Home Screen
  - [ ] Terminal Status Display
  - [ ] Quick Actions
  - [ ] Agent Status
  - [ ] Recent Commands

- [ ] Terminal Screen
  - [ ] Terminal Emulator
  - [ ] Command Input
  - [ ] Output Display
  - [ ] History Management

- [ ] War Room Screen
  - [ ] Multi-Agent Debate Display
  - [ ] Bull Team vs Bear Team
  - [ ] Debate Rounds
  - [ ] Decision Display

- [ ] Identity Screen
  - [ ] Bot Binding Status
  - [ ] Telegram Connection
  - [ ] Line Connection
  - [ ] Reset Identity

- [ ] Settings Screen
  - [ ] LLM Model Selection
  - [ ] API Configuration
  - [ ] Theme Settings
  - [ ] Notification Settings

## Phase 3: Integration & Testing
- [ ] Context7 MCP Integration
  - [ ] Documentation Fetching
  - [ ] Prompt Enhancement
  - [ ] Cache Management

- [ ] Multi-Agent Debate Framework
  - [ ] Bull Team Implementation
  - [ ] Bear Team Implementation
  - [ ] Debate Rounds
  - [ ] Consensus Building

- [ ] Harness Engineering
  - [ ] Prompt Optimization
  - [ ] Tool Selection
  - [ ] Agent Orchestration
  - [ ] Performance Tuning

## Phase 4: Advanced Features
- [ ] Termux Integration
- [ ] Knowledge Base Integration
- [ ] Obsidian Sync
- [ ] Vector Database
- [ ] Monitoring & Observability

## Phase 5: Testing & Deployment
- [ ] Unit Tests (>85% coverage)
- [ ] Integration Tests
- [ ] End-to-End Tests
- [ ] Hard Test Debugging (Windows, Mac, Linux, iOS, Android)
- [ ] Security Audit
- [ ] Performance Optimization
- [ ] Deployment Preparation

## Known Issues & Pain Points to Fix
- [ ] Bot Telegram/Line ID Binding Issue (ค้างเก่า)
- [ ] Identity Reset Mechanism
- [ ] Multi-OS Terminal Support
- [ ] Agent Debate Quality
- [ ] Context7 MCP Reliability

## Completed Items
(None yet - starting fresh)


## Phase 4: Backend API Server
- [ ] Create Express.js Server
  - [ ] User API (login, profile, logout)
  - [ ] Terminal API (connect, execute, list)
  - [ ] Agent API (create, list, debate)
  - [ ] Identity API (bind, verify, reset)
  - [ ] LLM API (prompt, models)
  - [ ] Tool API (execute, list)
- [ ] Database Integration (Supabase)
  - [ ] User Schema
  - [ ] Terminal Sessions Schema
  - [ ] Agent Schema
  - [ ] Debate History Schema
- [ ] Authentication & Authorization
  - [ ] JWT Token Management
  - [ ] OAuth Integration
  - [ ] Role-based Access Control
- [ ] Error Handling & Logging
- [ ] API Tests

## Phase 5: Postman API Collection
- [ ] Create Postman Collection
  - [ ] User Endpoints
  - [ ] Terminal Endpoints
  - [ ] Agent Endpoints
  - [ ] Identity Endpoints
  - [ ] LLM Endpoints
  - [ ] Tool Endpoints
- [ ] Environment Setup (Dev, Staging, Prod)
- [ ] Pre-request Scripts
- [ ] Test Scripts
- [ ] Documentation
- [ ] Export & Share

## Phase 6: Flutter Mobile App
- [ ] Project Setup (Dart + Flutter Advanced)
  - [ ] Project Structure
  - [ ] Dependencies (Riverpod, GetIt, Dio)
  - [ ] Theme & Design System
- [ ] Auth Screen (Warp-style)
  - [ ] Email/Password Login
  - [ ] GitHub OAuth
  - [ ] Google OAuth
  - [ ] SSO
  - [ ] OTP Verification
- [ ] Terminal Screen
  - [ ] Connection Management
  - [ ] Command Input & Output
  - [ ] Session Management
  - [ ] File Browser
- [ ] War Room Screen
  - [ ] Agent List
  - [ ] Debate Interface
  - [ ] Real-time Messaging
  - [ ] Debate History
- [ ] Home Screen
  - [ ] Dashboard
  - [ ] Quick Actions
  - [ ] Status Overview
- [ ] Settings Screen
  - [ ] Profile Management
  - [ ] Preferences
  - [ ] Logout

## Phase 7: API Integration
- [ ] HTTP Client Setup (Dio)
- [ ] API Service Layer
  - [ ] User Service
  - [ ] Terminal Service
  - [ ] Agent Service
  - [ ] Identity Service
  - [ ] LLM Service
  - [ ] Tool Service
- [ ] State Management (Riverpod)
- [ ] Error Handling
- [ ] Caching Strategy

## Phase 8: Real-time Communication
- [ ] WebSocket Setup
  - [ ] Connection Management
  - [ ] Reconnection Logic
  - [ ] Message Handling
- [ ] Live Terminal Updates
- [ ] Live Debate Updates
- [ ] Push Notifications

## Phase 9: Testing & Deployment
- [ ] Unit Tests (Flutter)
- [ ] Widget Tests
- [ ] Integration Tests
- [ ] API Tests (Postman)
- [ ] Performance Testing
- [ ] Security Testing
- [ ] Build & Release
  - [ ] iOS Build
  - [ ] Android Build
  - [ ] TestFlight / Google Play
