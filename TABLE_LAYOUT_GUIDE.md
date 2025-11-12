# Student Ratings Table Layout Guide

## New 2-Column Format (Date-Based Pivot Table)

### Desktop View (≥600px)

```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ SUBJECT     │ 11/11/2025   │ 10/11/2025   │ 09/11/2025   │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ English     │ ✓ Good       │ ✓ Excellent  │ —            │
│             │ (Blue)       │ (Green)      │              │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ Arabic      │ ✓ Fair       │ —            │ ✓ Good       │
│             │ (Orange)     │              │ (Blue)       │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ Math        │ ✓ Excellent  │ ✓ Good       │ ✓ Excellent  │
│             │ (Green)      │ (Blue)       │ (Green)      │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

**Features:**
- First column: Subject names
- Header columns: Dates (newest to oldest, left to right)
- Data cells: Color-coded ratings
- Empty cells: Show "—" (dash)
- Dates auto-sorted by newest first

### Example with Different Dates

```
┌──────────────┬────────────────┬────────────────┐
│ SUBJECT      │ 11/11/2025     │ 10/11/2025     │
├──────────────┼────────────────┼────────────────┤
│ English      │ ✓ Good         │ ✓ Excellent    │
├──────────────┼────────────────┼────────────────┤
│ Math         │ ✓ Excellent    │ ✓ Good         │
├──────────────┼────────────────┼────────────────┤
│ Science      │ —              │ ✓ Fair         │
└──────────────┴────────────────┴────────────────┘
```

### Mobile View (≤600px)

Each row becomes a card:

```
Card 1 - English:
┌─────────────────────────────────────┐
│ SUBJECT: English                    │
│ 11/11/2025: Good (Blue Badge)      │
│ 10/11/2025: Excellent (Green)      │
└─────────────────────────────────────┘

Card 2 - Arabic:
┌─────────────────────────────────────┐
│ SUBJECT: Arabic                     │
│ 11/11/2025: Fair (Orange Badge)    │
│ 10/11/2025: — (No rating)          │
└─────────────────────────────────────┘

Card 3 - Math:
┌─────────────────────────────────────┐
│ SUBJECT: Math                       │
│ 11/11/2025: Excellent (Green)      │
│ 10/11/2025: Good (Blue Badge)      │
└─────────────────────────────────────┘
```

## How It Works

### Data Processing
1. **Extract Unique Dates**: Get all unique dates from ratings, sort newest first
2. **Extract Unique Subjects**: Get all unique subject IDs
3. **Create Table Headers**: Subject column + Date columns
4. **Populate Cells**: For each Subject-Date combination, find matching rating
5. **Handle Missing Data**: Show "—" if no rating exists for that combination

### Example Algorithm
```javascript
// Get unique dates (newest first)
const dates = Array.from(
  new Set(ratings.map(r => r.date))
).sort((a, b) => new Date(b) - new Date(a));

// Get unique subjects
const subjects = Array.from(
  new Set(ratings.map(r => r.subjectId))
);

// For each subject-date combo, find rating
ratings.find(r => 
  r.subjectId === subject && 
  r.date === date
);
```

## Data Structure Example

### Input Data
```javascript
[
  {
    subjectId: "English",
    date: "2025-11-11",
    rating: "Good"
  },
  {
    subjectId: "English",
    date: "2025-10-11",
    rating: "Excellent"
  },
  {
    subjectId: "Arabic",
    date: "2025-11-11",
    rating: "Fair"
  },
  {
    subjectId: "Arabic",
    date: "2025-10-11",
    rating: null  // No rating for this date
  },
  {
    subjectId: "Math",
    date: "2025-11-11",
    rating: "Excellent"
  }
]
```

### Output Table
```
SUBJECT  | 11/11/2025 | 10/11/2025
---------|------------|-----------
English  | Good       | Excellent
Arabic   | Fair       | —
Math     | Excellent  | —
```

## Advantages of This Layout

✅ **Compact**: See all ratings for a subject across dates in one row  
✅ **Comparative**: Easy to compare ratings across dates  
✅ **Scalable**: Handles multiple dates automatically  
✅ **Clear**: Visual comparison of performance over time  
✅ **Professional**: Pivot-table style presentation  

## Color Coding

All ratings still use the same color scheme:

| Rating | Color | Badge |
|--------|-------|-------|
| Excellent | Green | ✓ Excellent |
| Good | Blue | ✓ Good |
| Fair | Orange | ✓ Fair |
| Poor | Red | ✓ Poor |

## Empty Cells

When a subject has no rating for a specific date:

```
┌─────────────────────┐
│ —                   │
│ (light gray dash)   │
└─────────────────────┘
```

Style: `color: #cbd5e1; font-size: 1.5rem;`

