export const insertInitialData = async (db) => {
  try {
    await db.executeSql(`INSERT INTO workouts (type, duration, date) VALUES (?, ?, ?)`, ["Running", 30, "2022-01-01"]);
    console.info("Initial data inserted");
  } catch (error) {
    console.error(error);
  }
};
