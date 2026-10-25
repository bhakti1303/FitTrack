export function calculateBMR({ gender, weight, height, age }) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return bmr * (factors[activityLevel] || 1.2);
}

export function getTargetCalories(tdee, goal) {
  if (goal === 'weight-loss') return tdee - 400;
  if (goal === 'weight-gain') return tdee + 400;
  return tdee;
}

export function getDayNumber(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / 86400000);
  return diffDays + 1;
}

const workoutWeeks = {
  'weight-loss': [
    { focus: 'Cardio Blast', type: 'Cardio', exercises: ['30 min brisk walk or jog', '3 rounds jumping jacks (1 min)', '10 min stretching'] },
    { focus: 'Full Body HIIT', type: 'Strength', exercises: ['Squats x15, Push-ups x10, Lunges x12 (3 rounds)', '10 min core work'] },
    { focus: 'Core & Stretch', type: 'Yoga', exercises: ['Plank 3x30 sec', 'Russian twists x20', '15 min yoga stretch'] },
    { focus: 'Cardio Blast', type: 'Cardio', exercises: ['25 min cycling or brisk walk', '2 rounds burpees x10', '10 min stretching'] },
    { focus: 'Full Body HIIT', type: 'Strength', exercises: ['Squats x15, Push-ups x10, Mountain climbers (3 rounds)', '10 min core work'] },
    { focus: 'Active Recovery (Yoga)', type: 'Yoga', exercises: ['20 min gentle yoga flow', 'Deep breathing 10 min'] },
    { focus: 'Rest Day', type: 'Rest', exercises: ['Complete rest or light 15 min walk', 'Focus on hydration and sleep'] },
  ],
  'weight-gain': [
    { focus: 'Push Day', type: 'Strength', exercises: ['Bench press 3x10', 'Shoulder press 3x10', 'Tricep dips 3x12'] },
    { focus: 'Pull Day', type: 'Strength', exercises: ['Rows 3x10', 'Lat pulldown 3x10', 'Bicep curls 3x12'] },
    { focus: 'Leg Day', type: 'Strength', exercises: ['Squats 4x10', 'Lunges 3x12', 'Calf raises 3x15'] },
    { focus: 'Rest Day', type: 'Rest', exercises: ['Light stretching', 'Extra protein & recovery focus'] },
    { focus: 'Push Day', type: 'Strength', exercises: ['Incline press 3x10', 'Lateral raises 3x12', 'Tricep pushdown 3x12'] },
    { focus: 'Pull Day', type: 'Strength', exercises: ['Deadlifts 3x8', 'Face pulls 3x12', 'Hammer curls 3x12'] },
    { focus: 'Leg Day', type: 'Strength', exercises: ['Leg press 3x10', 'Hamstring curls 3x12', 'Glute bridges 3x15'] },
  ],
  maintain: [
    { focus: 'Cardio', type: 'Cardio', exercises: ['20 min moderate jog or cycling', '10 min stretching'] },
    { focus: 'Strength', type: 'Strength', exercises: ['Full body circuit — squats, push-ups, rows (3 rounds)'] },
    { focus: 'Yoga & Mobility', type: 'Yoga', exercises: ['25 min yoga flow', 'Mobility drills 10 min'] },
    { focus: 'Cardio', type: 'Cardio', exercises: ['20 min swimming or brisk walk'] },
    { focus: 'Strength', type: 'Strength', exercises: ['Full body circuit — lunges, plank, rows (3 rounds)'] },
    { focus: 'Yoga & Mobility', type: 'Yoga', exercises: ['20 min yoga flow', 'Deep stretch 10 min'] },
    { focus: 'Rest Day', type: 'Rest', exercises: ['Light walk', 'Recovery focus'] },
  ],
};

