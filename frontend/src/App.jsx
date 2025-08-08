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
  FileText,
  Link,
  Type,
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
  const [documentInput, setDocumentInput] = useState("");
  const [documentInputType, setDocumentInputType] = useState("text"); // 'text', 'url', 'file'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const fileInputRef = useRef(null);
  const documentFileInputRef = useRef(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;

  const FEATURES = [
    {
      id: "image-analysis",
      name: "Analyze Image",
      description: "Upload and analyze images with AI",
    },
    {
      id: "document-analysis",
      name: "Document Analysis",
      description: "Analyze PDF, DOC, URLs, and Google Drive documents",
    },
  ];

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/check-auth`);
      if (response.data.authenticated) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

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
      setDocumentInput("");
      setSelectedDocument(null);
    }
  };

  const handleFeatureSelect = (featureId) => {
    setSelectedFeature(featureId);
    setMessages([]);
    setSelectedImage(null);
    setImagePreview(null);
    setDocumentInput("");
    setSelectedDocument(null);
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
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedDocument(file);

      // Add user message
      const userMessage = {
        id: Date.now(),
        type: "user",
        content: `Uploaded document: ${file.name}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Analyze the document
      analyzeDocument({ file });
    }
  };

  const handleDocumentSubmit = () => {
    if (!documentInput.trim()) return;

    let content = "";
    let userMessageContent = "";

    if (documentInputType === "text") {
      content = documentInput;
      userMessageContent = "Submitted text for analysis";
    } else if (documentInputType === "url") {
      content = documentInput;
      userMessageContent = `Submitted URL for analysis: ${documentInput}`;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Analyze the document
    if (documentInputType === "text") {
      analyzeDocument({ text: content });
    } else if (documentInputType === "url") {
      analyzeDocument({ url: content });
    }

    setDocumentInput("");
  };

  const analyzeImage = async (file) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.post(
        `${API_BASE_URL}/analyze-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

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

  const analyzeDocument = async (documentData) => {
    setIsLoading(true);

    try {
      let response;

      if (documentData.file) {
        // File upload
        const formData = new FormData();
        formData.append("file", documentData.file);
        response = await axios.post(
          `${API_BASE_URL}/analyze-document`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else if (documentData.url) {
        // URL
        response = await axios.post(`${API_BASE_URL}/analyze-document`, {
          url: documentData.url,
        });
      } else if (documentData.text) {
        // Text
        response = await axios.post(`${API_BASE_URL}/analyze-document`, {
          text: documentData.text,
        });
      }

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: response.data.summary,
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
      console.error("Error analyzing document:", error);
      let errorMessage =
        "Sorry, I encountered an error while analyzing your document. Please try again.";

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

  const handleDocumentFileSelect = () => {
    documentFileInputRef.current.click();
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedDocument(null);
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLoginLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoginLoading}
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
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Bot className="navbar-icon" />
            <h1>AI Analysis Platform</h1>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Messages Area */}
        <div className="messages-container">
          {!selectedFeature ? (
            <div className="empty-state">
              <Settings className="empty-icon" />
              <h3>Select a Feature</h3>
              <p>Choose a feature from the dropdown below to get started</p>
            </div>
          ) : selectedFeature === "image-analysis" ? (
            messages.length === 0 ? (
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
                      <div className="message-timestamp">
                        {message.timestamp}
                      </div>
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
            )
          ) : selectedFeature === "document-analysis" ? (
            messages.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>Welcome to Document Analysis</h3>
                <p>
                  Upload a document, enter a URL, or paste text below to get
                  started
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
                      <div
                        className={`message-text ${
                          message.isError ? "error" : ""
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="message-timestamp">
                        {message.timestamp}
                      </div>
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
                        <span>Analyzing your document...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="empty-state">
              <Settings className="empty-icon" />
              <h3>Feature Coming Soon</h3>
              <p>
                This feature is under development and will be available soon!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bottom-controls">
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

          {selectedFeature === "document-analysis" && (
            <div className="input-area">
              <div className="document-input-section">
                <div className="input-type-selector">
                  <button
                    type="button"
                    className={`input-type-btn ${
                      documentInputType === "text" ? "active" : ""
                    }`}
                    onClick={() => setDocumentInputType("text")}
                  >
                    <Type size={16} />
                    Text
                  </button>
                  <button
                    type="button"
                    className={`input-type-btn ${
                      documentInputType === "url" ? "active" : ""
                    }`}
                    onClick={() => setDocumentInputType("url")}
                  >
                    <Link size={16} />
                    URL
                  </button>
                  <button
                    type="button"
                    className={`input-type-btn ${
                      documentInputType === "file" ? "active" : ""
                    }`}
                    onClick={() => setDocumentInputType("file")}
                  >
                    <FileText size={16} />
                    File
                  </button>
                </div>

                {documentInputType === "file" ? (
                  <div className="file-upload-section">
                    <button
                      className="upload-button"
                      onClick={handleDocumentFileSelect}
                      disabled={isLoading}
                    >
                      <Upload size={20} />
                      {selectedDocument ? "Change Document" : "Upload Document"}
                    </button>
                    <input
                      ref={documentFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      style={{ display: "none" }}
                    />
                    {selectedDocument && (
                      <span className="selected-file">
                        {selectedDocument.name}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-input-section">
                    <textarea
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      placeholder={
                        documentInputType === "text"
                          ? "Paste your text here..."
                          : "Enter URL here (supports Google Drive links)..."
                      }
                      rows={3}
                      disabled={isLoading}
                    />
                    <button
                      className="submit-button"
                      onClick={handleDocumentSubmit}
                      disabled={!documentInput.trim() || isLoading}
                    >
                      <Send size={16} />
                      Analyze
                    </button>
                  </div>
                )}

                {(selectedDocument || messages.length > 0) && (
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
    </div>
  );
}

export default App;
