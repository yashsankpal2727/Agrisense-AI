import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { MongoClient } from 'mongodb';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'data', 'users.json');
const HISTORY_FILE = process.env.HISTORY_FILE || path.join(__dirname, 'data', 'analysis-history.json');
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
let mongoClient;
let usersCollection;
let analysisHistoryCollection;
const activeSessions = new Map();

async function readLegacyJson(filePath, expectedType) {
  let contents;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (!contents?.trim()) return expectedType === 'array' ? [] : {};
  try {
    const data = JSON.parse(contents);
    if (expectedType === 'array' ? !Array.isArray(data) : !data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`Expected ${expectedType === 'array' ? 'an array' : 'an object'}.`);
    }
    return data;
  } catch (error) {
    throw new Error(`Legacy data in ${filePath} is invalid and was not modified: ${error.message}`);
  }
}

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Add your MongoDB connection string to the server .env file.');
  }

  mongoClient = new MongoClient(MONGODB_URI);
  try {
    await mongoClient.connect();
    const database = MONGODB_DB
      ? mongoClient.db(MONGODB_DB)
      : mongoClient.db();
    usersCollection = database.collection('users');
    analysisHistoryCollection = database.collection('analysisHistory');
    await Promise.all([
      usersCollection.createIndex({ rawPhone: 1 }, { unique: true }),
      analysisHistoryCollection.createIndex({ userPhone: 1, timestamp: -1 })
    ]);
    await migrateLegacyData();
    console.log(`Connected to MongoDB database "${database.databaseName}".`);
  } catch (error) {
    await mongoClient.close();
    throw error;
  }
}

async function migrateLegacyData() {
  if (await usersCollection.countDocuments() === 0) {
    const legacyUsers = await readLegacyJson(USERS_FILE, 'array');
    if (legacyUsers.length) {
      await usersCollection.insertMany(legacyUsers.map((user) => ({
        ...user,
        _id: String(user.id)
      })));
      console.log(`Migrated ${legacyUsers.length} user records from JSON to MongoDB.`);
    }
  }

  if (await analysisHistoryCollection.countDocuments() === 0) {
    const legacyHistories = await readLegacyJson(HISTORY_FILE, 'object');
    const analyses = Object.entries(legacyHistories).flatMap(([userPhone, records]) =>
      (Array.isArray(records) ? records : []).map((analysis) => ({
        ...analysis,
        _id: `${userPhone}:${analysis.id}`,
        userPhone
      }))
    );
    if (analyses.length) {
      await analysisHistoryCollection.insertMany(analyses);
      console.log(`Migrated ${analyses.length} analysis records from JSON to MongoDB.`);
    }
  }
}

function findUserByPhone(rawPhone) {
  return usersCollection.findOne({ rawPhone });
}

async function createUser(user) {
  await usersCollection.insertOne({ ...user, _id: user.id });
}

async function updateUserByPhone(rawPhone, updates) {
  const result = await usersCollection.findOneAndUpdate(
    { rawPhone },
    { $set: updates },
    { returnDocument: 'after' }
  );
  return result;
}

function createPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function passwordMatches(password, user) {
  const actualHash = scryptSync(password, user.passwordSalt, 64);
  const storedHash = Buffer.from(user.passwordHash, 'hex');
  return storedHash.length === actualHash.length && timingSafeEqual(storedHash, actualHash);
}

function publicUser(user) {
  const {
    _id,
    passwordHash,
    passwordSalt,
    hasFarm,
    farmSizeAcres,
    ...profile
  } = user;
  return profile;
}

function createSession(userPhone) {
  const sessionToken = randomBytes(32).toString('hex');
  activeSessions.set(sessionToken, userPhone);
  return sessionToken;
}

function getSessionPhone(req) {
  const authorization = req.get('authorization') || '';
  const sessionToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  return sessionToken ? activeSessions.get(sessionToken) : null;
}

const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ============================================================
// Per-account analysis history
// ============================================================

