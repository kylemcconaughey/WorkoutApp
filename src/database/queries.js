import { db } from './db';

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
    const createdAt = new Date();
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


/*
### Exercises Table
1. **Create Exercise**
   - SQL: `INSERT INTO Exercises (Name, Type, TargetedBodyParts, Instructions, VideoUrl, GifUrl) VALUES (?, ?, ?, ?, ?, ?);`
   - Function: `createExercise(exercise)`

2. **Get All Exercises**
   - SQL: `SELECT * FROM Exercises;`
   - Function: `getAllExercises()`

3. **Get Exercise by ID**
   - SQL: `SELECT * FROM Exercises WHERE ExerciseId = ?;`
   - Function: `getExerciseById(exerciseId)`

4. **Update Exercise**
   - SQL: `UPDATE Exercises SET Name = ?, Type = ?, TargetedBodyParts = ?, Instructions = ?, VideoUrl = ?, GifUrl = ? WHERE ExerciseId = ?;`
   - Function: `updateExercise(exerciseId, exercise)`

5. **Delete Exercise**
   - SQL: `DELETE FROM Exercises WHERE ExerciseId = ?;`
   - Function: `deleteExercise(exerciseId)`

### SetDetails Table
1. **Create SetDetail**
   - SQL: `INSERT INTO SetDetails (MinReps, MaxReps, Weight, AMRAP, Paused, Fast, Forced, Dropset) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
   - Function: `createSetDetail(setDetail)`

2. **Get All SetDetails**
   - SQL: `SELECT * FROM SetDetails;`
   - Function: `getAllSetDetails()`

3. **Get SetDetail by ID**
   - SQL: `SELECT * FROM SetDetails WHERE SetDetailId = ?;`
   - Function: `getSetDetailById(setDetailId)`

4. **Update SetDetail**
   - SQL: `UPDATE SetDetails SET MinReps = ?, MaxReps = ?, Weight = ?, AMRAP = ?, Paused = ?, Fast = ?, Forced = ?, Dropset = ? WHERE SetDetailId = ?;`
   - Function: `updateSetDetail(setDetailId, setDetail)`

5. **Delete SetDetail**
   - SQL: `DELETE FROM SetDetails WHERE SetDetailId = ?;`
   - Function: `deleteSetDetail(setDetailId)`

### ExerciseDetails Table
1. **Create ExerciseDetail**
   - SQL: `INSERT INTO ExerciseDetails (ExerciseId, \`Order\`, SetDetails) VALUES (?, ?, ?);`
   - Function: `createExerciseDetail(exerciseDetail)`

2. **Get All ExerciseDetails**
   - SQL: `SELECT * FROM ExerciseDetails;`
   - Function: `getAllExerciseDetails()`

3. **Get ExerciseDetail by ID**
   - SQL: `SELECT * FROM ExerciseDetails WHERE ExerciseDetailId = ?;`
   - Function: `getExerciseDetailById(exerciseDetailId)`

4. **Update ExerciseDetail**
   - SQL: `UPDATE ExerciseDetails SET ExerciseId = ?, \`Order\` = ?, SetDetails = ? WHERE ExerciseDetailId = ?;`
   - Function: `updateExerciseDetail(exerciseDetailId, exerciseDetail)`

5. **Delete ExerciseDetail**
   - SQL: `DELETE FROM ExerciseDetails WHERE ExerciseDetailId = ?;`
   - Function: `deleteExerciseDetail(exerciseDetailId)`

### Workouts Table
1. **Create Workout**
   - SQL: `INSERT INTO Workouts (UserId, Name) VALUES (?, ?);`
   - Function: `createWorkout(workout)`

2. **Get All Workouts**
   - SQL: `SELECT * FROM Workouts;`
   - Function: `getAllWorkouts()`

3. **Get Workout by ID**
   - SQL: `SELECT * FROM Workouts WHERE WorkoutId = ?;`
   - Function: `getWorkoutById(workoutId)`

4. **Update Workout**
   - SQL: `UPDATE Workouts SET UserId = ?, Name = ? WHERE WorkoutId = ?;`
   - Function: `updateWorkout(workoutId, workout)`

5. **Delete Workout**
   - SQL: `DELETE FROM Workouts WHERE WorkoutId = ?;`
   - Function: `deleteWorkout(workoutId)`

### WorkoutPlans Table
1. **Create WorkoutPlan**
   - SQL: `INSERT INTO WorkoutPlans (UserId, Name, Description) VALUES (?, ?, ?);`
   - Function: `createWorkoutPlan(workoutPlan)`

2. **Get All WorkoutPlans**
   - SQL: `SELECT * FROM WorkoutPlans;`
   - Function: `getAllWorkoutPlans()`

3. **Get WorkoutPlan by ID**
   - SQL: `SELECT * FROM WorkoutPlans WHERE WorkoutPlanId = ?;`
   - Function: `getWorkoutPlanById(workoutPlanId)`

4. **Update WorkoutPlan**
   - SQL: `UPDATE WorkoutPlans SET UserId = ?, Name = ?, Description = ? WHERE WorkoutPlanId = ?;`
   - Function: `updateWorkoutPlan(workoutPlanId, workoutPlan)`

5. **Delete WorkoutPlan**
   - SQL: `DELETE FROM WorkoutPlans WHERE WorkoutPlanId = ?;`
   - Function: `deleteWorkoutPlan(workoutPlanId)`

### CompletedExercises Table
1. **Create CompletedExercise**
   - SQL: `INSERT INTO CompletedExercises (ExerciseId, \`Order\`) VALUES (?, ?);`
   - Function: `createCompletedExercise(completedExercise)`

2. **Get All CompletedExercises**
   - SQL: `SELECT * FROM CompletedExercises;`
   - Function: `getAllCompletedExercises()`

3. **Get CompletedExercise by ID**
   - SQL: `SELECT * FROM CompletedExercises WHERE CompletedExerciseId = ?;`
   - Function: `getCompletedExerciseById(completedExerciseId)`

4. **Update CompletedExercise**
   - SQL: `UPDATE CompletedExercises SET ExerciseId = ?, \`Order\` = ? WHERE CompletedExerciseId = ?;`
   - Function: `updateCompletedExercise(completedExerciseId, completedExercise)`

5. **Delete CompletedExercise**
   - SQL: `DELETE FROM CompletedExercises WHERE CompletedExerciseId = ?;`
   - Function: `deleteCompletedExercise(completedExerciseId)`

### WorkoutSessions Table
1. **Create WorkoutSession**
   - SQL: `INSERT INTO WorkoutSessions (UserId, WorkoutPlanId, WorkoutId) VALUES (?, ?, ?);`
   - Function: `createWorkoutSession(workoutSession)`

2. **Get All WorkoutSessions**
   - SQL: `SELECT * FROM WorkoutSessions;`
   - Function: `getAllWorkoutSessions()`

3. **Get WorkoutSession by ID**
   - SQL: `SELECT * FROM WorkoutSessions WHERE WorkoutSessionId = ?;`
   - Function: `getWorkoutSessionById(workoutSessionId)`

4. **Update WorkoutSession**
   - SQL: `UPDATE WorkoutSessions SET UserId = ?, WorkoutPlanId = ?, WorkoutId = ? WHERE WorkoutSessionId = ?;`
   - Function: `updateWorkoutSession(workoutSessionId, workoutSession)`

5. **Delete WorkoutSession**
   - SQL: `DELETE FROM WorkoutSessions WHERE WorkoutSessionId = ?;`
   - Function: `deleteWorkoutSession(workoutSessionId)`

### Helper/Wrapper Functions
1. **Execute Transaction**: A wrapper to execute multiple SQL statements in a single transaction.
   - Function: `executeTransaction(statements)`

2. **Get Data by Foreign Key**: Fetch data from one table based on a foreign key relation to another table.
   - Function: `getDataByForeignKey(tableName, foreignKey, value)`

3. **Bulk Insert**: Insert multiple rows into a table.
   - Function: `bulkInsert(tableName, columns, values)`

This list covers the essential CRUD operations for each table and some helper functions that might be useful for more complex interactions.
*/