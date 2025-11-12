# Student Ratings Feature Documentation

## 📋 Overview

The Student Ratings feature displays bulk-rated students in a clean, organized table format within the StudentProfile page. Teachers and admins can rate students by subject and date, and the ratings appear automatically in students' profiles.

## 🎯 Features

- ✅ **View-Only Display** - No editing from StudentProfile component
- ✅ **Date-Sorted** - Most recent ratings appear first
- ✅ **Color-Coded** - Visual rating levels (Excellent, Good, Fair, Poor)
- ✅ **Responsive Design** - Desktop tables, mobile grid cards
- ✅ **Multi-Language** - Full translation support
- ✅ **Accessible** - Proper semantic HTML and labels
- ✅ **Professional** - Matches existing design system

## 📁 Files Modified

### Frontend
- `frontend/src/pages/StudentProfile.js` - Added ratings section with table display

### Backend (Pre-existing)
- `backend/routes/students.js` - Rating endpoints
- `backend/models/Student.js` - Rating data model

## 🔄 Data Flow

```
┌─────────────┐
│  Teacher    │
│  Bulk Rate  │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│  POST /rating      │
│  Save to Database  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│  Student Profile   │
│  Fetch Ratings     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│  Display Table     │
│  Color-Coded       │
└────────────────────┘
```

## 📊 Table Structure

### Desktop View (≥600px)
```
┌──────────┬────────────┬──────────────┐
│ SUBJECT  │    DATE    │    RATING    │
├──────────┼────────────┼──────────────┤
│ English  │ 11/11/2024 │ ✓ Excellent  │
│ Math     │ 10/11/2024 │ ✓ Good       │
│ Science  │ 09/11/2024 │ ✓ Fair       │
│ History  │ 08/11/2024 │ ✓ Poor       │
└──────────┴────────────┴──────────────┘
```

### Mobile View (≤600px)
```
Card Layout - 2 Columns
┌─────────────────────┐
│ SUBJECT: English    │
│ DATE: 11/11/2024    │
│ RATING: Excellent   │
└─────────────────────┘
```

## 🎨 Rating Levels & Colors

| Level | Color | Hex | Use Case |
|-------|-------|-----|----------|
| **Excellent** | 🟢 Green | #10b981 | Outstanding performance |
| **Good** | 🔵 Blue | #3b82f6 | Above average |
| **Fair** | 🟠 Orange | #f59e0b | Average performance |
| **Poor** | 🔴 Red | #ef4444 | Below average |

## 🔌 API Endpoints

### Get Student Ratings
```
GET /api/students/:studentId/ratings
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "student": { /* student object */ },
    "ratings": [
      {
        "_id": "...",
        "subjectId": "...",
        "season": "Season 1",
        "date": "2024-11-11",
        "rating": "Excellent",
        "ratedAt": "2024-11-11T10:30:00.000Z"
      }
    ]
  }
}
```

### Save Student Rating
```
POST /api/students/:studentId/rating
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "subjectId": "60d5ec49c1234567890abc50",
  "season": "Season 1",
  "date": "2024-11-11",
  "rating": "Excellent"
}

Response: { "success": true, "data": { /* updated student */ } }
```

## 🌍 Localization Keys

Required translation keys:

```javascript
{
  // Section Title
  "studentProfile.studentRatings": "Student Ratings",
  
  // Column Headers
  "studentProfile.subject": "Subject",
  "studentProfile.date": "Date",
  "studentProfile.rating": "Rating",
  
  // Rating Levels
  "studentProfile.rating.excellent": "Excellent",
  "studentProfile.rating.good": "Good",
  "studentProfile.rating.fair": "Fair",
  "studentProfile.rating.poor": "Poor",
  
  // Empty State
  "studentProfile.noRatings": "No ratings have been recorded yet."
}
```

## 🚀 How to Use

### For Students
1. Log in to your account
2. Navigate to "Student Profile"
3. Find the "Student Ratings" section
4. View your ratings in the table
5. Ratings are sorted by date (newest first)

### For Teachers/Admins
1. Navigate to a student's profile
2. Student Ratings section displays all saved ratings
3. Ratings are read-only in this view
4. To add ratings, use the bulk rating interface (separate page)

## 🔧 Configuration

### Rating Values (Backend Validation)
Edit `backend/routes/students.js` to change valid rating values:

```javascript
const validRatings = ["Excellent", "Good", "Fair", "Poor"];
```

### Colors (Frontend Customization)
Edit `frontend/src/pages/StudentProfile.js`:

```javascript
const getRatingColor = (rating) => {
  switch (rating?.toLowerCase?.() || rating) {
    case "excellent": return "#10b981"; // Change green
    case "good": return "#3b82f6";      // Change blue
    case "fair": return "#f59e0b";      // Change orange
    case "poor": return "#ef4444";      // Change red
  }
};
```

## 📝 Usage Examples

### In StudentProfile Component
```javascript
// State
const [studentRatings, setStudentRatings] = useState([]);

// Fetch ratings
const ratingsResponse = await studentsAPI.getRatings(studentData._id);
setStudentRatings(ratingsResponse.data?.ratings || []);

// Display
{studentRatings
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((rating) => (
    <tr key={rating._id}>
      <td>{rating.subjectId}</td>
      <td>{formatDate(rating.date)}</td>
      <td>
        <span style={{ backgroundColor: getRatingColor(rating.rating) }}>
          {getRatingLabel(rating.rating)}
        </span>
      </td>
    </tr>
  ))}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] View student profile as student
- [ ] View student profile as teacher
- [ ] View student profile as admin
- [ ] Ratings display in table format
- [ ] Color coding correct
- [ ] Dates sorted newest first
- [ ] Mobile view shows grid cards
- [ ] Empty state displays when no ratings
- [ ] Hover effects work on desktop
- [ ] Touch works on mobile

### API Testing
```bash
# Get ratings
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/students/{id}/ratings

# Save rating
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"...","season":"Season 1","date":"2024-11-11","rating":"Excellent"}' \
  http://localhost:5000/api/students/{id}/rating
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Ratings not showing | Check backend returns ratings array in GET endpoint |
| Wrong colors | Verify rating text matches case in getRatingColor() |
| Mobile layout broken | Check viewport meta tag, test at ≤600px |
| Translations missing | Add keys to translation system, restart dev server |
| API 401 error | Verify JWT token is valid and user role has permission |
| API 404 error | Confirm student ID exists, check route parameters |

## 📚 Related Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup instructions
- [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) - Code examples

## 🔄 Recent Changes

- ✨ Added Student Ratings section to StudentProfile
- 🎨 Implemented color-coded rating badges
- 📱 Added responsive mobile design
- 🌍 Added translation support
- 🎯 Sorted ratings by date (newest first)

## 🎓 Architecture

```
StudentProfile.js
├── State Management
│   └── studentRatings (array)
├── Data Fetching
│   └── studentsAPI.getRatings()
├── Helper Functions
│   ├── getRatingLabel()
│   ├── getRatingColor()
│   └── formatDate()
├── UI Components
│   ├── Empty State
│   ├── Table (Desktop)
│   └── Grid Cards (Mobile)
└── Styles
    ├── ratings-table
    ├── rating-badge
    └── Responsive CSS
```

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Review [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) for code samples
3. Check browser console for errors (F12)
4. Verify backend API is running
5. Check user has correct permissions

## 📄 License

This feature is part of the Student Exercise Platform.

---

**Last Updated**: November 11, 2024
**Version**: 1.0.0
**Status**: Ready for Production ✅

