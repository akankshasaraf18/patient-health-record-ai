"""
Generate SBAR using fine-tuned LLM and evaluate accuracy against ground truth
This script is called by the backend to generate and evaluate SBAR summaries
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import pandas as pd
import os
import json
import sys
from difflib import SequenceMatcher
import re

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models/sbar_llm_finetuned")
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/patient_records_200.csv')

# Load dataset for comparison (ground truth)
try:
    df = pd.read_csv(DATA_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load dataset: {str(e)}"}))
    sys.exit(1)

# Load model and tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        torch_dtype=torch.float32,
        device_map=None
    )
    model.eval()
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)


def extract_sbar_components(sbar_text):
    """Extract S, B, A, R components from SBAR text"""
    components = {
        'S': '',
        'B': '',
        'A': '',
        'R': ''
    }
    
    # Try to extract each component
    for key in ['S', 'B', 'A', 'R']:
        pattern = rf'{key}:\s*([^.]+\.?)'
        match = re.search(pattern, sbar_text)
        if match:
            components[key] = match.group(1).strip()
    
    return components


def calculate_similarity(text1, text2):
    """Calculate similarity between two texts using SequenceMatcher"""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio() * 100


def calculate_jaccard_similarity(text1, text2):
    """Calculate Jaccard similarity between two texts"""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    if len(union) == 0:
        return 0.0
    
    return (len(intersection) / len(union)) * 100


def generate_sbar(patient_info):
    """Generate SBAR summary using the fine-tuned LLM"""
    prompt = f"""### Instruction:
Generate a structured SBAR summary for the following patient:

### Patient Information:
- Name: {patient_info.get('name', 'Unknown')}
- Age: {patient_info.get('age', 'N/A')}, Gender: {patient_info.get('gender', 'N/A')}
- Medical Condition: {patient_info.get('medical_condition', 'N/A')}
- History: {patient_info.get('history', 'N/A')}
- Vital Signs: HR {patient_info.get('heart_rate', 'N/A')}, BP {patient_info.get('blood_pressure', 'N/A')}, Temp {patient_info.get('temperature', 'N/A')}, RR {patient_info.get('respiratory_rate', 'N/A')}, SpO2 {patient_info.get('oxygen_saturation', 'N/A')}%
- Current Medications: {patient_info.get('current_medications', 'N/A')}
- Admission Type: {patient_info.get('admission_type', 'N/A')}

### SBAR Summary:
"""
    
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
            num_return_sequences=1
        )
    
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract only the SBAR part
    sbar_start = generated_text.find("### SBAR Summary:") + len("### SBAR Summary:")
    sbar = generated_text[sbar_start:].strip()
    
    # Clean up - take only until next ### or end
    if "###" in sbar:
        sbar = sbar[:sbar.index("###")].strip()
    
    # Take first 4 sentences (S, B, A, R)
    sentences = sbar.split('.')
    if len(sentences) > 4:
        sbar = '.'.join(sentences[:4]) + '.'
    
    return sbar.strip()


def find_ground_truth(patient_info):
    """Find matching ground truth SBAR from dataset using fuzzy matching"""
    # Try exact name match first
    name = patient_info.get('name', '').lower()
    if name and name != 'unknown':
        exact_name_match = df[df['patient_name'].str.lower() == name]
        if len(exact_name_match) > 0:
            return exact_name_match.iloc[0]['sbar_summary']
    
    # Try exact medical condition match
    condition = patient_info.get('medical_condition', '').lower()
    if condition and condition != 'n/a':
        exact_condition_match = df[df['medical_condition'].str.lower() == condition]
        if len(exact_condition_match) > 0:
            return exact_condition_match.iloc[0]['sbar_summary']
    
    # Try partial medical condition match
    if condition:
        partial_match = df[df['medical_condition'].str.lower().str.contains(condition, na=False)]
        if len(partial_match) > 0:
            return partial_match.iloc[0]['sbar_summary']
    
    # If still no match, find the most similar patient based on age and gender
    age = patient_info.get('age', 0)
    gender = patient_info.get('gender', '').lower()
    
    if age and age != 'N/A':
        # Filter by similar age (within 10 years) and same gender if available
        age_similar = df[abs(df['age'] - int(age)) <= 10]
        if len(age_similar) > 0:
            if gender and gender != 'unknown':
                gender_match = age_similar[age_similar['gender'].str.lower() == gender]
                if len(gender_match) > 0:
                    return gender_match.iloc[0]['sbar_summary']
            return age_similar.iloc[0]['sbar_summary']
    
    # Last resort: return a random sample from the dataset
    if len(df) > 0:
        return df.sample(1).iloc[0]['sbar_summary']
    
    return None


def evaluate_sbar(generated_sbar, ground_truth_sbar):
    """Evaluate generated SBAR against ground truth"""
    
    if not ground_truth_sbar:
        return {
            'overall_accuracy': None,
            'message': 'No ground truth found for comparison',
            'component_scores': None
        }
    
    # Extract components
    gen_components = extract_sbar_components(generated_sbar)
    truth_components = extract_sbar_components(ground_truth_sbar)
    
    # Calculate component-wise accuracy
    component_scores = {}
    for key in ['S', 'B', 'A', 'R']:
        if gen_components[key] and truth_components[key]:
            # Use Jaccard similarity for each component
            score = calculate_jaccard_similarity(gen_components[key], truth_components[key])
            component_scores[key] = round(score, 2)
        else:
            component_scores[key] = 0.0
    
    # Calculate overall accuracy
    overall_sequence = calculate_similarity(generated_sbar, ground_truth_sbar)
    overall_jaccard = calculate_jaccard_similarity(generated_sbar, ground_truth_sbar)
    
    # Average of both methods
    overall_accuracy = round((overall_sequence + overall_jaccard) / 2, 2)
    
    return {
        'overall_accuracy': overall_accuracy,
        'sequence_match': round(overall_sequence, 2),
        'jaccard_similarity': round(overall_jaccard, 2),
        'component_scores': component_scores,
        'generated_components': gen_components,
        'ground_truth_components': truth_components
    }


def main():
    """Main function - expects JSON input via command line"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No patient data provided"}))
        sys.exit(1)
    
    try:
        patient_info = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    
    # Generate SBAR
    try:
        generated_sbar = generate_sbar(patient_info)
    except Exception as e:
        print(json.dumps({"error": f"Failed to generate SBAR: {str(e)}"}))
        sys.exit(1)
    
    # Find ground truth
    ground_truth_sbar = find_ground_truth(patient_info)
    
    # Evaluate
    evaluation = evaluate_sbar(generated_sbar, ground_truth_sbar)
    
    # Prepare result
    result = {
        'success': True,
        'generated_sbar': generated_sbar,
        'ground_truth_sbar': ground_truth_sbar,
        'evaluation': evaluation,
        'model_info': {
            'model_name': 'GPT-2 Fine-tuned',
            'training_date': '2025-10-29',
            'dataset_size': len(df)
        }
    }
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
