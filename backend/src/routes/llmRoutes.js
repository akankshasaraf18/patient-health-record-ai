/**
 * LLM Generation Routes
 * Handles SBAR generation using fine-tuned LLM with accuracy evaluation
 */

import express from 'express';
import { generateAndEvaluateSBAR, getLLMModelInfo } from '../services/llmGenerationService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/llm/generate-sbar
 * Generate SBAR summary using LLM and evaluate accuracy
 */
router.post('/generate-sbar', authenticate, async (req, res) => {
  try {
    const patientData = req.body;

    if (!patientData.medical_condition && !patientData.condition) {
      return res.status(400).json({
        success: false,
        message: 'Patient medical condition is required'
      });
    }

    // Generate and evaluate SBAR
    const result = await generateAndEvaluateSBAR(patientData);

    res.json({
      success: true,
      message: 'SBAR generated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error generating SBAR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SBAR',
      error: error.message
    });
  }
});

/**
 * GET /api/llm/model-info
 * Get LLM model information and training metadata
 */
router.get('/model-info', authenticate, async (req, res) => {
  try {
    const modelInfo = getLLMModelInfo();

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error('Error fetching LLM info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch LLM information',
      error: error.message
    });
  }
});

/**
 * POST /api/llm/test-generation
 * Test LLM generation with sample data
 */
router.post('/test-generation', authenticate, async (req, res) => {
  try {
    // Sample patient data for testing
    const sampleData = {
      name: 'Test Patient',
      age: 65,
      gender: 'M',
      medical_condition: 'chest pain',
      history: 'hypertension',
      heart_rate: 80,
      blood_pressure: '140/90',
      temperature: 37.2,
      respiratory_rate: 18,
      oxygen_saturation: 98,
      current_medications: 'amlodipine',
      admission_type: 'Emergency'
    };

    const result = await generateAndEvaluateSBAR(sampleData);

    res.json({
      success: true,
      message: 'Test generation completed',
      data: result
    });

  } catch (error) {
    console.error('Error in test generation:', error);
    res.status(500).json({
      success: false,
      message: 'Test generation failed',
      error: error.message
    });
  }
});

export default router;