async function saveAnalysisForUser(userPhone, analysis) {
  await analysisHistoryCollection.updateOne(
    { _id: `${userPhone}:${analysis.id}` },
    { $set: { ...analysis, userPhone } },
    { upsert: true }
  );
  const expiredRecords = await analysisHistoryCollection
    .find({ userPhone })
    .sort({ timestamp: -1 })
    .skip(20)
    .project({ _id: 1 })
    .toArray();
  if (expiredRecords.length) {
    await analysisHistoryCollection.deleteMany({
      _id: { $in: expiredRecords.map((record) => record._id) }
    });
  }
}

async function runGeminiVisionAnalysis(
  imageData,
  commodityHint,
  district
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  let base64Clean = imageData;
  let mimeType = 'image/jpeg';

  const match = imageData.match(
    /^data:(image\/[a-zA-Z0-9+]+);base64,(.+)$/
  );

  if (match) {
    mimeType = match[1];
    base64Clean = match[2];
  }

  const prompt = `
You are an expert Agricultural Produce Quality Inspector analyzing this produce photo.

The trained PyTorch model is the ONLY authority for Grade A/B/C.

Gemini must NOT determine or modify the grade.

Return additional visual information only.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',

    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Clean
        }
      },
      prompt
    ],

    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = response.text?.trim() || '{}';

  return JSON.parse(text);
}

// ============================================================
// API Health
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'AgriSense AI',
    version: '1.0.0',
    mode: 'React.js (.JSX)',
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    fruitsSupported: ['Apple', 'Tomato']
  });
});

async function runPythonML(imageData, commodity, district) {
  const pythonCmd = path.join(__dirname, '.venv', 'Scripts', 'python.exe');

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(
      pythonCmd,
      ['-X', 'utf8', 'ml_engine.py'],
      {
        cwd: __dirname,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          AGRISENSE_COMMODITY: commodity,
          AGRISENSE_DISTRICT: district
        },
        windowsHide: true
      }
    );

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.setEncoding('utf8');
    pythonProcess.stderr.setEncoding('utf8');
    pythonProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk;
    });
    pythonProcess.stderr.on('data', (chunk) => {
      stderrData += chunk;
    });
    pythonProcess.on('error', (error) => {
      reject(new Error(`Could not start the Python grading engine: ${error.message}`));
    });
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(
          `Python grading engine exited with code ${code}: ${stderrData || stdoutData || 'No details returned.'}`
        ));
        return;
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        if (!result || typeof result !== 'object') {
          throw new Error('The grading engine returned an invalid response.');
        }
        resolve(result);
      } catch (error) {
        reject(new Error(`Could not read the Python grading result: ${error.message}`));
      }
    });
    pythonProcess.stdin.on('error', (error) => {
      reject(new Error(`Could not send the image to the grading engine: ${error.message}`));
    });
    pythonProcess.stdin.end(imageData);
  });
}

// ============================================================
// Analyze produce
// ============================================================

app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();

  try {
    const historyKey = getSessionPhone(req);
    if (!historyKey) {
      return res.status(401).json({ status: 'error', error: 'Sign in before saving an analysis.' });
    }

    const {
      image,
      previewImage,
      commodity = 'auto',
      district = '',
      market = 'All Markets'
    } = req.body;

    // ----------------------------------------------------------
    // Validate image
    // ----------------------------------------------------------

    if (!image) {
      return res.status(400).json({
        status: 'error',
        error: 'Image data is required'
      });
    }
    if (!MANDI_DISTRICT_STATES[district]) {
      return res.status(400).json({
        status: 'error',
        error: 'Choose a supported district before analyzing produce.'
      });
    }

    // ----------------------------------------------------------
    // IMPORTANT:
    // PyTorch is the ONLY authority for Grade A/B/C.
    // Gemini and JS fallback must NOT determine grade.
    // ----------------------------------------------------------
    const rawCommodity =
      String(commodity).toLowerCase().trim();

    const selectedCommodity =
      rawCommodity === 'auto detect'
        ? 'auto'
        : rawCommodity;

    if (
      !['auto', 'apple', 'tomato'].includes(
        selectedCommodity
      )
    ) {
      return res.status(400).json({
        status: 'error',
        error:
          'Unsupported commodity. Please use Auto Detect, Apple, or Tomato.'
      });
    }

    // ----------------------------------------------------------
    // STEP 1: Run trained PyTorch model
    // ----------------------------------------------------------

    let gradingResult;

    try {
      gradingResult = await runPythonML(
        image,
        selectedCommodity,
        district
      );
    } catch (mlError) {
      console.error('====================================');
      console.error('PYTORCH ML ERROR');
      console.error(mlError);
      console.error('====================================');

      return res.status(500).json({
        status: 'error',
        error: mlError.message || 'Python ML execution failed'
      });
    }

    // ----------------------------------------------------------
    // STEP 1B:
    // Handle unsupported fruit.
    // Example: Mango / Banana / Papaya
    // ----------------------------------------------------------

    if (!gradingResult) {
      return res.status(500).json({
        status: 'error',
        error: 'The trained AI model returned no result.'
      });
    }

    if (gradingResult.status === 'rejected') {
      return res.status(400).json({
        status: 'rejected',
        error:
          gradingResult.message ||
          'Please upload an Apple or Tomato image.',
        data: gradingResult
      });
    }

    // ----------------------------------------------------------
    // STEP 1C:
    // Validate successful grading result
    // ----------------------------------------------------------

    if (
      gradingResult.status !== 'success' ||
      !['A', 'B', 'C'].includes(
        String(gradingResult.grade || '').toUpperCase()
      )
    ) {
      return res.status(500).json({
        status: 'error',
        error:
          'The trained AI model returned an invalid grading result.'
      });
    }

    // ----------------------------------------------------------
    // STEP 2:
    // PyTorch grade is FINAL
    //
    // IMPORTANT:
    // For Auto Detect, use commodity returned by Python.
    // ----------------------------------------------------------

    const finalCommodity =
      gradingResult.commodity ||
      (selectedCommodity === 'apple'
        ? 'Apple'
        : 'Tomato');

    const grade =
      String(gradingResult.grade).toUpperCase();

    const confidence =
      Number(gradingResult.confidence) || 0;

    const probabilities =
      gradingResult.model_probabilities ||
      gradingResult.probabilities || {
        A: 0,
        B: 0,
        C: 0
      };

    // ----------------------------------------------------------
    // STEP 3:
    // Calculate quality score
    // ----------------------------------------------------------

    const qualityScore =
      Math.round(
        (
          Number(probabilities.A || 0) * 1.0 +
          Number(probabilities.B || 0) * 0.70 +
          Number(probabilities.C || 0) * 0.40
        ) * 10
      ) / 10;

    const gradeLabel =
      grade === 'A'
        ? 'High Quality'
        : grade === 'B'
          ? 'Standard Quality'
          : 'Needs Sorting';

    // ----------------------------------------------------------
    // STEP 4:
    // Presentation metrics
    // ----------------------------------------------------------

    const a = Number(probabilities.A || 0);
    const b = Number(probabilities.B || 0);
    const c = Number(probabilities.C || 0);

    const metrics = {
      freshness: Math.round(qualityScore),

      color: Math.round(
        Math.min(
          100,
          qualityScore + (a - c) * 0.05
        )
      ),

      visibleDefects: Math.round(
        Math.max(
          0,
          Math.min(
            100,
            100 - qualityScore
          )
        )
      ),

      bruising: Math.round(
        Math.max(
          0,
          Math.min(
            100,
            (b + c) * 0.35
          )
        )
      ),

      shapeConsistency: Math.round(
        Math.max(
          0,
          Math.min(
            100,
            qualityScore - c * 0.10
          )
        )
      )
    };

    // ----------------------------------------------------------
    // STEP 5:
    // Shelf life based on trained-model grade
    // ----------------------------------------------------------

    let shelfLife;

    if (finalCommodity === 'Tomato') {
      if (grade === 'A') {
        shelfLife = '5 - 7 Days';
      } else if (grade === 'B') {
        shelfLife = '3 - 4 Days';
      } else {
        shelfLife = '1 - 2 Days';
      }
    } else {
      if (grade === 'A') {
        shelfLife = '14 - 21 Days';
      } else if (grade === 'B') {
        shelfLife = '7 - 10 Days';
      } else {
        shelfLife = '3 - 5 Days';
      }
    }

    // ----------------------------------------------------------
    // STEP 6:
    // Description
    //
    // PyTorch grade remains final.
    // ----------------------------------------------------------

    const variety =
      gradingResult.variety ||
      finalCommodity;

    const description =
      gradingResult.description ||
      `The trained ${finalCommodity.toLowerCase()} classification model ` +
      `classified this sample as Grade ${grade}. ` +
      `Model confidence is ${confidence.toFixed(2)}%.`;

    // ----------------------------------------------------------
    // STEP 7:
    // Market price
    // ----------------------------------------------------------

    const districtKey = district;

    // ----------------------------------------------------------
    // STEP 8:
    // Final result
    // ----------------------------------------------------------

    const inferenceTimeMs =
      Date.now() - startTime;

    const newRecord = {
      id: `scan-${Date.now()}`,

      timestamp:
        new Date().toISOString(),

      dateFormatted:
        new Intl.DateTimeFormat(
          'en-IN',
          {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }
        ).format(new Date()),

      commodity: finalCommodity,

      variety,

      // Grade ONLY from PyTorch
      grade,

      gradeLabel,

      qualityScore,

      maxScore: 100,

      metrics,

      shelfLife,

      confidence,

      description,

      district: districtKey,

      market:
        market === 'All Markets'
          ? `${districtKey} Main APMC`
          : market,

      image:
        typeof previewImage === 'string' && previewImage.startsWith('data:image/')
          ? previewImage
          : image,

      modelProbabilities: probabilities,

      // Additional detector information
      fruitDetection:
        gradingResult.fruit_detection || null,

      pipelineDetails: {
        framework:
          'PyTorch EfficientNet-B0',

        model:
          finalCommodity === 'Apple'
            ? 'apple_grade_model.pth'
            : 'tomato_grade_model.pth',

        fruitDetectionModel:
          'fruit_detection_model.pth',

        inferenceTimeMs,

        gradeSource:
          'Trained PyTorch Grade Model',

        fruitDetectionSource:
          'Trained PyTorch Fruit Detection Model',

        geminiUsed: false
      }
    };

    // ----------------------------------------------------------
    // Save history
    // ----------------------------------------------------------

    await saveAnalysisForUser(historyKey, newRecord);

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      status: 'success',
      data: newRecord
    });

  } catch (error) {
    console.error(
      'Analysis error:',
      error
    );

    return res.status(500).json({
      status: 'error',
      error:
        error.message ||
        'Analysis failed'
    });
  }
});

// ============================================================
// Market intelligence data
// ============================================================

const MANDI_API_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const MANDI_DISTRICT_STATES = {
  Kolhapur: 'Maharashtra',
  Nashik: 'Maharashtra',
  Pune: 'Maharashtra',
  Shimla: 'Himachal Pradesh',
  Sangli: 'Maharashtra',
  Satara: 'Maharashtra',
  Solapur: 'Maharashtra',
  Ahmednagar: 'Maharashtra',
  Nagpur: 'Maharashtra',
  Bengaluru: 'Karnataka'
};

function readMandiField(record, fieldName) {
  const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingKey = Object.keys(record).find(
    (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
  );
  return matchingKey ? record[matchingKey] : undefined;
}

function parseMandiPrice(value) {
  const price = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function parseMandiDate(value) {
  const dateText = String(value ?? '').trim();
  const dayFirstDate = dateText.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const date = dayFirstDate
    ? new Date(Date.UTC(
        Number(dayFirstDate[3]),
        Number(dayFirstDate[2]) - 1,
        Number(dayFirstDate[1])
      ))
    : new Date(dateText);
  return Number.isNaN(date.getTime()) ? null : date;
}

app.get('/api/market-prices', async (req, res) => {
  const requestedCommodity = String(req.query.commodity || '');
  const commodity = ['Tomato', 'Apple', 'Dragon Fruit'].find(
    (value) => value.toLowerCase() === requestedCommodity.toLowerCase()
  );
  const district = String(req.query.district || '');
  const state = MANDI_DISTRICT_STATES[district];

  if (!commodity || !state) {
    return res.status(400).json({
      status: 'error',
      error: 'Choose a supported commodity and district.'
    });
  }

  if (!process.env.MANDI_API_KEY) {
    return res.status(503).json({
      status: 'error',
      error: 'Mandi prices are not configured. Add MANDI_API_KEY to the server .env file and restart the app.'
    });
  }

  const apiUrl = new URL(`https://api.data.gov.in/resource/${MANDI_API_RESOURCE_ID}`);
  apiUrl.search = new URLSearchParams({
    'api-key': process.env.MANDI_API_KEY,
    format: 'json',
    limit: '1000',
    'filters[state]': state,
    'filters[district]': district,
    'filters[commodity]': commodity
  }).toString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`Mandi data provider returned HTTP ${response.status}.`);
      return res.status(502).json({
        status: 'error',
        error: 'The mandi price provider could not return data. Check the API key and try again.'
      });
    }

    const payload = await response.json();
    if (!Array.isArray(payload.records)) {
      console.error('Mandi data provider returned an unexpected response format.');
      return res.status(502).json({
        status: 'error',
        error: 'The mandi price provider returned an unexpected response.'
      });
    }

    const records = payload.records
      .map((record) => ({
        market: String(readMandiField(record, 'Market') || 'Unknown market'),
        date: parseMandiDate(readMandiField(record, 'Arrival_Date')),
        min: parseMandiPrice(readMandiField(record, 'Min_Price')),
        modal: parseMandiPrice(readMandiField(record, 'Modal_Price')),
        max: parseMandiPrice(readMandiField(record, 'Max_Price'))
      }))
      .filter((record) => record.date && record.min !== null && record.modal !== null && record.max !== null);

    if (records.length === 0) {
      return res.json({
        commodity,
        district,
        unit: '₹/kg',
        source: 'AGMARKNET via data.gov.in',
        fetchedAt: new Date().toISOString(),
        dataDate: null,
        summary: null,
        comparisons: [],
        trends: [],
        message: 'No reported mandi prices were found for this commodity and district.'
      });
    }

    const latestTimestamp = Math.max(...records.map((record) => record.date.getTime()));
    const latestRecords = records.filter((record) => record.date.getTime() === latestTimestamp);
    const toKg = (price) => Number((price / 100).toFixed(2));
    const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;
    const summary = {
      min: toKg(Math.min(...latestRecords.map((record) => record.min))),
      modal: toKg(average(latestRecords.map((record) => record.modal))),
      max: toKg(Math.max(...latestRecords.map((record) => record.max)))
    };

    const marketGroups = new Map();
    for (const record of latestRecords) {
      const marketRecords = marketGroups.get(record.market) || [];
      marketRecords.push(record);
      marketGroups.set(record.market, marketRecords);
    }
    const comparisons = [...marketGroups.entries()]
      .map(([name, marketRecords]) => ({
        name,
        min: toKg(Math.min(...marketRecords.map((record) => record.min))),
        modal: toKg(average(marketRecords.map((record) => record.modal))),
        max: toKg(Math.max(...marketRecords.map((record) => record.max))),
        distance: '—'
      }))
      .sort((left, right) => right.modal - left.modal)
      .map((market, index) => ({ ...market, isBest: index === 0 }));

    const trendGroups = new Map();
    for (const record of records) {
      const day = record.date.toISOString().slice(0, 10);
      const dayRecords = trendGroups.get(day) || [];
      dayRecords.push(record.modal);
      trendGroups.set(day, dayRecords);
    }
    const trends = [...trendGroups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-30)
      .map(([day, prices]) => ({
        day: new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC'
        }),
        price: toKg(average(prices))
      }));

    return res.json({
      commodity,
      district,
      unit: '₹/kg',
      source: 'AGMARKNET via data.gov.in',
      fetchedAt: new Date().toISOString(),
      dataDate: new Date(latestTimestamp).toISOString().slice(0, 10),
      summary,
      comparisons,
      trends
    });
  } catch (error) {
    console.error('Failed to fetch mandi prices:', error);
    return res.status(502).json({
      status: 'error',
      error: error.name === 'AbortError'
        ? 'The mandi price provider took too long to respond. Please try again.'
        : 'Could not load mandi prices. Check the server connection and try again.'
    });
  }
});

