import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = "WorkoutApp.db";
const database_version = "1.0";
const database_displayname = "SQLite Workout App Database";
const database_size = 200000;

export const db = async () => {
  try {
    const dbConnection = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );

    // Enable foreign key constraints
    await dbConnection.executeSql('PRAGMA foreign_keys = ON;');
    console.info("Foreign key enforcement is enabled.");

    return dbConnection;
  } catch (error) {
    console.error("Database opening error:", error);
  }
};
