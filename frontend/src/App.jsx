import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Upload,
  Send,
  Bot,
  User,
  Image as ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "http://localhost:3000/api";

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;

  const FEATURES = [
    {
      id: "image-analysis",
      name: "Analyze Image",
      description: "Upload and analyze images with AI",
    },
    {
      id: "text-analysis",
      name: "Text Analysis",
      description: "Analyze text content (coming soon)",
    },
    {
      id: "document-analysis",
      name: "Document Analysis",
      description: "Analyze documents (coming soon)",
    },
    {
      id: "code-analysis",
      name: "Code Analysis",
      description: "Analyze code snippets (coming soon)",
    },
  ];

  // Check authentication status on component mount

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        setIsLoggedIn(true);
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.error) {
        setLoginError(error.response.data.error);
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setSelectedFeature("");
      setMessages([]);
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleFeatureSelect = (featureId) => {
    setSelectedFeature(featureId);
    setMessages([]);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setSelectedImage(imageData);
        setImagePreview(imageData);

        // Add user message
        const userMessage = {
          id: Date.now(),
          type: "user",
          content: "Uploaded an image for analysis",
          image: imageData,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Analyze the image
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData) => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze-image`, {
        image: imageData,
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: response.data.description,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: `Error: ${response.data.error}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      let errorMessage =
        "Sorry, I encountered an error while analyzing your image. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
        setIsLoggedIn(false);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      const errorMsg = {
        id: Date.now() + 1,
        type: "bot",
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-header">
            <Bot className="login-icon" />
            <h1>AI Analysis Platform</h1>
            <p>Login to access AI-powered analysis features</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  console.log("Username changed:", e.target.value);
                  setUsername(e.target.value);
                }}
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  console.log("Password changed:", e.target.value);
                  setPassword(e.target.value);
                }}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && <div className="error-message">{loginError}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <>
                  <Loader2 className="loading-icon" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="login-info">
            <p>
              <strong>Demo Credentials:</strong>
            </p>
            <p>
              Username: <code>admin</code>
            </p>
            <p>
              Password: <code>password123</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Application
  return (
    <div className="app">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <Bot className="header-icon" />
            <h1>AI Analysis Platform</h1>
            <p>Welcome back! Select a feature to get started</p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Feature Selection */}
        <div className="feature-selection">
          <div className="feature-dropdown">
            <label htmlFor="feature-select">Select Feature:</label>
            <select
              id="feature-select"
              value={selectedFeature}
              onChange={(e) => handleFeatureSelect(e.target.value)}
            >
              <option value="">Choose a feature...</option>
              {FEATURES.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFeature && (
            <div className="feature-info">
              <h3>{FEATURES.find((f) => f.id === selectedFeature)?.name}</h3>
              <p>
                {FEATURES.find((f) => f.id === selectedFeature)?.description}
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="messages-container">
          {!selectedFeature ? (
            <div className="empty-state">
              <Settings className="empty-icon" />
              <h3>Select a Feature</h3>
              <p>Choose a feature from the dropdown above to get started</p>
            </div>
          ) : selectedFeature !== "image-analysis" ? (
            <div className="empty-state">
              <Settings className="empty-icon" />
              <h3>Feature Coming Soon</h3>
              <p>
                This feature is under development and will be available soon!
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <ImageIcon className="empty-icon" />
              <h3>Welcome to Image Analysis</h3>
              <p>
                Upload an image below to get started with AI-powered analysis
              </p>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === "user" ? (
                      <User size={20} />
                    ) : (
                      <Bot size={20} />
                    )}
                  </div>
                  <div className="message-content">
                    {message.image && (
                      <div className="message-image">
                        <img src={message.image} alt="Uploaded" />
                      </div>
                    )}
                    <div
                      className={`message-text ${
                        message.isError ? "error" : ""
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="message-timestamp">{message.timestamp}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message bot">
                  <div className="message-avatar">
                    <Bot size={20} />
                  </div>
                  <div className="message-content">
                    <div className="loading-indicator">
                      <Loader2 className="loading-icon" />
                      <span>Analyzing your image...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        {selectedFeature === "image-analysis" && (
          <div className="input-area">
            <div className="upload-section">
              <button
                className="upload-button"
                onClick={handleFileSelect}
                disabled={isLoading}
              >
                <Upload size={20} />
                {selectedImage ? "Change Image" : "Upload Image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              {selectedImage && (
                <button
                  className="clear-button"
                  onClick={clearChat}
                  disabled={isLoading}
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