// ============================================================
// Recent analyses history
// ============================================================

app.get(
  '/api/history',
  async (req, res) => {
    const historyKey = getSessionPhone(req);
    if (!historyKey) {
      return res.status(401).json({ status: 'error', error: 'Sign in to view analysis history.' });
    }

    try {
      const records = await analysisHistoryCollection
        .find({ userPhone: historyKey })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      const analyses = records.map(({ _id, userPhone, ...analysis }) => analysis);
      return res.json({
        status: 'success',
        analyses,
        totalCount: analyses.length,
        avgGrade: analyses[0]?.grade || null,
        bestMarketPrice: analyses[0]?.prices?.modal
          ? `₹${analyses[0].prices.modal}/kg`
          : null
      });
    } catch (error) {
      console.error('History load failed:', error);
      return res.status(500).json({ status: 'error', error: 'Could not load analysis history.' });
    }
  }
);

app.delete(
  '/api/history',
  async (req, res) => {
    const historyKey = getSessionPhone(req);
    if (!historyKey) {
      return res.status(401).json({ status: 'error', error: 'Sign in to clear analysis history.' });
    }

    try {
      await analysisHistoryCollection.deleteMany({ userPhone: historyKey });
      return res.json({ status: 'success', analyses: [], totalCount: 0 });
    } catch (error) {
      console.error('History clear failed:', error);
      return res.status(500).json({ status: 'error', error: 'Could not clear analysis history.' });
    }
  }
);

