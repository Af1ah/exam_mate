#!/bin/sh
set -eu

existing="$(psql -Atc 'SELECT count(*) FROM "question"')"
if [ "$existing" -gt 0 ] && [ "${ALLOW_APPEND_SEED:-false}" != "true" ]; then
  echo "Question table already contains $existing row(s); skipping seed."
  echo "Set ALLOW_APPEND_SEED=true to import only rows with new Question ID values."
  exit 0
fi

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE TEMP TABLE question_seed (
  "questionId" text, exam text, "examDate" text, shift text, "sourcePaper" text,
  "questionNumber" int, subject text, topic text, content text, "rightAnswer" text,
  "optionA" text, "optionB" text, "optionC" text, "shortExplanation" text
);
\copy question_seed FROM '/seed/questions.csv' WITH (FORMAT csv, HEADER true)
INSERT INTO "question" ("questionId", exam, "examDate", shift, "sourcePaper", "questionNumber", subject, topic, content, "rightAnswer", "optionA", "optionB", "optionC", "shortExplanation", "createdAt", "updatedAt")
SELECT "questionId", exam, "examDate", shift, "sourcePaper", "questionNumber", subject, topic, content, "rightAnswer", "optionA", "optionB", "optionC", "shortExplanation", now(), now()
FROM question_seed
ON CONFLICT ("questionId") DO NOTHING;
SQL
