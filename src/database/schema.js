/**
 * Creates database tables for a workout app.
 * @param {SQLite.SQLiteDatabase} db - The database instance.
 */
export const createTables = async (db) => {
  const queries = [
    // Users
    `CREATE TABLE IF NOT EXISTS Users (
      UserId INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Email TEXT UNIQUE NOT NULL,
      PasswordHash TEXT NOT NULL,
      CreatedAt TEXT NOT NULL,
      FitnessLevel TEXT CHECK(FitnessLevel IN ('beginner', 'intermediate', 'advanced')),
      Goals TEXT
    );`,

    // Exercises
    `CREATE TABLE IF NOT EXISTS Exercises (
      ExerciseId INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Type TEXT CHECK(Type IN ('cardio', 'strength')),
      TargetedBodyParts TEXT CHECK(TargetedBodyParts IN ('Abs', 'Back', 'Biceps', 'Calves', 'Chest', 'Core', 'Glutes', 'Hamstrings', 'Legs', 'Shoulders', 'Triceps', 'Quads')),
      Instructions TEXT,
      VideoUrl TEXT,
      GifUrl TEXT
    );`,

    // Set Details
    `CREATE TABLE IF NOT EXISTS SetDetails (
      SetDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
      MinReps INTEGER,
      MaxReps INTEGER,
      Weight INTEGER,
      AMRAP BOOLEAN,
      Paused BOOLEAN,
      Fast BOOLEAN,
      Forced BOOLEAN,
      Dropset BOOLEAN
    );`,

    // Exercise Details
    `CREATE TABLE IF NOT EXISTS ExerciseDetails (
      ExerciseDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
      ExerciseId INTEGER,
      \`Order\` INTEGER,
      SetDetails INTEGER,
      FOREIGN KEY (ExerciseId) REFERENCES Exercises (ExerciseId) ON DELETE CASCADE,
      FOREIGN KEY (SetDetails) REFERENCES SetDetails (SetDetailId) ON DELETE CASCADE
    );`,

    // Workouts
    `CREATE TABLE IF NOT EXISTS Workouts (
      WorkoutId INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER,
      Name TEXT NOT NULL,
      FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
    );`,

    // Workout Plans
    `CREATE TABLE IF NOT EXISTS WorkoutPlans (
      WorkoutPlanId INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER,
      Name TEXT NOT NULL,
      Description TEXT,
      FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
    );`,

    // Completed Exercises
    `CREATE TABLE IF NOT EXISTS CompletedExercises (
      CompletedExerciseId INTEGER PRIMARY KEY AUTOINCREMENT,
      ExerciseId INTEGER,
      \`Order\` INTEGER,
      FOREIGN KEY (ExerciseId) REFERENCES Exercises (ExerciseId) ON DELETE CASCADE
    );`,

    // Workout Sessions
    `CREATE TABLE IF NOT EXISTS WorkoutSessions (
      WorkoutSessionId INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER,
      WorkoutPlanId INTEGER,
      WorkoutId INTEGER,
      FOREIGN KEY (UserId) REFERENCES Users (UserId),
      FOREIGN KEY (WorkoutPlanId) REFERENCES WorkoutPlans (WorkoutPlanId),
      FOREIGN KEY (WorkoutId) REFERENCES Workouts (WorkoutId)
    );`
  ];

  try {
    for (const query of queries) {
      await db.executeSql(query);
    }
    console.info("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};
