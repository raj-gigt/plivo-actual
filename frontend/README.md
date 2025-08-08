# AI Analysis Platform - Frontend

This is the React frontend for the AI Analysis Platform, built with Vite.

## Environment Variables

The frontend uses environment variables to configure the API endpoint. Create a `.env` file in the frontend directory with the following variables:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### Environment Variables

- `VITE_API_BASE_URL`: The base URL for the backend API (defaults to `http://localhost:3000/api`)

### Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your backend URL:

   ```bash
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- **Framework**: React 19 with Vite
- **Styling**: CSS3 with modern design
- **HTTP Client**: Axios for API calls
- **Icons**: Lucide React

## Features

- 🔐 Authentication system
- 🖼️ Image analysis with AI
- 📄 Document analysis (PDF, DOC, URLs)
- 🎨 Modern, responsive UI
- 📱 Mobile-friendly design

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
