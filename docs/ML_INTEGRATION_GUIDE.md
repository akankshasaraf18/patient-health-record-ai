# ML Model Integration Guide

## Overview

This document explains how the machine learning model training and evaluation has been integrated into your application using scikit-learn's train_test_split methodology.

## What Was Implemented

### 1. Python ML Training Pipeline (`backend/ml/train_test_model.py`)

A complete machine learning pipeline that:
- Loads 200 patient samples from `backend/data/patient_records_200.csv`
- Splits data into 80% training (160 samples) and 20% testing (40 samples)
- Trains a classifier to evaluate SBAR summary quality
- Calculates accuracy, precision, recall, and F1 score on test set
- Saves metrics to JSON for the web application to display

### 2. Backend Services

**ML Metrics Service** (`backend/src/services/mlMetricsService.js`)
- Reads training metrics from the Python-generated JSON file
- Provides methods to access train/test accuracy and other metrics
- Monitors for metric file updates

**API Routes** (`backend/src/routes/mlMetricsRoutes.js`)
- `GET /api/ml-metrics/all` - All metrics
- `GET /api/ml-metrics/performance` - Performance details
- `GET /api/ml-metrics/train-accuracy` - Training accuracy
- `GET /api/ml-metrics/test-accuracy` - Test accuracy
- `GET /api/ml-metrics/status` - Model training status

### 3. Frontend Components

**Model Metrics Service** (`frontend/src/services/mlMetricsService.js`)
- Fetches ML metrics from backend API

**Model Metrics Component** (`frontend/src/components/ModelMetrics.jsx`)
- Beautiful UI displaying:
  - Training accuracy with progress bar
  - Test accuracy with progress bar
  - Precision, Recall, F1 Score
  - Dataset information
  - Last training timestamp

**ML Model Page** (`frontend/src/pages/MLModelPage.jsx`)
- Dedicated page for viewing model performance
- Instructions for retraining
- Accessible via navbar "ML Model" link

## Quick Start

### Option 1: Using the Setup Script (Windows)

```bash
SETUP_ML.bat
```

This script will:
1. Check Python installation
2. Install all dependencies
3. Train the model
4. Display results

### Option 2: Manual Setup

1. **Install Python Dependencies**
   ```bash
   cd backend/ml
   pip install -r requirements.txt
   ```

2. **Train the Model**
   ```bash
   python train_test_model.py
   ```

3. **Start Backend** (in a new terminal)
   ```bash
   cd backend
   npm start
   ```

4. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

5. **View Results**
   - Navigate to http://localhost:5173
   - Login to the application
   - Click "ML Model" in the navbar

## How It Works

### Data Flow

```
patient_records_200.csv
        ↓
  Train/Test Split (80/20)
        ↓
  Feature Engineering
        ↓
  Model Training (TF-IDF or Transformers)
        ↓
  Evaluation on Test Set
        ↓
  metrics.json
        ↓
  Backend API
        ↓
  Frontend Display
```

### Model Types

**1. TF-IDF + Logistic Regression (Default: Fast)**
- Converts patient data to TF-IDF features
- Trains Logistic Regression classifier
- Quick training (~10-30 seconds)
- Good baseline accuracy

**2. Sentence Transformers + Random Forest (Better Accuracy)**
- Uses pre-trained language model for embeddings
- Trains Random Forest on semantic features
- Longer training (~2-5 minutes first time)
- Higher accuracy and better generalization

To switch models, edit `train_test_model.py` line ~250:
```python
use_sentence_transformers = True  # or False
```

### Features Used

The model extracts features from:
- Patient demographics (name, age, gender)
- Medical condition
- Medical history
- Current medications
- Vital signs (BP, HR, RR, Temp, O2 Saturation)
- Clinical notes

### Quality Classification

SBAR summaries are classified as:
- **High Quality**: All components present (S, B, A, R) with sufficient detail
- **Low Quality**: Missing components or insufficient information

## Viewing Results on Website

