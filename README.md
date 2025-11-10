# Student Exercise Platform

A comprehensive web application for structured learning with seasons, chapters, and interactive subjects. Built with React, Node.js, and MongoDB.

## Features

- **Structured Learning**: Organized into seasons, chapters, and subjects
- **Interactive Exercises**: Multiple choice questions with explanations
- **Progress Tracking**: Score tracking and completion status
- **Modern UI**: Beautiful, responsive design with intuitive navigation
- **Real-time Feedback**: Immediate results and explanations for exercises

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling

### Frontend

- **React** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Copy the provided example environment file and update it with your own secrets:

```bash
cp .env.example .env   # on Windows use: copy .env.example .env
```

Then adjust the values as needed—for hosting with MongoDB Atlas you can keep the provided connection string:

```env
PORT=5000
MONGODB_URI=mongodb+srv://mshexani45_db_user:j0ilNwvKkYBzFyuN@cluster0.buvzn1y.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

4. Start MongoDB service (make sure MongoDB is running on your system)

5. Seed the database with sample data:

```bash
node scripts/seedData.js
```

6. Start the backend server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the React development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Home Page**: View all available seasons with statistics
2. **Season Page**: Browse chapters within a season
3. **Chapter Page**: View subjects within a chapter
4. **Subject Page**: Read content and complete exercises

## Features Implemented

- ✅ Responsive design that works on all devices
- ✅ Interactive exercise system with immediate feedback
- ✅ Progress tracking and scoring
- ✅ Breadcrumb navigation
- ✅ Modern UI with hover effects and animations
- ✅ Comprehensive error handling
- ✅ Sample data for testing

## Sample Data

The application includes comprehensive sample data with:

- **2 Seasons**: Fundamentals and Advanced Concepts
- **6 Chapters**: 3 chapters per season
- **Multiple Subjects**: With educational content and exercises
- **Interactive Exercises**: Multiple choice questions with explanations

## License

This project is licensed under the MIT License.
