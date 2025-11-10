const mongoose = require("mongoose");

const studentExerciseGradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: function() {
      return this.gradingType === 'exercise' || !this.gradingType;
    },
  },
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part",
    required: function() {
      return this.gradingType === 'exercise' || !this.gradingType;
    },
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: function() {
      return this.gradingType === 'exercise' || !this.gradingType;
    },
  },
  gradingType: {
    type: String,
    enum: ['exercise', 'monthly_exam', 'attendance', 'behaviour', 'season_exam'],
    default: 'exercise',
  },
  monthlyExamNumber: {
    type: String,
    enum: ['1', '2'],
    default: undefined,
    required: false,
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Season",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  grade: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        // For exercise type, max grade should match the exercise degree
        // For other types, use appropriate max values
        if (this.gradingType === 'exercise' || !this.gradingType) {
          const maxValue = this.exerciseDegree || 10;
          return value >= 0 && value <= maxValue;
        } else if (this.gradingType === 'monthly_exam') {
          return value >= 0 && value <= 20;
        } else if (this.gradingType === 'attendance' || this.gradingType === 'behaviour') {
          return value >= 0 && value <= 5;
        } else if (this.gradingType === 'season_exam') {
          return value >= 0 && value <= 60;
        }
        return value >= 0;
      },
      message: function(props) {
        if (this.gradingType === 'exercise' || !this.gradingType) {
          const maxValue = this.exerciseDegree || 10;
          return `Grade ${props.value} exceeds the maximum allowed value of ${maxValue} for this exercise`;
        } else if (this.gradingType === 'monthly_exam') {
          return `Grade ${props.value} exceeds the maximum allowed value of 20 for monthly exam`;
        } else if (this.gradingType === 'attendance' || this.gradingType === 'behaviour') {
          return `Grade ${props.value} exceeds the maximum allowed value of 5`;
        } else if (this.gradingType === 'season_exam') {
          return `Grade ${props.value} exceeds the maximum allowed value of 60 for season exam`;
        }
        return `Invalid grade value: ${props.value}`;
      }
    },
  },
  exerciseDegree: {
    type: Number,
    required: function() {
      return this.gradingType === 'exercise' || !this.gradingType;
    },
    default: 10,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gradedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Update the updatedAt field before saving
studentExerciseGradeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
studentExerciseGradeSchema.index({ student: 1 });
studentExerciseGradeSchema.index({ exercise: 1 });
studentExerciseGradeSchema.index({ part: 1 });
studentExerciseGradeSchema.index({ chapter: 1 });
studentExerciseGradeSchema.index({ season: 1 });
studentExerciseGradeSchema.index({ subject: 1 });
studentExerciseGradeSchema.index({ class: 1 });
studentExerciseGradeSchema.index({ gradingType: 1 });
// Unique index only for exercise type - only apply when exercise is an ObjectId
// This prevents duplicate exercise entries but allows multiple non-exercise entries
// Note: Cannot use sparse with partialFilterExpression, so we only use partialFilterExpression
studentExerciseGradeSchema.index({ 
  student: 1, 
  exercise: 1 
}, { 
  unique: true,
  partialFilterExpression: { exercise: { $type: "objectId" } }
});
// For non-exercise types, we need a unique constraint on student + subject + season + gradingType + monthlyExamNumber
// This prevents duplicate entries for the same type (e.g., multiple season_exam entries)
// Note: We check that exercise is null (non-exercise types have null exercise)
studentExerciseGradeSchema.index({ 
  student: 1, 
  subject: 1, 
  season: 1, 
  gradingType: 1, 
  monthlyExamNumber: 1 
}, { 
  unique: true,
  partialFilterExpression: { exercise: null }
});
studentExerciseGradeSchema.index({ gradedBy: 1 });
studentExerciseGradeSchema.index({ gradedAt: -1 });

module.exports = mongoose.model("StudentExerciseGrade", studentExerciseGradeSchema);

