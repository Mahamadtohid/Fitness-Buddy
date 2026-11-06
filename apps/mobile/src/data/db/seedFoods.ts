/**
 * Static food catalog (PRD §3.4 "~150 common Indian home foods and gym staples"). Shipped as
 * bundled data and inserted once at first boot (see db/client.ts) — this never syncs, the ids are
 * fixed forever so they're safe to reference from saved meals/food entries across app versions.
 * Values are reasonable estimates, not lab-measured — PRD §12 flags this as a known risk and
 * expects per-user `food_override` edits to calibrate them over time.
 */
export type SeedFood = {
  id: string;
  name: string;
  servingUnit: string;
  servingG: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

function fixedId(n: number): string {
  return `20000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

type RawFood = [name: string, servingUnit: string, servingG: number, kcal: number, proteinG: number, carbG: number, fatG: number];

const RAW: RawFood[] = [
  // Grains & staples
  ['Roti (whole wheat)', '1 roti', 40, 120, 3, 18, 3.5],
  ['Phulka (thin roti)', '1 piece', 30, 80, 2.5, 15, 1],
  ['White Rice (cooked)', '1 katori', 150, 195, 4, 43, 0.5],
  ['Brown Rice (cooked)', '1 katori', 150, 170, 4, 36, 1.5],
  ['Jeera Rice', '1 katori', 150, 220, 4, 40, 5],
  ['Plain Paratha', '1 piece', 60, 210, 4, 27, 9],
  ['Aloo Paratha', '1 piece', 100, 260, 6, 36, 10],
  ['Naan', '1 piece', 90, 260, 7, 45, 5],
  ['Puri', '1 piece', 30, 100, 2, 12, 5],
  ['Bhakri (jowar)', '1 piece', 50, 150, 3.5, 28, 2.5],
  ['Idli', '1 piece', 40, 60, 2, 12, 0.3],
  ['Dosa (plain)', '1 piece', 80, 140, 3, 22, 4],
  ['Upma', '1 katori', 150, 220, 5, 35, 6],
  ['Poha', '1 katori', 150, 210, 4, 35, 6],
  ['Vermicelli Upma (semiya)', '1 katori', 150, 200, 4, 33, 5],

  // Dals & legumes
  ['Dal Tadka', '1 katori', 150, 150, 9, 20, 4],
  ['Dal Fry', '1 katori', 150, 170, 9, 20, 6],
  ['Moong Dal (plain boiled)', '1 katori', 150, 105, 7, 18, 0.5],
  ['Chana Dal', '1 katori', 150, 160, 9, 25, 3],
  ['Rajma (kidney bean curry)', '1 katori', 150, 180, 9, 25, 5],
  ['Chole (chickpea curry)', '1 katori', 150, 200, 9, 27, 7],
  ['Boiled Chickpeas (plain)', '1 katori', 150, 180, 10, 30, 3],
  ['Sprouts Salad', '1 katori', 100, 90, 7, 14, 1],
  ['Sambar', '1 katori', 150, 120, 6, 18, 3],
  ['Lobia (black-eyed pea curry)', '1 katori', 150, 170, 9, 24, 5],
  ['Toor Dal (plain)', '1 katori', 150, 110, 7, 19, 0.5],
  ['Masoor Dal', '1 katori', 150, 115, 8, 19, 0.5],

  // Vegetables / sabzi
  ['Aloo Sabzi (dry)', '1 katori', 120, 150, 3, 20, 7],
  ['Aloo Gobi', '1 katori', 120, 140, 3, 16, 7],
  ['Bhindi Masala', '1 katori', 120, 120, 2.5, 12, 7],
  ['Mixed Veg Curry', '1 katori', 120, 130, 3, 14, 7],
  ['Palak Sabzi (dry)', '1 katori', 120, 90, 3, 8, 5],
  ['Baingan Bharta', '1 katori', 120, 120, 2, 11, 8],
  ['Lauki Sabzi', '1 katori', 120, 80, 1.5, 9, 4],
  ['Cabbage Sabzi', '1 katori', 120, 90, 2, 10, 5],
  ['Gobi Matar', '1 katori', 120, 110, 3, 12, 6],
  ['Tinda Sabzi', '1 katori', 120, 85, 2, 9, 4.5],
  ['Karela Sabzi', '1 katori', 120, 95, 2, 9, 5.5],
  ['Bhindi Fry (less oil)', '1 katori', 120, 95, 2.5, 10, 5],
  ['Steamed Mixed Vegetables', '1 katori', 120, 60, 2.5, 10, 0.5],
  ['Salad (cucumber/tomato/onion)', '1 bowl', 150, 45, 2, 9, 0.5],
  ['Raita (plain)', '1 katori', 100, 70, 3, 6, 3.5],

  // Paneer & dairy
  ['Paneer (raw)', '100 g', 100, 260, 18, 3, 20],
  ['Paneer Bhurji', '1 katori', 120, 280, 16, 6, 21],
  ['Paneer Butter Masala', '1 katori', 150, 350, 14, 12, 27],
  ['Palak Paneer', '1 katori', 150, 300, 14, 10, 23],
  ['Curd (plain)', '1 katori', 150, 90, 5, 7, 4],
  ['Greek Yogurt (plain)', '100 g', 100, 60, 10, 4, 0.5],
  ['Milk (full fat)', '1 glass', 250, 150, 8, 12, 8],
  ['Milk (toned/low fat)', '1 glass', 250, 110, 8, 12, 3],
  ['Buttermilk (chaas)', '1 glass', 250, 60, 3, 5, 2.5],
  ['Cheese Slice', '1 slice', 20, 65, 4, 1, 5],
  ['Butter', '1 tsp', 5, 36, 0, 0, 4],
  ['Ghee', '1 tsp', 5, 45, 0, 0, 5],
  ['Lassi (sweet)', '1 glass', 250, 200, 6, 30, 6],

  // Eggs & non-veg
  ['Boiled Egg', '1 piece', 50, 70, 6, 0.5, 5],
  ['Egg White (boiled)', '1 piece', 33, 17, 3.5, 0.2, 0],
  ['Egg Bhurji', '2 eggs', 120, 220, 13, 4, 17],
  ['Omelette (2 egg)', '1 serving', 140, 240, 14, 2, 19],
  ['Chicken Breast (grilled, plain)', '100 g', 100, 165, 31, 0, 3.5],
  ['Chicken Curry', '1 katori (2 pieces)', 200, 320, 25, 10, 20],
  ['Butter Chicken', '1 katori', 200, 440, 24, 12, 32],
  ['Tandoori Chicken (2 pieces)', '1 serving', 200, 340, 40, 4, 17],
  ['Chicken Tikka', '1 serving (6 pieces)', 150, 280, 32, 5, 14],
  ['Fish Curry', '1 katori', 200, 260, 22, 8, 15],
  ['Grilled Fish (plain)', '100 g', 100, 140, 25, 0, 4],
  ['Mutton Curry', '1 katori', 200, 400, 26, 8, 28],
  ['Keema (minced meat curry)', '1 katori', 150, 330, 20, 6, 24],
  ['Prawns Curry', '1 katori', 150, 220, 20, 7, 12],

  // Breakfast
  ['Oats (cooked, water)', '1 bowl', 250, 150, 5, 27, 3],
  ['Oats with Milk', '1 bowl', 250, 220, 9, 30, 7],
  ['Masala Oats', '1 bowl', 200, 180, 6, 28, 5],
  ['Cornflakes with Milk', '1 bowl', 200, 200, 7, 34, 4],
  ['Muesli with Milk', '1 bowl', 200, 260, 9, 40, 7],
  ['Bread Slice (white)', '1 slice', 30, 80, 2.5, 15, 1],
  ['Bread Slice (brown/whole wheat)', '1 slice', 30, 75, 3, 13, 1],
  ['Peanut Butter', '1 tbsp', 16, 95, 4, 3, 8],
  ['Jam', '1 tbsp', 20, 50, 0, 13, 0],
  ['Besan Chilla', '1 piece', 80, 130, 6, 15, 5],
  ['Vegetable Sandwich (2 slices)', '1 serving', 150, 220, 7, 32, 7],

  // Snacks
  ['Samosa', '1 piece', 60, 260, 4, 24, 17],
  ['Kachori', '1 piece', 60, 230, 4, 22, 14],
  ['Pakora (mixed veg)', '1 serving (4-5 pieces)', 80, 220, 4, 20, 14],
  ['Dhokla', '2 pieces', 80, 130, 5, 18, 4],
  ['Khakhra', '1 piece', 15, 60, 1.5, 9, 2],
  ['Masala Papad (roasted)', '1 piece', 20, 70, 2, 10, 2.5],
  ['Bhel Puri', '1 bowl', 150, 250, 5, 40, 8],
  ['Sev / Namkeen Mix', '1 small bowl', 30, 160, 3, 14, 10],
  ['Roasted Chana (namkeen)', '1 small bowl', 40, 150, 9, 22, 3],
  ['Makhana (roasted fox nuts)', '1 small bowl', 30, 105, 3, 18, 2],
  ['Popcorn (plain, air-popped)', '1 bowl', 25, 95, 3, 19, 1],
  ['Banana Chips', '1 small bowl', 30, 160, 1, 18, 10],
  ['Chips (potato)', '1 small packet', 30, 165, 2, 15, 11],
  ['Vada Pav', '1 piece', 120, 290, 6, 40, 12],
  ['Pav Bhaji (1 pav + bhaji)', '1 serving', 250, 400, 9, 50, 18],

  // Sweets
  ['Gulab Jamun', '1 piece', 40, 150, 2, 20, 7],
  ['Rasgulla', '1 piece', 40, 105, 2.5, 20, 1.5],
  ['Jalebi', '1 piece', 25, 105, 1, 17, 4],
  ['Barfi (milk)', '1 piece', 30, 130, 3, 15, 7],
  ['Kheer', '1 katori', 150, 220, 6, 30, 8],
  ['Halwa (suji)', '1 katori', 100, 260, 3, 35, 12],
  ['Ladoo (besan)', '1 piece', 30, 140, 3, 16, 7],
  ['Ice Cream (vanilla)', '1 scoop', 60, 110, 2, 14, 5],
  ['Dark Chocolate (70%)', '2 squares', 20, 110, 1.5, 9, 8],
  ['Biscuits (marie, 4 pieces)', '1 serving', 28, 120, 2, 20, 3.5],

  // Fruits
  ['Banana', '1 medium', 120, 105, 1.3, 27, 0.3],
  ['Apple', '1 medium', 180, 95, 0.5, 25, 0.3],
  ['Mango', '1 medium', 200, 150, 1.5, 38, 0.5],
  ['Papaya', '1 cup chopped', 150, 60, 1, 15, 0.2],
  ['Orange', '1 medium', 150, 70, 1.5, 17, 0.2],
  ['Watermelon', '1 cup chopped', 150, 45, 1, 11, 0.2],
  ['Grapes', '1 cup', 150, 100, 1, 26, 0.3],
  ['Pomegranate', '1 cup seeds', 150, 120, 2, 27, 1.5],
  ['Guava', '1 medium', 150, 75, 3, 16, 1],
  ['Pineapple', '1 cup chopped', 150, 75, 0.8, 20, 0.2],
  ['Dates (dry)', '3 pieces', 25, 70, 0.6, 18, 0.1],
  ['Mixed Fruit Bowl', '1 bowl', 200, 110, 1.5, 27, 0.5],

  // Nuts & seeds
  ['Almonds', '10 pieces', 12, 70, 2.5, 2.5, 6],
  ['Walnuts', '4 halves', 16, 105, 2.5, 2, 10],
  ['Cashews', '10 pieces', 15, 85, 2.5, 4.5, 7],
  ['Peanuts (roasted)', '1 small bowl', 30, 170, 7, 5, 14],
  ['Pistachios', '20 pieces', 15, 85, 3, 4, 7],
  ['Mixed Dry Fruits & Nuts', '1 small bowl', 30, 180, 5, 10, 14],
  ['Chia Seeds', '1 tbsp', 12, 58, 2, 5, 3.5],
  ['Flax Seeds (roasted)', '1 tbsp', 10, 55, 2, 3, 4],

  // Beverages
  ['Tea (with milk & sugar)', '1 cup', 150, 60, 1.5, 9, 2],
  ['Black Coffee', '1 cup', 150, 5, 0.3, 1, 0],
  ['Coffee with Milk & Sugar', '1 cup', 150, 70, 2, 10, 2.5],
  ['Fresh Lime Water (sweetened)', '1 glass', 250, 95, 0, 24, 0],
  ['Coconut Water', '1 glass', 250, 45, 0.5, 9, 0.2],
  ['Fruit Juice (packaged)', '1 glass', 200, 110, 0.5, 27, 0],
  ['Soft Drink (cola)', '1 glass', 250, 105, 0, 27, 0],
  ['Protein Shake (water)', '1 scoop', 33, 120, 24, 3, 1.5],

  // Gym staples / supplements
  ['Whey Protein (with milk)', '1 scoop + milk', 283, 270, 32, 15, 9],
  ['Whey Protein (with water)', '1 scoop', 33, 120, 24, 3, 1.5],
  ['Casein Protein (water)', '1 scoop', 33, 120, 24, 3, 1],
  ['Mass Gainer (with milk)', '1 scoop + milk', 400, 750, 35, 110, 15],
  ['Creatine Monohydrate', '1 scoop', 5, 0, 0, 0, 0],
  ['BCAA (water)', '1 scoop', 10, 10, 2, 0, 0],
  ['Peanut Butter Protein Bar', '1 bar', 60, 220, 20, 22, 7],
  ['Boiled Egg Whites (4)', '4 pieces', 132, 68, 14, 1, 0],
  ['Chicken Breast Meal Prep', '1 serving', 150, 248, 46, 0, 5],
  ['Cottage Cheese (low fat)', '100 g', 100, 98, 11, 3, 4],

  // Eating out basics
  ['Veg Biryani', '1 plate', 300, 450, 9, 65, 16],
  ['Chicken Biryani', '1 plate', 350, 600, 28, 65, 24],
  ['Butter Naan + Dal Makhani', '1 serving', 350, 650, 18, 55, 38],
  ['Masala Dosa', '1 piece', 150, 300, 6, 45, 11],
  ['Veg Fried Rice', '1 plate', 300, 430, 8, 65, 14],
  ['Chicken Noodles (Hakka)', '1 plate', 300, 480, 20, 60, 16],
  ['Paneer Tikka (restaurant)', '1 serving (6 pieces)', 180, 320, 18, 10, 23],
  ['Margherita Pizza (2 slices)', '1 serving', 160, 420, 16, 48, 18],
  ['Veg Burger', '1 piece', 180, 400, 10, 48, 18],
  ['Masala Chaas (restaurant)', '1 glass', 250, 70, 3, 7, 3],
];

export const SEED_FOODS: SeedFood[] = RAW.map(([name, servingUnit, servingG, kcal, proteinG, carbG, fatG], i) => ({
  id: fixedId(i + 1),
  name,
  servingUnit,
  servingG,
  kcal,
  proteinG,
  carbG,
  fatG,
}));