// ============================================================
// User session / profile
// ============================================================

app.get(
  '/api/user',
  async (req, res) => {
    const historyKey = getSessionPhone(req);
    if (!historyKey) {
      return res.status(401).json({ status: 'error', error: 'Sign in to view your account.' });
    }

    try {
      const user = await findUserByPhone(historyKey);
      if (!user) {
        return res.status(404).json({ status: 'error', error: 'Account not found.' });
      }
      return res.json({ status: 'success', user: publicUser(user) });
    } catch (error) {
      console.error('Account profile load failed:', error);
      return res.status(500).json({ status: 'error', error: 'Could not load your account.' });
    }
  }
);

app.put('/api/user', async (req, res) => {
  const historyKey = getSessionPhone(req);
  if (!historyKey) {
    return res.status(401).json({ status: 'error', error: 'Sign in to update your account.' });
  }

  const { district, dailySmsAlerts } = req.body || {};
  const supportedDistricts = Object.keys(MANDI_DISTRICT_STATES);
  if (!supportedDistricts.includes(district) || typeof dailySmsAlerts !== 'boolean') {
    return res.status(400).json({ status: 'error', error: 'Provide a valid district and alert preference.' });
  }

  try {
    const user = await updateUserByPhone(historyKey, {
      district,
      state: MANDI_DISTRICT_STATES[district],
      dailySmsAlerts
    });
    if (!user) {
      return res.status(404).json({ status: 'error', error: 'Account not found.' });
    }
    return res.json({ status: 'success', user: publicUser(user) });
  } catch (error) {
    console.error('Account profile update failed:', error);
    return res.status(500).json({ status: 'error', error: 'Could not save your account preferences.' });
  }
});

