# AI Model Files

This directory should contain the AI model files required for ShiftFlow AI to function properly.

## Required Model Files

### 1. RoBERTa Model (Saliency Filtering)

- **Filename**: `roberta-saliency.onnx`
- **Format**: ONNX
- **Purpose**: Filters salient sentences from EHR notes
- **Location**: Place in this directory

### 2. Llama-2 7B Model (Abstractive Summarization)

- **Filename**: `llama2-7b.gguf`
- **Format**: GGUF (quantized)
- **Purpose**: Generates narrative summaries from salient text
- **Location**: Place in this directory

## Download Instructions

### Option 1: Pre-trained Models

1. Download the RoBERTa ONNX model from your model repository
2. Download the Llama-2 7B GGUF model from Hugging Face or your model repository
3. Place both files in this directory

### Option 2: Convert Your Own Models

If you have trained models in other formats:

**For RoBERTa:**

```bash
# Convert PyTorch model to ONNX
python -m transformers.onnx --model=path/to/roberta-model --feature=sequence-classification roberta-saliency/
```

**For Llama-2:**

```bash
# Convert to GGUF format using llama.cpp
# Follow instructions at: https://github.com/ggerganov/llama.cpp
```

## Verify Installation

After placing the model files, your directory structure should look like:

```
backend/models/
├── README.md (this file)
├── roberta-saliency.onnx
└── llama2-7b.gguf
```

## Configuration

Model paths can be customized in the `.env` file:

```env
ROBERTA_MODEL_PATH=./models/roberta-saliency.onnx
LLAMA_MODEL_PATH=./models/llama2-7b.gguf
```

## Notes

- The server will start without these models but AI-powered handoff generation will not be available
- Model files are typically large (several GB) and are not included in version control
- Ensure you have sufficient disk space and RAM to load these models
- For GPU acceleration, ensure appropriate drivers are installed and update the `gpuLayers` setting in `llamaService.js`

## Troubleshooting

If you see model loading errors:

1. Verify files are in the correct location
2. Check file permissions
3. Ensure files are not corrupted
4. Verify the ONNX Runtime and node-llama-cpp packages are properly installed
