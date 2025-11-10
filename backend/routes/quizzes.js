const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  optionalAuth,
} = require("../middleware/auth");

const sendResponse = (res, statusCode, success, messageKey, data = null) => {
  res.status(statusCode).json({
    success,
    message: messageKey,
    messageKey: messageKey.includes('.') ? messageKey : null,
    ...(data && { data }),
  });
};

const normalizeQuizPayload = (body, { isUpdate = false } = {}) => {
  const errors = [];

  if (!body?.title || !body.title.trim()) {
    errors.push("api.quiz.titleRequired");
  }

  if (!isUpdate && !body?.chapter) {
    errors.push("api.quiz.chapterRequired");
  }

  if (!Array.isArray(body?.questions) || body.questions.length === 0) {
    errors.push("api.quiz.questionsMinimum");
  }

  if (errors.length) {
    const error = new Error(errors.join(". "));
    error.statusCode = 400;
    throw error;
  }

  const normalizeQuestion = (question, index) => {
    const rawType =
      typeof question?.type === "string" && question.type.trim().length
        ? question.type.trim()
        : "multiple_choice";

    const normalized = {
      order:
        typeof question?.order === "number" && question.order > 0
          ? question.order
          : index + 1,
      type: rawType,
      prompt: typeof question?.prompt === "string" ? question.prompt : "",
      explanation:
        typeof question?.explanation === "string" && question.explanation.trim()
          ? question.explanation
          : undefined,
    };

    if (rawType === "multiple_choice") {
      const rawChoices = Array.isArray(question?.choices)
        ? question.choices
        : [];
      normalized.choices = rawChoices.map((choice, choiceIndex) => ({
        id: choice?.id,
        text: typeof choice?.text === "string" ? choice.text : "",
        isCorrect: choice?.isCorrect === true || choiceIndex === 0,
      }));
    } else if (rawType === "true_false") {
      normalized.correctAnswer =
        question?.correctAnswer === false ? false : true;
    } else if (rawType === "matching") {
      const rawPairs = Array.isArray(question?.pairs) ? question.pairs : [];
      normalized.pairs = rawPairs.map((pair) => ({
        id: pair?.id,
        left: typeof pair?.left === "string" ? pair.left : "",
        right: typeof pair?.right === "string" ? pair.right : "",
      }));
    }

    return normalized;
  };

  const questions = body.questions.map((question, index) => {
    const normalized = normalizeQuestion(question, index);

    if (
      normalized.type === "multiple_choice" &&
      (!Array.isArray(normalized.choices) || normalized.choices.length < 2)
    ) {
      errors.push(
        `api.quiz.multipleChoiceMinimum.${index + 1}`
      );
    }

    return normalized;
  });

  if (errors.length) {
    const error = new Error(errors.join(". "));
    error.statusCode = 400;
    throw error;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("Normalized quiz payload", {
      title: body.title,
      chapter: body.chapter,
      questions: questions.map((question) => ({
        order: question.order,
        type: question.type,
        prompt: question.prompt,
        choicesLength: Array.isArray(question.choices)
          ? question.choices.length
          : undefined,
        trimmedChoicesLength: Array.isArray(question.choices)
          ? question.choices.filter(
              (choice) =>
                typeof choice?.text === "string" &&
                choice.text.trim().length > 0
            ).length
          : undefined,
        choicesPreview: Array.isArray(question.choices)
          ? question.choices.map((choice) => ({
              id: choice.id,
              text: choice.text,
              trimmed:
                typeof choice.text === "string" ? choice.text.trim() : "",
              length: typeof choice.text === "string" ? choice.text.length : 0,
              isCorrect: choice.isCorrect,
            }))
          : undefined,
      })),
    });
  }

  return {
    title: body.title.trim(),
    chapter: body.chapter,
    trainingOnly: body.trainingOnly !== false,
    isActive: body.isActive !== false,
    questions,
  };
};

// GET all quizzes
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { chapter, type, trainingOnly, isActive } = req.query;
    const filter = {};

    if (chapter) {
      filter.chapter = chapter;
    }

    if (type) {
      filter["questions.type"] = type;
    }

    if (trainingOnly !== undefined && trainingOnly !== "all") {
      filter.trainingOnly = trainingOnly === "true";
    }

    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true";
    } else if (isActive === undefined) {
      filter.isActive = true;
    }

    const quizzes = await Quiz.find(filter)
      .populate({
        path: "chapter",
        select: "title titleMultilingual subject season",
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "api.quiz.retrievedSuccessfully", quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    sendResponse(res, 500, false, "api.quiz.failedRetrieve");
  }
});

// GET quizzes by chapter
router.get("/chapter/:chapterId", optionalAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      chapter: req.params.chapterId,
      isActive: true,
    })
      .populate({
        path: "chapter",
        select: "title titleMultilingual subject season",
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "api.quiz.retrievedSuccessfully", quizzes);
  } catch (error) {
    console.error("Error fetching quizzes by chapter:", error);
    sendResponse(res, 500, false, "api.quiz.failedRetrieve");
  }
});

// GET single quiz
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate({
      path: "chapter",
      select: "title titleMultilingual subject season",
    });

    if (!quiz) {
      return sendResponse(res, 404, false, "api.quiz.notFound");
    }

    sendResponse(res, 200, true, "api.quiz.retrievedSuccessfully", quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    sendResponse(res, 500, false, "api.quiz.failedRetrieve");
  }
});

// CREATE quiz
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const payload = normalizeQuizPayload(req.body);
      const quiz = new Quiz(payload);
      const savedQuiz = await quiz.save();
      await savedQuiz.populate({
        path: "chapter",
        select: "title titleMultilingual subject season",
      });

      sendResponse(res, 201, true, "api.quiz.created", savedQuiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      sendResponse(res, error.statusCode || 400, false, error.message);
    }
  }
);

// UPDATE quiz
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);

      if (!quiz) {
        return sendResponse(res, 404, false, "api.quiz.notFound");
      }

      const payload = normalizeQuizPayload(req.body, { isUpdate: true });

      quiz.title = payload.title;
      quiz.trainingOnly = payload.trainingOnly;
      if (payload.chapter) {
        quiz.chapter = payload.chapter;
      }
      quiz.isActive = payload.isActive;
      quiz.questions = payload.questions;

      const updatedQuiz = await quiz.save();
      await updatedQuiz.populate({
        path: "chapter",
        select: "title titleMultilingual subject season",
      });

      sendResponse(res, 200, true, "api.quiz.updated", updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      sendResponse(res, error.statusCode || 400, false, error.message);
    }
  }
);

// UPDATE quiz status
router.patch(
  "/:id/status",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const nextStatus =
        req.body.isActive === true || req.body.isActive === "true";
      const quiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        { isActive: nextStatus },
        { new: true }
      ).populate({
        path: "chapter",
        select: "title titleMultilingual subject season",
      });

      if (!quiz) {
        return sendResponse(res, 404, false, "api.quiz.notFound");
      }

      const action = quiz.isActive ? "activated" : "deactivated";
      sendResponse(res, 200, true, `api.quiz.statusUpdated`, quiz);
    } catch (error) {
      console.error("Error updating quiz status:", error);
      sendResponse(res, 400, false, error.message);
    }
  }
);

// DELETE quiz
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const quiz = await Quiz.findByIdAndDelete(req.params.id);

      if (!quiz) {
        return sendResponse(res, 404, false, "api.quiz.notFound");
      }

      sendResponse(res, 200, true, "api.quiz.deleted");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      sendResponse(res, 500, false, error.message);
    }
  }
);

module.exports = router;
