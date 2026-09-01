import { getEncouragement } from "@/lib/encouragement";

export default function Home() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Make today’s ten questions
            <br />
            <em>count.</em>
          </h1>
          <p className="lede">
            Exam Mate sends a private ten-question quiz to WhatsApp—one fresh topic at a time, with no repeated
            questions.
          </p>
          <a className="whatsapp-button" href="https://wa.me/919495410343?text=start" target="_blank" rel="noreferrer">
            Start today’s quiz <span>→</span>
          </a>
          <p className="button-note">
            Opens WhatsApp with <strong>start</strong> ready to send to +91 94954 10343.
          </p>
          <p className="encouragement">{getEncouragement("welcome")}</p>
        </div>
        <div className="daily-card" aria-label="Daily quiz details">
          <p className="daily-label">Today’s routine</p>
          <div className="daily-number">
            10<span>Q</span>
          </div>
          <p className="daily-topic">One topic · 10 minutes</p>
          <div className="daily-rule">
            <span>✓</span> One attempt per day
          </div>
          <div className="daily-rule">
            <span>✓</span> Fresh questions only
          </div>
        </div>
      </section>
      <section className="steps">
        <article>
          <span>01</span>
          <h2>Message</h2>
          <p>Tap start and send the WhatsApp message.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Open safely</h2>
          <p>Your private quiz link expires after 15 minutes.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Build momentum</h2>
          <p>Finish today’s topic and return tomorrow for the next.</p>
        </article>
      </section>
    </main>
  );
}
