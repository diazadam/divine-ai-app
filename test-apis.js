#!/usr/bin/env node

// Divine-AI API Testing Script
// This script tests all the main API integrations

import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';

config();

const API_BASE = 'http://localhost:5001/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function success(msg) { log(colors.green, '✅', msg); }
function error(msg) { log(colors.red, '❌', msg); }
function info(msg) { log(colors.blue, 'ℹ️ ', msg); }
function warning(msg) { log(colors.yellow, '⚠️ ', msg); }

async function testApiEndpoint(name, url, options = {}) {
  try {
    info(`Testing ${name}...`);
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      success(`${name} - Status: ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      error(`${name} - Status: ${response.status} - ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
  } catch (err) {
    error(`${name} - Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testGeminiDirect() {
  info('Testing Gemini API directly...');
  try {
    if (!process.env.GEMINI_API_KEY) {
      error('GEMINI_API_KEY not found in environment');
      return false;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Say hello and confirm you're working!",
    });

    const text = response.text;
    if (text) {
      success(`Gemini Direct API - Response: ${text.substring(0, 100)}...`);
      return true;
    } else {
      error('Gemini Direct API - No response text');
      return false;
    }
  } catch (err) {
    error(`Gemini Direct API - Error: ${err.message}`);
    return false;
  }
}

async function testOpenAIDirect() {
  info('Testing OpenAI API directly...');
  try {
    if (!process.env.OPENAI_API_KEY) {
      error('OPENAI_API_KEY not found in environment');
      return false;
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      success(`OpenAI Direct API - Found ${data.data?.length || 0} models`);
      return true;
    } else {
      const errorText = await response.text();
      error(`OpenAI Direct API - Status: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (err) {
    error(`OpenAI Direct API - Error: ${err.message}`);
    return false;
  }
}

async function testBibleApiDirect() {
  info('Testing Bible API directly...');
  try {
    if (!process.env.BIBLE_API_KEY) {
      error('BIBLE_API_KEY not found in environment');
      return false;
    }

    const response = await fetch('https://api.scripture.api.bible/v1/bibles', {
      headers: {
        'api-key': process.env.BIBLE_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      success(`Bible API Direct - Found ${data.data?.length || 0} bibles`);
      return true;
    } else {
      const errorText = await response.text();
      error(`Bible API Direct - Status: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (err) {
    error(`Bible API Direct - Error: ${err.message}`);
    return false;
  }
}

async function runAllTests() {
  log(colors.cyan, '\n🧪 Divine-AI API Testing Suite\n');
  
  // Check environment variables
  info('Checking environment variables...');
  const requiredEnvVars = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'BIBLE_API_KEY'];
  let envOk = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      success(`${envVar} is configured`);
    } else {
      error(`${envVar} is missing`);
      envOk = false;
    }
  }
  
  if (!envOk) {
    error('Some environment variables are missing. Please check your .env file.');
    process.exit(1);
  }

  // Test direct API connections
  log(colors.magenta, '\n📡 Testing Direct API Connections\n');
  
  const directTests = [
    testGeminiDirect(),
    testOpenAIDirect(),
    testBibleApiDirect(),
  ];
  
  const directResults = await Promise.all(directTests);
  const directSuccess = directResults.every(result => result);
  
  if (directSuccess) {
    success('All direct API connections working!');
  } else {
    warning('Some direct API connections failed');
  }

  // Test server endpoints
  log(colors.magenta, '\n🌐 Testing Server Endpoints\n');
  
  const serverTests = [
    // Health check
    testApiEndpoint('Health Check', `${API_BASE}/health`),
    
    // Bible API endpoints
    testApiEndpoint('List Bibles', `${API_BASE}/bibles`),
    testApiEndpoint('Get Bible', `${API_BASE}/bibles/de4e12af7f28f599-02`),
    testApiEndpoint('Search Bible', `${API_BASE}/bibles/de4e12af7f28f599-02/search?query=love&limit=5`),
    
    // Gemini endpoints
    testApiEndpoint('Gemini Sentiment', `${API_BASE}/ai/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'I am feeling great today!' }),
    }),
    
    testApiEndpoint('Gemini Pastoral Guidance', `${API_BASE}/ai/pastoral-guidance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How can I find peace in difficult times?' }),
    }),
    
    // Scripture endpoints
    testApiEndpoint('Scripture Search', `${API_BASE}/scripture/search?query=love&limit=3`),
    testApiEndpoint('Get Verse', `${API_BASE}/scripture/verse/John%203:16`),
  ];
  
  const serverResults = await Promise.allSettled(serverTests);
  const successfulTests = serverResults.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  log(colors.cyan, `\n📊 Test Results: ${successfulTests}/${serverResults.length} endpoints working\n`);
  
  if (successfulTests === serverResults.length) {
    success('All server endpoints working! 🎉');
  } else {
    warning(`${serverResults.length - successfulTests} endpoints need attention`);
  }

  // Summary
  log(colors.bright, '\n📋 Summary:');
  info(`Direct API connections: ${directSuccess ? 'All working' : 'Some issues'}`);
  info(`Server endpoints: ${successfulTests}/${serverResults.length} working`);
  
  if (directSuccess && successfulTests === serverResults.length) {
    success('Divine-AI is fully operational! 🚀');
  } else {
    warning('Some issues found. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
