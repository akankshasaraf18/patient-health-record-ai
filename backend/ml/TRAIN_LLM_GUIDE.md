# 🚀 LLM Fine-tuning Guide for SBAR Generation

## Overview

This guide helps you fine-tune a Large Language Model (LLM) to generate SBAR summaries from patient data using your `patient_records_200.csv` dataset.

## What You're Training

**Model**: GPT-2 (default) or Llama-2  
**Task**: Text Generation (SBAR summaries from patient information)  
**Dataset**: 200 patient records with SBAR summaries  
**Training Time**: 15-60 minutes (depending on hardware)

## Prerequisites

### Option 1: Local Training (Recommended if you have GPU)
- **GPU**: NVIDIA GPU with 8GB+ VRAM (RTX 3060 or better)
- **RAM**: 16GB+ system RAM
- **Disk**: 5GB free space

### Option 2: Google Colab (FREE - Recommended for most users)
- No GPU required on your machine
- Free GPU access (T4 or better)
- Just need a Google account

### Option 3: CPU Only (SLOW but works)
- Works on any machine
- Training will take 2-4 hours
- Consider reducing dataset size

## Installation

### Step 1: Install Python Dependencies

```powershell
cd E:\aka\backend\ml
pip install -r requirements_llm.txt
```

This installs:
- ✅ PyTorch (deep learning framework)
- ✅ Transformers (Hugging Face library)
- ✅ Datasets (data handling)
- ✅ Accelerate (faster training)

### Step 2: Verify Installation

```powershell
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
```

Expected output:
```
PyTorch: 2.x.x
CUDA Available: True  (or False if no GPU)
```

## Training the Model

### Quick Start (Default Settings)

```powershell
cd E:\aka\backend\ml
python train_llm_finetuning.py
```

This will:
1. ✅ Load `patient_records_200.csv`
2. ✅ Create 160 training + 40 test examples
3. ✅ Download GPT-2 model (first time only)
4. ✅ Fine-tune on your data (3 epochs)
5. ✅ Save to `models/sbar_llm_finetuned/`

### Expected Output

```
============================================================
SBAR LLM Fine-tuning Pipeline
============================================================
Model: gpt2
Dataset: ../data/patient_records_200.csv
Output: models/sbar_llm_finetuned
============================================================

Using device: cuda

Loading dataset...
Loaded 200 patient records

Creating training prompts...
Created 200 training examples

Dataset split:
  Training: 160 examples
  Test: 40 examples

Loading tokenizer and model: gpt2...
✅ Model and tokenizer loaded successfully!

Tokenizing datasets...
✅ Tokenization complete!

============================================================
Starting Fine-tuning...
============================================================
Epochs: 3
Batch size: 4
Learning rate: 5e-05
============================================================

🚀 Training started...

Epoch 1/3: [=====>    ] 50%  Loss: 2.145
Epoch 2/3: [========> ] 80%  Loss: 1.823
Epoch 3/3: [==========] 100% Loss: 1.621

✅ Training completed!

============================================================
Training Results
============================================================
Training Loss: 1.621
Evaluation Loss: 1.734
============================================================

✅ Model saved to: models/sbar_llm_finetuned
```

## Testing the Model

After training, test it:

```powershell
python test_finetuned_llm.py
```

This will generate SBAR summaries for test patients and show results.

## Advanced Options

### Option 1: Use Llama-2 Instead of GPT-2

Edit `train_llm_finetuning.py` line 23:

```python
MODEL_NAME = "meta-llama/Llama-2-7b-hf"  # Requires Hugging Face token
```

You'll need:
1. Hugging Face account: https://huggingface.co/
2. Request access to Llama-2
3. Create token and login: `huggingface-cli login`

### Option 2: Reduce Training Time (CPU Users)

Edit `train_llm_finetuning.py`:

```python
EPOCHS = 1  # Change from 3 to 1 (line 22)
```

Or use fewer samples:

```python
# After line 46, add:
df = df.head(50)  # Use only 50 samples
```

### Option 3: Improve Quality (More Epochs)

```python
EPOCHS = 5  # Change from 3 to 5
```

## Using Google Colab (Recommended for Beginners)

### Step 1: Create Colab Notebook

1. Go to: https://colab.research.google.com/
2. New Notebook
3. Change Runtime → GPU (T4)

### Step 2: Upload Files

```python
from google.colab import files
uploaded = files.upload()  # Upload patient_records_200.csv
```

### Step 3: Install Dependencies

```python
!pip install transformers datasets accelerate torch
```

### Step 4: Copy Training Script

Copy the entire content of `train_llm_finetuning.py` into a cell and modify paths:

```python
DATA_PATH = "patient_records_200.csv"  # Line 21
OUTPUT_DIR = "sbar_llm_finetuned"  # Line 20
```

### Step 5: Run Training

Execute the cell - training will start!

### Step 6: Download Trained Model

```python
!zip -r sbar_model.zip sbar_llm_finetuned/
from google.colab import files
files.download('sbar_model.zip')
```

## Integration with Your App

After training, integrate the model into your backend:

### Create LLM Service

```javascript
// backend/src/services/fineTunedLlamaService.js
import { spawn } from 'child_process';
import path from 'path';

export const generateSbarWithLLM = async (patientData) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ml/generate_sbar.py');
    const python = spawn('python', [pythonScript, JSON.stringify(patientData)]);
    
    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.on('close', () => resolve(JSON.parse(output)));
  });
};
```

## Troubleshooting

### Error: CUDA out of memory

**Solution 1**: Reduce batch size
```python
BATCH_SIZE = 2  # Change from 4
```

**Solution 2**: Use CPU
```python
device = "cpu"  # Force CPU
```

### Error: Model download failed

**Solution**: Check internet connection, try again

### Error: Module not found

**Solution**: 
```powershell
pip install transformers datasets accelerate torch
```

## Performance Expectations

| Hardware | Training Time | Quality |
|----------|--------------|---------|
| RTX 4090 | 10-15 min | Excellent |
| RTX 3060 | 30-45 min | Good |
| Google Colab (T4) | 20-30 min | Good |
| CPU (i7) | 2-4 hours | Fair |

## Next Steps

1. ✅ Train the model: `python train_llm_finetuning.py`
2. ✅ Test generation: `python test_finetuned_llm.py`
3. ✅ Integrate into your app
4. ✅ Deploy to production

## Support

- Training issues? Check `models/sbar_llm_finetuned/training_metadata.json`
- Model quality low? Increase epochs or dataset size
- Out of memory? Reduce batch size or use Colab

---

**Created**: 2025-10-29  
**Dataset**: patient_records_200.csv (200 samples)  
**Model**: GPT-2 → Fine-tuned for SBAR generation
