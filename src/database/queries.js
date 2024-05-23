import { db } from './db';
import { format } from 'date-fns';

////////////////////////////////////////
/////////// HELPER FUNCTIONS ///////////
////////////////////////////////////////

/**
 * Executes multiple SQL statements as a single transaction.
 * @param {Array<{query: string, params: Array<any>}>} statements - Array of SQL statement objects.
 * @returns {Promise<void>}
 */
export const executeTransaction = async (statements) => {
   console.info("executeTransaction()");
   const dbConnection = await db();
   try {
      await dbConnection.transaction(async (tx) => {
         for (const { query, params } of statements) {
            try {
               await tx.executeSql(query, params);
               console.info(`Executed query: ${query}, with params: ${params}`);
            } catch (sqlError) {
               console.error(`SQL Error executing query: ${query}, with params: ${params}`, sqlError);
               throw sqlError; // Re-throw to trigger transaction rollback
            }
         }
      });
      console.info("Transaction successfully committed.");
   } catch (error) {
      console.error("Transaction failed, rolling back:", error);
      throw error; // Propagate the error for further handling if necessary
   }
};

/**
 * Fetches data from a table based on a foreign key value.
 * @param {string} tableName - The name of the table to fetch data from.
 * @param {string} foreignKey - The foreign key column name in the table.
 * @param {any} value - The value of the foreign key to match.
 * @returns {Promise<Array<Object>>} - Array of rows matching the foreign key value.
 */
export const getDataByForeignKey = async (tableName, foreignKey, value) => {
   console.info("getDataByForeignKey()");
   const dbConnection = await db();
   try {
      const [results] = await dbConnection.executeSql(
         `SELECT * FROM ${tableName} WHERE ${foreignKey} = ?;`,
         [value]
      );
      console.info(`Fetched data from ${tableName} where ${foreignKey} = ${value}`);
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error(`Failed to get data from ${tableName} where ${foreignKey} = ${value}:`, error);
      throw error;
   }
};

