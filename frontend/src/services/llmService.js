import { authPost, authGet } from '../utils/api';

/**
 * Generate SBAR using LLM and evaluate accuracy
 */
export const generateSBARWithLLM = async (patientData) => {
  try {
    const response = await authPost('/llm/generate-sbar', patientData);
    return response.data;
  } catch (error) {
    console.error('Error generating SBAR with LLM:', error);
    throw error;
  }
};

/**
 * Get LLM model information
 */
export const getLLMModelInfo = async () => {
  try {
    const response = await authGet('/llm/model-info');
    return response.data;
  } catch (error) {
    console.error('Error fetching LLM model info:', error);
    throw error;
  }
};

/**
 * Test LLM generation with sample data
 */
export const testLLMGeneration = async () => {
  try {
    const response = await authPost('/llm/test-generation');
    return response.data;
  } catch (error) {
    console.error('Error testing LLM generation:', error);
    throw error;
  }
};

export default {
  generateSBARWithLLM,
  getLLMModelInfo,
  testLLMGeneration
};
