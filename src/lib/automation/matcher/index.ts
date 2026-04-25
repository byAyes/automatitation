import { MatchResult, Matcher } from './types';

// Mapeo de providers a matchers
const matchers: Record<string, Matcher> = {};

// Registrar matcher según configuración
function registerMatcher() {
  const provider = process.env.MATCHING_PROVIDER || process.env.EMAIL_PROVIDER || 'openai';
  
  switch (provider) {
    case 'keyword':
      matchers.keyword = require('./keyword').default;
      console.log('✅ Using Keyword Matcher (100% gratis, sin IA)');
      break;
      
    case 'ollama':
      matchers.ollama = require('./ollama').default;
      console.log('✅ Using Ollama Matcher (local, gratuito)');
      break;
      
    case 'gemini':
      matchers.gemini = require('./gemini').default;
      console.log('✅ Using Gemini Matcher (gratis, API)');
      break;
      
    case 'resend':
    case 'sendgrid':
    case 'smtp':
      // Para resend/sendgrid/smtp, default usamos keyword si no hay OpenAI
      if (!process.env.OPENAI_API_KEY) {
        matchers.keyword = require('./keyword').default;
        console.log('✅ OpenAI no configurado → Usando Keyword Matcher (gratis)');
      } else {
        matchers.openai = require('./openai').default;
        console.log('✅ Using OpenAI Matcher (premium, pago)');
      }
      break;
      
    case 'openai':
    default:
      if (process.env.OPENAI_API_KEY) {
        matchers.openai = require('./openai').default;
        console.log('✅ Using OpenAI Matcher');
      } else {
        matchers.keyword = require('./keyword').default;
        console.log('✅ OpenAI key not found → Usando Keyword Matcher (gratis)');
      }
  }
}

// Inicializa matchers
registerMatcher();

/**
 * Calcula el match score entre un job y los intereses del usuario
 */
export async function calculateMatchScore(job: any, userInterests: string[]): Promise<MatchResult> {
  const provider = process.env.MATCHING_PROVIDER || 
                   (process.env.OPENAI_API_KEY ? 'openai' : 'keyword');
  
  const matcher = matchers[provider] || matchers.keyword;
  
  if (!matcher) {
    // Fallback a keyword si no hay matcher configurado
    const { default: keywordMatcher } = await import('./keyword');
    return keywordMatcher.calculateMatchScore(job, userInterests);
  }
  
  return matcher.calculateMatchScore(job, userInterests);
}

export { MatchResult } from './types';
