# Debugging Guide: Student Ratings Not Showing

## 🔍 Troubleshooting Steps

### Step 1: Open Browser Console

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for errors (red messages)

### Step 2: Check Console Logs

Add this to see if ratings are being fetched:

```javascript
// In browser console, type:
localStorage.getItem("user"); // Check if logged in
```

Look for these logs when page loads:

```
✅ "No ratings found for student:" (if no ratings) - This is OK
✅ "Ratings fetched successfully" (if ratings exist) - This is GOOD
❌ Error messages - This is BAD, need to fix
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Getting API 401 Error

```
❌ Error: 401 Unauthorized
```

**Cause**: Not logged in or token expired  
**Fix**:

1. Log out and log back in
2. Refresh the page
3. Check if token is in localStorage

**Test**:

```javascript
// In console:
localStorage.getItem("token"); // Should show a token
```

---

### Issue 2: Getting API 404 Error

```
❌ Error: 404 Not Found - /api/students/{id}/ratings
```

**Cause**: Backend endpoint doesn't exist or student ID is wrong  
**Fix**:

1. Verify backend is running
2. Check student ID is correct
3. Verify route in backend: `GET /api/students/:id/ratings`

**Test**:

```bash
# In terminal, test the API:
curl -X GET \
  "http://localhost:5000/api/students/60d5ec49c1234567890abcde/ratings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Issue 3: Ratings Not in Database

```
✅ API returns success but ratings array is empty
```

**Cause**: No ratings saved for this student yet  
**Fix**:

1. Add some ratings first (via bulk rating interface)
2. Or manually insert test data

**Test**:

```javascript
// In database console:
db.students.findOne({ _id: ObjectId("...") }, { ratings: 1 });
```

---

### Issue 4: Empty studentRatings State

```
✅ Component loads but no ratings show
```

**Cause**: State not updating properly  
**Fix**:

1. Check if API returned data
2. Verify state is being set
3. Check if component re-renders

**Debugging Code** (add to StudentProfile.js temporarily):

```javascript
// After setStudentRatings(...)
useEffect(() => {
  console.log("studentRatings state:", studentRatings);
}, [studentRatings]);
```

---

### Issue 5: Table Not Rendering

```
❌ studentRatings has data but table doesn't show
```

**Cause**: JavaScript error in table generation  
**Fix**:

1. Check for console errors
2. Verify Set and Array operations work
3. Check if dates are formatted correctly

**Test**:

```javascript
// In console:
Array.from(new Set([1, 2, 2, 3])); // Should return [1, 2, 3]
```

---

## 🔧 Quick Debugging Commands

### Check if ratings exist in database:

```bash
# MongoDB shell
db.students.findOne(
  { _id: ObjectId("60d5ec49c1234567890abcde") },
  { ratings: 1 }
)
```

### Check if API endpoint works:

```bash
curl -X GET \
  "http://localhost:5000/api/students/60d5ec49c1234567890abcde/ratings" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### Check component state:

```javascript
// Add this to StudentProfile.js temporarily:
console.log("studentRatings:", studentRatings);
console.log("studentRatings.length:", studentRatings.length);
console.log("First rating:", studentRatings[0]);
```

---

## 📋 Diagnostic Checklist

- [ ] Browser console open (F12)
- [ ] Student profile loads
- [ ] No red errors in console
- [ ] User is logged in
- [ ] Student has an ID
- [ ] API is responding
- [ ] Backend has ratings data
- [ ] studentRatings state has data
- [ ] Table section appears on page
- [ ] Ratings display with colors

---

## 🚀 If Nothing Works

### Step 1: Clear Everything

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();

// Or just clear the token:
localStorage.removeItem("token");
```

### Step 2: Restart

1. Close browser completely
2. Restart development server: `npm start`
3. Log in again
4. Go to Student Profile

### Step 3: Check Browser Network Tab

1. Open F12 → Network tab
2. Reload page
3. Look for API call: `students/*/ratings`
4. Check response (should have ratings array)

---

## 🔍 Network Tab Inspection

### Look for this request:

```
GET /api/students/{id}/ratings
Status: 200 OK (green)
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "student": { ... },
    "ratings": [
      {
        "_id": "...",
        "subjectId": "...",
        "date": "2025-11-11",
        "rating": "Excellent"
      }
    ]
  }
}
```

### Bad Response:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 📝 Add Temporary Debug Logs

Add this to see what's happening:

```javascript
// In StudentProfile.js, in the fetch ratings try block:

// After setStudentRatings(...)
console.log("✅ Ratings fetched:", ratingsData);
console.log("✅ Count:", ratingsData.length);
console.log("✅ First rating:", ratingsData[0]);

// In the catch block:
console.error("❌ Ratings API Error:", err.response?.data || err.message);
```

Then check console when page loads.

---

## 🎯 Verify Step-by-Step

### 1. Is the section visible?

Scroll down on student profile page. Look for:

```
⭐ STUDENT RATINGS
```

**If not visible**: JavaScript error or empty state

### 2. Does it show empty state?

```
No ratings have been recorded yet.
```

**If yes**: studentRatings is empty

### 3. Do you see the table?

```
SUBJECT | 11/11/2025
--------|----------
...
```

**If yes**: It's working! ✅

---

## 💡 Most Common Causes

| Cause            | Symptom           | Fix                   |
| ---------------- | ----------------- | --------------------- |
| No data in DB    | Empty state shows | Add test ratings      |
| API error        | Console error     | Check auth token      |
| State not set    | Nothing shows     | Check console logs    |
| Wrong student ID | 404 error         | Verify student ID     |
| Backend down     | Network error     | Start backend server  |
| Syntax error     | Page crashes      | Check browser console |

---

## 🆘 If Still Stuck

### Provide this information:

1. **What do you see?**

   - Nothing at all?
   - Empty state message?
   - Error message?

2. **Console errors?**

   - Copy any red messages from F12 console

3. **Network response?**

   - Check F12 → Network tab
   - Find `/ratings` request
   - Copy the response

4. **Browser?**

   - Chrome, Firefox, Safari, Edge?

5. **Logged in as?**
   - Student, Teacher, or Admin?

---

## ✅ Final Checklist

- [x] Backend running? `npm run dev` (backend folder)
- [x] Frontend running? `npm start` (frontend folder)
- [x] API endpoint exists? Check `backend/routes/students.js`
- [x] Student has ratings? Check database
- [x] User logged in? Check localStorage token
- [x] No console errors? Check F12 → Console
- [x] API returning data? Check F12 → Network

---

**If you provide the errors from the console, I can help fix them!** 🔧
