import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import { useTranslation } from "../contexts/TranslationContext";
import { quizzesAPI } from "../services/api";

const interpolateTemplate = (template, values) => {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match
  );
};

const generateMatchingOptions = (questions = []) => {
  const options = {};

  questions.forEach((question, questionIndex) => {
    if (question?.type !== "matching") {
      return;
    }

    const pairs = Array.isArray(question.pairs) ? question.pairs : [];
    const rights = pairs
      .map((pair) => (typeof pair?.right === "string" ? pair.right : ""))
      .filter((value) => value.trim().length > 0);

    const uniqueRights = Array.from(new Set(rights));
    const shuffled = [...uniqueRights].sort(() => Math.random() - 0.5);

    options[questionIndex] = shuffled;
  });

  return options;
};

const normalizeKey = (value, fallback) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const QuizPlayer = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [loading, setLoading] = useState(!location.state?.quiz);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [matchingOptions, setMatchingOptions] = useState(
    generateMatchingOptions(location.state?.quiz?.questions || [])
  );

  const getLocalizedText = useMemo(
    () => (value, fallback = "") => {
      if (!value) return fallback;
      if (typeof value === "string") return value;
      if (typeof value === "object") {
        return (
          value[currentLanguage] ||
          value.en ||
          value.ar ||
          value.ku ||
          fallback
        );
      }
      return fallback;
    },
    [currentLanguage]
  );

  useEffect(() => {
    let ignore = false;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await quizzesAPI.getById(quizId, {
          lang: currentLanguage,
        });
        if (ignore) return;
        const quizData = response.data?.data || response.data || null;
        setQuiz(quizData);
      } catch (err) {
        if (ignore) return;
        console.error("Failed to load quiz.", err);
        setError(
          t(
            "quizPlayer.error.load",
            "Unable to load this quiz right now. Please try again."
          )
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchQuiz();

    return () => {
      ignore = true;
    };
  }, [quizId, currentLanguage, t]);

  useEffect(() => {
    if (!quiz) return;
    setMatchingOptions(generateMatchingOptions(quiz.questions));
  }, [quiz]);

  useEffect(() => {
    if (!quiz) return;
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setCurrentQuestionIndex(0);
  }, [quiz?._id]);

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const totalQuestions = questions.length;

  const currentQuestion = totalQuestions
    ? questions[Math.min(currentQuestionIndex, totalQuestions - 1)]
    : null;

  const handleMultipleChoiceChange = (questionIndex, choiceId) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: choiceId,
    }));
  };

  const handleTrueFalseChange = (questionIndex, value) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleMatchingChange = (questionIndex, pairKey, value) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...(prev[questionIndex] || {}),
        [pairKey]: value,
      },
    }));
  };

  const evaluateQuiz = () => {
    if (!totalQuestions) return null;

    const breakdown = questions.map((question, questionIndex) => {
      const base = {
        correct: false,
        type: question.type,
        explanation: question.explanation,
      };

      if (question.type === "multiple_choice") {
        const selectedChoiceId = answers[questionIndex];
        const choices = Array.isArray(question.choices)
          ? question.choices
          : [];
        const selectedChoice = choices.find(
          (choice) => choice.id === selectedChoiceId
        );
        const correctChoice = choices.find((choice) => choice.isCorrect);
        return {
          ...base,
          correct: Boolean(selectedChoice?.isCorrect),
          selectedChoice,
          correctChoice,
        };
      }

      if (question.type === "true_false") {
        const selectedAnswer = answers[questionIndex];
        const correctAnswer = question.correctAnswer === false ? false : true;
        return {
          ...base,
          correct:
            typeof selectedAnswer === "boolean" &&
            selectedAnswer === correctAnswer,
          selectedAnswer,
          correctAnswer,
        };
      }

      if (question.type === "matching") {
        const selections = answers[questionIndex] || {};
        const pairs = Array.isArray(question.pairs) ? question.pairs : [];
        const evaluatedPairs = pairs.map((pair, pairIndex) => {
          const pairKey = normalizeKey(pair?.id, `pair_${pairIndex}`);
          const selectedValue = selections[pairKey] || "";
          const correct =
            selectedValue.trim().toLowerCase() ===
            (pair?.right || "").trim().toLowerCase();
          return {
            key: pairKey,
            selectedValue,
            correct,
            pair,
          };
        });

        return {
          ...base,
          correct: evaluatedPairs.every((pair) => pair.correct),
          evaluatedPairs,
        };
      }

      return base;
    });

    const correctAnswers = breakdown.filter((entry) => entry.correct).length;

    return {
      total: totalQuestions,
      correct: correctAnswers,
      breakdown,
    };
  };

  const handleSubmit = () => {
    if (!totalQuestions) return;
    const evaluation = evaluateQuiz();
    setResult(evaluation);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setCurrentQuestionIndex(0);
    setMatchingOptions(generateMatchingOptions(questions));
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentQuestionIndex((prev) =>
      Math.min(prev + 1, totalQuestions - 1)
    );
  };

  const renderMultipleChoice = (question, questionIndex) => {
    const choices = Array.isArray(question.choices) ? question.choices : [];
    const selectedChoiceId = answers[questionIndex];

    return (
      <div className="choice-list">
        {choices.map((choice, choiceIndex) => {
          const choiceKey = normalizeKey(
            choice?.id,
            `choice_${questionIndex}_${choiceIndex}`
          );
          const isSelected = selectedChoiceId === choice?.id;
          const breakdownEntry = result?.breakdown?.[questionIndex];
          const showState = submitted && breakdownEntry;
          const isCorrectChoice = Boolean(choice?.isCorrect);
          const isUserChoice = isSelected;
          const stateClass = showState
            ? isCorrectChoice
              ? "correct"
              : isUserChoice
              ? "incorrect"
              : ""
            : isUserChoice
            ? "selected"
            : "";

          return (
            <label key={choiceKey} className={`choice-item ${stateClass}`}>
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value={choice?.id || choiceKey}
                checked={isSelected}
                onChange={() => handleMultipleChoiceChange(questionIndex, choice?.id || choiceKey)}
                disabled={submitted}
              />
              <span>{choice?.text || t("quizPlayer.choice.noText", "Untitled choice")}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (question, questionIndex) => {
    const selected = answers[questionIndex];
    const breakdownEntry = result?.breakdown?.[questionIndex];
    const correctAnswer = breakdownEntry?.correctAnswer;

    return (
      <div className="true-false-list">
        {[true, false].map((value) => {
          const isSelected = selected === value;
          const showState = submitted && breakdownEntry;
          const isCorrectChoice = value === correctAnswer;
          const stateClass = showState
            ? isCorrectChoice
              ? "correct"
              : isSelected
              ? "incorrect"
              : ""
            : isSelected
            ? "selected"
            : "";

          return (
            <label key={String(value)} className={`true-false-item ${stateClass}`}>
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value={String(value)}
                checked={isSelected}
                onChange={() => handleTrueFalseChange(questionIndex, value)}
                disabled={submitted}
              />
              <span>
                {value
                  ? t("quizPlayer.answer.true", "True")
                  : t("quizPlayer.answer.false", "False")}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderMatching = (question, questionIndex) => {
    const pairs = Array.isArray(question.pairs) ? question.pairs : [];
    const selections = answers[questionIndex] || {};
    const options =
      matchingOptions[questionIndex] ||
      pairs
        .map((pair) => pair?.right || "")
        .filter((value) => value.trim().length > 0);
    const breakdownEntry = result?.breakdown?.[questionIndex];

    return (
      <div className="matching-list">
        {pairs.map((pair, pairIndex) => {
          const pairKey = normalizeKey(pair?.id, `pair_${pairIndex}`);
          const selectedValue = selections[pairKey] || "";
          const evaluation = breakdownEntry?.evaluatedPairs?.find(
            (entry) => entry.key === pairKey
          );
          const showState = submitted && evaluation;
          const stateClass = showState
            ? evaluation.correct
              ? "correct"
              : "incorrect"
            : "";

          return (
            <div key={pairKey} className={`matching-row ${stateClass}`}>
              <span className="matching-left">{pair?.left || t("quizPlayer.matching.placeholderLeft", "Left side")}</span>
              <span className="matching-arrow">⇔</span>
              <select
                value={selectedValue}
                onChange={(event) =>
                  handleMatchingChange(
                    questionIndex,
                    pairKey,
                    event.target.value
                  )
                }
                disabled={submitted}
              >
                <option value="">
                  {t("quizPlayer.matching.placeholder", "Select answer")}
                </option>
                {options.map((optionValue) => (
                  <option key={`${pairKey}_${optionValue}`} value={optionValue}>
                    {optionValue}
                  </option>
                ))}
              </select>
              {showState && !evaluation.correct && (
                <span className="matching-feedback">
                  {t("quizPlayer.matching.correctAnswer", "Correct:")}{" "}
                  {evaluation.pair?.right || t("quizPlayer.matching.noAnswer", "N/A")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuestion = (question, questionIndex) => {
    if (!question) return null;

    return (
      <div className="question-card">
        <div className="question-header">
          <span className="question-index">
            {t("quizPlayer.questionLabel", "Question")} {questionIndex + 1}{" "}
            {t("quizPlayer.ofTotal", "of")} {totalQuestions}
          </span>
          <span className={`question-type type-${question.type}`}>
            {t(`quiz.type.${question.type}`, question.type)}
          </span>
        </div>
        <div className="question-prompt">
          {question.prompt || t("quizPlayer.noPrompt", "No prompt provided.")}
        </div>

        {question.type === "multiple_choice" && renderMultipleChoice(question, questionIndex)}
        {question.type === "true_false" && renderTrueFalse(question, questionIndex)}
        {question.type === "matching" && renderMatching(question, questionIndex)}

        {submitted && result?.breakdown?.[questionIndex] && (
          <div
            className={`question-feedback ${
              result.breakdown[questionIndex].correct ? "correct" : "incorrect"
            }`}
          >
            {result.breakdown[questionIndex].correct ? (
              <div className="feedback-message">
                <CheckCircle2 size={18} />
                <span>{t("quizPlayer.feedback.correct", "Correct answer!")}</span>
              </div>
            ) : (
              <div className="feedback-message">
                <XCircle size={18} />
                <span>
                  {t(
                    "quizPlayer.feedback.incorrect",
                    "That answer is not correct."
                  )}
                </span>
              </div>
            )}
            {question.explanation?.trim() && (
              <div className="explanation">
                {question.explanation.trim()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="quiz-player-page">
      <div className="container">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={18} />
          {t("btn.back", "Back")}
        </button>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <span>{t("quizPlayer.loading", "Loading quiz...")}</span>
          </div>
        ) : error ? (
          <div className="error-state">
            <XCircle size={24} />
            <p>{error}</p>
          </div>
        ) : !quiz ? (
          <div className="error-state">
            <XCircle size={24} />
            <p>
              {t(
                "quizPlayer.error.noQuiz",
                "We could not find this quiz. Please return and try a different one."
              )}
            </p>
          </div>
        ) : (
          <div className="quiz-wrapper">
            <div className="quiz-header">
              <div>
                <h1>
                  {getLocalizedText(
                    quiz.titleMultilingual || quiz.title,
                    quiz.title || t("quizPlayer.untitledQuiz", "Untitled Quiz")
                  )}
                </h1>
                <div className="quiz-subtitle">
                  <span>
                    {t(
                      "quizPlayer.questionCount",
                      "{{count}} questions",
                      { count: totalQuestions }
                    )}
                  </span>
                  {quiz.chapter && (
                    <span className="dot">
                      {getLocalizedText(
                        quiz.chapter.titleMultilingual || quiz.chapter.title,
                        quiz.chapter.title ||
                          t("quizPlayer.unknownChapter", "Unknown chapter")
                      )}
                    </span>
                  )}
                  {quiz.trainingOnly !== false && (
                    <span className="pill">
                      {t("quizPlayer.trainingOnly", "Training")}
                    </span>
                  )}
                </div>
              </div>
              {submitted && result && (
                <div className="score-card">
                  <span>{t("quizPlayer.score", "Score")}</span>
                  <strong>
                    {result.correct}/{result.total}
                  </strong>
                </div>
              )}
            </div>

            {totalQuestions === 0 ? (
              <div className="empty-quiz">
                <ClipboardList size={32} />
                <p>
                  {t(
                    "quizPlayer.emptyQuiz",
                    "This quiz does not have any questions yet."
                  )}
                </p>
              </div>
            ) : (
              <>
                {renderQuestion(currentQuestion, currentQuestionIndex)}

                <div className="player-controls">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    {t("quizPlayer.previous", "Previous")}
                  </button>
                  <div className="progress-indicator">
                    {interpolateTemplate(
                      t(
                        "quizPlayer.progress",
                        "Question {{current}} of {{total}}"
                      ),
                      {
                        current: currentQuestionIndex + 1,
                        total: totalQuestions,
                      }
                    )}
                  </div>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={goToNext}
                    disabled={currentQuestionIndex >= totalQuestions - 1}
                  >
                    {t("quizPlayer.next", "Next")}
                  </button>
                </div>

                <div className="submit-controls">
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={submitted}
                  >
                    {t("quizPlayer.submit", "Submit Quiz")}
                  </button>
                  {submitted && (
                    <button
                      type="button"
                      className="reset-btn"
                      onClick={handleReset}
                    >
                      <RotateCcw size={16} />
                      {t("quizPlayer.retry", "Try Again")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-player-page {
          padding: 24px 0;
        }

        .container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 16px;
        }

        .loading-state,
        .error-state,
        .empty-quiz {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: #2563eb;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .quiz-wrapper {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }

        .quiz-header h1 {
          margin: 0;
          font-size: 1.75rem;
          color: #0f172a;
        }

        .quiz-subtitle {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
          color: #64748b;
          font-size: 0.9rem;
        }

        .quiz-subtitle .dot::before {
          content: "•";
          margin-right: 6px;
          color: #cbd5f5;
        }

        .quiz-subtitle .pill {
          background: #ecfdf5;
          color: #047857;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .score-card {
          background: #eef2ff;
          border-radius: 12px;
          padding: 12px 16px;
          text-align: right;
          min-width: 120px;
        }

        .score-card span {
          display: block;
          font-size: 0.75rem;
          color: #4338ca;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .score-card strong {
          font-size: 1.25rem;
          color: #312e81;
        }

        .question-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #f8fafc;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .question-index {
          font-weight: 600;
          color: #1f2937;
        }

        .question-type {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }

        .question-prompt {
          font-size: 1rem;
          line-height: 1.6;
          color: #0f172a;
          background: #ffffff;
          border-radius: 10px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .choice-list {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .choice-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .choice-item input {
          pointer-events: none;
        }

        .choice-item.selected {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .choice-item.correct {
          border-color: #047857;
          background: #ecfdf5;
        }

        .choice-item.incorrect {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .true-false-list {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .true-false-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          cursor: pointer;
          justify-content: center;
        }

        .true-false-item.selected {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .true-false-item.correct {
          border-color: #047857;
          background: #ecfdf5;
        }

        .true-false-item.incorrect {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .matching-list {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .matching-row {
          display: grid;
          grid-template-columns: 1fr auto 1.2fr;
          gap: 12px;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
        }

        .matching-row.correct {
          border-color: #047857;
          background: #ecfdf5;
        }

        .matching-row.incorrect {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .matching-left {
          font-weight: 600;
          color: #0f172a;
        }

        .matching-arrow {
          font-size: 1.2rem;
          color: #2563eb;
          text-align: center;
        }

        .matching-row select {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
        }

        .matching-feedback {
          grid-column: 1 / -1;
          font-size: 0.85rem;
          color: #991b1b;
        }

        .question-feedback {
          margin-top: 16px;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .question-feedback.correct {
          background: #ecfdf5;
          color: #065f46;
        }

        .question-feedback.incorrect {
          background: #fef2f2;
          color: #991b1b;
        }

        .feedback-message {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .explanation {
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .player-controls {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .nav-btn {
          min-width: 120px;
          border: 1px solid #cbd5f1;
          background: #eef2ff;
          color: #4338ca;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .progress-indicator {
          font-size: 0.9rem;
          color: #475569;
        }

        .submit-controls {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .submit-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 999px;
          font-weight: 700;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reset-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .matching-row {
            grid-template-columns: 1fr;
          }

          .matching-arrow {
            display: none;
          }

          .player-controls {
            flex-direction: column;
          }

          .nav-btn {
            width: 100%;
          }

          .submit-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizPlayer;