/**
* Inserts multiple rows into a table in a single operation.
* @param {string} tableName - The name of the table to insert data into.
* @param {Array<string>} columns - An array of column names to be populated.
* @param {Array<Array<any>>} values - An array of value arrays, where each inner array corresponds to a row of data to insert.
* @returns {Promise<void>}
*/
export const bulkInsert = async (tableName, columns, values) => {
   console.info("bulkInsert()");
   const dbConnection = await db();
   const placeholders = columns.map(() => '?').join(', ');
   const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders});`;
   try {
      await dbConnection.transaction(async (tx) => {
         for (const valueSet of values) {
            try {
               await tx.executeSql(query, valueSet);
               console.info(`Inserted row into ${tableName}: ${valueSet}`);
            } catch (sqlError) {
               console.error(`SQL Error inserting row into ${tableName}: ${valueSet}`, sqlError);
               throw sqlError; // Re-throw to trigger transaction rollback
            }
         }
      });
      console.info("Bulk insert successfully completed.");
   } catch (error) {
      console.error("Bulk insert failed:", error);
      throw error; // Propagate the error for further handling if necessary
   }
};


///////////////////////////////////////
//////// TABLE QUERY FUNCTIONS ////////
///////////////////////////////////////

///////////// USERS TABLE /////////////

/**
 * Creates a new user in the Users table
 * @param {Object} user - The user object to create
 * @param {string} user.name - The name of the user (required)
 * @param {string} user.fitnessLevel - The fitness level of the user (beginner, intermediate, advanced) (optional)
 * @param {string} [user.goals] - The fitness goals of the user (optional)
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing
 */
export const createUser = async (user) => {
   console.info("createUser()");

   // Required parameters
   const requiredParams = ['name'];

   // Check for missing required parameters
   const missingParams = requiredParams.filter(param => !user[param]);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating user: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }


   // Set default values for non-required parameters if they are missing
   // const email = user.email;
   // const passwordHash = user.passwordHash;

   const name = user.name;
   const createdAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
   const fitnessLevel = user.fitnessLevel || null; // Default to NULL if not provided
   const goals = user.goals || null; // Default to NULL if not provided

   const dbConnection = await db();
   const query = `
      INSERT INTO Users (Name, CreatedAt, FitnessLevel, Goals)
      VALUES (?, ?, ?, ?);
    `;
   const params = [name, createdAt, fitnessLevel, goals];

   try {
      await dbConnection.executeSql(query, params);
      console.info("User created successfully:", user);
   } catch (error) {
      console.error("Error creating user:", error);
      throw error;
   }
};

/**
 * Retrieves all users from the Users table.
 * @returns {Promise<Array<Object>>} - An array of user objects.
 */
export const getAllUsers = async () => {
   console.info("getAllUsers()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Users;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Users retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving users:", error);
      throw error;
   }
};

/**
* Retrieves a user by their ID from the Users table.
* @param {number} userId - The ID of the user to retrieve.
* @returns {Promise<Object>} - The user object.
*/
export const getUserById = async (userId) => {
   console.info("getUserById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Users WHERE UserId = ?;';
   const params = [userId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("User retrieved successfully:", userId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving user:", error);
      throw error;
   }
};

/**
 * Updates a user's information in the Users table.
 * @param {number} userId - The ID of the user to update.
 * @param {Object} userDetails - The details of the user to update.
 * @param {string} [userDetails.name] - The new name of the user.
 * @param {string} [userDetails.email] - The new email of the user.
 * @param {string} [userDetails.passwordHash] - The new password hash of the user.
 * @param {string} [userDetails.fitnessLevel] - The new fitness level of the user.
 * @param {string} [userDetails.goals] - The new goals of the user.
 * @returns {Promise} A promise that resolves when the user is updated.
 */
export const updateUser = async (userId, userDetails) => {
   console.info("updateUser()");

   if (!userId || typeof userId !== 'number') {
      throw new Error(`Invalid userId: ${userId}. It should be a number.`);
   }

   const validFields = ['name', 'email', 'passwordHash', 'fitnessLevel', 'goals'];
   const fields = Object.keys(userDetails).filter(key => validFields.includes(key) && userDetails[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE Users SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE UserId = ?`;
   const values = fields.map(field => userDetails[field]);
   values.push(userId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("User updated successfully.");
   } catch (error) {
      console.error("Error updating user:", error);
   }
};

/**
* Deletes a user from the Users table.
* @param {number} userId - The ID of the user to delete.
* @returns {Promise<void>}
*/
export const deleteUser = async (userId) => {
   console.info("deleteUser()");
   const dbConnection = await db();
   const query = 'DELETE FROM Users WHERE UserId = ?;';
   const params = [userId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("User deleted successfully:", userId);
   } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
   }
};


/////////// EXERCISES TABLE ///////////

/**
 * Creates a new exercise in the Exercises table.
 * @param {Object} exercise - The exercise object to create.
 * @param {string} exercise.name - The name of the exercise (required).
 * @param {string} exercise.type - The type of exercise (cardio, strength) (required).
 * @param {string} exercise.targetedBodyParts - The targeted body parts (optional).
 * @param {string} [exercise.instructions] - Instructions for the exercise (optional).
 * @param {string} [exercise.videoUrl] - URL to a video for the exercise (optional).
 * @param {string} [exercise.gifUrl] - URL to a GIF for the exercise (optional).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createExercise = async (exercise) => {
   console.info("createExercise()");

   const requiredParams = ['name', 'type'];
   const missingParams = requiredParams.filter(param => !exercise[param]);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating exercise: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const name = exercise.name;
   const type = exercise.type;
   const targetedBodyParts = exercise.targetedBodyParts;
   const instructions = exercise.instructions || null;
   const videoUrl = exercise.videoUrl || null;
   const gifUrl = exercise.gifUrl || null;

   const dbConnection = await db();
   const query = `
     INSERT INTO Exercises (Name, Type, TargetedBodyParts, Instructions, VideoUrl, GifUrl)
     VALUES (?, ?, ?, ?, ?, ?);
   `;
   const params = [name, type, targetedBodyParts, instructions, videoUrl, gifUrl];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Exercise created successfully:", exercise);
   } catch (error) {
      console.error("Error creating exercise:", error);
      throw error;
   }
};

/**
 * Retrieves all exercises from the Exercises table.
 * @returns {Promise<Array<Object>>} - An array of exercise objects.
 */
