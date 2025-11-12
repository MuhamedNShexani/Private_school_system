# Example Usage: Student Ratings Feature

## Database Example

### Student Document with Ratings
```javascript
{
  "_id": "60d5ec49c1234567890abcde",
  "fullName": "Ahmed Mohammad",
  "email": "ahmed@example.com",
  "username": "ahmed123",
  "class": "60d5ec49c1234567890abc00",
  "branchID": "60d5ec49c1234567890abc01",
  "gender": "Male",
  "createdAt": "2024-01-15",
  "updatedAt": "2024-11-11",
  "ratings": [
    {
      "_id": "60d5ec49c1234567890abf01",
      "subjectId": "60d5ec49c1234567890abc50",
      "season": "Season 1",
      "date": "2024-11-11",
      "rating": "Excellent",
      "ratedAt": "2024-11-11T10:30:00.000Z"
    },
    {
      "_id": "60d5ec49c1234567890abf02",
      "subjectId": "60d5ec49c1234567890abc51",
      "season": "Season 1",
      "date": "2024-11-10",
      "rating": "Good",
      "ratedAt": "2024-11-10T14:20:00.000Z"
    },
    {
      "_id": "60d5ec49c1234567890abf03",
      "subjectId": "60d5ec49c1234567890abc52",
      "season": "Season 1",
      "date": "2024-11-09",
      "rating": "Fair",
      "ratedAt": "2024-11-09T09:15:00.000Z"
    }
  ]
}
```

## React Code Examples

### Using the API in Components

#### Example 1: Fetch and Display Ratings
```javascript
import { studentsAPI } from "../services/api";
import { useState, useEffect } from "react";

function StudentRatingsComponent({ studentId }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await studentsAPI.getRatings(studentId);
        setRatings(response.data?.ratings || []);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [studentId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Student Ratings</h2>
      {ratings.length === 0 ? (
        <p>No ratings available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {ratings
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((rating) => (
                <tr key={rating._id}>
                  <td>{rating.subjectId}</td>
                  <td>{new Date(rating.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${rating.rating.toLowerCase()}`}>
                      {rating.rating}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

#### Example 2: Save a Rating (Admin/Teacher)
```javascript
import { studentsAPI } from "../services/api";
import { useState } from "react";

function RateStudentForm({ studentId, onSuccess }) {
  const [formData, setFormData] = useState({
    subjectId: "",
    season: "Season 1",
    date: new Date().toISOString().split('T')[0],
    rating: "Good"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentsAPI.saveRating(studentId, formData);
      alert("Rating saved successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("Failed to save rating");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Subject ID"
        value={formData.subjectId}
        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
        required
      />
      
      <select
        value={formData.season}
        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
      >
        <option>Season 1</option>
        <option>Season 2</option>
      </select>

      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />

      <select
        value={formData.rating}
        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
      >
        <option>Excellent</option>
        <option>Good</option>
        <option>Fair</option>
        <option>Poor</option>
      </select>

      <button type="submit">Save Rating</button>
    </form>
  );
}
```

## API Call Examples

### Using cURL

#### Get Student Ratings
```bash
curl -X GET \
  "http://localhost:5000/api/students/60d5ec49c1234567890abcde/ratings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "60d5ec49c1234567890abcde",
      "fullName": "Ahmed Mohammad",
      "email": "ahmed@example.com"
    },
    "ratings": [
      {
        "_id": "60d5ec49c1234567890abf01",
        "subjectId": "60d5ec49c1234567890abc50",
        "season": "Season 1",
        "date": "2024-11-11",
        "rating": "Excellent",
        "ratedAt": "2024-11-11T10:30:00.000Z"
      }
    ]
  }
}
```

#### Save Student Rating
```bash
curl -X POST \
  "http://localhost:5000/api/students/60d5ec49c1234567890abcde/rating" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "60d5ec49c1234567890abc50",
    "season": "Season 1",
    "date": "2024-11-11",
    "rating": "Excellent"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "fullName": "Ahmed Mohammad",
    "ratings": [
      {
        "_id": "60d5ec49c1234567890abf01",
        "subjectId": "60d5ec49c1234567890abc50",
        "season": "Season 1",
        "date": "2024-11-11",
        "rating": "Excellent",
        "ratedAt": "2024-11-11T10:30:00.000Z"
      }
    ]
  }
}
```

