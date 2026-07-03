const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class AIService {
  constructor() {
    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    // Google Gemini
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  // ─────────────────────────────────────────────
  // HEALTH CHATBOT
  // ─────────────────────────────────────────────
  async healthChat(messages, patientContext = {}) {
    if (!this.anthropic && !this.gemini) {
      return {
        content: "I am a simulated AI response since no Anthropic API key is configured. Please consult a doctor.",
        tokensUsed: 42,
        model: 'mock-model'
      };
    }
    const systemPrompt = `You are an AI healthcare assistant for HealthCare AI System. You provide helpful, accurate, and empathetic health information.

Patient Context:
- Name: ${patientContext.name || 'Patient'}
- Age: ${patientContext.age || 'Unknown'}
- Blood Type: ${patientContext.bloodType || 'Unknown'}
- Known Conditions: ${patientContext.chronicConditions?.join(', ') || 'None listed'}
- Current Medications: ${patientContext.currentMedications?.map(m => m.name).join(', ') || 'None listed'}

IMPORTANT GUIDELINES:
- Always recommend consulting a doctor for serious concerns
- Never diagnose conditions definitively
- Provide general health education and guidance
- Be empathetic and reassuring
- Flag emergencies immediately with "⚠️ EMERGENCY:" prefix
- Keep responses clear, structured, and patient-friendly
- Always mention if symptoms warrant immediate medical attention`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const geminiMessages = messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        
        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
          history: geminiMessages.slice(0, -1)
        });

        const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1].parts[0].text);
        
        return {
          content: result.response.text(),
          tokensUsed: 100,
          model: 'gemini-flash-latest',
        };
      } catch (error) {
        logger.error('Gemini health chat error: ' + error.message);
        return {
          content: "I encountered an error connecting to the AI service. Please try again.",
          tokensUsed: 0,
          model: 'error'
        };
      }
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    };
  }

  // ─────────────────────────────────────────────
  // SYMPTOM ANALYZER
  // ─────────────────────────────────────────────
  async analyzeSymptoms(symptoms, patientInfo = {}) {
    if (!this.anthropic && !this.gemini) {
      return {
        urgencyLevel: 'moderate',
        possibleConditions: [
          { condition: 'Common Cold', probability: 'high', description: 'Viral infection of the upper respiratory tract.' }
        ],
        recommendedSpecialist: 'General Physician',
        immediateActions: ['Rest', 'Hydrate'],
        selfCareAdvice: ['Get plenty of sleep', 'Drink warm liquids'],
        warningSignsToWatch: ['High fever', 'Difficulty breathing'],
        shouldVisitER: false,
        estimatedRecovery: '3-7 days',
        summary: 'Based on the mock analysis, symptoms are consistent with a common cold.',
        tokensUsed: 100,
        analyzedAt: new Date()
      };
    }
    const prompt = `Analyze the following symptoms for a patient and provide a structured medical assessment.

Patient Information:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Blood Type: ${patientInfo.bloodType || 'Unknown'}
- Known Conditions: ${patientInfo.chronicConditions?.join(', ') || 'None'}
- Current Medications: ${patientInfo.currentMedications?.join(', ') || 'None'}
- Symptom Duration: ${patientInfo.duration || 'Not specified'}
- Severity (1-10): ${patientInfo.severity || 'Not specified'}

Reported Symptoms:
${symptoms.join('\n- ')}

Provide a JSON response with this exact structure:
{
  "urgencyLevel": "low|moderate|high|emergency",
  "possibleConditions": [
    {"condition": "name", "probability": "low|moderate|high", "description": "brief description"}
  ],
  "recommendedSpecialist": "specialty",
  "immediateActions": ["action1", "action2"],
  "selfCareAdvice": ["advice1", "advice2"],
  "warningSignsToWatch": ["sign1", "sign2"],
  "shouldVisitER": true|false,
  "estimatedRecovery": "timeframe",
  "summary": "brief overall summary"
}

IMPORTANT: Return ONLY valid JSON. Be conservative with urgency levels.`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        return {
          ...analysis,
          tokensUsed: 150,
          analyzedAt: new Date(),
        };
      } catch (error) {
        logger.error('Gemini analyzeSymptoms error: ' + error.message);
        return {
          urgencyLevel: 'moderate',
          summary: 'We encountered an error parsing the AI response.',
          error: error.message,
          analyzedAt: new Date(),
        };
      }
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(text);
      return {
        ...analysis,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        analyzedAt: new Date(),
      };
    } catch (parseError) {
      logger.error('Failed to parse symptom analysis JSON');
      return {
        urgencyLevel: 'moderate',
        summary: response.content[0].text,
        error: 'Could not parse structured response',
        analyzedAt: new Date(),
      };
    }
  }

  // ─────────────────────────────────────────────
  // MEDICAL REPORT SUMMARIZER
  // ─────────────────────────────────────────────
  async summarizeReport(reportData) {
    if (!this.anthropic && !this.gemini) {
      return {
        summary: "This is a mock AI summary of your medical report. All results appear to be within standard ranges.",
        keyFindings: ["WBC count normal", "RBC count normal"],
        normalResults: ["WBC", "RBC", "Hemoglobin"],
        abnormalResults: [],
        recommendations: ["Maintain current lifestyle"],
        riskLevel: "low",
        questionsForDoctor: ["Are there any long-term trends I should watch?"],
        lifestyleAdvice: ["Eat a balanced diet"],
        followUpNeeded: false,
        followUpTimeframe: "1 year",
        tokensUsed: 150,
        model: 'mock-model',
        analyzedAt: new Date()
      };
    }
    const prompt = `You are a medical AI assistant. Analyze and summarize this medical report in patient-friendly language.

Report Type: ${reportData.reportType}
Report Title: ${reportData.title}
Lab Name: ${reportData.labName || 'Not specified'}
Report Date: ${reportData.reportDate}
${reportData.rawText ? `Report Content:\n${reportData.rawText}` : ''}
${reportData.description ? `Additional Notes:\n${reportData.description}` : ''}

Provide a JSON response:
{
  "summary": "2-3 sentence patient-friendly summary",
  "keyFindings": ["finding1", "finding2"],
  "normalResults": ["result1"],
  "abnormalResults": ["result1"],
  "recommendations": ["recommendation1", "recommendation2"],
  "riskLevel": "low|moderate|high|critical",
  "questionsForDoctor": ["question1", "question2"],
  "lifestyleAdvice": ["advice1"],
  "followUpNeeded": true|false,
  "followUpTimeframe": "when to follow up"
}`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        
        let parts = [{ text: prompt }];
        
        if (reportData.filePublicId && reportData.mimeType) {
           const filePath = path.join(__dirname, '../uploads', reportData.filePublicId);
           if (fs.existsSync(filePath)) {
              const fileBase64 = fs.readFileSync(filePath).toString("base64");
              parts.push({
                inlineData: {
                  data: fileBase64,
                  mimeType: reportData.mimeType
                }
              });
           }
        }

        const result = await model.generateContent(parts);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return {
          ...JSON.parse(text),
          tokensUsed: 150,
          model: 'gemini-flash-latest',
          analyzedAt: new Date(),
        };
      } catch (error) {
        logger.error('Gemini summarizeReport error: ' + error.message);
        return {
          summary: "Error parsing AI response from Gemini.",
          riskLevel: 'moderate',
          analyzedAt: new Date(),
        };
      }
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return {
        ...JSON.parse(text),
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        analyzedAt: new Date(),
      };
    } catch {
      return {
        summary: response.content[0].text,
        riskLevel: 'moderate',
        analyzedAt: new Date(),
      };
    }
  }

  // ─────────────────────────────────────────────
  // CONSULTATION SUMMARIZER
  // ─────────────────────────────────────────────
  async summarizeConsultation(doctorNotes, diagnosis, patientInfo) {
    if (!this.anthropic && !this.gemini) {
      return {
        summary: "This is a mock AI summary since no real API keys are configured. Patient discussed current symptoms, and doctor advised rest and medication."
      };
    }
    const prompt = `You are a medical AI assistant. Analyze these doctor's consultation notes and generate a concise, professional clinical summary.

Patient: ${patientInfo?.name || 'Unknown'} (Age: ${patientInfo?.age || 'Unknown'})
Diagnosis provided: ${diagnosis || 'None'}
Doctor's Notes:
${doctorNotes}

Provide a JSON response:
{
  "summary": "1-2 paragraph professional clinical summary of the encounter"
}`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (error) {
        logger.error('Gemini summarizeConsultation error: ' + error.message);
        return { summary: "Error parsing AI response from Gemini." };
      }
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch {
      return { summary: response.content[0].text };
    }
  }

  // ─────────────────────────────────────────────
  // DOCTOR RECOMMENDER
  // ─────────────────────────────────────────────
  async recommendDoctor(symptoms, patientInfo, availableDoctors) {
    if (!this.anthropic) {
      return {
        primaryRecommendation: { doctorName: availableDoctors[0]?.name || "Any Available Doctor", reason: "General consultation recommended." },
        alternativeRecommendations: [],
        recommendedSpecialty: "General Physician",
        urgency: "routine",
        explanation: "This is a mock recommendation."
      };
    }
    const doctorList = availableDoctors
      .map((d) => `- ${d.name} | ${d.specialization} | Rating: ${d.rating} | Exp: ${d.experience}yrs`)
      .join('\n');

    const prompt = `Based on the patient's symptoms and available doctors, recommend the most suitable doctor.

Patient Symptoms: ${symptoms.join(', ')}
Patient Age: ${patientInfo.age}
Patient Gender: ${patientInfo.gender}
Chronic Conditions: ${patientInfo.chronicConditions?.join(', ') || 'None'}

Available Doctors:
${doctorList}

Return JSON:
{
  "primaryRecommendation": {"doctorName": "name", "reason": "why"},
  "alternativeRecommendations": [{"doctorName": "name", "reason": "why"}],
  "recommendedSpecialty": "specialty",
  "urgency": "routine|soon|urgent|emergency",
  "explanation": "brief explanation"
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch {
      return { explanation: response.content[0].text };
    }
  }

  // ─────────────────────────────────────────────
  // HEALTH TIPS GENERATOR (Gemini)
  // ─────────────────────────────────────────────
  async generateHealthTips(patientProfile) {
    if (!this.gemini) {
      // Fallback to Claude
      return this.generateHealthTipsWithClaude(patientProfile);
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `Generate 5 personalized daily health tips for:
- Age: ${patientProfile.age}
- Conditions: ${patientProfile.chronicConditions?.join(', ') || 'None'}
- BMI: ${patientProfile.bmi || 'Unknown'}
- Exercise Level: ${patientProfile.exerciseFrequency || 'Unknown'}

Return JSON array: [{"tip": "text", "category": "nutrition|exercise|sleep|mental|hydration|medication", "priority": "high|medium|low"}]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      logger.error(`Gemini health tips error: ${error.message}`);
      return this.generateHealthTipsWithClaude(patientProfile);
    }
  }

  async generateHealthTipsWithClaude(patientProfile) {
    if (!this.anthropic) {
      return [
        { tip: "Drink at least 8 glasses of water daily.", category: "hydration", priority: "high" },
        { tip: "Aim for 30 minutes of moderate exercise.", category: "exercise", priority: "medium" }
      ];
    }
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Generate 5 personalized health tips for a patient with age ${patientProfile.age}, conditions: ${patientProfile.chronicConditions?.join(', ') || 'None'}. Return as JSON array: [{"tip": "text", "category": "nutrition|exercise|sleep|mental|hydration", "priority": "high|medium|low"}]`
      }],
    });
    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch {
      return [{ tip: response.content[0].text, category: 'general', priority: 'medium' }];
    }
  }

  // ─────────────────────────────────────────────
  // RISK DETECTION
  // ─────────────────────────────────────────────
  async detectHealthRisks(patientData) {
    if (!this.anthropic) {
      return {
        riskLevel: "low",
        risks: [],
        preventiveActions: ["Regular checkups"],
        monitoringRecommendations: ["Annual blood work"],
        urgentFlags: []
      };
    }
    const prompt = `Analyze this patient's health data and identify potential risks.

Vitals History: ${JSON.stringify(patientData.vitals?.slice(-5) || [])}
Current Medications: ${patientData.currentMedications?.map(m => m.name).join(', ') || 'None'}
Chronic Conditions: ${patientData.chronicConditions?.join(', ') || 'None'}
BMI: ${patientData.bmi || 'Unknown'}
Age: ${patientData.age}
Smoking: ${patientData.smokingStatus || 'Unknown'}

Return JSON:
{
  "riskLevel": "low|moderate|high|critical",
  "risks": [{"risk": "name", "severity": "low|moderate|high", "description": "details"}],
  "preventiveActions": ["action1"],
  "monitoringRecommendations": ["recommendation1"],
  "urgentFlags": ["flag1"]
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch {
      return { riskLevel: 'moderate', summary: response.content[0].text };
    }
  }

  // ─────────────────────────────────────────────
  // REPORT CHAT ASSISTANT
  // ─────────────────────────────────────────────
  async chatAboutReport(reportData, chatHistory, newQuestion) {
    if (!this.anthropic && !this.gemini) {
      return {
        content: "This is a mock AI response since no API keys are configured. The report appears normal, but please verify independently.",
        tokensUsed: 50,
        model: 'mock-model'
      };
    }

    const systemPrompt = `You are a specialized medical AI assistant designed to help doctors review patient medical reports.
Your role is to assist the doctor by answering questions about the specific report provided.
Always maintain a professional, clinical tone.
Do not make definitive final diagnoses. Remind the doctor that they hold the final clinical judgment if asked for a final decision.

Report Context:
- Patient Name: ${reportData.patient?.name || 'Unknown'}
- Report Title: ${reportData.title || 'Untitled'}
- Report Type: ${reportData.reportType || 'Unknown'}
- Report Date: ${reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString() : 'Unknown'}
- AI Pre-Analysis Summary: ${reportData.aiAnalysis?.summary || 'None available'}
- AI Pre-Analysis Findings: ${reportData.aiAnalysis?.keyFindings?.join(', ') || 'None available'}`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const geminiMessages = chatHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        
        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
          history: geminiMessages
        });

        const result = await chat.sendMessage(newQuestion);
        
        return {
          content: result.response.text(),
          tokensUsed: 100,
          model: 'gemini-flash-latest',
        };
      } catch (error) {
        logger.error('Gemini chatAboutReport error: ' + error.message);
        return {
          content: "I encountered an error connecting to the AI service. Please try again.",
          tokensUsed: 0,
          model: 'error'
        };
      }
    }

    // Fallback to Claude if no Gemini
    const allMessages = [...chatHistory, { role: 'user', content: newQuestion }].map((m) => ({
      role: m.role,
      content: m.content
    }));

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: allMessages,
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    };
  }
  // ─────────────────────────────────────────────
  // DIET ANALYZER
  // ─────────────────────────────────────────────
  async analyzeDiet(condition, patientInfo) {
    if (!this.anthropic && !this.gemini) {
      return {
        condition: condition || "Unknown",
        summary: "This is a mock AI diet plan since no API keys are configured.",
        riskLevel: "LOW",
        recommendedFoods: ["Water", "Vegetables"],
        avoidFoods: ["Junk food", "Excess sugar"],
        breakfast: ["Oatmeal", "Fruit"],
        lunch: ["Salad", "Lean protein"],
        dinner: ["Soup", "Vegetables"],
        snacks: ["Nuts", "Yogurt"],
        waterIntake: "2-3 Liters",
        lifestyleTips: ["Exercise 30 mins daily", "Sleep 7-8 hours"],
        monitoring: "Check vitals regularly",
        warningSigns: ["Dizziness", "Severe pain"],
        disclaimer: "This diet plan is AI-assisted and for general guidance. Please follow your doctor's advice for final treatment."
      };
    }

    const prompt = `You are an expert nutritionist and medical AI. Analyze the following condition and generate a personalized diet plan based on the patient's profile.

Condition/Problem: ${condition}
Patient Profile:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Height: ${patientInfo.height ? patientInfo.height + ' cm' : 'Unknown'}
- Weight: ${patientInfo.weight ? patientInfo.weight + ' kg' : 'Unknown'}
- BMI: ${patientInfo.bmi || 'Unknown'}
- Existing Diseases/Conditions: ${patientInfo.chronicConditions?.join(', ') || 'None'}
- Allergies: ${patientInfo.allergies?.join(', ') || 'None'}
- Current Medicines: ${patientInfo.currentMedications?.map(m => m.name).join(', ') || 'None'}

Provide a JSON response with exactly this structure:
{
  "condition": "The standardized name of the condition (e.g., Diabetes, Hypertension)",
  "summary": "Short explanation of the diet strategy (2-3 sentences)",
  "riskLevel": "LOW", // MUST be exactly LOW, MEDIUM, or HIGH
  "recommendedFoods": ["Food 1", "Food 2"],
  "avoidFoods": ["Food 1", "Food 2"],
  "breakfast": ["Item 1", "Item 2"],
  "lunch": ["Item 1", "Item 2"],
  "dinner": ["Item 1", "Item 2"],
  "snacks": ["Item 1", "Item 2"],
  "waterIntake": "Recommended daily water intake",
  "lifestyleTips": ["Tip 1", "Tip 2"],
  "monitoring": "What to monitor (e.g., Fasting sugar, BP)",
  "warningSigns": ["Sign 1", "Sign 2"],
  "disclaimer": "This diet plan is AI-assisted and for general guidance. Please follow your doctor's advice for final treatment."
}

Ensure the plan avoids the patient's allergies and does not conflict with their medications. Return ONLY valid JSON.`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        return analysis;
      } catch (error) {
        logger.error('Gemini analyzeDiet error: ' + error.message);
        throw new Error('AI analysis failed');
      }
    }

    // Fallback to Anthropic
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (parseError) {
      logger.error('Failed to parse diet analysis JSON');
      throw new Error('AI analysis parsing failed');
    }
  }

  // ─────────────────────────────────────────────
  // FINAL CLINICAL REPORT GENERATOR
  // ─────────────────────────────────────────────
  async generateFinalClinicalReport(reportData, doctorNotes) {
    if (!this.anthropic && !this.gemini) {
      return {
        content: `FINAL CLINICAL REPORT\n\nPatient: ${reportData.patient?.name || 'Unknown'}\nDate: ${new Date().toLocaleDateString()}\n\nAI Analysis Summary: ${reportData.aiAnalysis?.summary || 'N/A'}\n\nDoctor's Notes: ${doctorNotes || 'None'}\n\nAssessment: This is a simulated final report.`
      };
    }

    const systemPrompt = `You are an expert Medical AI summarizing a final clinical report for a doctor.
Synthesize the original AI Analysis and the Doctor's specific notes into a concise, professional clinical summary.
Include sections for:
1. Patient Overview
2. Key Clinical Findings (from AI Analysis)
3. Doctor's Observations/Notes
4. Final Recommendations/Plan

Format as plain professional text (no markdown formatting if possible, use ALL CAPS for section headers).`;

    const input = `AI Analysis: ${reportData.aiAnalysis?.summary || 'N/A'}\nKey Findings: ${reportData.aiAnalysis?.keyFindings?.join(', ') || 'N/A'}\nDoctor Notes: ${doctorNotes || 'No specific notes provided.'}`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-flash-latest' });
        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
        });
        const result = await chat.sendMessage(input);
        return { content: result.response.text() };
      } catch (error) {
        return { content: "Error generating final report with AI." };
      }
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: input }],
    });

    return { content: response.content[0].text };
  }
}

module.exports = new AIService();
