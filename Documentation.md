# Overview

This document provides an overview of the database schema and the SQL commands for interacting with the Workout App's database. The schema includes tables for users, exercises, workout plans, and workout sessions. Each table and its related SQL commands are described in detail below.

## Model Construction

### User
```
{
    "UserId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "Name": TEXT NOT NULL,
    "Email": TEXT UNIQUE NOT NULL,
    "PasswordHash": TEXT NOT NULL,
    "CreatedAt": TEXT NOT NULL,
    "FitnessLevel": TEXT CHECK(FitnessLevel IN ('beginner', 'intermediate', 'advanced')),
    "Goals": TEXT
}
```

### Exercise
```
{
    "ExerciseId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "Name": TEXT NOT NULL,
    "Type": TEXT CHECK(Type IN ('cardio', 'strength')),
    "TargetedBodyParts": TEXT CHECK(TargetedBodyParts IN ('Abs', 'Back', 'Biceps', 'Calves', 'Chest', 'Core', 'Forearms', 'Glutes', 'Hamstrings', 'Legs', 'Shoulders', 'Triceps', 'Quads')),
    "Instructions": TEXT,
    "VideoUrl": TEXT,
    "GifUrl": TEXT
}
```

### SetDetail
```
{
    "SetDetailId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "MinReps": INTEGER,
    "MaxReps": INTEGER,
    "Weight": INTEGER,
    "AMRAP": BOOLEAN,
    "Paused": BOOLEAN,
    "Fast": BOOLEAN,
    "Forced": BOOLEAN,
    "Dropset": BOOLEAN
}
```

### ExerciseDetail
```
{
    "ExerciseDetailId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "ExerciseId": INTEGER,
    "Order": INTEGER,
    "SetDetails": INTEGER,
    "FOREIGN KEY (ExerciseId)": REFERENCES Exercises (ExerciseId) ON DELETE CASCADE
}
```

### Workout
```
{
    "WorkoutId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "UserId": INTEGER,
    "Name": TEXT NOT NULL,
    "FOREIGN KEY (UserId)": REFERENCES Users (UserId) ON DELETE CASCADE
}
```

### WorkoutPlan
```
{
    "WorkoutPlanId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "UserId": INTEGER,
    "Name": TEXT NOT NULL,
    "Description": TEXT,
    "FOREIGN KEY (UserId)": REFERENCES Users (UserId) ON DELETE CASCADE
}
```

### CompletedExercise
```
{
    "CompletedExerciseId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "ExerciseId": INTEGER,
    "Order": INTEGER,
    "FOREIGN KEY (ExerciseId)": REFERENCES Exercises (ExerciseId) ON DELETE CASCADE
}
```

### WorkoutSession
```
{
    "WorkoutSessionId": INTEGER PRIMARY KEY AUTOINCREMENT,
    "UserId": INTEGER,
    "WorkoutPlanId": INTEGER,
    "WorkoutId": INTEGER,
    "FOREIGN KEY (UserId)": REFERENCES Users (UserId),
    "FOREIGN KEY (WorkoutPlanId)": REFERENCES WorkoutPlans (WorkoutPlanId),
    "FOREIGN KEY (WorkoutId)": REFERENCES Workouts (WorkoutId)
}
```
-----------------------------------------------------------------------------------------------------
## SQL Commands

### Users

| Action     | SQL Command                                                                                                                                                               | Notes                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Create     | `INSERT INTO Users (Name, Email, PasswordHash, CreatedAt, FitnessLevel, Goals) VALUES ('John Doe', 'john@example.com', 'hash', '2024-05-21', 'beginner', 'Lose weight');` |                             |
| Read       | `SELECT * FROM Users;`                                                                                                                                                    | Retrieve all users          |
| Read by ID | `SELECT * FROM Users WHERE UserId = 1;`                                                                                                                                   | Retrieve user with UserId 1 |
| Update     | `UPDATE Users SET Name = 'Jane Doe' WHERE UserId = 1;`                                                                                                                    | Update user with UserId 1   |
| Delete     | `DELETE FROM Users WHERE UserId = 1;`                                                                                                                                     | Delete user with UserId 1   |

### Exercises

| Action     | SQL Command                                                                                                                                                               | Notes                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Create     | `INSERT INTO Exercises (Name, Type, TargetedBodyParts, Instructions, VideoUrl, GifUrl) VALUES ('Push Up', 'strength', 'Chest', 'Do a push-up.', 'video_url', 'gif_url');` |                                     |
| Read       | `SELECT * FROM Exercises;`                                                                                                                                                | Retrieve all exercises              |
| Read by ID | `SELECT * FROM Exercises WHERE ExerciseId = 1;`                                                                                                                           | Retrieve exercise with ExerciseId 1 |
| Update     | `UPDATE Exercises SET Name = 'Pull Up' WHERE ExerciseId = 1;`                                                                                                             | Update exercise with ExerciseId 1   |
| Delete     | `DELETE FROM Exercises WHERE ExerciseId = 1;`                                                                                                                             | Delete exercise with ExerciseId 1   |

