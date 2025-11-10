import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ClipboardList,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  X,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { useTranslation } from "../contexts/TranslationContext";
import { useAuth } from "../contexts/AuthContext";
import { chaptersAPI, quizzesAPI } from "../services/api";

const createId = () => Math.random().toString(36).slice(2, 10);

const createChoice = (overrides = {}) => ({
  id: createId(),
  text: "",
  isCorrect: false,
  ...overrides,
});

const createPair = () => ({
  id: createId(),
  left: "",
  right: "",
});

const createQuestion = (type = "multiple_choice") => {
  switch (type) {
    case "true_false":
      return {
        id: createId(),
        order: 0,
        type,
        prompt: "",
        explanation: "",
        choices: [],
        correctAnswer: true,
        pairs: [],
      };
    case "matching":
      return {
        id: createId(),
        order: 0,
        type,
        prompt: "",
        explanation: "",
        choices: [],
        correctAnswer: null,
        pairs: [createPair()],
      };
    default:
      return {
        id: createId(),
        order: 0,
        type: "multiple_choice",
        prompt: "",
        explanation: "",
        choices: [createChoice({ isCorrect: true }), createChoice()],
        correctAnswer: null,
        pairs: [],
      };
  }
};

const ChapterQuizzes = () => {
  const { chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();

  const canManageQuizzes = user?.role === "Admin" || user?.role === "Teacher";

  const [chapter, setChapter] = useState(location.state?.chapter || null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    trainingOnly: true,
    isActive: true,
    questions: [createQuestion()],
  });
  const [formError, setFormError] = useState(null);

  const quizTypeOptions = useMemo(
    () => [
      {
        value: "multiple_choice",
        label: t("quiz.type.multiple_choice", "Multiple Choice"),
      },
      {
        value: "true_false",
        label: t("quiz.type.true_false", "True or False"),
      },
      { value: "matching", label: t("quiz.type.matching", "Matching") },
    ],
    [t]
  );

  const getLocalizedText = (value, fallback = "") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;

    if (typeof value === "object") {
      const directMatch =
        value[currentLanguage] || value.en || value.ar || value.ku;
      if (directMatch) return directMatch;
    }

    return fallback;
  };

  const formatDate = (date) => {
    if (!date) return t("common.na", "N/A");
    return new Date(date).toLocaleDateString("en-GB");
  };

  const fetchChapter = useCallback(async () => {
    try {
      const response = await chaptersAPI.getById(chapterId);
      const chapterData = response.data?.data || response.data || null;
      setChapter(chapterData);
    } catch (err) {
      console.error("Failed to fetch chapter:", err);
      setError(
        t(
          "chapterQuizzes.error.chapter",
          "Unable to load chapter details. Please try again."
        )
      );
    }
  }, [chapterId, t]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const params = {
        chapter: chapterId,
        isActive: canManageQuizzes ? "all" : true,
      };
      const response = await quizzesAPI.getAll(params);
      const data = response.data?.data || response.data || [];
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
      setError(
        t(
          "chapterQuizzes.error.quizzes",
          "Unable to load quizzes for this chapter."
        )
      );
      setQuizzes([]);
    }
  }, [canManageQuizzes, chapterId, t]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchChapter(), fetchQuizzes()]);
      setLoading(false);
    };

    loadData();
  }, [
    chapterId,
    canManageQuizzes,
    currentLanguage,
    fetchChapter,
    fetchQuizzes,
  ]);

  const resetForm = () => {
    setFormData({
      title: "",
      trainingOnly: true,
      isActive: true,
      questions: [createQuestion()],
    });
    setFormError(null);
  };

  const normalizeQuestionForForm = (question) => {
    const base = {
      id: question.id || createId(),
      order: question.order || 0,
      type: question.type || "multiple_choice",
      prompt: question.prompt || "",
      explanation: question.explanation || "",
      choices: [],
      correctAnswer: null,
      pairs: [],
    };

    if (base.type === "multiple_choice") {
      const choices = Array.isArray(question.choices) ? question.choices : [];
      const ensuredChoices =
        choices.length >= 2
          ? choices
          : [
              ...choices,
              ...Array.from({ length: 2 - choices.length }, () =>
                createChoice()
              ),
            ];
      base.choices = ensuredChoices.map((choice, index) => ({
        id: choice.id || createId(),
        text: choice.text || "",
        isCorrect:
          typeof choice.isCorrect === "boolean"
            ? choice.isCorrect
            : index === 0,
      }));
    } else if (base.type === "true_false") {
      base.correctAnswer =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : true;
    } else if (base.type === "matching") {
      const pairs = Array.isArray(question.pairs) ? question.pairs : [];
      base.pairs =
        pairs.length > 0
          ? pairs.map((pair) => ({
              id: pair.id || createId(),
              left: pair.left || "",
              right: pair.right || "",
            }))
          : [createPair()];
    }

    return base;
  };

  const openModal = (quiz = null) => {
    if (!canManageQuizzes) return;

    if (quiz) {
      setEditingQuiz(quiz);
      const questions =
        Array.isArray(quiz.questions) && quiz.questions.length > 0
          ? quiz.questions.map(normalizeQuestionForForm)
          : [createQuestion()];
      setFormData({
        title: getLocalizedText(
          quiz.titleMultilingual || quiz.title,
          quiz.title || ""
        ),
        trainingOnly: quiz.trainingOnly !== false,
        isActive: quiz.isActive !== false,
        questions,
      });
    } else {
      setEditingQuiz(null);
      resetForm();
    }

    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuiz(null);
    resetForm();
    setError(null);
  };

  const updateQuestion = (questionId, updater) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        const updated =
          typeof updater === "function"
            ? updater(question)
            : { ...question, ...updater };

        return {
          ...updated,
          prompt:
            typeof updated.prompt === "string"
              ? updated.prompt
              : typeof question.prompt === "string"
              ? question.prompt
              : "",
          type:
            typeof updated.type === "string" && updated.type.trim()
              ? updated.type.trim()
              : question.type || "multiple_choice",
        };
      }),
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, createQuestion()],
    }));
  };

  const removeQuestion = (questionId) => {
    setFormData((prev) => {
      if (prev.questions.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        questions: prev.questions.filter(
          (question) => question.id !== questionId
        ),
      };
    });
  };

  const handleQuestionTypeChange = (questionId, nextType) => {
    updateQuestion(questionId, (question) => {
      const next = createQuestion(nextType);
      return {
        ...next,
        id: question.id,
        order: question.order,
        prompt: typeof question.prompt === "string" ? question.prompt : "",
        explanation: question.explanation,
      };
    });
  };

  const addChoice = (questionId) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "multiple_choice") return question;
      const currentChoices = Array.isArray(question.choices)
        ? question.choices
        : [];
      if (currentChoices.length >= 6) return question;
      return {
        ...question,
        choices: [...currentChoices, createChoice()],
      };
    });
  };

  const removeChoice = (questionId, choiceId) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "multiple_choice") return question;
      const currentChoices = Array.isArray(question.choices)
        ? question.choices
        : [];
      if (question.choices.length <= 2) return question;
      const updatedChoices = question.choices.filter(
        (choice) => choice.id !== choiceId
      );
      if (!updatedChoices.some((choice) => choice.isCorrect)) {
        updatedChoices[0] = { ...updatedChoices[0], isCorrect: true };
      }
      return {
        ...question,
        choices: updatedChoices,
      };
    });
  };

  const updateChoice = (questionId, choiceId, updater) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "multiple_choice") return question;
      const currentChoices = Array.isArray(question.choices)
        ? question.choices
        : [];
      return {
        ...question,
        choices: currentChoices.map((choice) =>
          choice.id === choiceId
            ? typeof updater === "function"
              ? updater(choice)
              : { ...choice, ...updater }
            : choice
        ),
      };
    });
  };

  const setCorrectChoice = (questionId, choiceId) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "multiple_choice") return question;
      return {
        ...question,
        choices: question.choices.map((choice) => ({
          ...choice,
          isCorrect: choice.id === choiceId,
        })),
      };
    });
  };

  const addPair = (questionId) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "matching") return question;
      return { ...question, pairs: [...question.pairs, createPair()] };
    });
  };

  const removePair = (questionId, pairId) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "matching") return question;
      if (question.pairs.length <= 1) return question;
      return {
        ...question,
        pairs: question.pairs.filter((pair) => pair.id !== pairId),
      };
    });
  };

  const updatePair = (questionId, pairId, updater) => {
    updateQuestion(questionId, (question) => {
      if (question.type !== "matching") return question;
      return {
        ...question,
        pairs: question.pairs.map((pair) =>
          pair.id === pairId
            ? typeof updater === "function"
              ? updater(pair)
              : { ...pair, ...updater }
            : pair
        ),
      };
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return t("chapterQuizzes.error.title", "Quiz title is required.");
    }

    if (!formData.questions.length) {
      return t(
        "chapterQuizzes.error.questionsRequired",
        "Please add at least one question."
      );
    }

    for (const question of formData.questions) {
      if (!question.type) {
        return t(
          "chapterQuizzes.error.typeRequired",
          "Each question needs a quiz type."
        );
      }

      if (!question.prompt.trim()) {
        return t(
          "chapterQuizzes.error.questionPrompt",
          "Each question needs a prompt."
        );
      }

      if (question.type === "multiple_choice") {
        if (question.choices.length < 2) {
          return t(
            "chapterQuizzes.error.choiceCount",
            "Multiple choice questions need at least two choices."
          );
        }

        if (question.choices.some((choice) => !choice.text.trim())) {
          return t(
            "chapterQuizzes.error.choiceText",
            "All choices must have text."
          );
        }

        if (!question.choices.some((choice) => choice.isCorrect)) {
          return t(
            "chapterQuizzes.error.correctChoice",
            "Please mark exactly one correct answer for each multiple choice question."
          );
        }
      }

      if (question.type === "matching") {
        if (
          !question.pairs.length ||
          question.pairs.some((pair) => !pair.left.trim() || !pair.right.trim())
        ) {
          return t(
            "chapterQuizzes.error.matchingPairs",
            "Matching questions need complete pairs."
          );
        }
      }

      if (
        question.type === "true_false" &&
        typeof question.correctAnswer !== "boolean"
      ) {
        return t(
          "chapterQuizzes.error.trueFalseAnswer",
          "True/False questions need a correct answer."
        );
      }
    }

    return null;
  };

  const buildPayloadQuestions = () =>
    formData.questions.map((question, index) => {
      const type = question.type || "multiple_choice";
      const promptSource =
        typeof question.prompt === "string" ? question.prompt : "";
      const base = {
        order: index + 1,
        type,
        prompt: promptSource.trim(),
        explanation: question.explanation?.trim() || undefined,
      };

      if (type === "multiple_choice") {
        const rawChoices = Array.isArray(question.choices)
          ? question.choices
          : [];
        const ensuredChoices =
          rawChoices.length >= 2
            ? rawChoices
            : [
                ...rawChoices,
                ...Array.from({ length: 2 - rawChoices.length }, () =>
                  createChoice()
                ),
              ];

        const normalizedChoices = ensuredChoices.map((choice, choiceIndex) => ({
          id: choice.id || createId(),
          text: (choice.text || "").trim(),
          isCorrect:
            typeof choice.isCorrect === "boolean"
              ? choice.isCorrect
              : choiceIndex === 0,
        }));

        if (!normalizedChoices.some((choice) => choice.isCorrect)) {
          normalizedChoices[0] = { ...normalizedChoices[0], isCorrect: true };
        }

        base.choices = normalizedChoices;
      } else if (type === "true_false") {
        base.correctAnswer = question.correctAnswer === false ? false : true;
      } else if (type === "matching") {
        base.pairs = question.pairs.map((pair) => ({
          id: pair.id || createId(),
          left: pair.left.trim(),
          right: pair.right.trim(),
        }));
      }

      return base;
    });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManageQuizzes) return;

    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("Current quiz form data", formData);
    }

    const payload = {
      title: formData.title.trim(),
      chapter: chapterId,
      trainingOnly: formData.trainingOnly !== false,
      isActive: formData.isActive !== false,
      questions: buildPayloadQuestions(),
    };

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("Submitting quiz payload", payload);
    }

    try {
      if (editingQuiz) {
        await quizzesAPI.update(editingQuiz._id, payload);
      } else {
        await quizzesAPI.create(payload);
      }
      await fetchQuizzes();
      closeModal();
    } catch (err) {
      const serverMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.join(". ")
          : null);
      console.error("Failed to save quiz:", err.response?.data || err);
      setFormError(
        serverMessage ||
          t("chapterQuizzes.error.save", "Failed to save the quiz.")
      );
    }
  };

  const handleStatusToggle = async (quiz) => {
    if (!canManageQuizzes) return;

    try {
      await quizzesAPI.updateStatus(quiz._id, !quiz.isActive);
      await fetchQuizzes();
    } catch (err) {
      console.error("Failed to update quiz status:", err);
      setError(
        err.response?.data?.message ||
          t("chapterQuizzes.error.status", "Failed to update quiz status.")
      );
    }
  };

  const handleDelete = async (quiz) => {
    if (!canManageQuizzes) return;

    const confirmed = window.confirm(
      t(
        "chapterQuizzes.confirmDelete",
        "Are you sure you want to delete this quiz?"
      )
    );

    if (!confirmed) return;

    try {
      await quizzesAPI.delete(quiz._id);
      await fetchQuizzes();
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      setError(
        err.response?.data?.message ||
          t("chapterQuizzes.error.delete", "Failed to delete the quiz.")
      );
    }
  };

  const summarizeQuestionTypes = (quiz) => {
    const uniqueTypes = Array.from(
      new Set((quiz.questions || []).map((question) => question.type))
    );

    return uniqueTypes
      .map((type) => {
        switch (type) {
          case "multiple_choice":
            return t("quiz.type.multiple_choice", "Multiple Choice");
          case "true_false":
            return t("quiz.type.true_false", "True or False");
          case "matching":
            return t("quiz.type.matching", "Matching");
          default:
            return null;
        }
      })
      .filter(Boolean)
      .join(" • ");
  };

  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [quizzes]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          {t("msg.loading_programs", "Loading programs...")}
        </div>
      </div>
    );
  }

  if (error && !showModal) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="btn btn-secondary" onClick={fetchQuizzes}>
          {t("btn.retry", "Retry")}
        </button>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="container">
        <div className="error">
          {t(
            "chapterQuizzes.error.noChapter",
            "Chapter details not available."
          )}
        </div>
      </div>
    );
  }

  const chapterTitle = getLocalizedText(
    chapter.titleMultilingual || chapter.title,
    chapter.title || ""
  );

  const subjectTitle = getLocalizedText(
    chapter.subject?.titleMultilingual || chapter.subject?.title,
    chapter.subject?.title || ""
  );

  const renderQuestionBuilder = (question, index) => (
    <div key={question.id} className="question-card">
      <div className="question-card-header">
        <div className="question-title">
          <span className="badge">{index + 1}</span>
          <span>{t("chapterQuizzes.questionLabel", "Question")}</span>
        </div>
        <div className="question-controls">
          <select
            value={question.type}
            onChange={(e) =>
              handleQuestionTypeChange(question.id, e.target.value)
            }
          >
            {quizTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formData.questions.length > 1 && (
            <button
              type="button"
              className="icon-button"
              onClick={() => removeQuestion(question.id)}
              title={t("chapterQuizzes.removeQuestion", "Remove question")}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>{t("chapterQuizzes.prompt", "Question prompt")}</label>
        <textarea
          value={question.prompt}
          onChange={(e) =>
            updateQuestion(question.id, { prompt: e.target.value })
          }
          rows="3"
          required
        />
      </div>

      {question.type === "multiple_choice" && (
        <div className="choices-section">
          <div className="choices-header">
            <h4>{t("chapterQuizzes.choices", "Choices")}</h4>
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={() => addChoice(question.id)}
              disabled={question.choices.length >= 6}
            >
              <Plus size={14} />
              {t("chapterQuizzes.addChoice", "Add choice")}
            </button>
          </div>
          {question.choices.map((choice, choiceIndex) => (
            <div key={choice.id} className="choice-row">
              <label className="choice-radio">
                <input
                  type="radio"
                  name={`question-${question.id}-correct`}
                  checked={choice.isCorrect}
                  onChange={() => setCorrectChoice(question.id, choice.id)}
                />
                <span>
                  {t("chapterQuizzes.correctAnswer", "Correct answer")}
                </span>
              </label>
              <input
                type="text"
                value={choice.text}
                onChange={(e) =>
                  updateChoice(question.id, choice.id, { text: e.target.value })
                }
                placeholder={`${t("chapterQuizzes.choice", "Choice")} ${
                  choiceIndex + 1
                }`}
              />
              {question.choices.length > 2 && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeChoice(question.id, choice.id)}
                  title={t("chapterQuizzes.removeChoice", "Remove choice")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="form-group">
          <label>{t("chapterQuizzes.correctAnswer", "Correct answer")}</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                checked={question.correctAnswer === true}
                onChange={() =>
                  updateQuestion(question.id, { correctAnswer: true })
                }
              />
              {t("chapterQuizzes.true", "True")}
            </label>
            <label>
              <input
                type="radio"
                checked={question.correctAnswer === false}
                onChange={() =>
                  updateQuestion(question.id, { correctAnswer: false })
                }
              />
              {t("chapterQuizzes.false", "False")}
            </label>
          </div>
        </div>
      )}

      {question.type === "matching" && (
        <div className="matching-section">
          <div className="choices-header">
            <h4>{t("chapterQuizzes.pairs", "Pairs")}</h4>
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={() => addPair(question.id)}
            >
              <Plus size={14} />
              {t("chapterQuizzes.addPair", "Add pair")}
            </button>
          </div>
          {question.pairs.map((pair, pairIndex) => (
            <div key={pair.id} className="pair-row">
              <input
                type="text"
                value={pair.left}
                onChange={(e) =>
                  updatePair(question.id, pair.id, { left: e.target.value })
                }
                placeholder={`${t("chapterQuizzes.left", "Left")} ${
                  pairIndex + 1
                }`}
              />
              <span className="pair-divider">⇔</span>
              <input
                type="text"
                value={pair.right}
                onChange={(e) =>
                  updatePair(question.id, pair.id, { right: e.target.value })
                }
                placeholder={`${t("chapterQuizzes.right", "Right")} ${
                  pairIndex + 1
                }`}
              />
              {question.pairs.length > 1 && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removePair(question.id, pair.id)}
                  title={t("chapterQuizzes.removePair", "Remove pair")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label>
          {t("chapterQuizzes.explanation", "Explanation (optional)")}
        </label>
        <textarea
          value={question.explanation}
          onChange={(e) =>
            updateQuestion(question.id, { explanation: e.target.value })
          }
          rows="2"
          placeholder={t(
            "chapterQuizzes.explanationHint",
            "Short feedback shown after answering."
          )}
        />
      </div>
    </div>
  );

  return (
    <div className="chapter-quizzes-page">
      <div className="container">
        <div className="page-header">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <ChevronLeft size={16} />
            {t("btn.back", "Back")}
          </button>
          <h1>
            <ClipboardList
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {t("chapterQuizzes.title", "Chapter Quizzes")}
          </h1>
          <p>
            {t("chapterQuizzes.subtitle", "Training quizzes for")}{" "}
            <strong>{chapterTitle}</strong>
          </p>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <div className="chapter-overview">
          <div className="overview-card">
            <div className="overview-icon">
              <BookOpen size={20} />
            </div>
            <div className="overview-content">
              <h3>{t("chapterQuizzes.chapter", "Chapter")}</h3>
              <span>{chapterTitle}</span>
            </div>
          </div>
          {subjectTitle && (
            <div className="overview-card">
              <div className="overview-icon">
                <BookOpen size={20} />
              </div>
              <div className="overview-content">
                <h3>{t("chapterQuizzes.subject", "Subject")}</h3>
                <span>{subjectTitle}</span>
              </div>
            </div>
          )}
          <div className="overview-card">
            <div className="overview-icon">
              <ClipboardList size={20} />
            </div>
            <div className="overview-content">
              <h3>{t("chapterQuizzes.count", "Training Quizzes")}</h3>
              <span>{sortedQuizzes.length}</span>
            </div>
          </div>
        </div>

        <div className="quizzes-header">
          <div>
            <h2>{t("chapterQuizzes.trainingTitle", "Training Quizzes")}</h2>
            <p className="note">
              {t(
                "programs.training_quizzes_note",
                "Training quizzes help students practice and do not affect their degree."
              )}
            </p>
          </div>
          {canManageQuizzes && (
            <button
              className="btn btn-primary"
              onClick={() => openModal()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              {t("btn.add_quiz", "Add Quiz")}
            </button>
          )}
        </div>

        {sortedQuizzes.length === 0 ? (
          <div className="empty-section">
            <ClipboardList size={32} color="#9ca3af" />
            <p>
              {t(
                "chapterQuizzes.empty",
                "No training quizzes available for this chapter yet."
              )}
            </p>
          </div>
        ) : (
          <div className="quizzes-grid">
            {sortedQuizzes.map((quiz) => {
              const quizTitle = getLocalizedText(
                quiz.titleMultilingual || quiz.title,
                quiz.title || t("chapterQuizzes.untitled", "Untitled Quiz")
              );
              const updatedAt = formatDate(quiz.updatedAt || quiz.createdAt);
              const questionCount = quiz.questions?.length || 0;
              const questionSummary = summarizeQuestionTypes(quiz);
              const firstQuestion = quiz.questions?.[0]?.prompt;

              return (
                <div
                  key={quiz._id}
                  className={`quiz-card ${
                    quiz.isActive ? "" : "inactive-card"
                  }`}
                >
                  <div className="quiz-card-header">
                    <div className="quiz-card-title">
                      <ClipboardList size={20} />
                      <div>
                        <h3>{quizTitle}</h3>
                        <span className="quiz-type">
                          {questionSummary || t("common.na", "N/A")}
                        </span>
                      </div>
                    </div>
                    <span className="training-pill">
                      {quiz.trainingOnly !== false
                        ? t("programs.training_only_label", "Training Only")
                        : t("chapterQuizzes.assessment", "Assessment")}
                    </span>
                  </div>

                  <div className="quiz-overview">
                    <div className="quiz-overview-item">
                      <CheckCircle2 size={16} />
                      <span>
                        {t(
                          "chapterQuizzes.questionCount",
                          "{{count}} questions",
                          {
                            count: questionCount,
                          }
                        )}
                      </span>
                    </div>
                    {firstQuestion ? (
                      <div className="quiz-overview-item preview">
                        “{firstQuestion}”
                      </div>
                    ) : (
                      <div className="quiz-overview-item preview muted">
                        {t(
                          "chapterQuizzes.noQuestions",
                          "No questions added yet."
                        )}
                      </div>
                    )}
                  </div>

                  <div className="quiz-footer">
                    <span className="status">
                      {quiz.isActive
                        ? t("status.active", "Active")
                        : t("status.inactive", "Inactive")}
                    </span>
                    <span className="updated">
                      {t("chapterQuizzes.updated", "Updated")}: {updatedAt}
                    </span>
                  </div>

                  <div className="quiz-play">
                    <button
                      type="button"
                      className="play-btn"
                      onClick={() =>
                        navigate(`/quizzes/${quiz._id}/play`, {
                          state: { quiz, from: location.pathname },
                        })
                      }
                    >
                      <PlayCircle size={16} />
                      {t("chapterQuizzes.playQuiz", "Play Quiz")}
                    </button>
                  </div>

                  {canManageQuizzes && (
                    <div className="quiz-actions">
                      <button
                        type="button"
                        className="control-btn status"
                        onClick={() => handleStatusToggle(quiz)}
                        title={
                          quiz.isActive
                            ? t("btn.deactivate", "Deactivate")
                            : t("btn.activate", "Activate")
                        }
                      >
                        {quiz.isActive ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="control-btn edit"
                        onClick={() => openModal(quiz)}
                        title={t("btn.edit_quiz", "Edit Quiz")}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className="control-btn delete"
                        onClick={() => handleDelete(quiz)}
                        title={t("btn.delete_quiz", "Delete Quiz")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {editingQuiz
                  ? t("modal.edit_quiz", "Edit Quiz")
                  : t("modal.add_quiz", "Add Quiz")}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="form-error-banner">{formError}</div>
              )}
              <div className="form-group">
                <label>{t("form.title", "Title")}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row compact">
                <div className="form-group">
                  <label>{t("form.active_status", "Active Status")}</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "true",
                      })
                    }
                  >
                    <option value={true}>{t("status.active", "Active")}</option>
                    <option value={false}>
                      {t("status.inactive", "Inactive")}
                    </option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label>{t("form.training_only", "Training Only")}</label>
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={formData.trainingOnly}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          trainingOnly: e.target.checked,
                        })
                      }
                    />
                    <span>
                      {t(
                        "form.training_only_hint",
                        "Quiz is for practice and will not affect student degree"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="questions-header">
                <h3>{t("chapterQuizzes.questions", "Questions")}</h3>
              </div>

              <div className="questions-list">
                {formData.questions.map((question, index) =>
                  renderQuestionBuilder(question, index)
                )}
              </div>

              <div className="add-question-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addQuestion}
                >
                  <Plus size={16} />
                  {t("chapterQuizzes.addQuestion", "Add Question")}
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  {t("btn.cancel", "Cancel")}
                </button>
                <button type="submit" className="save-btn">
                  {editingQuiz
                    ? t("btn.update", "Update")
                    : t("btn.create", "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .chapter-quizzes-page {
          padding: 24px 0;
        }

        .page-header h1 {
          margin-top: 16px;
          display: flex;
          align-items: center;
        }

        .page-header p {
          margin-top: 8px;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .error-banner {
          margin: 16px 0;
          padding: 12px 16px;
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner button {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.1rem;
          cursor: pointer;
        }

        .chapter-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin: 32px 0;
        }

        .overview-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .overview-icon {
          width: 40px;
          height: 40px;
          background: #eef2ff;
          color: #4338ca;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overview-content h3 {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 600;
        }

        .overview-content span {
          display: block;
          margin-top: 4px;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }

        .quizzes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .quizzes-header h2 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 600;
          color: #1f2937;
        }

        .note {
          margin: 6px 0 0 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .quiz-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .quiz-card.inactive-card {
          opacity: 0.7;
          background: #f9fafb;
        }

        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .quiz-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quiz-card-title h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .quiz-type {
          display: block;
          margin-top: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6366f1;
        }

        .training-pill {
          background: #fef3c7;
          color: #b45309;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .quiz-overview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quiz-overview-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 0;
          font-size: 0.85rem;
          color: #475569;
        }

        .quiz-overview-item.preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 12px;
          color: #334155;
          font-style: italic;
        }

        .quiz-overview-item.preview.muted {
          color: #94a3b8;
        }

        .quiz-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 0.85rem;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .quiz-footer .status {
          font-weight: 600;
        }

        .quiz-play {
          margin-top: 12px;
        }

        .play-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .play-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .quiz-actions {
          display: flex;
          gap: 8px;
        }

        .control-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .control-btn.status {
          background: #e6fffa;
          color: #00b894;
        }

        .control-btn.edit {
          background: #fff5e6;
          color: #f6ad55;
        }

        .control-btn.delete {
          background: #fed7d7;
          color: #e53e3e;
        }

        .control-btn:hover {
          transform: scale(1.05);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 720px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          color: #2d3748;
          background: white;
          transition: all 0.3s ease;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-row.compact {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .form-error-banner {
          margin-bottom: 16px;
          padding: 12px 16px;
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 10px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .checkbox-group .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #475569;
          font-size: 0.85rem;
        }

        .questions-header {
          display: flex;
          align-items: center;
          margin: 24px 0 16px;
        }

        .questions-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .add-question-footer {
          margin: 16px 0 24px;
          display: flex;
          justify-content: center;
        }

        .question-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #f8fafc;
        }

        .question-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .question-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .badge {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .question-controls {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .choices-section,
        .matching-section {
          margin: 16px 0;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
        }

        .choices-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .choice-row,
        .pair-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .choice-row:last-child,
        .pair-row:last-child {
          margin-bottom: 0;
        }

        .choice-radio {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #475569;
        }

        .pair-divider {
          font-weight: 600;
          color: #1d4ed8;
        }

        .radio-group {
          display: inline-flex;
          gap: 16px;
          align-items: center;
        }

        .radio-group label {
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }

        .icon-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #fee2e2;
          color: #b91c1c;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .icon-button:hover {
          background: #fca5a5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-btn,
        .save-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-btn {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .cancel-btn:hover {
          background: #edf2f7;
        }

        .save-btn {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .save-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
        }

        .btn-tertiary {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          background: #e0f2fe;
          color: #0369a1;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .btn-tertiary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .choice-row,
          .pair-row {
            grid-template-columns: 1fr;
          }

          .pair-divider {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .quizzes-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .quiz-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChapterQuizzes;
