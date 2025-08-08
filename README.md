# AI Analysis Platform

A modern, authenticated chatbot application that analyzes images using Google's Gemini 2.0 Flash model. Users must log in to access AI-powered analysis features through a clean, feature-rich interface.

## Features

- 🔐 **Secure Authentication**: Login system with session management
- 🖼️ **Image Upload & Analysis**: Upload images and get comprehensive descriptions
- 🤖 **AI-Powered Analysis**: Uses Google's Gemini 2.0 Flash for accurate image understanding
- 💬 **Modern Chat Interface**: Clean, responsive chat UI with real-time messaging
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Processing**: Instant image analysis with loading indicators
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations
- 🔄 **Feature Selection**: Dropdown menu for future feature expansion
- 🚀 **Scalable Architecture**: Ready for additional AI analysis features

## Tech Stack

### Backend

- **Flask**: Python web framework with session management
- **LangChain**: LLM integration framework
- **Google Generative AI**: Gemini 2.0 Flash model
- **Flask-CORS**: Cross-origin resource sharing with credentials
- **Pillow**: Image processing

### Frontend

- **React 19**: Modern React with hooks and authentication
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client with credential support
- **Lucide React**: Beautiful icons
- **CSS3**: Modern styling with gradients and animations

## Project Structure

```
plivo actual/
├── backend/
│   ├── app.py              # Flask application with auth
│   ├── requirements.txt    # Python dependencies
│   ├── env.example        # Environment variables template
│   └── README.md          # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component with auth
│   │   ├── App.css        # Component styles
│   │   ├── index.css      # Global styles
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── start.sh               # Easy startup script
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google API key with Gemini access

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your Google API key:

   ```
   GOOGLE_API_KEY=your_actual_api_key_here
   SECRET_KEY=your_secret_key_for_sessions
   ```

5. **Run the backend**
   ```bash
   python app.py
   ```
   The backend will start on `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

## Usage

1. **Open the application** in your browser at `http://localhost:5173`

2. **Login** using the demo credentials:

   - Username: `admin`
   - Password: `password123`

3. **Select a feature** from the dropdown menu:

   - **Analyze Image**: Upload and analyze images with AI
   - **Text Analysis**: Coming soon
   - **Document Analysis**: Coming soon
   - **Code Analysis**: Coming soon

4. **Upload an image** (when Image Analysis is selected) by clicking the "Upload Image" button

5. **Wait for analysis** - the AI will process your image and provide a detailed description

6. **View the results** in the chat interface with comprehensive analysis including:
   - Visual description
   - Objects and elements
   - Setting and environment
   - Colors and lighting
   - Composition analysis
   - Mood and atmosphere
   - Details and textures
   - Potential context

## API Endpoints

### POST /api/login

Authenticate user and create session.

**Request:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### POST /api/logout

Logout and clear session.

### GET /api/check-auth

Check authentication status.

### POST /api/analyze-image

Analyzes an uploaded image and returns a detailed description (requires authentication).

**Request:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**

```json
{
  "success": true,
  "description": "Detailed image analysis...",
  "model_used": "Gemini 2.0 Flash"
}
```

### GET /api/health

Health check endpoint.

## Environment Variables

### Backend (.env)

- `GOOGLE_API_KEY`: Your Google API key with Gemini access
- `SECRET_KEY`: Secret key for Flask sessions (optional, defaults to 'your-secret-key-change-in-production')
- `FLASK_ENV`: Development environment (optional)
- `FLASK_DEBUG`: Debug mode (optional)

## Getting a Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file

## Features in Detail

### Authentication System

- Session-based authentication
- Secure login/logout functionality
- Protected API endpoints
- Automatic session validation
- Graceful error handling for expired sessions

### Image Analysis

- Supports all common image formats (JPEG, PNG, GIF, etc.)
- Automatic image format conversion
- Base64 encoding for secure transmission
- Error handling for invalid images
- Authentication required for analysis

### Chat Interface

- Real-time message updates
- Loading indicators during analysis
- Error message handling
- Image preview functionality
- Clear chat option
- Session persistence

### Feature Selection

- Dropdown menu for feature selection
- Extensible architecture for new features
- Coming soon indicators for future features
- Clean state management

### Responsive Design

- Mobile-first approach
- Adaptive layout for different screen sizes
- Touch-friendly interface
- Smooth animations and transitions

## Development

### Backend Development

```bash
cd backend
python app.py
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
# Use a production WSGI server like gunicorn
pip install gunicorn
gunicorn app:app
```

## Future Features

The platform is designed to be easily extensible. Future features can include:

- **Text Analysis**: Analyze and summarize text content
- **Document Analysis**: Process and analyze PDF documents
- **Code Analysis**: Review and explain code snippets
- **Audio Analysis**: Transcribe and analyze audio files
- **Video Analysis**: Process video content
- **Multi-language Support**: Support for multiple languages
- **User Management**: User registration and role-based access
- **Analytics Dashboard**: Usage statistics and insights

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is running on port 5001 and CORS is properly configured
2. **Authentication Errors**: Check that sessions are working and credentials are correct
3. **API Key Issues**: Verify your Google API key is valid and has Gemini access
4. **Image Upload Failures**: Check that the image format is supported and file size is reasonable
5. **Network Errors**: Ensure both frontend and backend are running

### Debug Mode

- Backend: Set `FLASK_DEBUG=True` in your `.env` file
- Frontend: Check browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub
