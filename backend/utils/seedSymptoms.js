require('dotenv').config();
const mongoose = require('mongoose');
const Symptom = require('../models/Symptom');

const symptomsData = [
  {
    name: 'Fever',
    recommended: ['Warm soups', 'Herbal tea', 'Lots of water', 'Oatmeal', 'Fresh fruits (Vitamin C)', 'Boiled vegetables', 'Coconut water'],
    avoid: ['Spicy food', 'Caffeine', 'Alcohol', 'Fried food', 'Sugary drinks', 'Dairy (if mucus is present)'],
    hydration: ['Drink at least 3 liters of water', 'Take ORS if feeling weak', 'Warm lemon water with honey'],
    mealPlan: {
      Morning: ['Oatmeal with soft fruits', 'Ginger tea'],
      Afternoon: ['Light chicken or vegetable soup', 'Boiled rice'],
      Evening: ['Clear broth', 'Warm milk (if tolerated)'],
      Night: ['Light vegetable khichdi', 'Chamomile tea']
    },
    warning: 'If fever exceeds 103°F (39.4°C) or lasts more than 3 days, consult a doctor immediately.',
    homeCare: ['Rest as much as possible', 'Apply a cool compress to your forehead', 'Wear light clothing']
  },
  {
    name: 'Cold',
    recommended: ['Ginger tea', 'Chicken soup', 'Garlic', 'Honey and lemon', 'Turmeric milk', 'Citrus fruits', 'Warm water'],
    avoid: ['Cold drinks', 'Ice cream', 'Dairy products (can thicken mucus)', 'Fried foods', 'Processed snacks'],
    hydration: ['Warm water throughout the day', 'Herbal teas', 'Warm broths'],
    mealPlan: {
      Morning: ['Warm oats', 'Ginger honey tea'],
      Afternoon: ['Hot chicken/veg soup', 'Light toast'],
      Evening: ['Turmeric milk', 'Few nuts'],
      Night: ['Light soup', 'Warm water']
    },
    warning: 'Seek medical attention if breathing becomes difficult or if symptoms worsen after a week.',
    homeCare: ['Use a humidifier', 'Inhale steam', 'Gargle with warm salt water']
  },
  {
    name: 'Cough',
    recommended: ['Honey', 'Ginger', 'Warm fluids', 'Turmeric milk', 'Pineapple juice', 'Thyme tea', 'Chicken soup'],
    avoid: ['Cold water', 'Ice cream', 'Fried foods', 'Citrus fruits (can irritate throat)', 'Spicy foods'],
    hydration: ['Warm water', 'Herbal teas with honey', 'Warm broths'],
    mealPlan: {
      Morning: ['Warm porridge', 'Ginger tea with honey'],
      Afternoon: ['Light soup', 'Steamed vegetables'],
      Evening: ['Turmeric milk', 'Toast'],
      Night: ['Light soup', 'Warm water']
    },
    warning: 'If cough persists for more than 3 weeks or brings up blood, see a doctor.',
    homeCare: ['Use lozenges', 'Elevate your head while sleeping', 'Avoid irritants like smoke']
  },
  {
    name: 'Headache',
    recommended: ['Water', 'Magnesium-rich foods (spinach, almonds)', 'Ginger tea', 'Watermelon', 'Bananas', 'Fatty fish', 'Coffee (in moderation)'],
    avoid: ['Alcohol', 'Aged cheeses', 'Processed meats', 'Artificial sweeteners', 'Too much caffeine'],
    hydration: ['Drink plenty of water (dehydration is a common cause)', 'Electrolyte solutions'],
    mealPlan: {
      Morning: ['Oatmeal with almonds', 'Water'],
      Afternoon: ['Spinach salad', 'Grilled fish/chicken'],
      Evening: ['Ginger tea', 'Banana'],
      Night: ['Light dinner', 'Water']
    },
    warning: 'If the headache is sudden and severe (thunderclap headache) or accompanied by fever/stiff neck, seek emergency care.',
    homeCare: ['Rest in a dark, quiet room', 'Apply a cold or warm compress', 'Massage your temples']
  },
  {
    name: 'Stomach Pain',
    recommended: ['BRAT diet (Bananas, Rice, Applesauce, Toast)', 'Ginger', 'Peppermint tea', 'Plain yogurt', 'Boiled potatoes', 'Oatmeal', 'Papaya'],
    avoid: ['Spicy food', 'Dairy (except yogurt)', 'Fried food', 'Caffeine', 'Alcohol', 'High-fiber foods (temporarily)', 'Artificial sweeteners'],
    hydration: ['Clear fluids', 'Chamomile tea', 'Coconut water (if tolerated)'],
    mealPlan: {
      Morning: ['Toast', 'Banana', 'Peppermint tea'],
      Afternoon: ['Plain rice', 'Boiled potatoes'],
      Evening: ['Ginger tea', 'Crackers'],
      Night: ['Applesauce', 'Oatmeal']
    },
    warning: 'Seek immediate care if pain is severe, accompanied by bloody stools, or you cannot keep liquids down.',
    homeCare: ['Use a heating pad', 'Avoid eating solid food for a few hours', 'Rest']
  },
  {
    name: 'Diabetes',
    recommended: ['Leafy greens', 'Whole grains', 'Fatty fish', 'Beans', 'Walnuts', 'Citrus fruits', 'Berries', 'Sweet potatoes', 'Greek yogurt', 'Chia seeds'],
    avoid: ['Sugar-sweetened beverages', 'Trans fats', 'White bread/rice/pasta', 'Fruit-flavored yogurt', 'Sweetened breakfast cereals', 'Flavored coffee drinks', 'Honey/agave/maple syrup', 'Dried fruit'],
    hydration: ['Water is best', 'Unsweetened tea', 'Coffee (black or with milk substitute)'],
    mealPlan: {
      Morning: ['Oatmeal with berries and walnuts', 'Boiled egg'],
      Afternoon: ['Grilled chicken salad with leafy greens and beans', 'Quinoa'],
      Evening: ['Small apple with almond butter'],
      Night: ['Baked salmon', 'Roasted sweet potatoes', 'Steamed broccoli']
    },
    warning: 'Monitor blood sugar levels regularly. Consult a doctor for a personalized plan.',
    homeCare: ['Exercise regularly', 'Check feet for sores', 'Take medication as prescribed']
  },
  {
    name: 'Blood Pressure',
    recommended: ['Leafy greens (Spinach, Kale)', 'Berries', 'Beets', 'Skim milk and yogurt', 'Oatmeal', 'Bananas', 'Salmon/fatty fish', 'Seeds (Flax, Pumpkin)', 'Garlic', 'Pistachios'],
    avoid: ['Salt/Sodium (Fast food, Canned soup)', 'Deli meats', 'Frozen pizza', 'Pickles', 'Canned tomatoes', 'Sugar', 'Saturated fats', 'Alcohol'],
    hydration: ['Water', 'Hibiscus tea', 'Pomegranate juice (in moderation)'],
    mealPlan: {
      Morning: ['Oatmeal with sliced bananas', 'Skim milk'],
      Afternoon: ['Spinach salad with grilled chicken and seeds', 'Beet juice'],
      Evening: ['Handful of pistachios'],
      Night: ['Baked salmon', 'Quinoa', 'Steamed greens']
    },
    warning: 'High blood pressure often has no symptoms. Regular check-ups are crucial.',
    homeCare: ['Reduce stress', 'Limit sodium intake', 'Engage in moderate physical activity']
  },
  {
    name: 'Nausea',
    recommended: ['Ginger (tea, ale, candies)', 'Crackers', 'Toast', 'Bananas', 'Applesauce', 'Broth', 'Rice', 'Peppermint'],
    avoid: ['Greasy foods', 'Spicy foods', 'Dairy', 'Very sweet foods', 'Strong-smelling foods', 'Caffeine'],
    hydration: ['Sip clear liquids slowly', 'Ginger tea', 'Peppermint tea', 'Electrolyte drinks (if vomiting)'],
    mealPlan: {
      Morning: ['Dry toast or crackers', 'Ginger tea'],
      Afternoon: ['Plain rice or broth'],
      Evening: ['Banana or applesauce'],
      Night: ['Light broth', 'Crackers']
    },
    warning: 'If nausea is accompanied by severe headache, chest pain, or vomiting blood, seek emergency help.',
    homeCare: ['Rest', 'Get fresh air', 'Avoid strong odors', 'Eat small, frequent meals']
  },
  {
    name: 'Fatigue',
    recommended: ['Complex carbohydrates (Oats, Sweet potato)', 'Lean proteins', 'Nuts and seeds', 'Watermelon', 'Spinach', 'Eggs', 'Green tea'],
    avoid: ['Refined sugar (causes crashes)', 'Excessive caffeine', 'Alcohol', 'Processed foods', 'Heavy/large meals'],
    hydration: ['Drink water consistently throughout the day', 'Dehydration is a major cause of fatigue'],
    mealPlan: {
      Morning: ['Oatmeal with nuts and seeds', 'Green tea'],
      Afternoon: ['Spinach and egg salad', 'Sweet potato'],
      Evening: ['Handful of almonds or watermelon'],
      Night: ['Lean chicken or fish', 'Quinoa', 'Steamed vegetables']
    },
    warning: 'If fatigue is persistent, unexplained, or accompanied by other symptoms like weight loss, see a doctor.',
    homeCare: ['Maintain a regular sleep schedule', 'Exercise regularly (but don\'t overdo it)', 'Manage stress']
  },
  {
    name: 'Vomiting',
    recommended: ['Clear broths', 'Crackers', 'Toast', 'Oatmeal', 'Boiled potatoes', 'Applesauce', 'Bananas'],
    avoid: ['Dairy products', 'Spicy foods', 'Greasy or fried foods', 'Caffeine', 'Alcohol', 'High-fiber foods'],
    hydration: ['Sip clear fluids slowly', 'Oral Rehydration Solution (ORS)', 'Diluted apple juice', 'Popsicles'],
    mealPlan: {
      Morning: ['Dry toast', 'Sip clear liquids'],
      Afternoon: ['Clear vegetable broth', 'A few crackers'],
      Evening: ['Applesauce'],
      Night: ['Plain rice', 'Sip ORS']
    },
    warning: 'Seek medical attention if vomiting lasts more than 24 hours, or if you show signs of severe dehydration.',
    homeCare: ['Rest completely', 'Avoid solid foods until vomiting stops', 'Rinse mouth after vomiting']
  },
  {
    name: 'Diarrhea',
    recommended: ['BRAT diet (Bananas, Rice, Applesauce, Toast)', 'Oatmeal', 'Boiled potatoes', 'Yogurt (with active cultures)', 'Lean chicken'],
    avoid: ['Dairy (except yogurt)', 'Spicy foods', 'Greasy/fried foods', 'High-fiber foods', 'Artificial sweeteners', 'Caffeine', 'Alcohol'],
    hydration: ['Drink plenty of fluids', 'Oral Rehydration Solution (ORS)', 'Clear broths', 'Coconut water'],
    mealPlan: {
      Morning: ['Oatmeal or Toast', 'Banana'],
      Afternoon: ['Plain white rice', 'Clear broth'],
      Evening: ['Applesauce'],
      Night: ['Boiled potatoes', 'Lean chicken (if tolerated)']
    },
    warning: 'Consult a doctor if diarrhea persists for more than 2 days, or if you have a high fever or bloody stools.',
    homeCare: ['Rest', 'Wash hands frequently', 'Eat small, bland meals']
  },
  {
    name: 'Sore Throat',
    recommended: ['Warm salt water (gargle)', 'Honey', 'Lemon', 'Ginger tea', 'Chamomile tea', 'Chicken soup', 'Soft foods (mashed potatoes, yogurt)'],
    avoid: ['Spicy foods', 'Acidic foods (citrus, tomatoes)', 'Rough/crunchy foods', 'Alcohol', 'Caffeine'],
    hydration: ['Warm fluids', 'Herbal teas', 'Water with honey and lemon', 'Ice pops (to numb the throat)'],
    mealPlan: {
      Morning: ['Oatmeal with honey', 'Chamomile tea'],
      Afternoon: ['Chicken soup', 'Mashed potatoes'],
      Evening: ['Yogurt (if it doesn\'t worsen mucus)'],
      Night: ['Warm broth', 'Ginger tea']
    },
    warning: 'See a doctor if the sore throat is severe, lasts longer than a week, or is accompanied by difficulty swallowing or breathing.',
    homeCare: ['Use a humidifier', 'Suck on lozenges or hard candy', 'Rest your voice']
  },
  {
    name: 'Chest Pain',
    recommended: ['Garlic', 'Almonds', 'Fatty fish (Salmon)', 'Leafy greens', 'Oats', 'Berries', 'Dark chocolate (in moderation)'],
    avoid: ['Trans fats', 'Fried foods', 'Processed meats', 'Excessive salt', 'Sugary drinks', 'Large, heavy meals'],
    hydration: ['Water', 'Green tea', 'Pomegranate juice'],
    mealPlan: {
      Morning: ['Oatmeal with berries', 'Green tea'],
      Afternoon: ['Salmon salad with leafy greens', 'Handful of almonds'],
      Evening: ['Small piece of dark chocolate'],
      Night: ['Grilled chicken', 'Steamed vegetables', 'Quinoa']
    },
    warning: 'CHEST PAIN CAN BE A MEDICAL EMERGENCY. Seek immediate help if the pain is crushing, spreads to your arm/jaw, or is accompanied by shortness of breath.',
    homeCare: ['Sit down and rest', 'Take prescribed medication (like nitroglycerin) if applicable', 'Try to remain calm']
  },
  {
    name: 'Back Pain',
    recommended: ['Anti-inflammatory foods (Cherries, Berries, Salmon, Walnuts)', 'Foods rich in Calcium and Vitamin D (Dairy, Fortified plant milks)', 'Turmeric', 'Ginger'],
    avoid: ['Processed foods', 'Sugary snacks', 'Refined carbohydrates (White bread, Pasta)', 'Trans fats', 'Excessive alcohol'],
    hydration: ['Water (hydrates spinal discs)', 'Green tea', 'Turmeric tea'],
    mealPlan: {
      Morning: ['Yogurt with berries and walnuts', 'Turmeric tea'],
      Afternoon: ['Salmon and spinach salad', 'Water'],
      Evening: ['Handful of cherries'],
      Night: ['Baked chicken', 'Roasted sweet potatoes', 'Broccoli']
    },
    warning: 'Consult a doctor if back pain is severe, doesn\'t improve with rest, spreads down one or both legs, or causes weakness/numbness.',
    homeCare: ['Use cold/heat therapy', 'Maintain good posture', 'Do gentle stretches (if approved by a professional)']
  },
  {
    name: 'Migraine',
    recommended: ['Magnesium-rich foods (Spinach, Swiss chard, Almonds, Black beans)', 'Fatty fish', 'Ginger', 'Water', 'Peppermint tea'],
    avoid: ['Aged cheeses', 'Alcohol (especially red wine)', 'Processed meats (Nitrates)', 'Chocolate (for some)', 'Artificial sweeteners (Aspartame)', 'MSG', 'Excessive caffeine'],
    hydration: ['Drink water consistently', 'Dehydration is a major migraine trigger', 'Electrolyte drinks (if needed)'],
    mealPlan: {
      Morning: ['Oatmeal with almonds', 'Water or Herbal tea'],
      Afternoon: ['Spinach salad with grilled chicken', 'Black beans'],
      Evening: ['Ginger tea'],
      Night: ['Baked salmon', 'Quinoa', 'Steamed Swiss chard']
    },
    warning: 'See a doctor if migraines are frequent, severe, or accompanied by neurological symptoms (like vision loss or weakness) that are new to you.',
    homeCare: ['Rest in a dark, quiet room', 'Apply a cold compress to your forehead or neck', 'Maintain a regular sleep schedule']
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Database Connection Error:', err);
    process.exit(1);
  }
};

const seedSymptoms = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Symptom.deleteMany({});
    console.log('🗑️  Cleared existing symptoms');

    // Insert new data
    await Symptom.insertMany(symptomsData);
    console.log('✅ Symptoms seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedSymptoms();
