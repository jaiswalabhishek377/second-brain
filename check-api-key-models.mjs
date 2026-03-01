// Check what models are available with your Gemini API key
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAvailableModels() {
  try {
    console.log("🔍 Checking what models your API key can access...\n");
    
    // Try to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.log("❌ Error:", data.error.message);
      return;
    }
    
    console.log(`✅ Found ${data.models.length} available models:\n`);
    
    // Filter and display embedding models
    const embeddingModels = data.models.filter(m => 
      m.name.toLowerCase().includes('embedding') || 
      m.supportedGenerationMethods?.includes('embedContent')
    );
    
    if (embeddingModels.length > 0) {
      console.log("📊 EMBEDDING MODELS:");
      embeddingModels.forEach(model => {
        console.log(`   ✓ ${model.name}`);
        console.log(`     Methods: ${model.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log("⚠️  NO EMBEDDING MODELS FOUND");
      console.log("\nReasons this might happen:");
      console.log("1. Google AI Studio keys don't support embeddings (only chat)");
      console.log("2. You need Vertex AI instead of AI Studio");
      console.log("3. Your project doesn't have embedding access");
    }
    
    // Show all chat models too
    console.log("\n💬 CHAT/GENERATION MODELS:");
    const chatModels = data.models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    chatModels.slice(0, 5).forEach(model => {
      console.log(`   ✓ ${model.name}`);
    });
    
    console.log(`\n(+ ${chatModels.length - 5} more chat models)`);
    
  } catch (error) {
    console.log("❌ Error fetching models:", error.message);
  }
}

listAvailableModels();