## Frontend Display Examples

### StudentProfile.js Integration

The ratings are displayed in this section:

```javascript
<div className="profile-card" style={{ gridColumn: "1 / -1" }}>
  <h3>Student Ratings</h3>
  {studentRatings.length === 0 ? (
    <div className="empty-section">
      <p>No ratings have been recorded yet.</p>
    </div>
  ) : (
    <table className="ratings-table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Date</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody>
        {studentRatings
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((rating, index) => (
            <tr key={index}>
              <td>{rating.subjectId}</td>
              <td>{formatDate(rating.date)}</td>
              <td>
                <span
                  className="rating-badge"
                  style={{ backgroundColor: getRatingColor(rating.rating) }}
                >
                  {getRatingLabel(rating.rating)}
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )}
</div>
```

## Complete Flow Example

### Step 1: Teacher Rates a Student
```javascript
// Teacher opens bulk rating interface
await studentsAPI.saveRating("60d5ec49c1234567890abcde", {
  subjectId: "60d5ec49c1234567890abc50",
  season: "Season 1",
  date: "2024-11-11",
  rating: "Excellent"
});
```

### Step 2: Student Views Profile
```javascript
// Student views their profile
const ratingsResponse = await studentsAPI.getRatings("60d5ec49c1234567890abcde");
// Returns: [{ subjectId: "...", rating: "Excellent", date: "2024-11-11", ... }]
```

### Step 3: Rating Displays
- Subject appears in first column
- Date (11/11/2024) appears in second column
- Rating "Excellent" displays in green badge in third column
- Most recent ratings appear first

## Styling Examples

### CSS Classes Used
```css
/* Rating table */
.ratings-table { /* Main table */ }
.ratings-table th { /* Header cells */ }
.ratings-table td { /* Data cells */ }
.ratings-table tbody tr:hover { /* Hover effect */ }

/* Rating badge */
.rating-badge { /* Color-coded badge */ }

/* Colors by rating */
.badge-excellent { background-color: #10b981; } /* Green */
.badge-good { background-color: #3b82f6; }      /* Blue */
.badge-fair { background-color: #f59e0b; }      /* Orange */
.badge-poor { background-color: #ef4444; }      /* Red */
```

## Data Validation Examples

### Valid Rating Values
```javascript
const validRatings = ["Excellent", "Good", "Fair", "Poor"];

// Case-insensitive matching
const normalizedRating = ratingValue.toLowerCase();
if (!validRatings.map(r => r.toLowerCase()).includes(normalizedRating)) {
  throw new Error("Invalid rating value");
}
```

### Date Format
```javascript
// Expected format: YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(dateString)) {
  throw new Error("Date must be in YYYY-MM-DD format");
}
```

## Error Handling Examples

### API Error Response
```javascript
try {
  await studentsAPI.getRatings(studentId);
} catch (error) {
  if (error.response?.status === 404) {
    console.log("Student not found");
  } else if (error.response?.status === 401) {
    console.log("Unauthorized - login required");
  } else {
    console.log("Failed to fetch ratings:", error.message);
  }
}
```

## Testing Examples

### Unit Test
```javascript
describe("StudentRatings", () => {
  it("should display ratings sorted by date", () => {
    const ratings = [
      { date: "2024-11-09", rating: "Good" },
      { date: "2024-11-11", rating: "Excellent" },
      { date: "2024-11-10", rating: "Fair" }
    ];
    
    const sorted = ratings.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    expect(sorted[0].date).toBe("2024-11-11");
    expect(sorted[1].date).toBe("2024-11-10");
    expect(sorted[2].date).toBe("2024-11-09");
  });
});
```

### Integration Test
```javascript
it("should fetch and display student ratings", async () => {
  const studentId = "60d5ec49c1234567890abcde";
  const response = await studentsAPI.getRatings(studentId);
  
  expect(response.success).toBe(true);
  expect(Array.isArray(response.data.ratings)).toBe(true);
  expect(response.data.ratings[0]).toHaveProperty("rating");
  expect(response.data.ratings[0]).toHaveProperty("date");
});
```

