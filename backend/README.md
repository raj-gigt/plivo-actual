# Image Analysis Chatbot Backend

A Flask-based backend service that provides image analysis capabilities using Google's Gemini 2.0 Flash model.

## Features

- Image analysis using Gemini 2.0 Flash
- RESTful API endpoints
- CORS support for frontend integration
- Comprehensive error handling
- Detailed image descriptions

## Setup

1. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**

   - Copy `env.example` to `.env`
   - Add your Google API key to the `.env` file:
     ```
     GOOGLE_API_KEY=your_actual_api_key_here
     ```

3. **Run the Application**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### POST /api/analyze-image

Analyzes an uploaded image and returns a detailed description.

**Request Body:**

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

## Requirements

- Python 3.8+
- Google API key with Gemini access
- All dependencies listed in `requirements.txt`
