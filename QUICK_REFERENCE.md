# Quick Reference: Student Ratings Feature

## 📍 Location in App
**Page**: Student Profile  
**Section**: Between "Training Quizzes" and "Student Grades"  
**Access**: `/student/profile` or `/student/profile?username={username}`

## 🔑 Key Files
| File | Changes |
|------|---------|
| `frontend/src/pages/StudentProfile.js` | Added ratings section, state, helpers, styles |
| `backend/models/Student.js` | Pre-existing ratings array |
| `backend/routes/students.js` | Pre-existing rating endpoints |

## 📊 Data Structure
```javascript
{
  _id: "...",
  subjectId: "...",
  season: "Season 1",
  date: "2024-11-11",
  rating: "Excellent", // or "Good", "Fair", "Poor"
  ratedAt: "2024-11-11T10:30:00.000Z"
}
```

## 🎨 Colors
| Rating | Color | Hex |
|--------|-------|-----|
| Excellent | 🟢 Green | #10b981 |
| Good | 🔵 Blue | #3b82f6 |
| Fair | 🟠 Orange | #f59e0b |
| Poor | 🔴 Red | #ef4444 |

## 🔌 API Calls
```javascript
// Get ratings
studentsAPI.getRatings(studentId)

// Save rating
studentsAPI.saveRating(studentId, {
  subjectId: "...",
  season: "Season 1",
  date: "2024-11-11",
  rating: "Excellent"
})
```

## 📱 Responsive Layout
| Screen | Layout |
|--------|--------|
| ≥600px | Table with 3 columns |
| ≤600px | 2-column grid cards |

## 🌍 Translation Keys
```
studentProfile.studentRatings
studentProfile.rating
studentProfile.rating.excellent
studentProfile.rating.good
studentProfile.rating.fair
studentProfile.rating.poor
studentProfile.noRatings
```

## ✅ Sorting
- **Order**: Newest date first
- **Method**: `sort((a, b) => new Date(b.date) - new Date(a.date))`

## 🎯 Features
✅ View-only (read-only)  
✅ Date-sorted  
✅ Color-coded  
✅ Responsive  
✅ Empty state  
✅ Translated  
✅ Professional UI  

## 🔄 Data Flow
1. User views StudentProfile
2. Component fetches ratings: `getRatings(studentId)`
3. Data stored in `studentRatings` state
4. Ratings sorted by date (newest first)
5. Rendered in responsive table/cards
6. Color applied based on rating level

## 🎭 States
| State | Display |
|-------|---------|
| Loading | Shows loading indicator |
| No ratings | Shows empty state message |
| Has ratings | Shows sorted ratings table |

## ⚙️ Configuration
```javascript
// Valid rating values
const validRatings = ["Excellent", "Good", "Fair", "Poor"];

// Colors (change in getRatingColor)
getRatingColor("Excellent") // #10b981

// Table columns (always 3)
[Subject, Date, Rating]

// Mobile breakpoint
@media (max-width: 600px) { /* 2-column grid */ }
```

## 🚀 Usage
### As Student
1. Log in
2. Go to "Student Profile"
3. Find "Student Ratings" section
4. View ratings in table/cards

### As Teacher
1. Log in
2. Select student
3. View "Student Ratings" section
4. Ratings are read-only

## 🐛 Common Issues
| Issue | Fix |
|-------|-----|
| Ratings not showing | Check API response and backend data |
| Wrong colors | Verify rating text in database |
| Mobile broken | Test at ≤600px viewport |
| Translations missing | Add keys and restart server |

## 📈 Performance
- ⚡ Data fetched once on mount
- ⚡ In-memory sorting
- ⚡ No repeated API calls
- ⚡ CSS GPU acceleration
- ⚡ Efficient re-renders

## 🔐 Permissions
- **View**: Student, Teacher, Admin
- **Edit**: Admin only (via backend)
- **Create**: Admin/Teacher (separate interface)

## 📋 Checklist
- [ ] StudentProfile.js loaded
- [ ] getRatings() API called
- [ ] Ratings displayed
- [ ] Colors correct
- [ ] Sorted by date
- [ ] Mobile responsive
- [ ] Translations working

## 🔗 Related Documentation
- `IMPLEMENTATION_SUMMARY.md` - Full technical docs
- `SETUP_GUIDE.md` - Setup instructions
- `EXAMPLE_USAGE.md` - Code examples
- `README_RATINGS.md` - Feature docs
- `VISUAL_GUIDE.md` - Visual diagrams

## 📞 Quick Debug
```javascript
// Check ratings in console
console.log(studentRatings);

// Check API response
console.log(ratingsResponse);

// Check if sorted correctly
console.log(
  studentRatings.slice().sort((a,b) => new Date(b.date) - new Date(a.date))
);

// Check color function
console.log(getRatingColor("Excellent")); // Should be #10b981
```

## 🎓 Component State
```javascript
const [studentRatings, setStudentRatings] = useState([]);
// Updated when: Component mounts, getRatings() called
// Used in: JSX rendering, sorting, filtering
```

## 🔄 Update Flow
```
useEffect
  ↓
getRatings(studentId)
  ↓
setStudentRatings(data)
  ↓
Re-render
  ↓
Display table/cards
```

## 📊 Columns (Always 3)
1. **Subject** - Left column
2. **Date** - Middle column
3. **Rating** - Right column (color-coded badge)

## 🎨 Styling
- Tables: `ratings-table` class
- Badges: `rating-badge` class
- Mobile: Grid layout (≤600px)
- Desktop: Table layout (≥600px)

## ⏱️ Timeline
- Ratings sorted newest to oldest
- Date format: MM/DD/YYYY
- Hover effect: 0.2s transition
- Mobile cards: 2-column layout

## 🔑 Key Functions
| Function | Purpose |
|----------|---------|
| `getRatingLabel()` | Convert rating to text |
| `getRatingColor()` | Map rating to color |
| `formatDate()` | Format date display |

## 📦 Dependencies
- React (hooks: useState, useEffect, useCallback)
- api.js (studentsAPI.getRatings)
- TranslationContext (i18n)

## ✨ Highlights
- Clean, professional UI
- Fully responsive
- Multi-language ready
- Error handling
- No editing in StudentProfile
- Rated by teachers/admins
- Read-only for students
- Color-coded for quick recognition

---

**Last Updated**: November 11, 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