## Column Management

### Dynamic Columns
- Columns are generated based on unique dates
- New dates automatically add new columns
- Dates always sorted newest to oldest
- No need to manually configure

### Column Headers
- First column: "SUBJECT"
- Other columns: Formatted dates (e.g., "11/11/2025")
- Format: MM/DD/YYYY
- Uses `formatDate()` function

## Responsive Behavior

### Desktop (≥600px)
- Full table view
- All columns visible (horizontal scroll if many dates)
- Professional table layout
- Hover effects on rows

### Mobile (≤600px)
- Converts to card layout
- One row = one card
- Each card shows subject name
- Each card shows all date-rating pairs

## Use Cases

### Scenario 1: Student with Ratings on Multiple Dates
```
Student: Ahmed
┌────────────┬─────────────┬─────────────┐
│ SUBJECT    │ 11/11/2025  │ 10/11/2025  │
├────────────┼─────────────┼─────────────┤
│ English    │ Excellent   │ Good        │
│ Math       │ Good        │ Good        │
│ Science    │ Fair        │ Excellent   │
└────────────┴─────────────┴─────────────┘
```

### Scenario 2: Student with Partial Ratings
```
Student: Sara
┌────────────┬─────────────┬─────────────┐
│ SUBJECT    │ 11/11/2025  │ 10/11/2025  │
├────────────┼─────────────┼─────────────┤
│ English    │ Good        │ —           │
│ Math       │ Excellent   │ Good        │
│ Science    │ —           │ —           │
└────────────┴─────────────┴─────────────┘
```

### Scenario 3: Student with Single Rating
```
Student: Hassan
┌────────────┬─────────────┐
│ SUBJECT    │ 11/11/2025  │
├────────────┼─────────────┤
│ English    │ Excellent   │
│ Math       │ Good        │
└────────────┴─────────────┘
```

## Implementation Details

### Table Generation Code
```javascript
// Header row with dates
<thead>
  <tr>
    <th>Subject</th>
    {uniqueDates.map(date => (
      <th key={date}>{formatDate(date)}</th>
    ))}
  </tr>
</thead>

// Body rows with subjects
<tbody>
  {uniqueSubjects.map(subject => (
    <tr key={subject}>
      <td>{subject}</td>
      {uniqueDates.map(date => {
        const rating = findRating(subject, date);
        return (
          <td key={`${subject}-${date}`}>
            {rating ? (
              <span className="rating-badge">
                {getRatingLabel(rating.rating)}
              </span>
            ) : (
              <span className="no-rating">—</span>
            )}
          </td>
        );
      })}
    </tr>
  ))}
</tbody>
```

## Performance

- ✅ Efficiently sorts unique values
- ✅ Uses Set to avoid duplicates
- ✅ Single pass through data
- ✅ Minimal re-renders
- ✅ Scales well with more data

## Browser Support

Works on all modern browsers that support:
- ES6 (Set, Array methods)
- CSS Grid and Flexbox
- CSS Gradients
- CSS Transitions

## Accessibility

- ✅ Proper table semantics
- ✅ Data labels on mobile
- ✅ Color + text for ratings
- ✅ Semantic HTML structure
- ✅ Keyboard navigable

## Future Enhancements

1. Add filtering by subject
2. Add filtering by date range
3. Add sorting by subject or rating
4. Add export to CSV
5. Add trend indicators (↑↓)
6. Add tooltips on hover
7. Add date range selector
8. Add comparison between students

---

**Version**: 2.0 (Updated with Pivot Table Layout)  
**Date**: November 11, 2025  
**Status**: ✅ Implemented

