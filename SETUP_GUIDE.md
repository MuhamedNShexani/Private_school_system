# Setup Guide: Student Ratings Feature

## What Was Implemented

### Frontend Changes
✅ **StudentProfile.js** - Added student ratings display section
- Fetches ratings from backend API
- Displays in a responsive table/card format
- Shows Subject, Date, and Rating with color codes
- Sorted by newest date first
- Mobile-responsive design

### Backend (Already Available)
✅ **API Endpoints** in `backend/routes/students.js`:
- `POST /api/students/:id/rating` - Save rating
- `GET /api/students/:id/ratings` - Fetch ratings
- `GET /api/students/rating/branch/:branchId` - Get students for bulk rating

✅ **Data Model** in `backend/models/Student.js`:
- `ratings` array with: subjectId, season, date, rating, ratedAt

## How Ratings Get Saved

### Method 1: Bulk Rate Students (via Teacher/Admin UI)
Teachers or Admins can bulk rate students through a ratings interface:

```javascript
POST /api/students/{studentId}/rating
{
  "subjectId": "507f1f77bcf86cd799439011",
  "season": "Season 1",
  "date": "2024-11-11",
  "rating": "Excellent"  // "Excellent", "Good", "Fair", or "Poor"
}
```

### Method 2: Direct API Call
```javascript
// From frontend
await studentsAPI.saveRating(studentId, {
  subjectId: "507f1f77bcf86cd799439011",
  season: "Season 1",
  date: "2024-11-11",
  rating: "Excellent"
});
```

## How to View Student Ratings

### As a Student
1. Log in to student account
2. Go to "Student Profile"
3. Scroll down to find "Student Ratings" section
4. View your ratings in table format

### As a Teacher
1. Log in to teacher account
2. Navigate to a student's profile (via Students page)
3. View student's ratings in the "Student Ratings" section

### As an Admin
1. Log in to admin account
2. Go to Students page
3. Select a student to view their profile
4. View their ratings in the "Student Ratings" section

## Display Format

### Desktop (≥600px)
```
┌─────────────────────────────────────┐
│      STUDENT RATINGS                │
├──────────┬──────────┬─────────────┤
│ SUBJECT  │  DATE    │   RATING    │
├──────────┼──────────┼─────────────┤
│ English  │11/11/2024│ ✓ Excellent│  (Green)
│ Math     │10/11/2024│ ✓ Good      │  (Blue)
│ Science  │09/11/2024│ ✓ Fair      │  (Orange)
│ History  │08/11/2024│ ✓ Poor      │  (Red)
└──────────┴──────────┴─────────────┘
```

### Mobile (≤600px)
```
┌─────────────────────┐
│ SUBJECT: English    │
│ DATE: 11/11/2024    │
│ RATING: Excellent   │
└─────────────────────┘

┌─────────────────────┐
│ SUBJECT: Math       │
│ DATE: 10/11/2024    │
│ RATING: Good        │
└─────────────────────┘
```

## Rating Levels & Colors

| Rating    | Color  | Hex Code | Display |
|-----------|--------|----------|---------|
| Excellent | Green  | #10b981  | ✓ Excellent |
| Good      | Blue   | #3b82f6  | ✓ Good |
| Fair      | Orange | #f59e0b  | ✓ Fair |
| Poor      | Red    | #ef4444  | ✓ Poor |

## Page Structure in StudentProfile

The Student Ratings section appears in this order:

1. Hero Banner (Student Info)
2. Contact Information Card
3. Training Quizzes
4. **← Student Ratings (NEW)**
5. Student Grades
6. Activities Log

## Testing Checklist

- [ ] Can view student profile
- [ ] Student Ratings section appears
- [ ] Ratings display correctly with colors
- [ ] Dates are sorted newest first
- [ ] Mobile view shows grid cards
- [ ] Empty state message shows when no ratings
- [ ] Hover effects work on desktop
- [ ] Touch-friendly on mobile

## Troubleshooting

### Ratings Not Showing
1. **Check API Response**: Ensure `/api/students/:id/ratings` returns ratings array
2. **Check Backend**: Verify student has ratings in database
3. **Check Browser Console**: Look for API errors
4. **Check Auth**: Teacher/Admin permissions required

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check CSS is loaded (F12 Dev Tools > Styles tab)
- Verify mobile viewport (F12 > Toggle Device Toolbar)

### Translation Issues
- Add translation keys (see IMPLEMENTATION_SUMMARY.md)
- Restart dev server after adding translations
- Check language context is working

## API Reference

### Fetch Ratings
```javascript
GET /api/students/:id/ratings
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "student": { /* student object */ },
    "ratings": [
      {
        "_id": "...",
        "subjectId": "507f1f77bcf86cd799439011",
        "season": "Season 1",
        "date": "2024-11-11T00:00:00.000Z",
        "rating": "Excellent",
        "ratedAt": "2024-11-11T10:30:00.000Z"
      }
    ]
  }
}
```

### Save Rating
```javascript
POST /api/students/:id/rating
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "subjectId": "507f1f77bcf86cd799439011",
  "season": "Season 1",
  "date": "2024-11-11",
  "rating": "Excellent"
}

Response:
{
  "success": true,
  "data": { /* updated student object */ }
}
```

## Features

✅ **Read-only Display** - No editing in StudentProfile
✅ **Sorted by Date** - Most recent first
✅ **Color-coded** - Visual rating levels
✅ **Responsive** - Desktop & mobile
✅ **Accessible** - Proper labels
✅ **Translated** - Multi-language support
✅ **Professional** - Matches existing design

## Related Files

- `frontend/src/pages/StudentProfile.js` - Main display component
- `frontend/src/services/api.js` - API calls
- `backend/models/Student.js` - Data model
- `backend/routes/students.js` - API endpoints

## Questions?

Refer to:
1. IMPLEMENTATION_SUMMARY.md - Full technical details
2. Backend API endpoints in `students.js`
3. Student model schema in `Student.js`
4. React component state management patterns