const mealPools = {
  'weight-loss': {
    veg: { 
      breakfast: ['Oats (40g) with Whey Protein (1 scoop) & Almonds (30g P, 35g C, 10g F)', 'Moong Dal Chilla (2) with Mint Chutney (22g P, 40g C, 8g F)', 'Tofu Scramble (150g) with Spinach & 1 Multigrain Toast (25g P, 20g C, 12g F)'], 
      lunch: ['Grilled Paneer (150g) Salad with Olive Oil Dressing (28g P, 15g C, 22g F)', 'Quinoa (100g) Bowl with Roasted Chickpeas & Veggies (18g P, 45g C, 12g F)', 'Lentil Soup (1 bowl) + 1 Roti + Mixed Greens (15g P, 40g C, 5g F)'], 
      dinner: ['Stir-fried Vegetables with Tofu (150g) (22g P, 15g C, 14g F)', 'Vegetable Soup + Sautéed Paneer (100g) (20g P, 12g C, 15g F)', 'Palak Paneer (100g, less oil) + 1 Multigrain Roti (18g P, 25g C, 12g F)'] 
    },
    'non-veg': { 
      breakfast: ['3 Whole Eggs + 2 Egg Whites Scrambled with Spinach (25g P, 2g C, 15g F)', 'Protein Oatmeal (1 scoop whey) + Berries (30g P, 35g C, 5g F)', 'Grilled Chicken (100g) on Whole Wheat Toast (30g P, 25g C, 8g F)'], 
      lunch: ['Grilled Chicken Breast (150g) + Quinoa (100g) + Asparagus (45g P, 30g C, 8g F)', 'Baked Salmon (120g) with Steamed Broccoli (28g P, 10g C, 18g F)', 'Tuna Salad with Greek Yogurt Dressing (35g P, 10g C, 12g F)'], 
      dinner: ['Baked White Fish (150g) + Steamed Veggies (35g P, 10g C, 5g F)', 'Grilled Chicken (150g) Zucchini Noodles (40g P, 15g C, 10g F)', 'Turkey Meatballs with Tomato Sauce & Greens (30g P, 15g C, 14g F)'] 
    },
    vegan: { 
      breakfast: ['Tofu Scramble (150g) + 1/2 Avocado (20g P, 15g C, 22g F)', 'Vegan Protein Smoothie Bowl with Chia Seeds (25g P, 35g C, 12g F)', 'Overnight Oats with Hemp Seeds & Almond Milk (15g P, 40g C, 15g F)'], 
      lunch: ['Tempeh (100g) Stir-fry with Brown Rice (50g) (22g P, 45g C, 12g F)', 'Chickpea Salad Bowl with Tahini Dressing (18g P, 40g C, 16g F)', 'Lentil & Quinoa Bowl with Roasted Veggies (20g P, 50g C, 10g F)'], 
      dinner: ['Zucchini Noodles with Walnut Pesto & Tofu (20g P, 20g C, 18g F)', 'Roasted Cauliflower Steak with Hummus (12g P, 25g C, 15g F)', 'Vegan Chili (Beans & Soy Granules) (25g P, 35g C, 8g F)'] 
    },
  },
  'weight-gain': {
    veg: { 
      breakfast: ['Paneer Paratha (2) with Thick Curd (1 bowl) (25g P, 60g C, 20g F)', 'Mass Gainer Shake: Oats, Peanut Butter, Banana, Milk (30g P, 80g C, 25g F)', 'Besan Cheela (3) with Paneer Stuffing (28g P, 50g C, 18g F)'], 
      lunch: ['Rajma (1 large bowl) + Rice (1.5 cups) + Ghee (1 tbsp) (22g P, 85g C, 20g F)', 'Soya Chunk Curry (150g) + 3 Rotis + Curd (35g P, 70g C, 15g F)', 'Paneer Butter Masala (150g) + 2 Parathas (30g P, 55g C, 35g F)'], 
      dinner: ['Dal Makhani (1 bowl) + 1.5 cups Brown Rice (20g P, 80g C, 15g F)', 'Mixed Veg Curry + Tofu (100g) + 3 Rotis (25g P, 60g C, 18g F)', 'Paneer Bhurji (150g) + 3 Multigrain Rotis (32g P, 55g C, 25g F)'] 
    },
    'non-veg': { 
      breakfast: ['4 Whole Eggs + 2 Slices Whole Wheat Bread + Avocado (30g P, 40g C, 25g F)', 'Chicken Sausage (100g) + Oats (60g) (35g P, 45g C, 20g F)', 'Mass Gainer Shake with Whey, Banana, Peanut Butter (40g P, 75g C, 20g F)'], 
      lunch: ['Chicken Breast (200g) + White Rice (1.5 cups) + Olive Oil (55g P, 80g C, 15g F)', 'Mutton Curry (150g) + 1.5 cups Rice (45g P, 60g C, 25g F)', 'Salmon (150g) + Sweet Potato (200g) (35g P, 50g C, 22g F)'], 
      dinner: ['Minced Beef/Lamb (150g) + Pasta (1 cup) (45g P, 70g C, 25g F)', 'Chicken Thighs (200g) + Mashed Potato (50g P, 60g C, 25g F)', 'Grilled Chicken (200g) + 3 Rotis + Ghee (55g P, 50g C, 20g F)'] 
    },
    vegan: { 
      breakfast: ['High Calorie Smoothie: Soy Milk, Oats, Peanut Butter, Banana (25g P, 80g C, 25g F)', 'Tofu Scramble (200g) + 2 Slices Toast + Avocado (30g P, 45g C, 25g F)', 'Large Bowl Oats with Assorted Nuts & Seeds (20g P, 70g C, 25g F)'], 
      lunch: ['Tofu (200g) Stir-fry with Thick Peanut Sauce + Rice (35g P, 80g C, 30g F)', 'Large Bowl Chickpea Curry + 1.5 cups Rice (25g P, 90g C, 15g F)', 'Soya Chunk (100g dry) Curry + Rice (55g P, 70g C, 10g F)'], 
      dinner: ['Lentil Curry (1.5 bowls) + Rice + Olive Oil (25g P, 85g C, 20g F)', 'Seitan (150g) Stir-fry with Noodles (45g P, 75g C, 15g F)', 'Tempeh (150g) + Quinoa (1 cup) + Avocado (35g P, 55g C, 25g F)'] 
    },
  },
  maintain: {
    veg: { 
      breakfast: ['Vegetable Poha (1 bowl) + 1 Scoop Whey (28g P, 45g C, 10g F)', 'Greek Yogurt (150g) with Granola & Berries (20g P, 40g C, 8g F)', 'Idli (3) with Sambar & Protein Shake (30g P, 50g C, 5g F)'], 
      lunch: ['Dal (1 bowl) + Sabzi + 2 Rotis + Side Salad (18g P, 60g C, 12g F)', 'Vegetable Pulao + Raita (1 bowl) (15g P, 65g C, 15g F)', 'Paneer (100g) Salad with Quinoa (22g P, 40g C, 18g F)'], 
      dinner: ['Mixed Veg Curry + 2 Rotis (12g P, 45g C, 10g F)', 'Khichdi (1.5 cups) + Salad (15g P, 60g C, 8g F)', 'Light Paneer Sabzi (100g) + 2 Rotis (20g P, 40g C, 15g F)'] 
    },
    'non-veg': { 
      breakfast: ['2 Whole Eggs + 2 Whites on Toast (22g P, 30g C, 12g F)', 'Chicken Sandwich (Whole Wheat) (30g P, 35g C, 10g F)', 'Protein Oats (1 scoop) + Banana (28g P, 45g C, 5g F)'], 
      lunch: ['Grilled Chicken (150g) + 1 cup Rice + Salad (45g P, 50g C, 10g F)', 'Fish Curry (150g) + 1 cup Rice (35g P, 45g C, 15g F)', 'Egg Curry (2 eggs) + 2 Rotis (18g P, 40g C, 15g F)'], 
      dinner: ['Grilled Chicken (120g) + Steamed Veggies (35g P, 15g C, 8g F)', 'Clear Chicken Soup + Mixed Salad (25g P, 10g C, 5g F)', 'Grilled Fish (120g) + Sweet Potato (100g) (30g P, 25g C, 10g F)'] 
    },
    vegan: { 
      breakfast: ['Oats with Fruits & Chia Seeds (15g P, 50g C, 10g F)', 'Vegan Protein Shake + 1 Apple (25g P, 30g C, 5g F)', 'Tofu Scramble (100g) + 1 Toast (15g P, 20g C, 12g F)'], 
      lunch: ['Lentil Curry (1 bowl) + 1 cup Rice (18g P, 60g C, 5g F)', 'Chickpea Salad Bowl with Lemon Dressing (15g P, 45g C, 12g F)', 'Tofu (100g) & Veggie Stir-fry + Quinoa (20g P, 45g C, 15g F)'], 
      dinner: ['Vegetable Stir-fry with Edamame (15g P, 25g C, 10g F)', 'Light Lentil Soup + Salad (12g P, 30g C, 5g F)', 'Mixed Veg Curry + 1 cup Rice (10g P, 50g C, 8g F)'] 
    },
  },
};

