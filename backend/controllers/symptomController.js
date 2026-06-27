const Symptom = require('../models/Symptom');
const SymptomCheckHistory = require('../models/SymptomCheckHistory');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all symptoms
// @route   GET /api/symptoms
// @access  Private
exports.getAllSymptoms = asyncHandler(async (req, res, next) => {
  const symptoms = await Symptom.find({ isActive: true }).sort('name');
  
  res.status(200).json({
    success: true,
    count: symptoms.length,
    data: symptoms
  });
});

// @desc    Get single symptom
// @route   GET /api/symptoms/:id
// @access  Private
exports.getSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: symptom
  });
});

// @desc    Create new symptom
// @route   POST /api/symptoms
// @access  Private (Admin)
exports.createSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.create(req.body);

  res.status(201).json({
    success: true,
    data: symptom
  });
});

// @desc    Update symptom
// @route   PUT /api/symptoms/:id
// @access  Private (Admin)
exports.updateSymptom = asyncHandler(async (req, res, next) => {
  let symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  symptom = await Symptom.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: symptom
  });
});

// @desc    Delete symptom
// @route   DELETE /api/symptoms/:id
// @access  Private (Admin)
exports.deleteSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  await symptom.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Analyze symptom and generate recommendations
// @route   POST /api/symptoms/analyze
// @access  Private
exports.analyzeSymptom = asyncHandler(async (req, res, next) => {
  const { symptomName, ageGroup, severity } = req.body;

  if (!symptomName || !ageGroup || !severity) {
    return next(new ErrorResponse('Please provide symptom name, age group, and severity', 400));
  }

  // 1. Fetch base symptom data
  let baseSymptom = await Symptom.findOne({ name: { $regex: new RegExp('^' + symptomName + '$', 'i') } });

  // 2. If not found, use a comprehensive fallback data
  if (!baseSymptom) {
    const fallbackSymptoms = [
      {
        name: 'Fever',
        recommended: ['Clear broths', 'Boiled vegetables', 'Oatmeal', 'Fresh fruits (Watermelon, Oranges)'],
        avoid: ['Fried food', 'Spicy meals', 'Caffeine', 'Heavy dairy products'],
        hydration: ['Drink at least 3 liters of water', 'Coconut water', 'Electrolyte solutions'],
        mealPlan: { Morning: ['Warm oatmeal', 'Herbal tea'], Afternoon: ['Vegetable soup', 'Boiled rice'], Evening: ['Fruit bowl', 'Coconut water'], Night: ['Light chicken broth or vegetable clear soup', 'Toast'] },
        warning: 'If fever exceeds 103°F or lasts more than 3 days, consult a doctor immediately.',
        homeCare: ['Rest in a cool room', 'Apply cold compress to forehead', 'Wear light clothing']
      },
      {
        name: 'Cold',
        recommended: ['Warm soups', 'Ginger tea', 'Garlic', 'Citrus fruits'],
        avoid: ['Cold beverages', 'Dairy', 'Sugary snacks'],
        hydration: ['Warm water with honey and lemon', 'Herbal teas', 'Warm broth'],
        mealPlan: { Morning: ['Ginger tea', 'Warm porridge'], Afternoon: ['Chicken noodle soup', 'Garlic bread'], Evening: ['Green tea', 'Warm nuts'], Night: ['Light vegetable soup', 'Steamed vegetables'] },
        warning: 'If you experience severe chest pain or difficulty breathing, seek emergency care.',
        homeCare: ['Steam inhalation', 'Gargle with warm salt water', 'Use a humidifier']
      },
      {
        name: 'Cough',
        recommended: ['Honey', 'Ginger', 'Warm soups', 'Turmeric milk'],
        avoid: ['Cold drinks', 'Fried food', 'Excessive sugar'],
        hydration: ['Warm water', 'Ginger tea', 'Warm lemon water'],
        mealPlan: { Morning: ['Warm water with honey', 'Oatmeal'], Afternoon: ['Warm lentil soup', 'Soft cooked rice'], Evening: ['Turmeric tea', 'Dry toast'], Night: ['Turmeric milk', 'Light soup'] },
        warning: 'If you cough up blood or have persistent wheezing, see a doctor.',
        homeCare: ['Use lozenges', 'Keep your head elevated while sleeping', 'Steam inhalation']
      },
      {
        name: 'Headache',
        recommended: ['Water-rich foods', 'Magnesium-rich foods (Spinach, Almonds)', 'Bananas'],
        avoid: ['Aged cheese', 'Processed meats', 'Excessive caffeine', 'Alcohol'],
        hydration: ['Drink plain water frequently', 'Electrolyte drinks', 'Peppermint tea'],
        mealPlan: { Morning: ['Banana smoothie', 'Handful of almonds'], Afternoon: ['Spinach salad', 'Quinoa'], Evening: ['Peppermint tea', 'Fresh cucumber slices'], Night: ['Baked salmon or lentil stew', 'Steamed broccoli'] },
        warning: 'If the headache is sudden and incredibly severe, seek emergency care immediately.',
        homeCare: ['Rest in a dark, quiet room', 'Apply a cold compress', 'Massage neck and temples']
      },
      {
        name: 'Stomach Pain',
        recommended: ['BRAT diet', 'Ginger', 'Mint'],
        avoid: ['Spicy foods', 'Dairy', 'High-fat foods', 'Caffeine'],
        hydration: ['Sip water slowly', 'Ginger tea', 'Clear broths'],
        mealPlan: { Morning: ['Toast without butter', 'Applesauce'], Afternoon: ['Plain white rice', 'Clear broth'], Evening: ['Ginger tea', 'Plain crackers'], Night: ['Mashed potatoes', 'Soft boiled carrots'] },
        warning: 'If pain is localized to the lower right abdomen, or accompanied by severe vomiting, seek emergency help.',
        homeCare: ['Use a heating pad on your stomach', 'Rest', 'Eat smaller, frequent meals']
      }
    ];
    baseSymptom = fallbackSymptoms.find(s => s.name.toLowerCase() === symptomName.toLowerCase());
    
    // If still not found, provide a generic response
    if (!baseSymptom) {
      baseSymptom = {
        name: symptomName,
        recommended: ['Easily digestible foods', 'Vegetables', 'Fruits'],
        avoid: ['Processed foods', 'Excess sugar', 'Fried items'],
        hydration: ['Water', 'Electrolytes'],
        mealPlan: { Morning: ['Oatmeal'], Afternoon: ['Light soup', 'Rice'], Evening: ['Herbal tea'], Night: ['Steamed veggies'] },
        warning: 'Please consult a healthcare professional for accurate advice.',
        homeCare: ['Rest', 'Stay hydrated']
      };
    }
  }

  // 3. Adapt results based on severity (Mock adaptation for AI feeling)
  let adaptedWarning = baseSymptom.warning;
  if (severity === 'High') {
    adaptedWarning = `URGENT: ${baseSymptom.warning} Due to high severity, professional medical advice is strongly recommended.`;
  } else if (severity === 'Mild') {
    adaptedWarning = `${baseSymptom.warning} Since symptoms are mild, continue monitoring at home.`;
  }

  const results = {
    recommended: baseSymptom.recommended,
    avoid: baseSymptom.avoid,
    hydration: baseSymptom.hydration,
    mealPlan: baseSymptom.mealPlan,
    warning: adaptedWarning,
    homeCare: baseSymptom.homeCare
  };

  // 4. Save to Database
  const historyRecord = await SymptomCheckHistory.create({
    patient: req.user.id,
    symptomName: baseSymptom.name,
    ageGroup,
    severity,
    results
  });

  // 5. Send Response
  res.status(200).json({
    success: true,
    data: {
      _id: historyRecord._id,
      name: baseSymptom.name,
      ...results
    }
  });
});
