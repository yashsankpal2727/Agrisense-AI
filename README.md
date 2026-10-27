# AgriSense AI

AgriSense AI is a web application for analyzing the quality of agricultural produce and viewing market price information.

The project currently supports **apples, tomatoes, and dragon fruit**. Users can upload an image or use their camera; produce detection runs automatically, and trained machine learning models classify supported produce into **Grade A, Grade B, or Grade C** and generate a quality score.

The application also includes market price information, analysis history, farmer profiles, and a multilingual interface.

## Features

* Automatic apple, tomato, and dragon fruit detection and quality grading
* Grade A / B / C classification
* Quality score out of 100
* Image upload and camera capture
* Analysis history
* Farmer login and profile
* APMC market price information
* Market price comparison
* English, Hindi, and Marathi interface
* Gemini API integration for translation and AI-assisted features
* Local Python ML engine for produce analysis

## How it works

The application uses React for the frontend, Express.js for the backend, and Python for the machine learning part.

```text
User
  ↓
Upload / Camera
  ↓
React Frontend
  ↓
Node.js + Express
  ↓
Python ML Engine
  ↓
Produce Detection
  ↓
Grade Classification
  ↓
Quality Score
  ↓
Result
```

The ML pipeline uses trained PyTorch models to process the submitted image.

## Machine Learning Models

The trained models are stored in:

```text
ml/models/
```

Current models:

| Model                       | Purpose                       |
| --------------------------- | ----------------------------- |
| `fruit_detection_model.pth` | Detects the supported produce |
| `apple_grade_model.pth`     | Classifies apple quality      |
| `tomato_grade_model.pth`    | Classifies tomato quality     |
| `dragonfruit_grade_model.pth` | Classifies dragon fruit quality |

The grading classes are:

```text
Grade A
Grade B
Grade C
```

The project also contains the training and testing scripts used during model development.

## Tech Stack

### Frontend

* React.js
* JSX
* JavaScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Machine Learning

* Python
* PyTorch
* Torchvision
* EfficientNet-B0
* Computer Vision
* Image Classification

### AI

* Google Gemini API

### Tools

* Git
* GitHub
* npm
* Python virtual environment

## Project Structure

```text
Agrisense/
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── server.js
├── metadata.json
│
├── ml_engine.py
├── ml_server.py
│
├── ml/
│   ├── models/
│   │   ├── apple_grade_model.pth
│   │   ├── tomato_grade_model.pth
│   │   └── fruit_detection_model.pth
│   │
│   ├── predict.py
│   ├── split_fruit_dataset.py
│   ├── test_fruit_detector.py
│   ├── train.py
│   ├── train_fruit_detector.py
│   └── train_tomato.py
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── types.js
│   │
│   ├── components/
│   │   ├── CameraModal.jsx
│   │   ├── LanguageSelect.jsx
│   │   └── Navbar.jsx
│   │
│   ├── data/
│   │   └── sampleProduce.js
│   │
│   ├── hooks/
│   │   └── useApiTranslation.js
│   │
│   └── pages/
│       ├── LandingPage.jsx
│       ├── AuthPage.jsx
│       ├── DashboardPage.jsx
│       ├── UploadPage.jsx
│       ├── AnalyzingPage.jsx
│       ├── ResultPage.jsx
│       ├── MarketPricePage.jsx
│       ├── HistoryPage.jsx
│       └── ProfilePage.jsx
│
├── .env.example
├── .gitignore
└── README.md
```

## Running the Project

### Requirements

Make sure you have the following installed:

* Node.js
* npm
* Python 3.10+
* Git

Check the installed versions:

```bash
node --version
npm --version
python --version
git --version
```

### 1. Clone the repository

```bash
git clone https://github.com/yashsankpal2727/Agrisense.git
```

Go to the project folder:

```bash
cd Agrisense
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Create a Python virtual environment

On Windows:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1

python -m pip install torch torchvision scikit-learn pillow numpy
```

Install the Python packages required by the ML code.

### 4. Configure the API key

Create a `.env` file in the project root.

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

The Market Price page uses the AGMARKNET "Current Daily Price of Various Commodities from Various Markets (Mandi)" dataset through the Express backend. The page checks for updates every five minutes and also has a manual refresh button; this only picks up new data when the provider publishes it. The provider reports daily prices, not live auction bids. Prices are converted from ₹/quintal to ₹/kg. The district modal card is an unweighted average of the returned market modal prices. The source grade (for example, `Local`) is not mapped to the app's produce Grade A/B/C; distance is not provided. The report-history chart only shows dates actually returned by the dataset, and may contain only one day. Restart `npm run dev` after changing `.env`.

Opening mandi prices from an analysis result preselects and locks the analyzed commodity so the request only returns that commodity. The analysis grade is shown for context, but AGMARKNET does not provide the same Grade A/B/C classification, so prices are not grade-adjusted. Dragon fruit is accepted as a commodity selection; the page shows an empty-data message if the source has no matching report.

### 5. Start the application

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Main Pages

### Landing Page

Introduces the project and explains the main features and workflow.

### Login / Registration

Users can create an account or log in to the application.

### Dashboard

Shows user information, recent analyses, analysis statistics, and market information.

### Upload & Analysis

Users can select a district and market, upload an image, or capture an image using the camera.

### Analysis

Shows the different stages of the image analysis process.

### Result

Displays the predicted grade, quality score, visual quality information, and estimated shelf life.

### Market Price

Shows APMC market prices and allows users to compare prices between markets.

### History

Stores and displays previous analysis results.

### Profile

Contains user information and application settings.

## Training the Models

The repository contains the scripts used to train the models.

Apple model:

```bash
python ml/train.py
```

Tomato model:

```bash
python ml/train_tomato.py
```

Fruit detection model:

```bash
python ml/train_fruit_detector.py
```

The training scripts require the appropriate datasets and Python dependencies.

## Supported Languages

The interface currently supports:

* English
* Hindi
* Marathi

The language can be changed from the navigation bar.

## Current Limitations

This is still a project under development.

Some of the current limitations are:

* Only apples and tomatoes are supported for grading.
* The grading models depend on the quality and variety of the training data.
* Market prices depend on the available data source.
* Shelf-life estimation is an approximate value and should not be treated as a laboratory measurement.
* More real-world images are needed to improve the models across different lighting and camera conditions.

## Future Improvements

Some improvements planned for the project:

* Add more fruits and vegetables
* Improve the grading models with larger datasets
* Add disease detection
* Improve shelf-life prediction
* Add more Indian languages
* Connect to live mandi price APIs
* Improve market price forecasting
* Add a mobile version
* Improve authentication and deployment
* Add more real-world testing

## Project Status

The main application, ML grading pipeline, market interface, and multilingual interface are currently under development.

The current trained models support:

```text
Apple  → Grade A / B / C
Tomato → Grade A / B / C
```

## License

This project is currently developed as an academic/personal project.

A separate open-source license can be added if the project is distributed publicly.
#   A g r i s e n s e  
 