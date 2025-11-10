const mongoose = require("mongoose");

const studentGradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  season: {
    type: String,
    required: true,
    enum: [
      // English
      "Season 1",
      "Season 2",
      "Season 3",
      "Season 4",
      // Arabic
      "الموسم الأول",
      "الموسم الثاني",
      "الموسم الثالث",
      "الموسم الرابع",
      // Kurdish
      "وەرزی یەکەم",
      "وەرزی دووەم",
      "وەرزی سێیەم",
      "وەرزی چوارەم",
    ],
  },
  season_exam: {
    type: Number,
    default: 0,
    min: 0,
    max: 60,
  },
  exercises: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  attendance: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  behaviour: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  monthly_exam: {
    type: [Number], // Array to store multiple monthly exam scores (e.g., [10, 10])
    default: [],
    validate: {
      validator: function (exams) {
        // Each exam can be max 20 points, and if 2 exams, total should not exceed 20 (will be averaged)
        // If 1 exam, max is 20. If 2 exams, each max is 20, but they'll be averaged
        const validScores = exams.every((score) => score >= 0 && score <= 20);
        if (!validScores) return false;
        // If 2 exams, ensure they can be averaged to max 20
        if (exams.length === 2) {
          const average = (exams[0] + exams[1]) / 2;
          return average <= 20;
        }
        // If 1 exam, max is 20
        if (exams.length === 1) {
          return exams[0] <= 20;
        }
        // Empty array is fine
        return exams.length === 0 || exams.length <= 2;
      },
      message: "Each monthly exam must be 0-20 points, and if 2 exams are provided, their average must not exceed 20",
    },
  },
  total: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total before saving
studentGradeSchema.pre("save", function (next) {
  let monthlyExamTotal = 0;
  
  if (this.monthly_exam.length > 0) {
    if (this.monthly_exam.length === 2) {
      // Average the two exams
      monthlyExamTotal = (this.monthly_exam[0] + this.monthly_exam[1]) / 2;
    } else if (this.monthly_exam.length === 1) {
      // Single exam value
      monthlyExamTotal = this.monthly_exam[0];
    }
  }

  // Cap monthly exam at 20
  const cappedMonthlyExam = Math.min(monthlyExamTotal, 20);

  this.total =
    (this.season_exam || 0) +
    (this.exercises || 0) +
    (this.attendance || 0) +
    (this.behaviour || 0) +
    cappedMonthlyExam;

  // Cap total at 100
  this.total = Math.min(this.total, 100);

  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one grade per student-subject-season combination
studentGradeSchema.index({ student: 1, subject: 1, season: 1 }, { unique: true });

// Index for efficient queries
studentGradeSchema.index({ student: 1 });
studentGradeSchema.index({ subject: 1 });
studentGradeSchema.index({ season: 1 });

module.exports = mongoose.model("StudentGrade", studentGradeSchema);