export const getAllExercises = async () => {
   console.info("getAllExercises()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Exercises;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Exercises retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving exercises:", error);
      throw error;
   }
};

/**
 * Retrieves an exercise by its ID from the Exercises table.
 * @param {number} exerciseId - The ID of the exercise to retrieve.
 * @returns {Promise<Object>} - The exercise object.
 */
export const getExerciseById = async (exerciseId) => {
   console.info("getExerciseById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Exercises WHERE ExerciseId = ?;';
   const params = [exerciseId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Exercise retrieved successfully:", exerciseId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving exercise:", error);
      throw error;
   }
};

/**
 * Retrieves an exercise by its name from the Exercises table.
 * @param {string} name - The name of the exercise to retrieve.
 * @returns {Promise<Object>} - The exercise object.
 */
export const getExerciseByName = async (name) => {
   console.info("getExerciseByName()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Exercises WHERE Name = ?;';
   const params = [name];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Exercise retrieved successfully:", name);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving exercise:", error);
      throw error;
   }
};

/**
 * Updates an exercise in the Exercises table.
 * @param {number} exerciseId - The ID of the exercise to update.
 * @param {Object} exerciseDetails - The exercise object with updated data.
 * @param {string} [exerciseDetails.name] - The new name of the exercise.
 * @param {string} [exerciseDetails.type] - The new type of the exercise (cardio, strength).
 * @param {string} [exerciseDetails.targetedBodyParts] - The new targeted body parts.
 * @param {string} [exerciseDetails.instructions] - The new instructions for the exercise.
 * @param {string} [exerciseDetails.videoUrl] - The new video URL for the exercise.
 * @param {string} [exerciseDetails.gifUrl] - The new GIF URL for the exercise.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if no valid fields are provided to update.
 */
