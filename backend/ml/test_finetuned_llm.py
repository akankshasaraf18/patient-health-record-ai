"""
Test the fine-tuned LLM model for SBAR generation
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models/sbar_llm_finetuned")

print("=" * 60)
print("Testing Fine-tuned SBAR LLM")
print("=" * 60)

# Check if model exists
if not os.path.exists(MODEL_DIR):
    print(f"❌ ERROR: Model not found at {MODEL_DIR}")
    print("Please run train_llm_finetuning.py first!")
    exit(1)

# Load model
print(f"\nLoading model from {MODEL_DIR}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto" if torch.cuda.is_available() else None
)
print("✅ Model loaded successfully!")

# Test cases
test_cases = [
    {
        "name": "John Doe",
        "age": 72,
        "gender": "M",
        "condition": "shortness of breath",
        "history": "COPD, diabetes",
        "hr": 95,
        "bp": "145/85",
        "temp": 37.8,
        "rr": 22,
        "spo2": 92,
        "medications": "metformin, albuterol",
        "admission": "Emergency"
    },
    {
        "name": "Jane Smith",
        "age": 58,
        "gender": "F",
        "condition": "abdominal pain",
        "history": "hypertension",
        "hr": 78,
        "bp": "138/82",
        "temp": 36.9,
        "rr": 16,
        "spo2": 98,
        "medications": "lisinopril",
        "admission": "Routine"
    }
]

def generate_sbar(patient_info):
    """Generate SBAR summary for a patient"""
    prompt = f"""### Instruction:
Generate a structured SBAR summary for the following patient:

### Patient Information:
- Name: {patient_info['name']}
- Age: {patient_info['age']}, Gender: {patient_info['gender']}
- Medical Condition: {patient_info['condition']}
- History: {patient_info['history']}
- Vital Signs: HR {patient_info['hr']}, BP {patient_info['bp']}, Temp {patient_info['temp']}, RR {patient_info['rr']}, SpO2 {patient_info['spo2']}%
- Current Medications: {patient_info['medications']}
- Admission Type: {patient_info['admission']}

### SBAR Summary:
"""
    
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )
    
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    sbar_start = generated_text.find("### SBAR Summary:") + len("### SBAR Summary:")
    sbar = generated_text[sbar_start:].strip()
    
    # Clean up - take only until next ### or end
    if "###" in sbar:
        sbar = sbar[:sbar.index("###")].strip()
    
    return sbar

# Generate SBARs for test cases
print("\n" + "=" * 60)
print("Generating SBAR Summaries")
print("=" * 60)

for i, patient in enumerate(test_cases, 1):
    print(f"\n{'=' * 60}")
    print(f"Test Case {i}: {patient['name']}")
    print("=" * 60)
    print(f"Condition: {patient['condition']}")
    print(f"Age: {patient['age']}, Gender: {patient['gender']}")
    print(f"History: {patient['history']}")
    print(f"Vitals: HR {patient['hr']}, BP {patient['bp']}, Temp {patient['temp']}")
    print(f"Medications: {patient['medications']}")
    
    print("\n📝 Generated SBAR:")
    print("-" * 60)
    sbar = generate_sbar(patient)
    print(sbar)
    print("-" * 60)

print("\n" + "=" * 60)
print("✅ Testing Complete!")
print("=" * 60)
