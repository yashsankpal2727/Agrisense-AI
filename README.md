# Agrisense AI 🌱

**AI-Powered Agricultural Produce Quality Inspection and Grading System**

Agrisense AI is a web-based application designed to analyze agricultural produce images and estimate their quality using machine learning. It aims to help users assess the quality of fruits, view grading results, and access agricultural information through a simple interface.

## Overview

Traditional fruit quality inspection often depends on manual observation, which can be time-consuming and inconsistent. Agrisense AI explores how computer vision and machine learning can make produce inspection faster and more consistent.

Users can upload or capture an image of agricultural produce, process it through the application's analysis workflow, and view the predicted quality grade and confidence score.

## Features

- **AI-Based Quality Grading:** Predicts fruit quality grades using trained machine learning models.
- **Fruit Classification:** Includes models for apple, tomato, and dragon fruit grading.
- **Fruit Detection:** Includes a separate fruit detection model.
- **Image Analysis:** Supports an image-based produce analysis workflow.
- **Analysis Results:** Displays the predicted grade, confidence score, and related prediction information.
- **Camera Support:** Includes a camera interface for capturing produce images.
- **Multilingual Interface:** Includes language selection and API-based translation functionality.
- **User Interface:** Provides pages for the dashboard, authentication, upload, analysis, results, history, market prices, and profile.
- **Backend Integration:** Connects the web application with backend services and the Python ML engine.

## Technology Stack

### Frontend
- React.js
- JavaScript (JSX)
- Vite
- CSS

### Backend
- Node.js
- Express.js
- REST API
- MongoDB

### Machine Learning
- Python
- PyTorch
- Torchvision
- EfficientNet-B0 for fruit grading models
- Computer vision and image classification

### Development Tools
- Git and GitHub
- Visual Studio Code
- npm
- Python virtual environment

## Project Structure

```text
Agrisense-AI/
├── ml/
│   ├── models/
│   │   ├── apple_grade_model.pth
│   │   ├── tomato_grade_model.pth
│   │   ├── dragonfruit_grade_model.pth
│   │   └── fruit_detection_model.pth
│   ├── predict.py
│   ├── predict_dragonfruit.py
│   ├── train.py
│   ├── train_tomato.py
│   ├── train_dragonfruit.py
│   ├── train_fruit_detector.py
│   └── ...
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── types.js
├── ml_engine.py
├── ml_server.py
├── server.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .env.example
└── README.md
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following software:

- [Node.js](https://nodejs.org/) and npm
- [Python](https://www.python.org/)
- [Git](https://git-scm.com/)
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/yashsankpal2727/Agrisense-AI.git
cd Agrisense-AI
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file using `.env.example` as a reference.

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure the environment variables required by the application.

Add your own valid API keys and configuration values where needed. Never commit your real `.env` file or expose secret keys on GitHub.

### 4. Set Up the Python Environment

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python packages required by the project. Use your project's dependency file if one is available; otherwise, install the dependencies required by the Python scripts, including the compatible PyTorch and Torchvision versions.

### 4. Configure API keys and MongoDB
```env
GEMINI_API_KEY="your-gemini-api-key"
```

You can use `.env.example` as a reference.

The Gemini API is used for features such as interface translation and AI-assisted functionality. The local produce grading models do not require a Gemini API key.

**Do not upload your `.env` file or API key to GitHub.**

To load reported mandi prices, add your data.gov.in API key to the same `.env` file:

```env
MANDI_API_KEY="your-data-gov-in-api-key"
```

The backend requires MongoDB. For a local MongoDB server, configure:

```env
MONGODB_URI="mongodb://127.0.0.1:27017/agrisense"
MONGODB_DB="agrisense"
```

For MongoDB Atlas, use the connection string from your cluster and ensure the application host is allowed by the cluster's network access settings. Keep database credentials private and never commit `.env`.

On startup, the server creates a unique index for farmer phone numbers and an index for per-user analysis history. If the MongoDB collections are empty, existing `data/users.json` and `data/analysis-history.json` records are imported once; the JSON files are left untouched. New profiles and analysis history are written to MongoDB.

The Market Price page uses the AGMARKNET "Current Daily Price of Various Commodities from Various Markets (Mandi)" dataset through the Express backend. The page checks for updates every five minutes and also has a manual refresh button; this only picks up new data when the provider publishes it. The provider reports daily prices, not live auction bids. Prices are converted from ₹/quintal to ₹/kg. The district modal card is an unweighted average of the returned market modal prices. The source grade (for example, `Local`) is not mapped to the app's produce Grade A/B/C; distance is not provided. The report-history chart only shows dates actually returned by the dataset, and may contain only one day. Restart `npm run dev` after changing `.env`.

Opening mandi prices from an analysis result preselects and locks the analyzed commodity so the request only returns that commodity. The analysis grade is shown for context, but AGMARKNET does not provide the same Grade A/B/C classification, so prices are not grade-adjusted. Dragon fruit is accepted as a commodity selection; the page shows an empty-data message if the source has no matching report.

### 5. Start the application

```bash
npm run dev
```

If the application requires the Express backend or Python ML service to run separately, start those services using the commands and configuration defined in the project.

Once the development server starts, open the local URL displayed in your terminal.

## Machine Learning Models

Agrisense AI includes trained PyTorch models for agricultural produce analysis.

| Model | Purpose |
|---|---|
| `apple_grade_model.pth` | Apple quality grading |
| `tomato_grade_model.pth` | Tomato quality grading |
| `dragonfruit_grade_model.pth` | Dragon fruit quality grading |
| `fruit_detection_model.pth` | Fruit detection |

The grading models are designed to predict quality categories based on the images they receive. Prediction results depend on image quality, dataset coverage, and model performance.

The model files are stored in `ml/models/`. The corresponding prediction and training scripts are located in the `ml/` directory.

## Application Workflow

1. Open the Agrisense AI web application.
2. Navigate to the produce analysis section.
3. Upload an image or use the available camera interface.
4. Allow the application to process the image.
5. View the predicted quality grade and confidence information.
6. Explore other available sections, such as history and market prices.

The available workflow depends on the configured backend services and application environment.

## API and Backend

The application includes an Express.js backend and Python services for machine learning integration.

- `server.js` — Node.js/Express application server.
- `ml_server.py` — Python machine learning service.
- `ml_engine.py` — Machine learning processing and integration logic.
- `src/hooks/useApiTranslation.js` — Frontend translation integration.

API routes, request formats, environment variables, and service ports are defined in the project source code and configuration files.

## Important Notes

- The project is intended for agricultural produce quality assessment and experimentation.
- Model predictions are estimates and should not be treated as guaranteed measurements of fruit quality.
- Prediction confidence is not the same as verified grading accuracy.
- Market prices and other external information depend on their configured data sources.
- Do not upload API keys, passwords, private datasets, or other sensitive information to a public repository.

## Future Improvements

- Improve model performance with larger and more diverse datasets.
- Extend support for additional fruits and vegetables.
- Add more robust image quality checks.
- Improve prediction evaluation and reporting.
- Expand multilingual support.
- Add deployment and automated testing workflows.


## License

A license has not yet been specified. If you intend to make this project open source, choose an appropriate license and add its file to the repository.
