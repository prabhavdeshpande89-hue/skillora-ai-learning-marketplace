# Skillora – AI Learning Marketplace

<p align="center">
  <strong>An AI-powered marketplace designed to make learning resources more accessible.</strong>
</p>

<p align="center">
  Discover learning resources, get AI-powered assistance, and access educational content through one platform.
</p>

<p align="center">
  <a href="https://skillora-ai-ten.vercel.app">Live Application</a> •
  <a href="https://skillora-backend-1l4x.onrender.com/docs">API Documentation</a> •
  <a href="https://github.com/prabhavdeshpande89-hue/skillora-ai-learning-marketplace">GitHub Repository</a>
</p>

---

## About Skillora

Skillora is an AI-powered learning marketplace that brings educational resources and intelligent learning assistance together in one platform.

The platform allows users to explore learning materials, discover relevant resources, interact with an AI assistant, and purchase resources using PayPal.

Skillora aims to simplify the learning experience by combining a digital marketplace with AI-powered support and integrated payment functionality.

## Problem Statement

Learning resources are distributed across multiple platforms, making it difficult for learners to discover relevant content and access everything conveniently.

Traditional learning marketplaces may also lack personalized AI assistance and seamless purchasing experiences.

## Our Solution

Skillora addresses these challenges through a unified learning marketplace that combines:

- A centralized marketplace for educational resources.
- AI-powered assistance using Google's Gemini models.
- A convenient resource discovery experience.
- PayPal integration for payment processing.
- User dashboards for accessing purchased resources.
- Administrative features for managing marketplace activity and payment records.

## Key Features

### 1. AI-Powered Learning Assistant
- Interact with an AI assistant using natural language.
- Ask learning-related questions.
- Receive AI-generated responses.
- Powered by Google's Gemini AI.

### 2. Learning Marketplace
- Explore educational resources.
- Browse learning categories.
- Discover relevant learning materials.
- View resource information before purchasing.

### 3. PayPal Payment Integration
- Integrated PayPal Sandbox checkout.
- Process test transactions.
- Handle payment success and cancellation redirects.
- Maintain payment records.

### 4. User Dashboard
- Access the user dashboard.
- View purchased learning resources.
- Access available learning content.

### 5. Admin Dashboard
- Administrative management features.
- Review payment records.
- Monitor marketplace transactions.

### 6. Responsive User Interface
- Modern React-based frontend.
- Tailwind CSS styling.
- User-friendly navigation and interface.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | MongoDB Atlas |
| Artificial Intelligence | Google Gemini API |
| Payment Gateway | PayPal Sandbox |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

## System Architecture

```text
             USER
               |
               v
       React + Vite Frontend
          (Vercel)
               |
               v
         FastAPI Backend
           (Render)
               |
       +-------+--------+
       |       |        |
       v       v        v
    MongoDB  Gemini   PayPal
     Atlas    API    Sandbox
       |       |        |
       +-------+--------+
               |
               v
       Application Response
               |
               v
              USER
```

## Project Structure

```text
skillora-ai-learning-marketplace/
│
├── backend/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── docs/
│
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
├── list_gemini_models.py
├── test_gemini_models.py
└── test_mongodb.py
```

*Note: This represents the known repository structure. Additional files and subdirectories may exist inside backend and frontend.*

## Live Deployment

| Service | URL |
|---|---|
| Skillora Frontend | https://skillora-ai-ten.vercel.app |
| Backend API | https://skillora-backend-1l4x.onrender.com |
| API Documentation | https://skillora-backend-1l4x.onrender.com/docs |

## Getting Started

Follow these instructions to run Skillora locally.

### Prerequisites

Make sure you have installed:

- Python 3.10 or later
- Node.js and npm
- Git
- MongoDB Atlas account
- Google Gemini API key
- PayPal Developer Sandbox account

### 1. Clone the Repository

```bash
git clone https://github.com/prabhavdeshpande89-hue/skillora-ai-learning-marketplace.git

cd skillora-ai-learning-marketplace
```

### 2. Backend Setup

Create and activate a Python virtual environment.

**Windows CMD:**

```cmd
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Configure your backend environment variables using a `.env` file.

Add the required configuration values according to the application's settings, including:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

Also configure the PayPal Sandbox credentials and any other environment variables required by the backend.

Start the backend:

```cmd
python -m uvicorn backend.app.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal.

```cmd
cd frontend

npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```cmd
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

### 4. External Service Configuration

Skillora integrates with external services:

- **Google Gemini:** Configure a valid Gemini API key.
- **MongoDB Atlas:** Configure your MongoDB connection string and database access.
- **PayPal Sandbox:** Configure your Sandbox application credentials and backend payment settings.

Never commit API keys, passwords, database credentials, or private environment files to GitHub.

## AI Integration

Skillora integrates Google's Gemini AI through the Google GenAI SDK.

The AI integration enables users to interact with an intelligent assistant and receive AI-generated responses.

The application uses the Gemini API through its backend, keeping sensitive API credentials away from the public frontend.

## PayPal Integration

PayPal Sandbox is integrated to support the resource purchasing workflow.

The payment process includes:

1. User selects a learning resource.
2. User proceeds to checkout.
3. PayPal Sandbox handles the payment interaction.
4. The application handles successful or cancelled payment redirects.
5. Payment records are maintained for application tracking.

**Note:** The current integration uses PayPal Sandbox for testing and demonstration purposes, not live financial transactions.

## Security Considerations

- API credentials are stored in environment variables.
- Backend services handle sensitive integrations.
- CORS is configured for the application origins.
- PayPal Sandbox is used for payment testing.
- Secret files should be excluded through `.gitignore`.

## Future Enhancements

- Personalized AI learning recommendations.
- AI-generated learning paths.
- Advanced learning analytics.
- More educational resource categories.
- Additional payment options.
- Improved resource management and discovery.
- Enhanced learning progress tracking.

## Project Links

- **Live Website:** https://skillora-ai-ten.vercel.app
- **Backend API:** https://skillora-backend-1l4x.onrender.com
- **API Documentation:** https://skillora-backend-1l4x.onrender.com/docs
- **GitHub:** https://github.com/prabhavdeshpande89-hue/skillora-ai-learning-marketplace

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Skillora – Learn Smarter. Discover More. Grow Further.</strong>
</p>

<p align="center">
  Built with passion using AI, modern web technologies, and PayPal integration.
</p>
