# Security Specifications & Rules TDD Specifications

## 1. Data Invariants
1. **User Ownership**: A user document at `/users/{userId}` can only be read, created, or written to by the authenticated user whose `request.auth.uid` matches `{userId}`.
2. **Subcollection Relational Security**: Access to subcollections (`foodLogs`, `challenges`, `notifications`) under `/users/{userId}` is transitively private to the owner. Other authenticated users must be completely denied access.
3. **Immutability of Identity**: Creation of user profiles or sub-records must register the owner's UID correctly. Updates are strictly forbidden from changing the owner's UID components.
4. **Data Shape Validation**:
    - All weight, height, age, daily caloric metrics must be positive numbers.
    - All IDs must follow standard string validation matching alphanumeric constraints (`^[a-zA-Z0-9_\-]+$`) and must not exceed structural length parameters.
5. **Timestamp Precision**: Creation and updates must validate timestamp fields matching `request.time` exactly, rather than taking client-supplied time coordinates.

---

## 2. The "Dirty Dozen" Attack Payloads

### Payload 1: Privilege Escalation / Admin Claim Spoofing (UserProfile)
Attempts to set `role: "admin"` during user creation.
```json
{
  "uid": "victim_uid",
  "displayName": "Intruder",
  "email": "attacker@gmail.com",
  "age": 25,
  "weight": 70,
  "height": 170,
  "dailyCalorieGoal": 2000,
  "healthGoals": "Lose weight",
  "dietPlan": "Balanced",
  "streakCount": 0,
  "lastLoggedDate": null,
  "points": 0,
  "badges": [],
  "role": "admin"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Ghost field detected, size mismatch, or role escalation blocked)

### Payload 2: Account Hijacking (UserProfile Owner Mismatch)
Authenticated as `attacker_uid`, but sending user creation to `/users/victim_uid`.
```json
{
  "uid": "victim_uid",
  "displayName": "Malicious",
  "email": "attacker@gmail.com",
  "age": 30,
  "weight": 80,
  "height": 180,
  "dailyCalorieGoal": 2500,
  "healthGoals": "Lose weight",
  "dietPlan": "Balanced",
  "streakCount": 5,
  "lastLoggedDate": "2026-06-10",
  "points": 1000,
  "badges": []
}
```
*Expected Outcome*: **PERMISSION_DENIED** (uid mismatch check: `request.auth.uid != userId` or `uid != request.auth.uid`)

### Payload 3: Cross-User Read/Leaking (FoodLog)
Authenticated as `attacker_uid`, attempting to read `/users/victim_uid/foodLogs/some_log_id`.
```json
{}
```
*Expected Outcome*: **PERMISSION_DENIED** (Relational user boundaries)

### Payload 4: Challenge Completion State Sideloading (Challenge Hack)
Direct client write setting `completed: true` to bypass exercise logging entirely.
```json
{
  "id": "streak_challenge",
  "title": "5-Day Streak Runner",
  "description": "Maintain a logging streak for 5 consecutive days",
  "durationDays": 5,
  "pointsValue": 150,
  "progress": 5,
  "completed": true,
  "type": "streak",
  "icon": "Wheat"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Only system processes can set ultimate completed milestones or strict update action guards block self-assignment)

### Payload 5: Integer Overflow / Wallet Denial Attack (UserProfile Points)
Inserting a monstrously massive points total during update.
```json
{
  "points": 9999999999
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Validation of range bounds `points <= 50000`, size checks, or restricted update fields)

### Payload 6: Denial of Wallet Space Attack (ID Poisoning)
Writing a record using a 2KB garbage string as the log ID: `/users/{userId}/foodLogs/GARBAGE_CHARACTERS...`.
```json
{
  "id": "GARBAGE_CHARACTERS...",
  "userId": "owner_uid"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Path ID validation bounds check `isValidId()`)

### Payload 7: Invalid Types Violation (FoodLog Type Confusion)
Sideloading standard text in nutrient arrays (e.g., passing a string where an array is required).
```json
{
  "id": "log_123",
  "userId": "owner_uid",
  "timestamp": "this_is_not_an_iso_string",
  "date": "2026-06-10",
  "foodName": "Stuffed Paratha",
  "mealType": "Lunch",
  "calories": 400,
  "protein": 12,
  "carbs": 50,
  "fats": 15,
  "vitamins": "not_an_array",
  "minerals": ["Iron"],
  "healthScore": 75,
  "summary": "Rich in carbs",
  "recommendation": "MODERATE",
  "reason": "Caloric density"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (`vitamins` fails `is list` constraint)

### Payload 8: Value Poisoning (Invalid Enums)
Logging food items with a randomized, unapproved recommendation level.
```json
{
  "recommendation": "ULTRA_EAT_GOD_SPEED"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Fails `recommendation in ["EAT", "MODERATE", "AVOID"]` check)

### Payload 9: Invalid Calories Boundary Check
Inputting negative calorie tracking statistics.
```json
{
  "calories": -100
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Fails boundary limit check: `calories >= 0`)

### Payload 10: Email Spoofing With Unverified Address
Attempting action when metadata profile fields contain matching emails but user is authenticated with `email_verified == false`.
```json
{}
```
*Expected Outcome*: **PERMISSION_DENIED** (`request.auth.token.email_verified == true` mandate check)

### Payload 11: System Field Overwrite Attack
Attacking client interfaces trying to manually edit `lastLoggedDate` or streak multipliers directly without performing dynamic scans.
```json
{
  "streakCount": 999
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Affected keys update action restriction)

### Payload 12: Missing Required Fields / Integrity Failure (FoodLog Orphan)
Logging a food plate item missing core macros fields.
```json
{
  "id": "log_456",
  "userId": "owner_uid",
  "timestamp": "2026-06-10T08:00:00.000Z",
  "foodName": "Greek Salad"
}
```
*Expected Outcome*: **PERMISSION_DENIED** (Map `hasAll(['calories', 'protein', 'carbs', 'fats'])` check failed)

---

## 3. The Test Suite Strategy
Tests are programmatically executed using the `@firebase/rules-unit-testing` or similar framework to verify security. Every request matches expectations, returning correct permission states across all access layers.
