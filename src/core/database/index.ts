import * as SQLite from 'expo-sqlite';
import { createTablesSQL, seedDataSQL, SCHEMA_VERSION } from './schema';
import { User, CreateUserInput } from './types';

const DB_NAME = 'trynerapp.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database
 */
export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);

    console.log('Database opened successfully');

    // Create tables
    await db.execAsync(createTablesSQL);
    console.log('Tables created successfully');

    // Seed initial data
    await db.execAsync(seedDataSQL);
    console.log('Initial data seeded successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Get the database instance
 */
const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Hash password (simple implementation for MVP - in production use bcrypt or similar)
 */
const hashPassword = (password: string): string => {
  // TODO: Implement proper password hashing in production
  // For MVP, we'll use a simple hash (NOT SECURE FOR PRODUCTION)
  return btoa(password);
};

/**
 * Verify password
 */
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// ============= USER OPERATIONS =============

/**
 * Create a new user
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  const database = getDb();
  const now = Date.now();

  const user: User = {
    id: generateId(),
    name: input.name,
    email: input.email.toLowerCase(),
    password: hashPassword(input.password),
    age: input.age,
    weight: input.weight,
    height: input.height,
    fitness_level: input.fitness_level,
    goal: input.goal,
    created_at: now,
    updated_at: now,
  };

  try {
    await database.runAsync(
      `INSERT INTO users (id, name, email, password, age, weight, height, fitness_level, goal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.password,
        user.age || null,
        user.weight || null,
        user.height || null,
        user.fitness_level || null,
        user.goal || null,
        user.created_at,
        user.updated_at,
      ]
    );

    console.log('User created successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const database = getDb();

  try {
    const result = await database.getFirstAsync<User>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    return result || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  const database = getDb();

  try {
    const result = await database.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return result || null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw error;
  }
};

/**
 * Login user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'password' | 'created_at'>>
): Promise<void> => {
  const database = getDb();
  const now = Date.now();

  try {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await database.runAsync(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('User updated successfully:', id);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Check if email exists
 */
export const emailExists = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);
  return user !== null;
};

// ============= EXERCISE OPERATIONS =============

/**
 * Get all exercises
 */
export const getAllExercises = async () => {
  const database = getDb();

  try {
    const exercises = await database.getAllAsync(
      'SELECT * FROM exercises ORDER BY name ASC'
    );

    return exercises;
  } catch (error) {
    console.error('Error getting exercises:', error);
    throw error;
  }
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (id: string) => {
  const database = getDb();

  try {
    const exercise = await database.getFirstAsync(
      'SELECT * FROM exercises WHERE id = ?',
      [id]
    );

    return exercise;
  } catch (error) {
    console.error('Error getting exercise:', error);
    throw error;
  }
};

// Export database for direct access if needed
export { db };
