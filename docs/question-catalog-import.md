# Adding questions from a CSV catalog

Exam Mate imports questions with the same header row and column order as the supplied `ssc_cgl_questions.csv` file. The catalog can contain questions for SSC or any future competitive exam category.

## Required columns

```text
Question ID,Exam,Exam Date,Shift,Source Paper,Question Number,Subject,Topic,Question,Right Answer,Option A,Option B,Option C,Short Explanation
```

- `Question ID` must be unique and stable. Re-importing the same ID is safe: it is skipped rather than duplicated.
- `Question Number` must be a whole number.
- `Right Answer` must exactly match one of the four answer choices: `Right Answer`, `Option A`, `Option B`, or `Option C`.
- Keep commas, quotation marks, and line breaks inside cells valid CSV by exporting from a spreadsheet tool as UTF-8 CSV.
- Every topic needs at least 10 unused questions before it can become a daily quiz.

## Initial catalog on a new database

Set `QUESTIONS_CSV_PATH` in the server `.env` to the absolute path of the CSV, then run:

```bash
docker compose --profile seed run --rm seed
```

The standard seed is deliberately conservative: if the database already has questions, it exits without changing the catalog.

## Append new questions to an existing database

After validating the CSV, set `QUESTIONS_CSV_PATH` to its absolute path and run this explicit append command:

```bash
ALLOW_APPEND_SEED=true docker compose --profile seed run --rm seed
```

Only rows with new `Question ID` values are inserted. Existing questions are not overwritten. Back up the database before any production import, and check the container output for the number of inserted rows.

## Before importing

1. Confirm the header row has not changed.
2. Check every question has four distinct choices and that the right answer is one of them.
3. Use a new `Question ID` for every genuinely new question.
4. Group questions with clear, reusable `Subject` and `Topic` names; the daily planner selects a topic with at least 10 available questions.