const extraMeals = {
  veg: {
    earlyMorning: ['Warm water with Apple Cider Vinegar', 'Black Coffee / Green Tea', 'Soaked Almonds (5) & Walnuts (2)'],
    midMorningSnack: ['1 Apple / Banana', 'Greek Yogurt (100g)', 'Roasted Chana (30g)'],
    eveningSnack: ['Green Tea + Roasted Makhana (20g)', 'Protein Shake (1 scoop)', 'Sprouts Salad (1 bowl)'],
    beforeBed: ['Warm Turmeric Milk (no sugar)', 'Casein Protein / Cottage Cheese (50g)', 'Chamomile Tea'],
  },
  'non-veg': {
    earlyMorning: ['Black Coffee (Pre-workout)', 'Warm water with lemon', 'Soaked Almonds (5)'],
    midMorningSnack: ['2 Hard Boiled Eggs', 'Protein Shake (1 scoop)', 'Handful of Mixed Nuts (30g)'],
    eveningSnack: ['Grilled Chicken Tikka (100g)', '3 Boiled Egg Whites', 'Greek Yogurt (100g)'],
    beforeBed: ['Casein Protein Shake', 'Warm Milk', 'Chamomile Tea'],
  },
  vegan: {
    earlyMorning: ['Black Coffee / Green Tea', 'Warm water with lemon', 'Soaked Almonds (5)'],
    midMorningSnack: ['1 Apple + Peanut Butter (1 tbsp)', 'Vegan Protein Shake', 'Roasted Chana (30g)'],
    eveningSnack: ['Edamame (1 cup)', 'Roasted Makhana (20g)', 'Sprouts Salad (1 bowl)'],
    beforeBed: ['Turmeric Almond Milk', 'Vegan Protein Shake (half scoop)', 'Chamomile Tea'],
  },
};

