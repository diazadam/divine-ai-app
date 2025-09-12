# Divine-AI VS Code Development Setup

## Quick Start Options

### Option 1: VS Code with Dev Containers (Recommended)
1. Install the "Dev Containers" extension in VS Code
2. Open Command Palette (`Cmd+Shift+P`) → "Dev Containers: Reopen in Container"
3. VS Code will build and start your development environment in Docker
4. Your app will be available at http://localhost:5000

### Option 2: Local Development
1. Install recommended extensions (VS Code will prompt you)
2. Copy `.env.example` to `.env` and add your API keys
3. Run `npm install`
4. Run `npm run dev`

## VS Code Features Configured

### Debugging
- **F5**: Launch Divine-AI Server with debugger
- Set breakpoints in TypeScript files
- Debug configuration in `.vscode/launch.json`

### Tasks
- **Cmd+Shift+P** → "Tasks: Run Task"
  - `npm: dev` - Start development server
  - `npm: build` - Build for production
  - `Docker: Build` - Build Docker image
  - `Docker: Run` - Run with docker-compose

### Extensions Installed
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Tailwind CSS** - CSS IntelliSense
- **TypeScript** - Enhanced TS support
- **Docker** - Docker integration
- **Thunder Client** - API testing
- **GitHub Copilot** - AI assistance

### Settings Configured
- Format on save enabled
- Auto-fix ESLint issues
- Tailwind CSS IntelliSense
- TypeScript preferences optimized

## Development Workflow

1. **Start Development**: `npm run dev` or use Dev Container
2. **API Testing**: Use Thunder Client extension for testing endpoints
3. **Debugging**: Set breakpoints and press F5
4. **Docker**: Use tasks or Dev Container for containerized development

## Port Mappings
- **5000**: Divine-AI Server
- **3000**: Vite Dev Server (if running separately)

## Environment Variables
Make sure to set up your `.env` file with:
- `GEMINI_API_KEY` - For AI features
- `OPENAI_API_KEY` - For audio processing
- `BIBLE_API_KEY` - For scripture integration

