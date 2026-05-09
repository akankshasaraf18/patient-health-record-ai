"""
SBAR Summary Model Training and Evaluation Script
Uses sklearn train_test_split to train and test on patient dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sentence_transformers import SentenceTransformer
import json
import os
from datetime import datetime
import re
import joblib

# Paths
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/patient_records_200.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/sbar_model.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'models/vectorizer.pkl')
METRICS_PATH = os.path.join(os.path.dirname(__file__), 'models/metrics.json')
EMBEDDINGS_MODEL_NAME = 'all-MiniLM-L6-v2'  # Fast and efficient sentence transformer


def load_data(file_path):
    """Load patient records from CSV file"""
    print(f"Loading data from {file_path}...")
    df = pd.read_csv(file_path)
    print(f"Loaded {len(df)} patient records")
    return df


def extract_sbar_components(sbar_text):
    """Extract individual SBAR components from the summary text"""
    components = {
        'situation': '',
        'background': '',
        'assessment': '',
        'recommendation': ''
    }
    
    if pd.isna(sbar_text):
        return components
    
    # Extract each component using regex
    situation_match = re.search(r'S:\s*([^.]+\.)', sbar_text, re.IGNORECASE)
    background_match = re.search(r'B:\s*([^.]+\.)', sbar_text, re.IGNORECASE)
    assessment_match = re.search(r'A:\s*([^.]+\.)', sbar_text, re.IGNORECASE)
    recommendation_match = re.search(r'R:\s*(.+)', sbar_text, re.IGNORECASE)
    
    if situation_match:
        components['situation'] = situation_match.group(1).strip()
    if background_match:
        components['background'] = background_match.group(1).strip()
    if assessment_match:
        components['assessment'] = assessment_match.group(1).strip()
    if recommendation_match:
        components['recommendation'] = recommendation_match.group(1).strip()
    
    return components


def create_features_from_patient_data(df):
    """Create feature text from patient data for model training"""
    features = []
    
    for idx, row in df.iterrows():
        # Combine relevant patient information
        feature_text = f"""
        Patient: {row['patient_name']}, Age: {row['age']}, Gender: {row['gender']}
        Condition: {row['medical_condition']}
        History: {row['history']}
        Medications: {row['current_medications']}
        Vitals: BP {row['blood_pressure']}, HR {row['heart_rate']}, RR {row['respiratory_rate']}, Temp {row['temperature']}, O2Sat {row['oxygen_saturation']}
        Notes: {row['notes']}
        """.strip()
        
        features.append(feature_text)
    
    return features


def create_quality_labels(df):
    """
    Create quality labels based on SBAR summary completeness
    1 = High quality (all components present)
    0 = Low quality (missing components)
    """
    labels = []
    
    for idx, row in df.iterrows():
        sbar = str(row['sbar_summary'])
        
        # Check if all SBAR components are present
        has_s = 'S:' in sbar
        has_b = 'B:' in sbar
        has_a = 'A:' in sbar
        has_r = 'R:' in sbar
        
        # High quality if all components present and reasonable length
        if has_s and has_b and has_a and has_r and len(sbar) > 50:
            labels.append(1)
        else:
            labels.append(0)
    
    return labels


def train_model_sklearn(X_train, X_test, y_train, y_test):
    """Train a model using scikit-learn"""
    print("\nTraining model with scikit-learn...")
    
    # Use TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2), stop_words='english')
    
    # Transform training and test data
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    # Train Logistic Regression model
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_tfidf, y_train)
    
    # Make predictions
    y_train_pred = model.predict(X_train_tfidf)
    y_test_pred = model.predict(X_test_tfidf)
    
    # Calculate metrics
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_test_pred, average='weighted')
    
    print(f"\nTraining Accuracy: {train_accuracy:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    
    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_test_pred, target_names=['Low Quality', 'High Quality']))
    
    return model, vectorizer, {
        'train_accuracy': float(train_accuracy),
        'test_accuracy': float(test_accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'train_size': len(X_train),
        'test_size': len(X_test)
    }


def train_with_sentence_transformers(X_train, X_test, y_train, y_test):
    """Train using sentence transformers for better semantic understanding"""
    print("\nTraining with Sentence Transformers...")
    
    # Load pre-trained sentence transformer
    embedder = SentenceTransformer(EMBEDDINGS_MODEL_NAME)
    
    # Generate embeddings
    print("Generating embeddings for training data...")
    X_train_embeddings = embedder.encode(X_train, show_progress_bar=True)
    
    print("Generating embeddings for test data...")
    X_test_embeddings = embedder.encode(X_test, show_progress_bar=True)
    
    # Train Random Forest on embeddings
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train_embeddings, y_train)
    
    # Make predictions
    y_train_pred = model.predict(X_train_embeddings)
    y_test_pred = model.predict(X_test_embeddings)
    
    # Calculate metrics
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_test_pred, average='weighted')
    
    print(f"\nTraining Accuracy: {train_accuracy:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    
    return model, embedder, {
        'train_accuracy': float(train_accuracy),
        'test_accuracy': float(test_accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'train_size': len(X_train),
        'test_size': len(X_test),
        'model_type': 'sentence_transformers'
    }


def save_metrics(metrics, model_type='tfidf'):
    """Save training metrics to JSON file"""
    os.makedirs(os.path.dirname(METRICS_PATH), exist_ok=True)
    
    metrics_data = {
        'model_type': model_type,
        'timestamp': datetime.now().isoformat(),
        'metrics': metrics,
        'dataset_info': {
            'total_samples': metrics['train_size'] + metrics['test_size'],
            'train_samples': metrics['train_size'],
            'test_samples': metrics['test_size'],
            'test_split_ratio': 0.2
        }
    }
    
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    
    print(f"\nMetrics saved to {METRICS_PATH}")


def save_model(model, vectorizer=None, model_type='tfidf'):
    """Save trained model and vectorizer"""
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    # Save vectorizer if using TF-IDF
    if vectorizer is not None:
        joblib.dump(vectorizer, VECTORIZER_PATH)
        print(f"Vectorizer saved to {VECTORIZER_PATH}")


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("SBAR Summary Model Training Pipeline")
    print("=" * 60)
    
    # Load data
    df = load_data(DATA_PATH)
    
    # Create features and labels
    print("\nCreating features from patient data...")
    X = create_features_from_patient_data(df)
    
    print("Creating quality labels...")
    y = create_quality_labels(df)
    
    print(f"\nDataset Statistics:")
    print(f"Total samples: {len(X)}")
    print(f"High quality samples: {sum(y)}")
    print(f"Low quality samples: {len(y) - sum(y)}")
    
    # Split data into train and test sets (80-20 split)
    print("\nSplitting data into train and test sets (80-20 split)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    # Choose model type
    use_sentence_transformers = True  # Set to False for faster TF-IDF approach
    
    if use_sentence_transformers:
        # Train with sentence transformers (better accuracy)
        model, embedder, metrics = train_with_sentence_transformers(
            X_train, X_test, y_train, y_test
        )
        save_model(model, model_type='sentence_transformers')
        save_metrics(metrics, model_type='sentence_transformers')
    else:
        # Train with TF-IDF (faster)
        model, vectorizer, metrics = train_model_sklearn(
            X_train, X_test, y_train, y_test
        )
        save_model(model, vectorizer, model_type='tfidf')
        save_metrics(metrics, model_type='tfidf')
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    
    return metrics


if __name__ == "__main__":
    main()
