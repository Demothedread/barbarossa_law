import csv
import os
import random
import sys
import time
from datetime import datetime

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'qa.csv')
LOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'quiz_log.csv')

QUESTION_TIME_MINUTES = 1.8

def load_questions(csv_path):
    if not os.path.isfile(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        print("Please ensure 'qa.csv' exists in the parent directory of this script.")
        sys.exit(1)
    questions = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('question') and row.get('choice_a'):
                questions.append(row)
    return questions

def choose_questions(questions, num):
    return random.sample(questions, k=num)

def print_question(q_dict, q_number, total):
    print(f"\nQuestion {q_number}/{total}:")
    if q_dict.get('prompt'):
        print(f"Context: {q_dict['prompt']}")
    print(q_dict['question'])
    print(f"  A. {q_dict['choice_a']}")
    print(f"  B. {q_dict['choice_b']}")
    print(f"  C. {q_dict['choice_c']}")
    print(f"  D. {q_dict['choice_d']}")

def get_user_answer(timeout_left):
    print(f"Time left: {timeout_left // 60}m {timeout_left % 60}s")
    print("Enter your answer: (A/B/C/D) or Q to quit")
    start = time.time()
    answer = None
    while True:
        if sys.platform == 'win32':
            answer = input().strip().upper()
            break
        else:
            import select
            if select.select([sys.stdin], [], [], 1)[0]:
                answer = sys.stdin.readline().strip().upper()
                break
        elapsed = time.time() - start
        if elapsed >= 1.0:
            break
    return answer

def ask_questions(selected, time_limit_s):
    user_answers = []
    correct_count = 0
    start_time = time.time()
    for idx, q in enumerate(selected):
        now = time.time()
        time_used = int(now - start_time)
        time_left = int(time_limit_s - time_used)
        if time_left <= 0:
            print("\nTime is up!")
            break
        print_question(q, idx+1, len(selected))
        while True:
            print(f"[Clock: {time_left//60}:{time_left%60:02d} left]")
            ans = input("Your answer (A/B/C/D or Q to quit): ").strip().upper()
            if ans == 'Q':
                print("Quiz ended early by user.")
                return user_answers, correct_count, int(time.time() - start_time)
            if ans in {'A','B','C','D'}:
                break
            print("Please enter A/B/C/D or Q.")
        correct = (ans == q['answer'].strip().upper())
        user_answers.append({'question': q['question'], 'your_answer': ans, 'correct_answer': q['answer'], 'correct': correct})
        if correct:
            print("Correct!\n")
            correct_count += 1
        else:
            print(f"Incorrect. Correct answer was {q['answer']}\n")
    time_used = int(time.time() - start_time)
    return user_answers, correct_count, time_used

def ensure_log_header(log_path):
    if not os.path.exists(log_path) or os.path.getsize(log_path) == 0:
        with open(log_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['datetime','num_questions','num_correct','score_pct','time_used_s','user_answers'])

def log_results(log_path, num_questions, num_correct, time_used, user_answers):
    ensure_log_header(log_path)
    with open(log_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().isoformat(sep=' ', timespec='seconds'),
            num_questions,
            num_correct,
            round(100*num_correct/num_questions,2) if num_questions else 0,
            time_used,
            str(user_answers)
        ])

def main():
    questions = load_questions(CSV_PATH)
    print(f"Loaded {len(questions)} questions.")
    while True:
        try:
            num = int(input("How many questions do you want? (1-%d): " % len(questions)))
            if 1 <= num <= len(questions):
                break
            else:
                print("Invalid number.")
        except Exception:
            print("Please enter a valid integer.")
    selected = choose_questions(questions, num)
    total_time = int(QUESTION_TIME_MINUTES * 60 * num)
    print(f"You have {total_time//60} minutes and {total_time%60:02d} seconds for this quiz.")
    print("Type Q at any prompt to quit early.")
    input("Press Enter to start the quiz...")
    user_answers, correct_count, time_used = ask_questions(selected, total_time)
    print(f"\nQuiz completed! You answered {correct_count}/{len(user_answers)} correct.")
    if len(user_answers):
        score = round(100*correct_count/len(user_answers),2)
        print(f"Score: {score}%")
    print(f"Total time used: {time_used//60}m {time_used%60}s")
    log_results(LOG_PATH, len(user_answers), correct_count, time_used, user_answers)
    print(f"Results saved to {LOG_PATH}")

if __name__ == "__main__":
    main()
