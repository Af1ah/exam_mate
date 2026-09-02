export type ResultData = {
  score: number;
  total: number;
  review: {
    id: number;
    position: number;
    content: string;
    selectedAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    feedback: string;
  }[];
};
export function ResultScreen({ result }: { result: ResultData }) {
  return (
    <main className="results">
      <section className="card result-summary">
        <h1>Today’s set is complete.</h1>
        <p className="result-score">
          {result.score} / {result.total}
        </p>
        <p>{getEncouragement(`${result.score}-${result.total}`)}</p>
        <p>Review each answer and carry one useful lesson into tomorrow’s attempt.</p>
        <div className="result-actions">
          <Link className="button" href="/dashboard">
            View my dashboard
          </Link>
        </div>
      </section>
      <section className="review-list" aria-label="Answer review">
        {result.review.map((answer) => (
          <article className="card review-card" key={answer.id}>
            <p className="question-number">Question {answer.position}</p>
            <h2>{answer.content}</h2>
            <div className="answer-review">
              <p className={answer.isCorrect ? "answer-choice correct" : "answer-choice incorrect"}>
                <span>Your answer</span>
                {answer.selectedAnswer ?? "Not answered"}
              </p>
              {!answer.isCorrect && (
                <p className="answer-choice correct">
                  <span>Correct answer</span>
                  {answer.correctAnswer}
                </p>
              )}
            </div>
            {answer.feedback && (
              <div className="feedback">
                <strong>Feedback</strong>
                <p>{answer.feedback}</p>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
import { getEncouragement } from "@/lib/encouragement";
import Link from "next/link";
