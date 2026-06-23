export interface FoodItem {
  id: string; // unique frontend id
  food_name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  loggedAt?: string; // ISO string
}

export interface UserDailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal?: "lose" | "maintain" | "gain" | "track";
  waterGoal?: number;
  isCompleted: boolean;
}

export interface DailyLogGroup {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
}