// ============================================================
// Authentication
// ============================================================

app.post(
  '/api/auth/register',
  async (req, res) => {
    const {
      name,
      phone,
      district,
      password,
      primaryCrop,
      dailySmsAlerts = false
    } = req.body || {};
    const digits = String(phone || '').replace(/\D/g, '');

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ status: 'error', error: 'Enter your full name.' });
    }
    if (digits.length < 10 || digits.length > 15) {
      return res.status(400).json({ status: 'error', error: 'Enter a valid mobile number.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ status: 'error', error: 'Password must be at least 6 characters.' });
    }
    if (!MANDI_DISTRICT_STATES[district]) {
      return res.status(400).json({ status: 'error', error: 'Choose a supported district.' });
    }
    if (!['Tomato', 'Apple', 'Dragon Fruit'].includes(primaryCrop)) {
      return res.status(400).json({ status: 'error', error: 'Choose a supported primary produce.' });
    }
    if (typeof dailySmsAlerts !== 'boolean') {
      return res.status(400).json({ status: 'error', error: 'Choose a valid alert preference.' });
    }

    try {
      const rawPhone = digits.slice(-10);

      const state = MANDI_DISTRICT_STATES[district];
      const user = {
        id: randomBytes(16).toString('hex'),
        name: name.trim(),
        phone: `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`,
        rawPhone,
        district,
        state,
        primaryCrops: [primaryCrop],
        dailySmsAlerts,
        createdAt: new Date().toISOString(),
        ...createPasswordHash(password)
      };

      await createUser(user);
      return res.status(201).json({
        status: 'success',
        user: publicUser(user),
        sessionToken: createSession(rawPhone)
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ status: 'error', error: 'An account with this phone number already exists.' });
      }
      console.error('Account registration failed:', error);
      return res.status(500).json({ status: 'error', error: 'Could not save your account.' });
    }
  }
);

