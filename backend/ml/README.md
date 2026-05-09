# ML Model Training for SBAR Summary Quality Assessment

This directory contains the machine learning pipeline for training and evaluating a model to assess SBAR summary quality using scikit-learn's train_test_split methodology.

## Overview

The ML model uses the 200 patient samples from `backend/data/patient_records_200.csv` to train a classifier that evaluates SBAR summary quality. The dataset is split into:
- **Training Set**: 80% (160 samples)
- **Test Set**: 20% (40 samples)

## Model Types

Two model approaches are available:

1. **TF-IDF + Logistic Regression** (Faster)
   - Uses Term Frequency-Inverse Document Frequency vectorization
   - Logistic Regression classifier
   - Quick training, good baseline performance

2. **Sentence Transformers + Random Forest** (Better Accuracy)
   - Uses pre-trained `all-MiniLM-L6-v2` model for semantic embeddings
   - Random Forest classifier with 100 estimators
   - Better semantic understanding, higher accuracy

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend/ml
pip install -r requirements.txt
```

This will install:
- scikit-learn
- pandas
- numpy
- transformers
- torch
- sentence-transformers
- matplotlib
- seaborn
- joblib
- tqdm

### 2. Train the Model

```bash
python train_test_model.py
```

The script will:
1. Load the 200 patient records from CSV
2. Create features from patient data (demographics, vitals, conditions, etc.)
3. Generate quality labels based on SBAR completeness
4. Split data into train/test sets (80/20)
5. Train the selected model
6. Evaluate on the test set
7. Save model, vectorizer/embedder, and metrics

### 3. View Results

After training, the following files will be created:

- `models/sbar_model.pkl` - Trained model
- `models/vectorizer.pkl` - TF-IDF vectorizer (if using TF-IDF approach)
- `models/metrics.json` - Training and test metrics

The metrics JSON contains:
```json
{
  "model_type": "tfidf" or "sentence_transformers",
  "timestamp": "2025-10-15T...",
  "metrics": {
    "train_accuracy": 0.95,
    "test_accuracy": 0.92,
    "precision": 0.91,
    "recall": 0.93,
    "f1_score": 0.92,
    "train_size": 160,
    "test_size": 40
  },
  "dataset_info": {
    "total_samples": 200,
    "train_samples": 160,
    "test_samples": 40,
    "test_split_ratio": 0.2
  }
}
```

## Viewing Metrics on the Website

The trained model metrics are automatically displayed on the website:

1. Start the backend server (if not already running):
   ```bash
   cd backend
   npm start
   ```

2. Navigate to the "ML Model" page in the application
3. View real-time metrics including:
   - Training Accuracy
   - Test Accuracy
   - Precision
   - Recall
   - F1 Score
   - Dataset statistics

## Model Configuration

To switch between model types, edit `train_test_model.py`:

```python
# Line ~250
use_sentence_transformers = True  # Set to False for TF-IDF approach
```

## Features Used

The model creates features from:
- Patient demographics (name, age, gender)
- Medical condition
- Medical history
- Current medications
- Vital signs (BP, HR, RR, Temp, O2Sat)
- Clinical notes

## Quality Labels

SBAR summaries are labeled as:
- **High Quality (1)**: All SBAR components present (S, B, A, R) and length > 50 chars
- **Low Quality (0)**: Missing components or too short

## Performance Metrics

- **Accuracy**: Percentage of correct predictions
- **Precision**: True Positives / (True Positives + False Positives)
- **Recall**: True Positives / (True Positives + False Negatives)
- **F1 Score**: Harmonic mean of Precision and Recall

## Retraining

To retrain the model with new data:

1. Update `backend/data/patient_records_200.csv` with new patient records
2. Run the training script again:
   ```bash
   python train_test_model.py
   ```
3. Refresh the ML Model page in the application to see updated metrics

## Troubleshooting

### Python packages not installing
```bash
# Upgrade pip first
pip install --upgrade pip
# Then retry
pip install -r requirements.txt
```

### Torch installation issues on Windows
```bash
# Install CPU-only version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### Model not showing on website
- Ensure the training script completed successfully
- Check that `models/metrics.json` exists
- Restart the backend server
- Check browser console for errors

## API Endpoints

The following endpoints are available:

- `GET /api/ml-metrics/all` - All metrics in one response
- `GET /api/ml-metrics/performance` - Model performance details
- `GET /api/ml-metrics/stats` - Formatted statistics
- `GET /api/ml-metrics/train-accuracy` - Training accuracy
- `GET /api/ml-metrics/test-accuracy` - Test accuracy
- `GET /api/ml-metrics/status` - Check if model is trained

## Future Improvements

- Add cross-validation for more robust evaluation
- Implement hyperparameter tuning
- Add model versioning and comparison
- Support for model deployment and inference
- Real-time prediction API for new SBAR summaries