1. After training, the metrics are automatically available
2. Navigate to the "ML Model" page in your app
3. You'll see:
   - **Training Accuracy**: Performance on 160 training samples
   - **Test Accuracy**: Performance on 40 held-out test samples
   - **Additional Metrics**: Precision, Recall, F1 Score
   - **Dataset Info**: Sample counts and split ratio

## Understanding the Metrics

### Accuracy
Percentage of correct predictions. Higher is better.
- **Training Accuracy**: How well the model learned the training data
- **Test Accuracy**: How well the model generalizes to new data

### Precision
Of all samples predicted as "High Quality", what percentage were actually high quality?

### Recall
Of all actual "High Quality" samples, what percentage did we correctly identify?

### F1 Score
Harmonic mean of Precision and Recall. Good overall performance indicator.

## Expected Performance

Based on the dataset:
- **Training Accuracy**: 85-95%
- **Test Accuracy**: 80-90%
- **Precision**: 80-92%
- **Recall**: 80-92%
- **F1 Score**: 80-92%

If test accuracy is significantly lower than training accuracy, this indicates overfitting.

## Retraining the Model

To retrain with updated data:

1. Update `backend/data/patient_records_200.csv` with new samples
2. Run training script:
   ```bash
   cd backend/ml
   python train_test_model.py
   ```
3. Refresh the ML Model page in your browser

## File Structure

```
backend/
  ml/
    train_test_model.py       # Main training script
    requirements.txt          # Python dependencies
    README.md                # ML-specific documentation
    models/                  # Created after training
      sbar_model.pkl        # Trained model
      vectorizer.pkl        # TF-IDF vectorizer (if used)
      metrics.json          # Performance metrics
  src/
    services/
      mlMetricsService.js   # Node.js service for metrics
    routes/
      mlMetricsRoutes.js    # API endpoints
  data/
    patient_records_200.csv # Training dataset

frontend/
  src/
    services/
      mlMetricsService.js   # Frontend API client
    components/
      ModelMetrics.jsx      # Metrics display component
    pages/
      MLModelPage.jsx       # ML Model page
```

## API Endpoints Reference

### GET /api/ml-metrics/all
Returns all metrics in one response.

**Response:**
```json
{
  "trained": true,
  "model_info": {
    "type": "sentence_transformers",
    "last_trained": "2025-10-15T10:30:00.000Z"
  },
  "accuracy": {
    "train": "92.50%",
    "test": "87.50%"
  },
  "metrics": {
    "precision": "88.20%",
    "recall": "89.10%",
    "f1_score": "88.65%"
  },
  "dataset": {
    "total_samples": 200,
    "train_samples": 160,
    "test_samples": 40,
    "test_split_ratio": 0.2
  }
}
```

## Troubleshooting

### Model not showing on website
- **Check**: Did training complete successfully?
- **Check**: Does `backend/ml/models/metrics.json` exist?
- **Fix**: Restart backend server after training

### Python dependencies fail to install
```bash
# Upgrade pip first
pip install --upgrade pip
pip install -r requirements.txt
```

### Torch installation issues (Windows)
```bash
# Install CPU-only version
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

### "Model not trained" message
- **Cause**: Training hasn't been run yet
- **Fix**: Run `python backend/ml/train_test_model.py`

## Next Steps

1. **Run the training** using `SETUP_ML.bat` or manually
2. **View results** on the ML Model page
3. **Compare** training vs test accuracy
4. **Iterate** by adjusting features or trying different models

## Differences from Previous Approach

### Before
- Compared generated summaries against ground truth dataset
- Used Jaccard similarity for evaluation
- Required manual ground truth data

### Now
- Trains ML model on 200 samples with train/test split
- Uses sklearn for proper train/test evaluation
- Shows real training and test accuracy
- More scientifically rigorous evaluation
- Better reflects actual model performance

## Future Enhancements

- Cross-validation for more robust metrics
- Hyperparameter tuning
- Model versioning and comparison
- Real-time SBAR quality prediction
- Confidence scores for predictions
- Feature importance analysis
