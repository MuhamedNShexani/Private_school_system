const mongoose = require("mongoose");

const choiceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const matchingPairSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    left: {
      type: String,
      required: true,
      trim: true,
    },
    right: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      default: 1,
      min: 1,
    },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "matching"],
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    choices: [choiceSchema],
    correctAnswer: mongoose.Schema.Types.Mixed,
    pairs: [matchingPairSchema],
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    trainingOnly: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ chapter: 1, createdAt: -1 });
quizSchema.index({ isActive: 1 });
quizSchema.index({ "questions.type": 1 });

quizSchema.pre("validate", function (next) {
  if (!Array.isArray(this.questions) || this.questions.length === 0) {
    return next(new Error("Quiz must include at least one question"));
  }

  this.questions = this.questions.map((question, index) => {
    const questionObject =
      question && typeof question.toObject === "function"
        ? question.toObject({ depopulate: true })
        : { ...question };

    const sanitized = { ...questionObject };
    const originalPrompt =
      typeof questionObject?.prompt === "string" ? questionObject.prompt : "";
    sanitized.type =
      typeof sanitized.type === "string" && sanitized.type.trim()
        ? sanitized.type.trim()
        : "multiple_choice";
    sanitized.order =
      typeof sanitized.order === "number" && sanitized.order > 0
        ? sanitized.order
        : index + 1;

    const promptString =
      typeof sanitized.prompt === "string"
        ? sanitized.prompt
        : originalPrompt;

    sanitized.prompt = promptString.trim();

    if (!sanitized.prompt) {
      throw new Error(`Question ${index + 1} is missing a prompt`);
    }

    sanitized.explanation =
      typeof sanitized.explanation === "string"
        ? sanitized.explanation.trim()
        : undefined;

    if (sanitized.type === "multiple_choice") {
      if (!Array.isArray(sanitized.choices)) {
        sanitized.choices = [];
      }

      if (sanitized.choices.length < 2) {
        throw new Error(
          `Multiple choice question ${index + 1} must have at least two choices`
        );
      }

      const choices = sanitized.choices.map((choice, choiceIndex) => {
        if (!choice?.text || !choice.text.trim()) {
          throw new Error(
            `Choice ${choiceIndex + 1} for question ${index + 1} is missing text`
          );
        }

        return {
          id:
            choice.id ||
            `choice_${index + 1}_${choiceIndex + 1}_${Date.now()}`,
          text: choice.text.trim(),
          isCorrect: !!choice.isCorrect,
        };
      });

      const correctChoices = choices.filter((choice) => choice.isCorrect);
      if (correctChoices.length !== 1) {
        throw new Error(
          `Multiple choice question ${index + 1} must have exactly one correct answer`
        );
      }

      sanitized.choices = choices;
      sanitized.correctAnswer = undefined;
      sanitized.pairs = undefined;
    } else if (sanitized.type === "true_false") {
      if (typeof sanitized.correctAnswer !== "boolean") {
        throw new Error(
          `True/False question ${index + 1} must specify a boolean correctAnswer`
        );
      }
      sanitized.choices = undefined;
      sanitized.pairs = undefined;
    } else if (sanitized.type === "matching") {
      if (!Array.isArray(sanitized.pairs) || sanitized.pairs.length === 0) {
        throw new Error(
          `Matching question ${index + 1} must include at least one pair`
        );
      }

      sanitized.pairs = sanitized.pairs.map((pair, pairIndex) => {
        if (!pair?.left || !pair.left.trim() || !pair?.right || !pair.right.trim()) {
          throw new Error(
            `Matching pair ${pairIndex + 1} for question ${
              index + 1
            } must include both left and right values`
          );
        }

        return {
          id:
            pair.id ||
            `pair_${index + 1}_${pairIndex + 1}_${Date.now()}`,
          left: pair.left.trim(),
          right: pair.right.trim(),
        };
      });

      sanitized.choices = undefined;
      sanitized.correctAnswer = undefined;
    }

    return sanitized;
  });

  next();
});

module.exports = mongoose.model("Quiz", quizSchema);