export const updateExercise = async (exerciseId, exerciseDetails) => {
   console.info("updateExercise()");

   if (!exerciseId || typeof exerciseId !== 'number') {
      throw new Error(`Invalid exerciseId: ${exerciseId}. It should be a number.`);
   }

   const validFields = ['name', 'type', 'targetedBodyParts', 'instructions', 'videoUrl', 'gifUrl'];
   const fields = Object.keys(exerciseDetails).filter(key => validFields.includes(key) && exerciseDetails[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE Exercises SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE ExerciseId = ?`;
   const values = fields.map(field => exerciseDetails[field]);
   values.push(exerciseId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Exercise updated successfully.");
   } catch (error) {
      console.error("Error updating exercise:", error);
      throw error;
   }
};

/**
 * Deletes an exercise from the Exercises table.
 * @param {number} exerciseId - The ID of the exercise to delete.
 * @returns {Promise<void>}
 */
export const deleteExercise = async (exerciseId) => {
   console.info("deleteExercise()");
   const dbConnection = await db();
   const query = 'DELETE FROM Exercises WHERE ExerciseId = ?;';
   const params = [exerciseId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Exercise deleted successfully:", exerciseId);
   } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
   }
};


/////////// SET DETAILS TABLE ///////////

/**
 * Creates a new set detail in the SetDetails table.
 * @param {Object} setDetail - The set detail object to create.
 * @param {number} setDetail.minReps - The minimum repetitions (required).
 * @param {number} setDetail.maxReps - The maximum repetitions (required).
 * @param {number} setDetail.weight - The weight used (required).
 * @param {boolean} setDetail.amrap - Whether it is an AMRAP set (optional).
 * @param {boolean} setDetail.paused - Whether it is a paused set (optional).
 * @param {boolean} setDetail.fast - Whether it is a fast set (optional).
 * @param {boolean} setDetail.forced - Whether it is a forced set (optional).
 * @param {boolean} setDetail.dropset - Whether it is a dropset (optional).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createSetDetail = async (setDetail) => {
   console.info("createSetDetail()");

   const requiredParams = ['minReps', 'maxReps', 'weight'];
   const missingParams = requiredParams.filter(param => setDetail[param] === undefined);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating set detail: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const minReps = setDetail.minReps;
   const maxReps = setDetail.maxReps;
   const weight = setDetail.weight;
   const amrap = setDetail.amrap || false;
   const paused = setDetail.paused || false;
   const fast = setDetail.fast || false;
   const forced = setDetail.forced || false;
   const dropset = setDetail.dropset || false;

   const dbConnection = await db();
   const query = `
    INSERT INTO SetDetails (MinReps, MaxReps, Weight, AMRAP, Paused, Fast, Forced, Dropset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `;
   const params = [minReps, maxReps, weight, amrap, paused, fast, forced, dropset];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Set detail created successfully:", setDetail);
   } catch (error) {
      console.error("Error creating set detail:", error);
      throw error;
   }
};

/**
 * Retrieves all set details from the SetDetails table.
 * @returns {Promise<Array<Object>>} - An array of set detail objects.
 */
export const getAllSetDetails = async () => {
   console.info("getAllSetDetails()");
   const dbConnection = await db();
   const query = 'SELECT * FROM SetDetails;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Set details retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving set details:", error);
      throw error;
   }
};

/**
 * Retrieves a set detail by its ID from the SetDetails table.
 * @param {number} setDetailId - The ID of the set detail to retrieve.
 * @returns {Promise<Object>} - The set detail object.
 */
export const getSetDetailById = async (setDetailId) => {
   console.info("getSetDetailById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM SetDetails WHERE SetDetailId = ?;';
   const params = [setDetailId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Set detail retrieved successfully:", setDetailId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving set detail:", error);
      throw error;
   }
};

/**
 * Updates a set detail in the SetDetails table.
 * @param {number} setDetailId - The ID of the set detail to update.
 * @param {Object} setDetail - The set detail object with updated data.
 * @param {number} [setDetail.minReps] - The new minimum repetitions.
 * @param {number} [setDetail.maxReps] - The new maximum repetitions.
 * @param {number} [setDetail.weight] - The new weight used.
 * @param {boolean} [setDetail.amrap] - Whether it is an AMRAP set.
 * @param {boolean} [setDetail.paused] - Whether it is a paused set.
 * @param {boolean} [setDetail.fast] - Whether it is a fast set.
 * @param {boolean} [setDetail.forced] - Whether it is a forced set.
 * @param {boolean} [setDetail.dropset] - Whether it is a dropset.
 * @returns {Promise<void>}
 */
export const updateSetDetail = async (setDetailId, setDetail) => {
   console.info("updateSetDetail()");

   if (!setDetailId || typeof setDetailId !== 'number') {
      throw new Error(`Invalid setDetailId: ${setDetailId}. It should be a number.`);
   }

   const validFields = ['minReps', 'maxReps', 'weight', 'amrap', 'paused', 'fast', 'forced', 'dropset'];
   const fields = Object.keys(setDetail).filter(key => validFields.includes(key) && setDetail[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE SetDetails SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE SetDetailId = ?`;
   const values = fields.map(field => setDetail[field]);
   values.push(setDetailId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Set detail updated successfully.");
   } catch (error) {
      console.error("Error updating set detail:", error);
      throw error;
   }
};

/**
 * Deletes a set detail from the SetDetails table.
 * @param {number} setDetailId - The ID of the set detail to delete.
 * @returns {Promise<void>}
 */
export const deleteSetDetail = async (setDetailId) => {
   console.info("deleteSetDetail()");
   const dbConnection = await db();
   const query = 'DELETE FROM SetDetails WHERE SetDetailId = ?;';
   const params = [setDetailId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Set detail deleted successfully:", setDetailId);
   } catch (error) {
      console.error("Error deleting set detail:", error);
      throw error;
   }
};


/////////// EXERCISE DETAILS TABLE ///////////

/**
 * Creates a new exercise detail in the ExerciseDetails table.
 * @param {Object} exerciseDetail - The exercise detail object to create.
 * @param {number} exerciseDetail.exerciseId - The ID of the exercise (required).
 * @param {number} exerciseDetail.order - The order of the exercise detail (required).
 * @param {number} exerciseDetail.setDetails - The set details ID (required).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createExerciseDetail = async (exerciseDetail) => {
   console.info("createExerciseDetail()");

   const requiredParams = ['exerciseId', 'order', 'setDetails'];
   const missingParams = requiredParams.filter(param => exerciseDetail[param] === undefined);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating exercise detail: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const exerciseId = exerciseDetail.exerciseId;
   const order = exerciseDetail.order;
   const setDetails = exerciseDetail.setDetails;

   const dbConnection = await db();
   const query = `
    INSERT INTO ExerciseDetails (ExerciseId, \`Order\`, SetDetails)
    VALUES (?, ?, ?);
  `;
   const params = [exerciseId, order, setDetails];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Exercise detail created successfully:", exerciseDetail);
   } catch (error) {
      console.error("Error creating exercise detail:", error);
      throw error;
   }
};

/**
 * Retrieves all exercise details from the ExerciseDetails table.
 * @returns {Promise<Array<Object>>} - An array of exercise detail objects.
 */
export const getAllExerciseDetails = async () => {
   console.info("getAllExerciseDetails()");
   const dbConnection = await db();
   const query = 'SELECT * FROM ExerciseDetails;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Exercise details retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving exercise details:", error);
      throw error;
   }
};

/**
 * Retrieves an exercise detail by its ID from the ExerciseDetails table.
 * @param {number} exerciseDetailId - The ID of the exercise detail to retrieve.
 * @returns {Promise<Object>} - The exercise detail object.
 */
export const getExerciseDetailById = async (exerciseDetailId) => {
   console.info("getExerciseDetailById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM ExerciseDetails WHERE ExerciseDetailId = ?;';
   const params = [exerciseDetailId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Exercise detail retrieved successfully:", exerciseDetailId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving exercise detail:", error);
      throw error;
   }
};

/**
 * Updates an exercise detail in the ExerciseDetails table.
 * @param {number} exerciseDetailId - The ID of the exercise detail to update.
 * @param {Object} exerciseDetail - The exercise detail object with updated data.
 * @param {number} [exerciseDetail.exerciseId] - The new exercise ID.
 * @param {number} [exerciseDetail.order] - The new order of the exercise detail.
 * @param {number} [exerciseDetail.setDetails] - The new set details ID.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if no valid fields are provided to update.
 */
export const updateExerciseDetail = async (exerciseDetailId, exerciseDetail) => {
   console.info("updateExerciseDetail()");

   if (!exerciseDetailId || typeof exerciseDetailId !== 'number') {
      throw new Error(`Invalid exerciseDetailId: ${exerciseDetailId}. It should be a number.`);
   }

   const validFields = ['exerciseId', 'order', 'setDetails'];
   const fields = Object.keys(exerciseDetail).filter(key => validFields.includes(key) && exerciseDetail[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE ExerciseDetails SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE ExerciseDetailId = ?`;
   const values = fields.map(field => exerciseDetail[field]);
   values.push(exerciseDetailId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Exercise detail updated successfully.");
   } catch (error) {
      console.error("Error updating exercise detail:", error);
      throw error;
   }
};

/**
 * Deletes an exercise detail from the ExerciseDetails table.
 * @param {number} exerciseDetailId - The ID of the exercise detail to delete.
 * @returns {Promise<void>}
 */
export const deleteExerciseDetail = async (exerciseDetailId) => {
   console.info("deleteExerciseDetail()");
   const dbConnection = await db();
   const query = 'DELETE FROM ExerciseDetails WHERE ExerciseDetailId = ?;';
   const params = [exerciseDetailId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Exercise detail deleted successfully:", exerciseDetailId);
   } catch (error) {
      console.error("Error deleting exercise detail:", error);
      throw error;
   }
};



//////////// WORKOUTS TABLE ////////////

/**
 * Creates a new workout in the Workouts table.
 * @param {Object} workout - The workout object to create.
 * @param {number} workout.userId - The ID of the user (required).
 * @param {string} workout.name - The name of the workout (required).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createWorkout = async (workout) => {
   console.info("createWorkout()");

   const requiredParams = ['userId', 'name'];
   const missingParams = requiredParams.filter(param => workout[param] === undefined);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating workout: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const userId = workout.userId;
   const name = workout.name;

   const dbConnection = await db();
   const query = `
     INSERT INTO Workouts (UserId, Name)
     VALUES (?, ?);
   `;
   const params = [userId, name];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout created successfully:", workout);
   } catch (error) {
      console.error("Error creating workout:", error);
      throw error;
   }
};

/**
 * Retrieves all workouts from the Workouts table.
 * @returns {Promise<Array<Object>>} - An array of workout objects.
 */
export const getAllWorkouts = async () => {
   console.info("getAllWorkouts()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Workouts;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Workouts retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving workouts:", error);
      throw error;
   }
};

/**
 * Retrieves a workout by its ID from the Workouts table.
 * @param {number} workoutId - The ID of the workout to retrieve.
 * @returns {Promise<Object>} - The workout object.
 */
export const getWorkoutById = async (workoutId) => {
   console.info("getWorkoutById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM Workouts WHERE WorkoutId = ?;';
   const params = [workoutId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Workout retrieved successfully:", workoutId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving workout:", error);
      throw error;
   }
};

/**
 * Updates a workout in the Workouts table.
 * @param {number} workoutId - The ID of the workout to update.
 * @param {Object} workout - The workout object with updated data.
 * @param {number} [workout.userId] - The new user ID.
 * @param {string} [workout.name] - The new name of the workout.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if no valid fields are provided to update.
 */
export const updateWorkout = async (workoutId, workout) => {
   console.info("updateWorkout()");

   if (!workoutId || typeof workoutId !== 'number') {
      throw new Error(`Invalid workoutId: ${workoutId}. It should be a number.`);
   }

   const validFields = ['userId', 'name'];
   const fields = Object.keys(workout).filter(key => validFields.includes(key) && workout[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE Workouts SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE WorkoutId = ?`;
   const values = fields.map(field => workout[field]);
   values.push(workoutId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Workout updated successfully.");
   } catch (error) {
      console.error("Error updating workout:", error);
      throw error;
   }
};

/**
 * Deletes a workout from the Workouts table.
 * @param {number} workoutId - The ID of the workout to delete.
 * @returns {Promise<void>}
 */
export const deleteWorkout = async (workoutId) => {
   console.info("deleteWorkout()");
   const dbConnection = await db();
   const query = 'DELETE FROM Workouts WHERE WorkoutId = ?;';
   const params = [workoutId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout deleted successfully:", workoutId);
   } catch (error) {
      console.error("Error deleting workout:", error);
      throw error;
   }
};

//////////// WORKOUT PLANS TABLE ////////////

/**
 * Creates a new workout plan in the WorkoutPlans table.
 * @param {Object} workoutPlan - The workout plan object to create.
 * @param {number} workoutPlan.userId - The ID of the user (required).
 * @param {string} workoutPlan.name - The name of the workout plan (required).
 * @param {string} workoutPlan.description - The description of the workout plan (optional).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createWorkoutPlan = async (workoutPlan) => {
   console.info("createWorkoutPlan()");

   const requiredParams = ['userId', 'name'];
   const missingParams = requiredParams.filter(param => workoutPlan[param] === undefined);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating workout plan: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const userId = workoutPlan.userId;
   const name = workoutPlan.name;
   const description = workoutPlan.description || '';

   const dbConnection = await db();
   const query = `
     INSERT INTO WorkoutPlans (UserId, Name, Description)
     VALUES (?, ?, ?);
   `;
   const params = [userId, name, description];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout plan created successfully:", workoutPlan);
   } catch (error) {
      console.error("Error creating workout plan:", error);
      throw error;
   }
};

/**
 * Retrieves all workout plans from the WorkoutPlans table.
 * @returns {Promise<Array<Object>>} - An array of workout plan objects.
 */
export const getAllWorkoutPlans = async () => {
   console.info("getAllWorkoutPlans()");
   const dbConnection = await db();
   const query = 'SELECT * FROM WorkoutPlans;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Workout plans retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving workout plans:", error);
      throw error;
   }
};

/**
 * Retrieves a workout plan by its ID from the WorkoutPlans table.
 * @param {number} workoutPlanId - The ID of the workout plan to retrieve.
 * @returns {Promise<Object>} - The workout plan object.
 */
export const getWorkoutPlanById = async (workoutPlanId) => {
   console.info("getWorkoutPlanById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM WorkoutPlans WHERE WorkoutPlanId = ?;';
   const params = [workoutPlanId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Workout plan retrieved successfully:", workoutPlanId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving workout plan:", error);
      throw error;
   }
};

/**
 * Updates a workout plan in the WorkoutPlans table.
 * @param {number} workoutPlanId - The ID of the workout plan to update.
 * @param {Object} workoutPlan - The workout plan object with updated data.
 * @param {number} [workoutPlan.userId] - The new user ID.
 * @param {string} [workoutPlan.name] - The new name of the workout plan.
 * @param {string} [workoutPlan.description] - The new description of the workout plan.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if no valid fields are provided to update.
 */
export const updateWorkoutPlan = async (workoutPlanId, workoutPlan) => {
   console.info("updateWorkoutPlan()");

   if (!workoutPlanId || typeof workoutPlanId !== 'number') {
      throw new Error(`Invalid workoutPlanId: ${workoutPlanId}. It should be a number.`);
   }

   const validFields = ['userId', 'name', 'description'];
   const fields = Object.keys(workoutPlan).filter(key => validFields.includes(key) && workoutPlan[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE WorkoutPlans SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE WorkoutPlanId = ?`;
   const values = fields.map(field => workoutPlan[field]);
   values.push(workoutPlanId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Workout plan updated successfully.");
   } catch (error) {
      console.error("Error updating workout plan:", error);
      throw error;
   }
};

/**
 * Deletes a workout plan from the WorkoutPlans table.
 * @param {number} workoutPlanId - The ID of the workout plan to delete.
 * @returns {Promise<void>}
 */
export const deleteWorkoutPlan = async (workoutPlanId) => {
   console.info("deleteWorkoutPlan()");
   const dbConnection = await db();
   const query = 'DELETE FROM WorkoutPlans WHERE WorkoutPlanId = ?;';
   const params = [workoutPlanId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout plan deleted successfully:", workoutPlanId);
   } catch (error) {
      console.error("Error deleting workout plan:", error);
      throw error;
   }
};


//////////// WORKOUT SESSIONS TABLE ////////////

/**
 * Creates a new workout session in the WorkoutSessions table.
 * @param {Object} workoutSession - The workout session object to create.
 * @param {number} workoutSession.userId - The ID of the user (required).
 * @param {number} workoutSession.workoutPlanId - The ID of the workout plan (required).
 * @param {number} workoutSession.workoutId - The ID of the workout (required).
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if any required parameters are missing.
 */
export const createWorkoutSession = async (workoutSession) => {
   console.info("createWorkoutSession()");

   const requiredParams = ['userId', 'workoutPlanId', 'workoutId'];
   const missingParams = requiredParams.filter(param => workoutSession[param] === undefined);

   if (missingParams.length > 0) {
      const missingParamsStr = missingParams.join(', ');
      console.error(`Error creating workout session: Missing required parameters: ${missingParamsStr}`);
      throw new Error(`Missing required parameters: ${missingParamsStr}`);
   }

   const userId = workoutSession.userId;
   const workoutPlanId = workoutSession.workoutPlanId;
   const workoutId = workoutSession.workoutId;

   const dbConnection = await db();
   const query = `
     INSERT INTO WorkoutSessions (UserId, WorkoutPlanId, WorkoutId)
     VALUES (?, ?, ?);
   `;
   const params = [userId, workoutPlanId, workoutId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout session created successfully:", workoutSession);
   } catch (error) {
      console.error("Error creating workout session:", error);
      throw error;
   }
};

/**
 * Retrieves all workout sessions from the WorkoutSessions table.
 * @returns {Promise<Array<Object>>} - An array of workout session objects.
 */
export const getAllWorkoutSessions = async () => {
   console.info("getAllWorkoutSessions()");
   const dbConnection = await db();
   const query = 'SELECT * FROM WorkoutSessions;';

   try {
      const [results] = await dbConnection.executeSql(query);
      console.info("Workout sessions retrieved successfully.");
      return results.rows.raw(); // Converts results to an array of objects
   } catch (error) {
      console.error("Error retrieving workout sessions:", error);
      throw error;
   }
};

/**
 * Retrieves a workout session by its ID from the WorkoutSessions table.
 * @param {number} workoutSessionId - The ID of the workout session to retrieve.
 * @returns {Promise<Object>} - The workout session object.
 */
export const getWorkoutSessionById = async (workoutSessionId) => {
   console.info("getWorkoutSessionById()");
   const dbConnection = await db();
   const query = 'SELECT * FROM WorkoutSessions WHERE WorkoutSessionId = ?;';
   const params = [workoutSessionId];

   try {
      const [results] = await dbConnection.executeSql(query, params);
      console.info("Workout session retrieved successfully:", workoutSessionId);
      return results.rows.item(0); // Returns the first result as an object
   } catch (error) {
      console.error("Error retrieving workout session:", error);
      throw error;
   }
};

/**
 * Updates a workout session in the WorkoutSessions table.
 * @param {number} workoutSessionId - The ID of the workout session to update.
 * @param {Object} workoutSession - The workout session object with updated data.
 * @param {number} [workoutSession.userId] - The new user ID.
 * @param {number} [workoutSession.workoutPlanId] - The new workout plan ID.
 * @param {number} [workoutSession.workoutId] - The new workout ID.
 * @returns {Promise<void>}
 * @throws {Error} Throws an error if no valid fields are provided to update.
 */
export const updateWorkoutSession = async (workoutSessionId, workoutSession) => {
   console.info("updateWorkoutSession()");

   if (!workoutSessionId || typeof workoutSessionId !== 'number') {
      throw new Error(`Invalid workoutSessionId: ${workoutSessionId}. It should be a number.`);
   }

   const validFields = ['userId', 'workoutPlanId', 'workoutId'];
   const fields = Object.keys(workoutSession).filter(key => validFields.includes(key) && workoutSession[key] !== undefined);

   if (fields.length === 0) {
      throw new Error("No valid fields provided to update.");
   }

   const query = `UPDATE WorkoutSessions SET ${fields.map(field => `${field.charAt(0).toUpperCase() + field.slice(1)} = ?`).join(', ')} WHERE WorkoutSessionId = ?`;
   const values = fields.map(field => workoutSession[field]);
   values.push(workoutSessionId);

   try {
      const dbConnection = await db();
      await dbConnection.executeSql(query, values);
      console.info("Workout session updated successfully.");
   } catch (error) {
      console.error("Error updating workout session:", error);
      throw error;
   }
};

/**
 * Deletes a workout session from the WorkoutSessions table.
 * @param {number} workoutSessionId - The ID of the workout session to delete.
 * @returns {Promise<void>}
 */
export const deleteWorkoutSession = async (workoutSessionId) => {
   console.info("deleteWorkoutSession()");
   const dbConnection = await db();
   const query = 'DELETE FROM WorkoutSessions WHERE WorkoutSessionId = ?;';
   const params = [workoutSessionId];

   try {
      await dbConnection.executeSql(query, params);
      console.info("Workout session deleted successfully:", workoutSessionId);
   } catch (error) {
      console.error("Error deleting workout session:", error);
      throw error;
   }
};
