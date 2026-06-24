require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Disease = require('../models/Disease');
const DietPlan = require('../models/DietPlan');

const seedAdditionalDiets = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for additional diet seeding');

    const otherDiseases = ['BP', 'Fever', 'Stomach Pain', 'Headache'];
    
    for (const diseaseName of otherDiseases) {
      let disease = await Disease.findOne({ name: diseaseName });
      if (!disease) {
        disease = await Disease.create({ name: diseaseName, category: 'General' });
        console.log(`Created Disease: ${diseaseName}`);
      }

      // Clear existing plans for this disease to prevent duplicates
      await DietPlan.deleteMany({ disease: disease._id });

      let dietPlans = [];

      if (diseaseName === 'BP') {
        dietPlans = [
          {
            disease: disease._id,
            diseaseType: 'Hypertension',
            severity: 'High',
            dailyPlan: {
              morning: ['Celery juice or warm lemon water', 'Oatmeal with chia seeds', 'Banana'],
              afternoon: ['Grilled chicken or tofu salad', 'Quinoa', 'Steamed broccoli'],
              evening: ['Green tea', 'Handful of unsalted almonds'],
              night: ['Light vegetable soup', '1 piece of grilled fish or paneer', 'Small portion of brown rice']
            },
            monthlyPlan: ['Check BP daily', 'Limit sodium strictly', '30 mins brisk walk daily'],
            avoidFoods: ['Salt/High sodium foods', 'Processed meats', 'Pickles', 'Canned soups'],
            warnings: ['If BP > 180/120 seek emergency care immediately', 'Do not skip medication']
          },
          {
            disease: disease._id,
            diseaseType: 'Hypotension',
            severity: 'Low',
            dailyPlan: {
              morning: ['Coffee or black tea', 'Salted crackers or toast with salted butter', 'Orange juice'],
              afternoon: ['Chicken sandwich with pickles', 'Salted nuts', 'Electrolyte drink'],
              evening: ['Cheese slice', 'Olives', 'Tea'],
              night: ['Pasta with cheese', 'Chicken or vegetable curry with moderate salt']
            },
            monthlyPlan: ['Check BP twice a week', 'Increase fluid intake', 'Compression stockings if advised'],
            avoidFoods: ['Alcohol', 'Large carb-heavy meals', 'Sudden posture changes'],
            warnings: ['If fainting occurs, lie down and raise legs', 'Drink plenty of water']
          }
        ];
      } else if (diseaseName === 'Fever') {
        dietPlans = [
          {
            disease: disease._id,
            diseaseType: 'Viral/Bacterial',
            severity: 'Standard',
            dailyPlan: {
              morning: ['Warm ginger tea', 'Soft boiled egg or porridge', 'Fresh orange juice'],
              afternoon: ['Clear chicken or vegetable soup', 'Soft cooked rice (Khichdi)', 'Boiled carrots'],
              evening: ['Warm herbal tea', 'A few biscuits'],
              night: ['Light soup', 'Mashed potatoes or soft rice']
            },
            monthlyPlan: ['Rest completely until fever subsides', 'Gradually return to normal diet'],
            avoidFoods: ['Spicy foods', 'Deep fried foods', 'Heavy dairy products', 'Caffeine'],
            warnings: ['If fever > 103°F seek medical help', 'Stay extremely hydrated']
          }
        ];
      } else if (diseaseName === 'Stomach Pain') {
        dietPlans = [
          {
            disease: disease._id,
            diseaseType: 'Gastritis/Acidity',
            severity: 'Standard',
            dailyPlan: {
              morning: ['Cold milk or coconut water', 'Oatmeal', 'Banana'],
              afternoon: ['Plain yogurt with rice', 'Steamed vegetables', 'Non-spicy lentils'],
              evening: ['Chamomile tea', 'Plain crackers'],
              night: ['Light lentil soup', 'Soft rice or plain toast']
            },
            monthlyPlan: ['Eat smaller, frequent meals', 'Avoid lying down immediately after eating'],
            avoidFoods: ['Spicy curries', 'Citrus fruits', 'Coffee/Tea', 'Tomato based sauces', 'Fried foods'],
            warnings: ['If pain is severe and sudden, seek emergency care', 'Watch for dark stools']
          }
        ];
      } else if (diseaseName === 'Headache') {
        dietPlans = [
          {
            disease: disease._id,
            diseaseType: 'Migraine/Tension',
            severity: 'Standard',
            dailyPlan: {
              morning: ['Water with magnesium powder', 'Scrambled eggs', 'Whole wheat toast'],
              afternoon: ['Salmon or leafy green salad', 'Quinoa', 'Avocado'],
              evening: ['Ginger tea', 'Handful of almonds or pumpkin seeds'],
              night: ['Grilled chicken or tofu', 'Spinach', 'Sweet potato']
            },
            monthlyPlan: ['Identify and track food triggers', 'Maintain consistent sleep schedule', 'Stay hydrated'],
            avoidFoods: ['Aged cheeses', 'Processed meats (Nitrates)', 'Artificial sweeteners', 'Alcohol (Red wine)'],
            warnings: ['If headache is "worst of your life", seek emergency care', 'Monitor vision changes']
          }
        ];
      }

      if (dietPlans.length > 0) {
        await DietPlan.insertMany(dietPlans);
        console.log(`Created Diet Plans for ${diseaseName}`);
      }
    }

    console.log('Seeding of additional diets completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdditionalDiets();