function getExtraMeal(dietPref, slot, dayIndex) {
  const pool = (extraMeals[dietPref] || extraMeals.veg)[slot];
  return pool[dayIndex % pool.length];
}

export function getWeeklyWorkoutPlan(goal) {
  return workoutWeeks[goal] || workoutWeeks.maintain;
}

function getWeeklyDietPlan(goal, dietPref) {
  const pools = (mealPools[goal] || mealPools.maintain)[dietPref] || mealPools.maintain.veg;
  return Array.from({ length: 7 }, (_, i) => ({
    breakfast: pools.breakfast[i % pools.breakfast.length],
    lunch: pools.lunch[(i + 1) % pools.lunch.length],
    dinner: pools.dinner[(i + 2) % pools.dinner.length],
  }));
}

// Poore din ka time-wise diet plan - 7 slots
export function getFullDayPlan(goal, dietPref, dayIndex) {
  const dietWeek = getWeeklyDietPlan(goal, dietPref);
  const day = dietWeek[dayIndex];
  return [
    { time: '6:00 - 7:00 AM', label: 'Early Morning', icon: 'bi-sunrise-fill', food: getExtraMeal(dietPref, 'earlyMorning', dayIndex), color: '#00E5FF' },
    { time: '7:30 - 8:30 AM', label: 'Breakfast', icon: 'bi-egg-fried', food: day.breakfast, color: '#B300FF' },
    { time: '10:30 - 11:00 AM', label: 'Mid-Morning Snack', icon: 'bi-apple', food: getExtraMeal(dietPref, 'midMorningSnack', dayIndex), color: '#00B3CC' },
    { time: '1:00 - 2:00 PM', label: 'Lunch', icon: 'bi-basket2-fill', food: day.lunch, color: '#B300FF' },
    { time: '4:30 - 5:00 PM', label: 'Evening Snack', icon: 'bi-cup-hot-fill', food: getExtraMeal(dietPref, 'eveningSnack', dayIndex), color: '#00E5FF' },
    { time: '7:30 - 8:30 PM', label: 'Dinner', icon: 'bi-moon-stars-fill', food: day.dinner, color: '#B300FF' },
    { time: '9:30 - 10:00 PM', label: 'Before Bed', icon: 'bi-cup-straw', food: getExtraMeal(dietPref, 'beforeBed', dayIndex), color: '#00B3CC' },
  ];
}