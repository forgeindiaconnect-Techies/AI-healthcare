import React, { useState } from 'react';
import { Search, Thermometer, Droplets, Utensils, AlertTriangle, Coffee, Sun, Moon, Info, HeartPulse, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const mockData = {
  Fever: {
    recommended: ["Rice porridge / Kanji", "Idli", "Vegetable soup", "Dal soup", "Curd rice", "Coconut water", "Banana", "Apple", "Orange", "Boiled vegetables", "Herbal tea", "Warm water"],
    avoid: ["Fried foods", "Spicy foods", "Cold drinks", "Ice cream", "Junk food", "Heavy oily meals", "Processed food"],
    hydration: ["Drink warm water", "ORS if dehydration symptoms", "Coconut water", "Fresh fruit juices without sugar", "Soup 2-3 times per day"],
    mealPlan: { Morning: ["Idli / Kanji", "Warm water"], Afternoon: ["Curd rice / Dal rice", "Vegetable soup"], Evening: ["Herbal tea", "Banana / Apple"], Night: ["Rice kanji", "Boiled vegetables"] },
    warning: "If fever is above 102°F, continues more than 3 days, or patient has breathing difficulty, consult doctor immediately.",
    homeCare: ["Rest heavily in a cool room", "Use a cold compress on forehead", "Wear light clothing"]
  },
  Cold: {
    recommended: ["Chicken/Vegetable soup", "Ginger tea", "Garlic", "Citrus fruits", "Honey", "Turmeric milk", "Oatmeal", "Sweet potatoes"],
    avoid: ["Dairy (if it thickens mucus)", "Cold beverages", "Sugary treats", "Alcohol", "Caffeinated drinks"],
    hydration: ["Hot water with lemon", "Warm ginger tea", "Broth", "Decaf herbal tea"],
    mealPlan: { Morning: ["Oatmeal with honey", "Ginger tea"], Afternoon: ["Chicken or Vegetable soup", "Steamed veggies"], Evening: ["Turmeric milk"], Night: ["Light soup", "Toasted bread"] },
    warning: "If cold persists for over 10 days, or accompanied by severe chest pain, seek medical attention.",
    homeCare: ["Steam inhalation", "Gargle with warm salt water", "Use a humidifier"]
  },
  Cough: {
    recommended: ["Honey", "Ginger", "Pineapple", "Peppermint tea", "Broth", "Warm water", "Turmeric milk"],
    avoid: ["Dairy products", "Fried foods", "Cold desserts", "Citrus fruits (if acidic causes irritation)", "Spicy foods"],
    hydration: ["Warm water", "Honey and lemon water", "Throat-soothing herbal teas"],
    mealPlan: { Morning: ["Warm water with honey", "Porridge"], Afternoon: ["Warm soup", "Soft cooked rice"], Evening: ["Ginger tea", "Soft fruit"], Night: ["Turmeric milk", "Light vegetable stew"] },
    warning: "Coughing up blood or green phlegm, or severe shortness of breath requires immediate medical care.",
    homeCare: ["Elevate head while sleeping", "Avoid smoke and dust", "Take warm showers"]
  },
  Headache: {
    recommended: ["Watermelon", "Spinach", "Almonds", "Flaxseeds", "Ginger tea", "Bananas", "Baked potato"],
    avoid: ["Aged cheese", "Alcohol", "Processed meats", "Artificial sweeteners", "Excessive caffeine"],
    hydration: ["Drink at least 8-10 glasses of water", "Electrolyte solutions if triggered by dehydration"],
    mealPlan: { Morning: ["Oatmeal with almonds", "Hydrating fruits"], Afternoon: ["Spinach salad", "Baked potato"], Evening: ["Herbal tea", "Banana"], Night: ["Light soup", "Whole grain toast"] },
    warning: "If headache is sudden and severe ('thunderclap'), accompanied by vision loss or numbness, call emergency.",
    homeCare: ["Rest in a dark, quiet room", "Apply cold or warm compress to head/neck", "Massage temples"]
  },
  "Stomach Pain": {
    recommended: ["Bananas", "Rice", "Applesauce", "Toast (BRAT diet)", "Ginger", "Peppermint tea", "Plain yogurt"],
    avoid: ["Spicy foods", "Dairy (if lactose intolerant)", "High-fat foods", "Caffeine", "Alcohol", "Artificial sweeteners"],
    hydration: ["Sip water slowly", "Clear broths", "Chamomile tea", "Diluted apple juice"],
    mealPlan: { Morning: ["Plain toast", "Banana"], Afternoon: ["White rice", "Clear broth"], Evening: ["Applesauce", "Peppermint tea"], Night: ["Plain rice kanji"] },
    warning: "Severe, unrelenting pain, or pain accompanied by bloody stools or vomiting blood requires emergency care.",
    homeCare: ["Use a heating pad on your abdomen", "Eat smaller, more frequent meals", "Don't lie down flat immediately after eating"]
  },
  Diabetes: {
    recommended: ["Leafy greens", "Fatty fish", "Avocados", "Chia seeds", "Greek yogurt", "Nuts", "Broccoli", "Olive oil"],
    avoid: ["Sugar-sweetened beverages", "Trans fats", "White bread/Rice/Pasta", "Fruit-flavored yogurt", "Sweetened breakfast cereals", "Honey/Maple syrup"],
    hydration: ["Water", "Unsweetened tea", "Sparkling water with a squeeze of lemon"],
    mealPlan: { Morning: ["Eggs with spinach", "Unsweetened tea"], Afternoon: ["Grilled fish/chicken", "Quinoa and broccoli"], Evening: ["Handful of almonds"], Night: ["Lentil soup", "Mixed green salad"] },
    warning: "If blood sugar drops below 70 mg/dL or rises above 240 mg/dL with ketones present, contact doctor.",
    homeCare: ["Check blood sugar regularly", "Inspect feet daily", "Stay active with daily walks"]
  },
  BP: {
    recommended: ["Leafy greens", "Berries", "Beets", "Oats", "Bananas", "Salmon", "Garlic", "Pistachios", "Pomegranate"],
    avoid: ["Salt/Sodium", "Deli meats", "Frozen pizza", "Pickles", "Canned soups", "Tomato products with added salt", "Alcohol"],
    hydration: ["Hibiscus tea", "Water", "Pomegranate juice (in moderation)"],
    mealPlan: { Morning: ["Oatmeal with berries", "Banana"], Afternoon: ["Salmon", "Leafy green salad"], Evening: ["Unsalted pistachios"], Night: ["Grilled chicken", "Roasted beets"] },
    warning: "Blood pressure reading higher than 180/120 mm Hg is a hypertensive crisis. Seek emergency care immediately.",
    homeCare: ["Reduce stress through deep breathing", "Limit alcohol and quit smoking", "Monitor BP daily at home"]
  },
  Nausea: {
    recommended: ["Crackers", "Ginger", "Dry toast", "Cold foods (less odor)", "Clear broths", "Popsicles", "Bananas"],
    avoid: ["Greasy/Fried foods", "Very sweet foods", "Spicy foods", "Strong-smelling foods", "Dairy"],
    hydration: ["Sip clear liquids slowly", "Ginger ale (flat)", "Ice chips", "Peppermint tea"],
    mealPlan: { Morning: ["Dry crackers", "Sip water"], Afternoon: ["Cold applesauce", "Clear broth"], Evening: ["Ginger tea", "Dry toast"], Night: ["Small portion of plain rice"] },
    warning: "Inability to keep liquids down for 24 hours, or signs of dehydration (dark urine, dizziness) require a doctor.",
    homeCare: ["Sit upright after eating", "Get plenty of fresh air", "Rinse mouth after vomiting"]
  },
  Fatigue: {
    recommended: ["Complex carbohydrates (Oats, Sweet potato)", "Lean proteins", "Nuts and seeds", "Watermelon", "Spinach", "Eggs", "Green tea"],
    avoid: ["Refined carbs (White bread, Pastries)", "Excessive caffeine (causes crash)", "Alcohol", "High-sugar snacks"],
    hydration: ["Consistent water intake throughout the day", "Green tea", "Electrolyte infused water if sweating heavily"],
    mealPlan: { Morning: ["Oatmeal with nuts", "Green tea"], Afternoon: ["Lean chicken salad", "Sweet potato"], Evening: ["Handful of mixed seeds"], Night: ["Grilled fish", "Steamed spinach"] },
    warning: "If fatigue is chronic, unexplainable, or accompanied by chest pain or depression, consult a physician.",
    homeCare: ["Maintain a strict sleep schedule", "Exercise lightly (yoga/stretching)", "Reduce screen time before bed"]
  },
  Vomiting: {
    recommended: ["Clear fluids", "Ice chips", "Ginger tea", "Dry toast", "Crackers", "Bananas", "Applesauce", "Rice"],
    avoid: ["Greasy or fried foods", "Very sweet foods", "Spicy foods", "Dairy products", "Strong-smelling foods"],
    hydration: ["Sip water slowly", "Electrolyte solutions", "Flat ginger ale", "Chamomile tea"],
    mealPlan: { Morning: ["Dry crackers", "Sip water"], Afternoon: ["Clear broth", "Dry toast"], Evening: ["Ginger tea"], Night: ["Small portion of rice or applesauce"] },
    warning: "If vomiting is severe, lasts more than 2 days, or contains blood, seek immediate medical attention.",
    homeCare: ["Rest lying down with head elevated", "Rinse mouth frequently", "Avoid eating large meals"]
  },
  Diarrhea: {
    recommended: ["Bananas", "Rice", "Applesauce", "Toast (BRAT diet)", "Oatmeal", "Boiled potatoes", "Clear broths"],
    avoid: ["Dairy products", "Fatty and fried foods", "High-fiber foods", "Spicy foods", "Caffeine", "Artificial sweeteners"],
    hydration: ["Oral rehydration solutions (ORS)", "Coconut water", "Clear broths", "Water"],
    mealPlan: { Morning: ["Oatmeal or plain toast", "Banana"], Afternoon: ["White rice with clear broth"], Evening: ["Applesauce", "Chamomile tea"], Night: ["Boiled potatoes", "Rice kanji"] },
    warning: "If diarrhea persists for more than 2 days, or you notice signs of severe dehydration or black/bloody stools, see a doctor.",
    homeCare: ["Rest adequately", "Drink fluids constantly to replace lost water", "Avoid strenuous activities"]
  },
  "Sore Throat": {
    recommended: ["Warm herbal teas", "Honey", "Warm broth", "Popsicles", "Soft foods like yogurt and mashed potatoes", "Oatmeal"],
    avoid: ["Crunchy or hard foods", "Acidic fruits and juices", "Spicy foods", "Alcohol", "Caffeine"],
    hydration: ["Warm water with honey and lemon", "Decaffeinated tea", "Clear broths"],
    mealPlan: { Morning: ["Oatmeal with honey", "Warm water"], Afternoon: ["Chicken or vegetable broth", "Mashed potatoes"], Evening: ["Warm herbal tea"], Night: ["Yogurt or soft pudding", "Warm milk"] },
    warning: "If sore throat is severe, lasts longer than a week, or is accompanied by difficulty breathing or swallowing, seek medical care.",
    homeCare: ["Gargle with warm salt water", "Use throat lozenges", "Use a humidifier"]
  },
  "Chest Pain": {
    recommended: ["Leafy greens", "Whole grains", "Berries", "Fatty fish", "Walnuts", "Almonds", "Avocados"],
    avoid: ["Trans fats", "High-sodium foods", "Processed meats", "Sugary drinks", "Refined carbohydrates", "Fried foods"],
    hydration: ["Water", "Green tea", "Pomegranate juice"],
    mealPlan: { Morning: ["Oatmeal with berries and walnuts", "Green tea"], Afternoon: ["Grilled salmon", "Leafy green salad"], Evening: ["Handful of almonds"], Night: ["Quinoa with steamed vegetables", "Avocado"] },
    warning: "Chest pain can be a sign of a heart attack. If it's sudden, severe, or radiates to your arm, back, neck, or jaw, call emergency services immediately.",
    homeCare: ["Rest immediately", "Take prescribed medication if you have a known condition", "Stay calm and avoid exertion"]
  },
  "Back Pain": {
    recommended: ["Cherries", "Berries", "Fatty fish", "Olive oil", "Turmeric", "Ginger", "Green leafy vegetables"],
    avoid: ["Sugary foods", "Refined carbohydrates", "Processed meats", "Trans fats", "Excessive alcohol"],
    hydration: ["Water", "Anti-inflammatory teas (turmeric, ginger)", "Tart cherry juice"],
    mealPlan: { Morning: ["Smoothie with berries and spinach", "Ginger tea"], Afternoon: ["Grilled fish with olive oil", "Turmeric rice"], Evening: ["Tart cherry juice"], Night: ["Mixed salad with olive oil dressing", "Steamed vegetables"] },
    warning: "If back pain is accompanied by loss of bowel/bladder control, numbness in legs, or is the result of a severe fall, seek emergency care.",
    homeCare: ["Use a cold or warm compress", "Do gentle stretching exercises", "Maintain good posture"]
  },
  Migraine: {
    recommended: ["Spinach", "Swiss chard", "Almonds", "Avocados", "Fatty fish", "Flaxseeds", "Watermelon"],
    avoid: ["Aged cheeses", "Alcohol (especially red wine)", "Chocolate", "Cured meats", "Foods containing MSG", "Artificial sweeteners"],
    hydration: ["Water", "Peppermint tea", "Ginger tea", "Electrolyte-rich fluids"],
    mealPlan: { Morning: ["Oatmeal with flaxseeds", "Peppermint tea"], Afternoon: ["Spinach salad with avocado", "Baked salmon"], Evening: ["Ginger tea", "Handful of almonds"], Night: ["Quinoa", "Steamed Swiss chard"] },
    warning: "If migraine is accompanied by a stiff neck, fever, confusion, or weakness, seek immediate medical attention.",
    homeCare: ["Rest in a dark, quiet room", "Apply a cold compress to the forehead", "Stay hydrated"]
  }
};

const allSymptoms = Object.keys(mockData);

const SymptomChecker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [severity, setSeverity] = useState('Moderate');
  const [ageGroup, setAgeGroup] = useState('Adult');
  const [activeTab, setActiveTab] = useState('Recommended');

  const filteredSymptoms = allSymptoms.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectSymptom = (symptom) => {
    setSelectedSymptom(symptom);
    setActiveTab('Recommended');
    toast.success(`Food recommendations generated for ${symptom}`);
  };

  const activeData = selectedSymptom && mockData[selectedSymptom] ? mockData[selectedSymptom] : null;

  // Compute a slight text variation for severity
  const severityPrefix = severity === 'Mild' 
    ? "As symptoms are mild, maintaining this basic diet will help." 
    : severity === 'High' 
    ? "Due to high severity, please adhere strictly to these recommendations and prioritize medical advice." 
    : "Follow these standard dietary guidelines for moderate relief.";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Diet & Symptom Checker</h1>
        <p className="text-gray-500 text-sm mt-1">Get personalized food recommendations and meal plans based on your current symptoms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Selectors */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {['Child', 'Adult', 'Senior'].map(age => (
                    <button
                      key={age}
                      onClick={() => setAgeGroup(age)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${ageGroup === age ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {['Mild', 'Moderate', 'High'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${severity === sev ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Symptom</h2>
            <div className="relative mb-6">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search symptoms..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              
              {/* Autocomplete Dropdown */}
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredSymptoms.length > 0 ? (
                    filteredSymptoms.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => {
                          handleSelectSymptom(symptom);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-50 last:border-0"
                      >
                        {symptom}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No matching symptoms found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Buttons */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {['Fever', 'Cold', 'Cough', 'Headache', 'Stomach Pain'].map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => {
                      handleSelectSymptom(symptom);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSymptom === symptom ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Area - Recommendations */}
        <div className="lg:col-span-2">
          {!activeData ? (
            <div className="bg-white h-full p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Utensils className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Symptom Selected</h3>
              <p className="text-gray-500 max-w-md">Select a symptom from the left menu to view personalized dietary recommendations, foods to avoid, and a tailored meal plan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommendations for {selectedSymptom}</h2>
                  <p className="text-indigo-100 text-sm mb-2">{ageGroup} • {severity} Severity</p>
                  <p className="text-sm bg-white/10 inline-block px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">{severityPrefix}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hidden sm:block">
                  <HeartPulse className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                  {['Recommended', 'Avoid', 'Hydration', 'Meal Plan', 'Warning'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === 'Recommended' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                      {activeData.recommended.map((item, idx) => (
                        <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="text-emerald-900 font-medium text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Avoid' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                      {activeData.avoid.map((item, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                          <span className="text-red-900 font-medium text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Hydration' && (
                    <div className="space-y-4 animate-in fade-in">
                      {activeData.hydration.map((item, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Droplets className="w-5 h-5 text-blue-600 shrink-0" />
                          </div>
                          <span className="text-blue-900 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Meal Plan' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200/50">
                            <Coffee className="w-5 h-5 text-amber-600" />
                            <h4 className="font-bold text-amber-900">Morning</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Morning.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-amber-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-200/50">
                            <Sun className="w-5 h-5 text-orange-600" />
                            <h4 className="font-bold text-orange-900">Afternoon</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Afternoon.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-orange-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200/50">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-bold text-indigo-900">Evening</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Evening.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-indigo-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/50">
                            <Moon className="w-5 h-5 text-slate-600" />
                            <h4 className="font-bold text-slate-900">Night</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Night.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-slate-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    </div>
                  )}

                  {activeTab === 'Warning' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="bg-red-100 p-3 rounded-xl shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900 mb-2 text-lg">Doctor Advice & Warnings</h4>
                          <p className="text-red-800 leading-relaxed font-medium">{activeData.warning}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                          <Stethoscope className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-900 mb-3 text-lg">Home Care Tips</h4>
                          <ul className="space-y-2">
                            {activeData.homeCare.map((tip, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-emerald-800 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