### SetDetails

| Action     | SQL Command                                                                                                                  | Notes                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Create     | `INSERT INTO SetDetails (MinReps, MaxReps, Weight, AMRAP, Paused, Fast, Forced, Dropset) VALUES (8, 12, 50, 0, 0, 0, 0, 0);` |                                        |
| Read       | `SELECT * FROM SetDetails;`                                                                                                  | Retrieve all set details               |
| Read by ID | `SELECT * FROM SetDetails WHERE SetDetailId = 1;`                                                                            | Retrieve set detail with SetDetailId 1 |
| Update     | `UPDATE SetDetails SET MinReps = 10 WHERE SetDetailId = 1;`                                                                  | Update set detail with SetDetailId 1   |
| Delete     | `DELETE FROM SetDetails WHERE SetDetailId = 1;`                                                                              | Delete set detail with SetDetailId 1   |

### ExerciseDetails

| Action     | SQL Command                                                                     | Notes                                            |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Create     | `INSERT INTO ExerciseDetails (ExerciseId, Order, SetDetails) VALUES (1, 1, 1);` |                                                  |
| Read       | `SELECT * FROM ExerciseDetails;`                                                | Retrieve all exercise details                    |
| Read by ID | `SELECT * FROM ExerciseDetails WHERE ExerciseDetailId = 1;`                     | Retrieve exercise detail with ExerciseDetailId 1 |
| Update     | `UPDATE ExerciseDetails SET Order = 2 WHERE ExerciseDetailId = 1;`              | Update exercise detail with ExerciseDetailId 1   |
| Delete     | `DELETE FROM ExerciseDetails WHERE ExerciseDetailId = 1;`                       | Delete exercise detail with ExerciseDetailId 1   |

### Workouts

| Action     | SQL Command                                                          | Notes                             |
| ---------- | -------------------------------------------------------------------- | --------------------------------- |
| Create     | `INSERT INTO Workouts (UserId, Name) VALUES (1, 'Morning Workout');` |                                   |
| Read       | `SELECT * FROM Workouts;`                                            | Retrieve all workouts             |
| Read by ID | `SELECT * FROM Workouts WHERE WorkoutId = 1;`                        | Retrieve workout with WorkoutId 1 |
| Update     | `UPDATE Workouts SET Name = 'Evening Workout' WHERE WorkoutId = 1;`  | Update workout with WorkoutId 1   |
| Delete     | `DELETE FROM Workouts WHERE WorkoutId = 1;`                          | Delete workout with WorkoutId 1   |

### WorkoutPlans

| Action     | SQL Command                                                                                           | Notes                                      |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Create     | `INSERT INTO WorkoutPlans (UserId, Name, Description) VALUES (1, 'Plan A', 'Description of Plan A');` |                                            |
| Read       | `SELECT * FROM WorkoutPlans;`                                                                         | Retrieve all workout plans                 |
| Read by ID | `SELECT * FROM WorkoutPlans WHERE WorkoutPlanId = 1;`                                                 | Retrieve workout plan with WorkoutPlanId 1 |
| Update     | `UPDATE WorkoutPlans SET Name = 'Plan B' WHERE WorkoutPlanId = 1;`                                    | Update workout plan with WorkoutPlanId 1   |
| Delete     | `DELETE FROM WorkoutPlans WHERE WorkoutPlanId = 1;`                                                   | Delete workout plan with WorkoutPlanId 1   |

### CompletedExercises

| Action     | SQL Command                                                              | Notes                                                  |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Create     | `INSERT INTO CompletedExercises (ExerciseId, Order) VALUES (1, 1);`      |                                                        |
| Read       | `SELECT * FROM CompletedExercises;`                                      | Retrieve all completed exercises                       |
| Read by ID | `SELECT * FROM CompletedExercises WHERE CompletedExerciseId = 1;`        | Retrieve completed exercise with CompletedExerciseId 1 |
| Update     | `UPDATE CompletedExercises SET Order = 2 WHERE CompletedExerciseId = 1;` | Update completed exercise with CompletedExerciseId 1   |
| Delete     | `DELETE FROM CompletedExercises WHERE CompletedExerciseId = 1;`          | Delete completed exercise with CompletedExerciseId 1   |

### WorkoutSessions

| Action     | SQL Command                                                                        | Notes                                            |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| Create     | `INSERT INTO WorkoutSessions (UserId, WorkoutPlanId, WorkoutId) VALUES (1, 1, 1);` |                                                  |
| Read       | `SELECT * FROM WorkoutSessions;`                                                   | Retrieve all workout sessions                    |
| Read by ID | `SELECT * FROM WorkoutSessions WHERE WorkoutSessionId = 1;`                        | Retrieve workout session with WorkoutSessionId 1 |
| Delete     | `DELETE FROM WorkoutSessions WHERE WorkoutSessionId = 1;`                          | Delete workout session with WorkoutSessionId 1   |

---