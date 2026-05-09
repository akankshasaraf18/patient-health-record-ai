/**
 * LLM SBAR Generation and Evaluation Service
 * Generates SBAR summaries using fine-tuned LLM and evaluates against ground truth
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate SBAR summary using fine-tuned LLM and evaluate accuracy
 * @param {Object} patientData - Patient information
 * @returns {Promise<Object>} Generated SBAR with accuracy scores
 */
export const generateAndEvaluateSBAR = async (patientData) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ml/generate_and_evaluate_sbar.py');
    
    console.log("🐍 Python script path:", pythonScript);
    console.log("📂 Script exists:", fs.existsSync(pythonScript));
    
    // Prepare patient data
    const patientInfo = {
      name: patientData.patient_name || patientData.name || 'Unknown',
      age: patientData.age,
      gender: patientData.gender,
      medical_condition: patientData.medical_condition || patientData.condition,
      history: patientData.history,
      heart_rate: patientData.heart_rate || patientData.hr,
      blood_pressure: patientData.blood_pressure || patientData.bp,
      temperature: patientData.temperature || patientData.temp,
      respiratory_rate: patientData.respiratory_rate || patientData.rr,
      oxygen_saturation: patientData.oxygen_saturation || patientData.spo2,
      current_medications: patientData.current_medications || patientData.medications,
      admission_type: patientData.admission_type || 'Emergency'
    };

    console.log("📤 Sending to Python:", patientInfo);

    // Spawn Python process
    const python = spawn('py', [pythonScript, JSON.stringify(patientInfo)]);
    
    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      const output = data.toString();
      console.log("🐍 Python stdout:", output);
      stdout += output;
    });

    python.stderr.on('data', (data) => {
      const error = data.toString();
      console.log("🐍 Python stderr:", error);
      stderr += error;
    });

    python.on('close', (code) => {
      console.log(`🐍 Python process closed with code: ${code}`);
      
      if (code !== 0) {
        console.error('❌ Python script error:', stderr);
        return reject(new Error(`LLM generation failed: ${stderr || 'Unknown error'}`));
      }

      try {
        console.log("📥 Raw Python output:", stdout);
        const result = JSON.parse(stdout);
        
        if (result.error) {
          console.error("❌ Python returned error:", result.error);
          return reject(new Error(result.error));
        }

        console.log("✅ Successfully parsed Python result");
        resolve(result);
      } catch (error) {
        console.error('❌ Failed to parse Python output:', stdout);
        reject(new Error('Failed to parse LLM output'));
      }
    });

    python.on('error', (error) => {
      console.error("❌ Failed to spawn Python process:", error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

/**
 * Get LLM model information
 */
export const getLLMModelInfo = () => {
  const metadataPath = path.join(__dirname, '../../ml/models/sbar_llm_finetuned/training_metadata.json');
  
  try {
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return {
        trained: true,
        model_name: metadata.model_name,
        training_date: metadata.training_date,
        dataset_size: metadata.dataset_size,
        train_size: metadata.train_size,
        test_size: metadata.test_size,
        epochs: metadata.epochs,
        training_loss: metadata.training_loss,
        eval_loss: metadata.eval_loss,
        accuracy_equivalent: calculateAccuracyFromLoss(metadata.eval_loss)
      };
    }
  } catch (error) {
    console.error('Error reading LLM metadata:', error);
  }
  
  return {
    trained: false,
    message: 'LLM model not trained yet'
  };
};

/**
 * Convert loss to approximate accuracy percentage
 */
const calculateAccuracyFromLoss = (loss) => {
  // Rough conversion: lower loss = higher accuracy
  // loss < 0.2 = ~90%
  // loss 0.2-0.5 = ~80-85%
  // loss 0.5-1.0 = ~70-80%
  // loss > 1.0 = <70%
  
  if (loss < 0.2) return 90;
  if (loss < 0.3) return 85;
  if (loss < 0.5) return 80;
  if (loss < 1.0) return 75;
  return 70;
};

export default {
  generateAndEvaluateSBAR,
  getLLMModelInfo
};
