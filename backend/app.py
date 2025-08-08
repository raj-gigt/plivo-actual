from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
import base64
from PIL import Image
import io
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
import logging
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configure session
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Google Generative AI
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Dummy user credentials (in production, use a database)
DUMMY_USERS = {
    'admin': {
        'password': 'password123',
        'role': 'admin'
    }
}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def analyze_image(image_data):
    """
    Analyze an image using Gemini 2.0 Flash and return a detailed description
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Prepare the prompt for detailed analysis
        prompt = """
        Please provide a comprehensive and detailed analysis of this image. Include:
        
        1. **Visual Description**: Describe what you see in the image in detail
        2. **Objects and Elements**: List and describe all visible objects, people, animals, or elements
        3. **Setting and Environment**: Describe the location, background, and environment
        4. **Colors and Lighting**: Analyze the color scheme, lighting, and visual atmosphere
        5. **Composition**: Describe the layout, perspective, and visual composition
        6. **Mood and Atmosphere**: What feeling or mood does the image convey?
        7. **Details and Textures**: Describe any notable details, textures, or patterns
        8. **Potential Context**: What might be happening or what could this image represent?
        
        Please be thorough and descriptive in your analysis.
        """
        
        # Generate response using Gemini
        response = model.generate_content([prompt, image])
        
        return {
            'success': True,
            'description': response.text,
            'model_used': 'Gemini 2.0 Flash'
        }
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return {
            'success': False,
            'error': f"Failed to analyze image: {str(e)}"
        }

@app.route('/api/login', methods=['POST'])
def login():
    """
    Login endpoint for authentication
    """
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400
        
        username = data['username']
        password = data['password']
        
        # Check credentials
        if username in DUMMY_USERS and DUMMY_USERS[username]['password'] == password:
            session['logged_in'] = True
            session['username'] = username
            session['role'] = DUMMY_USERS[username]['role']
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'username': username,
                    'role': DUMMY_USERS[username]['role']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
            
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Logout endpoint
    """
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    }), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """
    Check if user is authenticated
    """
    if session.get('logged_in'):
        return jsonify({
            'success': True,
            'authenticated': True,
            'user': {
                'username': session.get('username'),
                'role': session.get('role')
            }
        }), 200
    else:
        return jsonify({
            'success': True,
            'authenticated': False
        }), 200

@app.route('/api/analyze-image', methods=['POST'])
@login_required
def analyze_image_endpoint():
    """
    Endpoint to analyze uploaded images (requires authentication)
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        image_data = data['image']
        
        # Validate image data format
        if not image_data.startswith('data:image/'):
            return jsonify({
                'success': False,
                'error': 'Invalid image format. Please provide a base64 encoded image.'
            }), 400
        
        # Analyze the image
        result = analyze_image(image_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in analyze_image_endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'message': 'Image Analysis API is running',
        'authentication': 'enabled'
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port) 