app.post(
  '/api/auth/login',
  async (req, res) => {
    const { phone, password } = req.body || {};
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length < 10 || typeof password !== 'string' || !password) {
      return res.status(400).json({ status: 'error', error: 'Enter your phone number and password.' });
    }

    try {
      const rawPhone = digits.slice(-10);
      const user = await findUserByPhone(rawPhone);
      if (!user || !passwordMatches(password, user)) {
        return res.status(401).json({ status: 'error', error: 'Incorrect phone number or password.' });
      }

      return res.json({
        status: 'success',
        user: publicUser(user),
        sessionToken: createSession(rawPhone)
      });
    } catch (error) {
      console.error('Account login failed:', error);
      return res.status(500).json({ status: 'error', error: 'Could not log in right now.' });
    }
  }
);

app.post('/api/auth/logout', (req, res) => {
  const authorization = req.get('authorization') || '';
  const sessionToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (sessionToken) activeSessions.delete(sessionToken);
  return res.json({ status: 'success' });
});
// ============================================================
// Vite mounting
// ============================================================

async function startServer() {
  await connectToDatabase();

  if (!isProd) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });

    app.use(
      vite.middlewares
    );
  } else {
    app.use(
      express.static(
        path.resolve(
          __dirname,
          'dist'
        )
      )
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.resolve(
            __dirname,
            'dist',
            'index.html'
          )
        );
      }
    );
  }

  const server = app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `AgriSense AI (React JSX) server listening on http://localhost:${PORT}`
      );
    }
  );

  const shutdown = () => {
    server.close(async () => {
      await mongoClient?.close();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('Could not start AgriSense AI:', error);
  process.exitCode = 1;
});