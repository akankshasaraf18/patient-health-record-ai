"""
Fine-tune LLM (Llama-2 or GPT-2) for SBAR Summary Generation
Uses patient_records_200.csv to train a text generation model
"""

import pandas as pd
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import os
import json
from datetime import datetime

# Configuration
MODEL_NAME = "gpt2"  # Using GPT-2 (lighter, faster). Can change to "meta-llama/Llama-2-7b-hf" if you have access
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "models/sbar_llm_finetuned")
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/patient_records_200.csv')
MAX_LENGTH = 512
BATCH_SIZE = 4
EPOCHS = 3
LEARNING_RATE = 5e-5

print("=" * 60)
print("SBAR LLM Fine-tuning Pipeline")
print("=" * 60)
print(f"Model: {MODEL_NAME}")
print(f"Dataset: {DATA_PATH}")
print(f"Output: {OUTPUT_DIR}")
print("=" * 60)

# Check for GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"\nUsing device: {device}")
if device == "cpu":
    print("⚠️  WARNING: Training on CPU will be SLOW. GPU recommended.")
    print("   Consider using Google Colab (free GPU) or reduce dataset size.")

# Load dataset
print(f"\nLoading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} patient records")

# Prepare training data
# Format: Convert patient data into instruction-following format
def create_training_prompt(row):
    """
    Create a training prompt in instruction format:
    Input: Patient information
    Output: SBAR summary
    """
    input_text = f"""### Instruction:
Generate a structured SBAR (Situation, Background, Assessment, Recommendation) summary for the following patient:

### Patient Information:
- Name: {row['patient_name']}
- Age: {row['age']}, Gender: {row['gender']}
- Medical Condition: {row['medical_condition']}
- History: {row['history']}
- Vital Signs: HR {row['heart_rate']}, BP {row['blood_pressure']}, Temp {row['temperature']}, RR {row['respiratory_rate']}, SpO2 {row['oxygen_saturation']}%
- Current Medications: {row['current_medications']}
- Admission Type: {row['admission_type']}
- Notes: {row['notes']}

### SBAR Summary:
{row['sbar_summary']}"""
    
    return input_text

print("\nCreating training prompts...")
training_texts = [create_training_prompt(row) for _, row in df.iterrows()]
print(f"Created {len(training_texts)} training examples")

# Split into train/test (80/20)
train_size = int(0.8 * len(training_texts))
train_texts = training_texts[:train_size]
test_texts = training_texts[train_size:]

print(f"\nDataset split:")
print(f"  Training: {len(train_texts)} examples")
print(f"  Test: {len(test_texts)} examples")

# Create datasets
train_dataset = Dataset.from_dict({"text": train_texts})
test_dataset = Dataset.from_dict({"text": test_texts})

# Load tokenizer and model
print(f"\nLoading tokenizer and model: {MODEL_NAME}...")
print("This may take a few minutes on first run (downloading model)...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    device_map="auto" if device == "cuda" else None
)

print("✅ Model and tokenizer loaded successfully!")

# Tokenize datasets
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length"
    )

print("\nTokenizing datasets...")
tokenized_train = train_dataset.map(tokenize_function, batched=True, remove_columns=["text"])
tokenized_test = test_dataset.map(tokenize_function, batched=True, remove_columns=["text"])
print("✅ Tokenization complete!")

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False  # Causal LM (not masked)
)

# Training arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    warmup_steps=50,
    learning_rate=LEARNING_RATE,
    weight_decay=0.01,
    logging_dir=os.path.join(OUTPUT_DIR, "logs"),
    logging_steps=10,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    fp16=device == "cuda",  # Use mixed precision on GPU
    report_to="none",  # Disable wandb/tensorboard
    save_total_limit=2,  # Keep only 2 checkpoints
)

# Initialize trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_test,
    data_collator=data_collator,
)

print("\n" + "=" * 60)
print("Starting Fine-tuning...")
print("=" * 60)
print(f"Epochs: {EPOCHS}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Learning rate: {LEARNING_RATE}")
print("=" * 60)

# Train the model
print("\n🚀 Training started... This may take 15-60 minutes depending on hardware.\n")
train_result = trainer.train()

print("\n✅ Training completed!")

# Evaluate
print("\nEvaluating model on test set...")
eval_results = trainer.evaluate()

print("\n" + "=" * 60)
print("Training Results")
print("=" * 60)
print(f"Training Loss: {train_result.training_loss:.4f}")
print(f"Evaluation Loss: {eval_results['eval_loss']:.4f}")
print("=" * 60)

# Save model
print(f"\nSaving fine-tuned model to {OUTPUT_DIR}...")
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)

# Save training metadata
metadata = {
    "model_name": MODEL_NAME,
    "training_date": datetime.now().isoformat(),
    "dataset_size": len(df),
    "train_size": len(train_texts),
    "test_size": len(test_texts),
    "epochs": EPOCHS,
    "batch_size": BATCH_SIZE,
    "learning_rate": LEARNING_RATE,
    "training_loss": float(train_result.training_loss),
    "eval_loss": float(eval_results['eval_loss']),
    "device": device
}

metadata_path = os.path.join(OUTPUT_DIR, "training_metadata.json")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"✅ Training metadata saved to {metadata_path}")

# Test generation
print("\n" + "=" * 60)
print("Testing Model Generation")
print("=" * 60)

test_input = """### Instruction:
Generate a structured SBAR summary for the following patient:

### Patient Information:
- Name: Test Patient
- Age: 65, Gender: M
- Medical Condition: chest pain
- History: hypertension
- Vital Signs: HR 80, BP 140/90, Temp 37.2, RR 18, SpO2 98%
- Current Medications: amlodipine
- Admission Type: Emergency

### SBAR Summary:
"""

inputs = tokenizer(test_input, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
if device == "cuda":
    inputs = {k: v.to(device) for k, v in inputs.items()}

print("\nGenerating sample SBAR summary...")
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,
        temperature=0.7,
        do_sample=True,
        top_p=0.9,
        pad_token_id=tokenizer.eos_token_id
    )

generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
# Extract only the generated SBAR part
sbar_start = generated_text.find("### SBAR Summary:") + len("### SBAR Summary:")
generated_sbar = generated_text[sbar_start:].strip()

print("\n📝 Generated SBAR:")
print("-" * 60)
print(generated_sbar)
print("-" * 60)

print("\n" + "=" * 60)
print("✅ Fine-tuning Complete!")
print("=" * 60)
print(f"\n📦 Model saved to: {OUTPUT_DIR}")
print(f"📊 Metadata saved to: {metadata_path}")
print(f"\nYou can now use this model to generate SBAR summaries!")
print("=" * 60)
