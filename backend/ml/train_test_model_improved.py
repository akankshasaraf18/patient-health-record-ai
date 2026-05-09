"""
Improved SBAR Model Training with Realistic Quality Variations
Uses sklearn train_test_split to train and test on patient dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import json
import os
from datetime import datetime
import re
import random
import joblib

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Paths
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/patient_records_200.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/sbar_model.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'models/vectorizer.pkl')
METRICS_PATH = os.path.join(os.path.dirname(__file__), 'models/metrics.json')


def load_data(file_path):
    """Load patient records from CSV file"""
    print(f"Loading data from {file_path}...")
    df = pd.read_csv(file_path)
    print(f"Loaded {len(df)} patient records")
    return df


def create_quality_variations(df):
    """
    Create synthetic quality variations in SBAR summaries.
    
    Since all original summaries are perfect, we'll:
    - Keep 60% as high quality (complete, detailed)
    - Make 40% lower quality (missing components, vague, incomplete)
    
    This creates a realistic training scenario.
    """
    df = df.copy()
    df['original_sbar'] = df['sbar_summary'].copy()
    df['quality_label'] = 1  # Start with all high quality
    
    # Randomly select 40% to degrade
    n_samples = len(df)
    n_degrade = int(n_samples * 0.4)
    degrade_indices = random.sample(range(n_samples), n_degrade)
    
    print(f"\nCreating quality variations:")
    print(f"  High quality: {n_samples - n_degrade} samples (60%)")
    print(f"  Low quality:  {n_degrade} samples (40%)")
    
    for idx in degrade_indices:
        sbar = df.loc[idx, 'sbar_summary']
        degradation_type = random.choice([
            'missing_recommendation',
            'missing_assessment', 
            'missing_multiple',
            'vague_background',
            'incomplete_assessment',
            'no_vitals',
            'minimal_content'
        ])
        
        if degradation_type == 'missing_recommendation':
            # Remove recommendation component
            sbar = re.sub(r'\s*R:.*$', '', sbar)
            
        elif degradation_type == 'missing_assessment':
            # Remove assessment component
            sbar = re.sub(r'\s*A:.*?R:', ' R:', sbar)
            
        elif degradation_type == 'missing_multiple':
            # Remove both assessment and recommendation
            sbar = re.sub(r'\s*A:.*$', '', sbar)
            
        elif degradation_type == 'vague_background':
            # Make background vague
            sbar = re.sub(r'B: [^.]+\.', 'B: Multiple conditions.', sbar)
            
        elif degradation_type == 'incomplete_assessment':
            # Make assessment very short/incomplete
            sbar = re.sub(r'A: [^.]+\. R:', 'A: Stable. R:', sbar)
            
        elif degradation_type == 'no_vitals':
            # Remove vitals from assessment
            sbar = re.sub(r'HR \d+, BP [^,]+, Temp [^.]+\.', 'Vitals reviewed.', sbar)
            
        elif degradation_type == 'minimal_content':
            # Very minimal SBAR
            parts = sbar.split('.')
            if len(parts) > 2:
                sbar = parts[0] + '. ' + parts[1] + '.'
        
        df.loc[idx, 'sbar_summary'] = sbar
        df.loc[idx, 'quality_label'] = 0
    
    return df


def create_features_from_sbar(df):
    """
    Create feature vectors from SBAR summaries.
    Uses TF-IDF to convert text to numerical features.
    """
    features = []
    
    for idx, row in df.iterrows():
        # Use the SBAR summary as the feature text
        feature_text = str(row['sbar_summary'])
        features.append(feature_text)
    
    return features


def train_model(X_train, y_train):
    """
    Train a Random Forest classifier on the training data.
    Random Forest is robust and provides good performance.
    """
    print("\nTraining Random Forest classifier...")
    
    # Use TF-IDF vectorization
    vectorizer = TfidfVectorizer(
        max_features=100,
        ngram_range=(1, 2),
        min_df=2
    )
    
    # Fit vectorizer and transform training data
    X_train_vec = vectorizer.fit_transform(X_train)
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_vec, y_train)
    
    print(f"Model trained on {len(X_train)} samples")
    print(f"Feature vocabulary size: {len(vectorizer.vocabulary_)}")
    
    return model, vectorizer


def evaluate_model(model, vectorizer, X, y, set_name="Test"):
    """Evaluate model performance on a dataset"""
    X_vec = vectorizer.transform(X)
    y_pred = model.predict(X_vec)
    
    # Calculate metrics
    accuracy = accuracy_score(y, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y, y_pred, average='binary')
    
    print(f"\n{set_name} Set Performance:")
    print(f"  Accuracy:  {accuracy * 100:.2f}%")
    print(f"  Precision: {precision * 100:.2f}%")
    print(f"  Recall:    {recall * 100:.2f}%")
    print(f"  F1 Score:  {f1 * 100:.2f}%")
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'predictions': y_pred.tolist(),
        'true_labels': y.tolist()
    }


def save_metrics(train_metrics, test_metrics, X_train, X_test, y_train, y_test):
    """Save training metrics to JSON file"""
    
    # Count class distribution
    train_high_quality = sum(y_train)
    train_low_quality = len(y_train) - train_high_quality
    test_high_quality = sum(y_test)
    test_low_quality = len(y_test) - test_high_quality
    
    metrics = {
        'trained': True,
        'timestamp': datetime.now().isoformat(),
        'model_type': 'Random Forest Classifier',
        'accuracy': {
            'train': round(train_metrics['accuracy'] * 100, 2),
            'test': round(test_metrics['accuracy'] * 100, 2)
        },
        'metrics': {
            'precision': round(test_metrics['precision'] * 100, 2),
            'recall': round(test_metrics['recall'] * 100, 2),
            'f1_score': round(test_metrics['f1'] * 100, 2)
        },
        'dataset': {
            'total_samples': len(X_train) + len(X_test),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'split_ratio': '80/20',
            'train_distribution': {
                'high_quality': int(train_high_quality),
                'low_quality': int(train_low_quality)
            },
            'test_distribution': {
                'high_quality': int(test_high_quality),
                'low_quality': int(test_low_quality)
            }
        },
        'model_info': {
            'algorithm': 'Random Forest',
            'n_estimators': 100,
            'max_depth': 10,
            'features': 'TF-IDF (max 100 features)',
            'random_state': 42
        }
    }
    
    # Ensure models directory exists
    os.makedirs(os.path.dirname(METRICS_PATH), exist_ok=True)
    
    # Save to JSON
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"\nMetrics saved to: {METRICS_PATH}")
    return metrics


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("SBAR Quality Classifier Training")
    print("=" * 60)
    
    # Load data
    df = load_data(DATA_PATH)
    
    # Create quality variations (since all original samples are perfect)
    df = create_quality_variations(df)
    
    # Create features
    print("\nCreating features from SBAR summaries...")
    X = create_features_from_sbar(df)
    y = df['quality_label'].values
    
    # Split into train/test (80/20)
    print("\nSplitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.2, 
        random_state=42,
        stratify=y  # Ensure balanced split
    )
    
    print(f"  Training set: {len(X_train)} samples")
    print(f"  Test set:     {len(X_test)} samples")
    
    # Train model
    model, vectorizer = train_model(X_train, y_train)
    
    # Evaluate on training set
    train_metrics = evaluate_model(model, vectorizer, X_train, y_train, "Training")
    
    # Evaluate on test set
    test_metrics = evaluate_model(model, vectorizer, X_test, y_test, "Test")
    
    # Save model and vectorizer
    print("\nSaving model and vectorizer...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"  Model saved to: {MODEL_PATH}")
    print(f"  Vectorizer saved to: {VECTORIZER_PATH}")
    
    # Save metrics
    metrics = save_metrics(train_metrics, test_metrics, X_train, X_test, y_train, y_test)
    
    # Print summary
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"\nFinal Test Accuracy: {metrics['accuracy']['test']}%")
    print(f"Train/Test Split: {len(X_train)}/{len(X_test)} samples")
    print(f"\nClass Distribution:")
    print(f"  Training: {metrics['dataset']['train_distribution']['high_quality']} high quality, "
          f"{metrics['dataset']['train_distribution']['low_quality']} low quality")
    print(f"  Test:     {metrics['dataset']['test_distribution']['high_quality']} high quality, "
          f"{metrics['dataset']['test_distribution']['low_quality']} low quality")
    print("\nMetrics available at: /api/ml-metrics/all")
    print("=" * 60)


if __name__ == '__main__':
    main()
