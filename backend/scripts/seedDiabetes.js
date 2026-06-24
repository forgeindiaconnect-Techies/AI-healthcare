require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Disease = require('../models/Disease');
const DietPlan = require('../models/DietPlan');

const seedDiabetesData = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // 1. Create Disease
    let diabetes = await Disease.findOne({ name: 'Diabetes' });
    if (!diabetes) {
      diabetes = await Disease.create({
        name: 'Diabetes',
        description: 'A chronic condition that affects how your body turns food into energy.',
        category: 'Metabolic',
        tags: ['sugar', 'blood pressure', 'chronic']
      });
      console.log('Created Disease: Diabetes');
    }

    // 2. Clear old diet plans for diabetes (to prevent duplicates if run multiple times)
    await DietPlan.deleteMany({ disease: diabetes._id });

    // 3. Create Diet Plans for different severities and types
    const dietPlans = [
      {
        disease: diabetes._id,
        diseaseType: 'Type 2',
        severity: 'Moderate',
        dailyPlan: {
          morning: [
            'Warm water with lemon',
            'Oats / millet porridge',
            'Boiled egg or sprouts',
            'Low sugar fruits (Apple/Papaya)'
          ],
          afternoon: [
            '2 Brown rice / chapati',
            '1 bowl Vegetables (Bhindi, Karela)',
            '1 bowl Dal / lean protein',
            'Fresh Cucumber/Carrot Salad'
          ],
          evening: [
            'Green tea without sugar',
            'Handful of mixed nuts (Almonds/Walnuts)',
            'Roasted chana',
            'Avoid biscuits and sweets'
          ],
          night: [
            'Light dinner',
            '2 Chapati / vegetable soup',
            'Green leafy vegetables',
            'Avoid rice-heavy dinner'
          ]
        },
        monthlyPlan: [
          'Weekly diet rotation',
          'Sugar monitoring reminders',
          'Doctor follow-up reminder',
          'Exercise tracking (30 min walk/day)',
          'Monthly HbA1c reminder'
        ],
        avoidFoods: [
          'White Sugar & Jaggery',
          'Sweets & Desserts',
          'White rice excess',
          'Soft drinks & Juices',
          'Bakery items',
          'Fried foods',
          'High-carb snacks'
        ],
        warnings: [
          'Consult doctor before major diet change',
          'Check blood sugar regularly',
          'Do not skip meals',
          'Avoid self-medication',
          'Emergency warning: if dizzy, sweating, chest pain, check sugar immediately'
        ]
      },
      {
        disease: diabetes._id,
        diseaseType: 'Type 1',
        severity: 'High',
        dailyPlan: {
          morning: [
            'Warm water with cinnamon',
            'Protein-rich breakfast (Paneer/Egg)',
            'Multigrain toast',
            'Avocado'
          ],
          afternoon: [
            'Quinoa or Bajra roti',
            'Large portion of greens',
            'Fish or chicken breast (grilled)',
            'Salad'
          ],
          evening: [
            'Black coffee or Green tea',
            'Boiled chana',
            'Greek yogurt'
          ],
          night: [
            'Clear soup',
            'Grilled tofu/chicken',
            'Sautéed vegetables'
          ]
        },
        monthlyPlan: [
          'Strict carb counting',
          'Insulin dose adjustment consultation',
          'Continuous Glucose Monitoring tracking'
        ],
        avoidFoods: [
          'All refined carbs',
          'Sugary drinks',
          'Trans fats'
        ],
        warnings: [
          'Strict insulin timing required',
          'Carry emergency glucose',
          'Monitor ketones if sugar > 250'
        ]
      }
    ];

    await DietPlan.insertMany(dietPlans);
    console.log('Created Diet Plans for Diabetes');

    // Also create some mock diseases for the quick buttons
    const otherDiseases = ['BP', 'Fever', 'Stomach Pain', 'Headache'];
    for (const d of otherDiseases) {
      if (!(await Disease.findOne({ name: d }))) {
        await Disease.create({ name: d, category: 'General' });
        console.log(`Created Disease: ${d}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDiabetesData();
