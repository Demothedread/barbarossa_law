#!/usr/bin/env python3
"""
Script to analyze questions in qa.csv and assign appropriate subtopics
based on the categories in subtopicBreakdown.csv
"""

import csv
import os
import re
import sys
from pathlib import Path

# Make the script executable
os.chmod(sys.argv[0], 0o755)

def read_subtopic_breakdown(file_path):
    """Read the subtopic breakdown file and return a mapping of subject to subtopics."""
    subject_subtopics = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            subject = row['Subject']
            subtopic = row['Subtopic'].strip('"')
            if subject not in subject_subtopics:
                subject_subtopics[subject] = []
            subject_subtopics[subject].append(subtopic)
    
    return subject_subtopics

def infer_subtopic(question_data, subject_subtopics):
    """
    Analyze the question content and infer the most likely subtopic.
    This uses keyword matching and content analysis to make the best guess.
    """
    subject = question_data.get('subject', '')
    if not subject or subject not in subject_subtopics:
        return ""
    
    # Check if question already has an explicit subtopic
    if question_data.get('subtopic'):
        return question_data['subtopic']
        
    # Get the gold passage if available for additional context
    gold_passage = question_data.get('gold_passage', '')
    
    # Combine question text and choices for analysis
    text_to_analyze = f"{question_data.get('prompt', '')} {question_data.get('question', '')} " \
                      f"{question_data.get('choice_a', '')} {question_data.get('choice_b', '')} " \
                      f"{question_data.get('choice_c', '')} {question_data.get('choice_d', '')} " \
                      f"{gold_passage}"
    
    # Dictionary of keyword patterns for each subtopic
    subtopic_keywords = {
        # Evidence subtopics
        "Relevancy and reasons for excluding relevant evidence": [
            r'relev', r'admiss', r'prejudic', r'exclu', r'not outweigh', r'probative',
            r'403', r'unfair', r'mislead', r'confus', r'waste', r'cumulative'
        ],
        "Hearsay and circumstances of its admissibility": [
            r'hearsay', r'out.of.court', r'statement', r'declarant', r'admission', 
            r'prior.statement', r'exception', r'excited.utterance', r'present.sense',
            r'business.record', r'dying.declaration', r'former.testimony', r'party.admission'
        ],
        "Presentation of evidence": [
            r'witness', r'testimony', r'impeach', r'cross.examin', r'direct.examin', 
            r'expert', r'lay', r'opinion', r'present', r'competency', r'credibility',
            r'rehabilitat', r'leading.question', r'redirect', r'rebuttal', r'foundation'
        ],
        "Privileges and other policy exclusions": [
            r'privileg', r'attorney.client', r'doctor.patient', r'spousal', 
            r'self.incriminat', r'clergy', r'policy', r'confiden', r'waive',
            r'psychotherapist', r'journalis', r'shield', r'government'
        ],
        "Writings, recordings, and photographs": [
            r'writing', r'document', r'record', r'photo', r'authentica', r'best.evidence',
            r'original', r'duplicate', r'carbon.copy', r'demonstrative', r'exhibit',
            r'chain.of.custody', r'altera'
        ],
        
        # Civil Procedure subtopics
        "Jurisdiction and venue": [
            r'jurisdiction', r'venue', r'personal.jurisdiction', r'subject.matter', 
            r'diversity', r'federal.question', r'minimum.contacts', r'service',
            r'long.arm', r'forum.non.conveniens', r'transfer', r'removal'
        ],
        "Pretrial procedures": [
            r'pleading', r'complaint', r'answer', r'discovery', r'deposition', r'interrogator',
            r'class.action', r'joinder', r'intervention', r'pretrial', r'request.for.production',
            r'request.for.admission', r'protective.order', r'compel', r'scheduling', r'conference'
        ],
        "Motions": [
            r'motion', r'dismiss', r'summary.judgment', r'injunction', r'relief',
            r'pleading', r'12\(b\)', r'failure.to.state.a.claim', r'judgment.on.the.pleadings',
            r'directed.verdict', r'judgment.as.a.matter.of.law', r'notwithstanding'
        ],
        "Law applied by federal courts": [
            r'erie', r'state.law', r'federal.law', r'choice.of.law', r'conflicts',
            r'substance', r'procedure', r'outcome.determinative', r'forum.shopping'
        ],
        "Jury trials": [
            r'jury', r'voir.dire', r'challenge', r'peremptory', r'strike', r'deliberat',
            r'instruct', r'verdict.form', r'special.verdict', r'general.verdict'
        ],
        "Verdicts and judgments": [
            r'verdict', r'judgment', r'decree', r'damages', r'injunct', r'declaratory',
            r'remedy', r'relief', r'enforce', r'final.judgment', r'interlocutory', r'satisfaction'
        ],
        "Appealability and review": [
            r'appeal', r'review', r'standard.of.review', r'de.novo', r'clearly.erroneous',
            r'abuse.of.discretion', r'circuit', r'certiorari', r'writ', r'mandamus'
        ],
        
        # Constitutional Law subtopics
        "Individual rights": [
            r'rights', r'freedom', r'speech', r'religion', r'press', r'assembly', r'petition',
            r'equal.protection', r'due.process', r'privacy', r'abortion', r'discrimination',
            r'first.amendment', r'fourteenth.amendment', r'strict.scrutiny', r'intermediate.scrutiny',
            r'rational.basis'
        ],
        "The nature of judicial review": [
            r'judicial.review', r'marbury', r'madison', r'constitutional', r'unconstitutional',
            r'strike.down', r'declare', r'interpret', r'power', r'authority'
        ],
        "The separation of powers": [
            r'separat', r'power', r'executive', r'legislative', r'judicial', r'branch',
            r'president', r'congress', r'court', r'checks.and.balances', r'veto',
            r'appointment', r'delegation', r'oversight'
        ],
        "The relation of nation and states in a federal system (federalism)": [
            r'federal', r'state', r'commerce.clause', r'preempt', r'tenth.amendment',
            r'spending.power', r'necessary.and.proper', r'police.power', r'sovereign.immunity'
        ],
        
        # Contracts subtopics
        "Formation of contracts": [
            r'offer', r'acceptance', r'consideration', r'bargain', r'promise', r'mutuality',
            r'intent', r'bilateral', r'unilateral', r'counter.offer', r'revocation'
        ],
        "Performance, breach, and discharge": [
            r'performance', r'breach', r'discharge', r'duty', r'obligation', r'satisfaction',
            r'material', r'substantial', r'anticipatory', r'repudiation', r'impossibility',
            r'frustration', r'impracticability', r'commercial'
        ],
        "Defenses to enforceability": [
            r'defense', r'statute.of.fraud', r'minor', r'incapacity', r'duress', r'unconscionable',
            r'mistake', r'misrepresentation', r'fraud', r'illegality', r'public.policy'
        ],
        "Contract content and meaning": [
            r'term', r'condition', r'express', r'implied', r'interpret', r'parol.evidence',
            r'integration', r'merger', r'ambiguity', r'usage', r'course.of.dealing', r'good.faith'
        ],
        "Remedies": [
            r'remedies', r'damages', r'expectation', r'reliance', r'restitution', r'specific.performance',
            r'liquidated', r'consequential', r'incidental', r'mitigation', r'equity', r'injunction'
        ],
        "Third-party rights": [
            r'third.party', r'beneficiary', r'intended', r'incidental', r'assign', r'delegation',
            r'successor', r'novation'
        ],
        
        # Criminal Law and Procedure subtopics
        "Constitutional protection of accused persons": [
            r'fourth.amendment', r'fifth.amendment', r'sixth.amendment', r'miranda',
            r'search', r'seizure', r'warrant', r'counsel', r'custod', r'arrest', r'interrogat',
            r'double.jeopardy', r'self.incriminat', r'speedy.trial', r'confrontation',
            r'right.to.remain.silent', r'due.process', r'exclusionary.rule'
        ],
        "Homicide": [
            r'murder', r'manslaughter', r'kill', r'homicide', r'death', r'malice',
            r'premeditat', r'deliberat', r'first.degree', r'second.degree', r'voluntary',
            r'involuntary', r'negligent', r'reckless'
        ],
        "Other crimes": [
            r'theft', r'larceny', r'robbery', r'burglary', r'arson', r'assault', r'battery',
            r'rape', r'sexual', r'kidnap', r'fraud', r'forgery', r'embezzle', r'bribery', 
            r'extortion', r'conspiracy', r'solicitation'
        ],
        "Inchoate crimes, parties": [
            r'attempt', r'conspiracy', r'solicit', r'accessory', r'accomplice', r'aid',
            r'abet', r'principal', r'vicarious', r'liability', r'inchoate'
        ],
        "General principles of Criminal Law": [
            r'mens.rea', r'intent', r'knowledge', r'reckless', r'negligen', r'actus.reus',
            r'voluntary.act', r'omission', r'causation', r'justification', r'excuse', r'insanity',
            r'diminish', r'intoxicat', r'mistake', r'self.defense', r'duress', r'necessity'
        ],
        
        # Real Property subtopics
        "Ownership of real property": [
            r'ownership', r'possession', r'fee.simple', r'life.estate', r'reversion',
            r'remainder', r'joint.tenant', r'tenant.in.common', r'community.property',
            r'adverse.possession', r'prescription'
        ],
        "Rights in real property": [
            r'easement', r'profit', r'license', r'covenant', r'equitable.servitude',
            r'nuisance', r'trespass', r'lateral.support', r'air.rights', r'water.rights'
        ],
        "Real estate contracts": [
            r'contract', r'buy', r'sell', r'purchase', r'agreement', r'option',
            r'right.of.first.refusal', r'deed', r'escrow', r'closing'
        ],
        "Mortgages/security devices": [
            r'mortgage', r'lien', r'security.interest', r'deed.of.trust', r'foreclosure',
            r'priority', r'redemption', r'deficiency', r'acceleration'
        ],
        "Titles": [
            r'title', r'record', r'abstract', r'chain.of.title', r'warranty.deed',
            r'quitclaim.deed', r'marketable.title', r'cloud.on.title', r'quiet.title'
        ],
        
        # Torts subtopics
        "Negligence": [
            r'negligen', r'duty', r'breach', r'causation', r'proximate', r'actual',
            r'damage', r'foreseeab', r'reasonable', r'standard.of.care', r'professional',
            r'medical.malpractice'
        ],
        "Intentional torts": [
            r'intent', r'assault', r'battery', r'false.imprisonment', r'trespass', 
            r'conversion', r'defamation', r'slander', r'libel', r'privacy', r'malicious.prosecution'
        ],
        "Strict liability and products liability": [
            r'strict', r'product', r'defect', r'design', r'manufacturing', r'warning',
            r'abnormally.dangerous', r'ultrahazardous', r'warranty', r'merchantability'
        ],
        "Other torts": [
            r'nuisance', r'infliction.of.emotional.distress', r'fraud', r'misrepresentation',
            r'business.tort', r'unfair.competition', r'interference.with.contract'
        ]
    }
    
    # For each subtopic in this subject, check for keyword matches
    match_counts = {}
    for subtopic in subject_subtopics[subject]:
        count = 0
        if subtopic in subtopic_keywords:
            for pattern in subtopic_keywords[subtopic]:
                if re.search(pattern, text_to_analyze, re.IGNORECASE):
                    count += 1
        match_counts[subtopic] = count
    
    # If we have matches, return the subtopic with the most keyword matches
    if match_counts:
        max_count = max(match_counts.values())
        if max_count > 0:
            best_matches = [subtopic for subtopic, count in match_counts.items() if count == max_count]
            return best_matches[0]
    
    # Default: return first subtopic for the subject (better than nothing)
    return subject_subtopics[subject][0]

def process_qa_csv(qa_path, subtopic_breakdown_path, output_path=None):
    """
    Process the qa.csv file, assign subtopics, and write to a new file.
    """
    subject_subtopics = read_subtopic_breakdown(subtopic_breakdown_path)
    output_rows = []
    updated_count = 0
    skipped_count = 0
    
    print(f"Reading questions from {qa_path}...")
    
    with open(qa_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames or []  # Ensure fields is not None
        
        for i, row in enumerate(reader):
            # If subject is empty or subtopic already exists and is not empty, skip
            if not row['subject'] or (row.get('subtopic') and row['subtopic']):
                output_rows.append(row)
                skipped_count += 1
                continue
                
            # Infer the subtopic based on question content
            inferred_subtopic = infer_subtopic(row, subject_subtopics)
            row['subtopic'] = inferred_subtopic
            output_rows.append(row)
            updated_count += 1
            
            # Print progress every 10 questions
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1} questions...")
    
    # Write output to file
    output_file = output_path if output_path else qa_path
    print(f"Writing updated CSV to {output_file}...")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output_rows)
    
    print(f"Processing complete:")
    print(f"- Total questions: {len(output_rows)}")
    print(f"- Questions updated with subtopics: {updated_count}")
    print(f"- Questions skipped (already had subtopics or no subject): {skipped_count}")

def validate_assignments(qa_path, num_samples=5):
    """
    Print a few sample subtopic assignments to validate the quality.
    
    Args:
        qa_path: Path to the qa.csv file
        num_samples: Number of sample assignments to print
    """
    with open(qa_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    # Filter to only rows with assigned subtopics
    rows_with_subtopics = [row for row in rows if row.get('subtopic')]
    
    if not rows_with_subtopics:
        print("No questions with assigned subtopics found.")
        return
        
    # Select sample rows
    import random
    samples = random.sample(rows_with_subtopics, min(num_samples, len(rows_with_subtopics)))
    
    print("\n=== SAMPLE SUBTOPIC ASSIGNMENTS ===")
    for i, row in enumerate(samples):
        print(f"\nSample {i+1}:")
        print(f"Subject: {row['subject']}")
        print(f"Subtopic: {row['subtopic']}")
        print(f"Question: {row['question'][:100]}...")
        print(f"Answer: {row['answer']}")
    print("\n===================================")


if __name__ == "__main__":
    base_dir = Path(__file__).parent.parent
    qa_path = base_dir / "qa.csv"
    subtopic_path = base_dir / "subtopicBreakdown.csv"
    
    # Check if files exist
    if not qa_path.exists():
        print(f"Error: {qa_path} does not exist.")
        sys.exit(1)
    if not subtopic_path.exists():
        print(f"Error: {subtopic_path} does not exist.")
        sys.exit(1)
    
    # Process the files
    process_qa_csv(qa_path, subtopic_path)
    
    # Validate the assignments
    validate_assignments(qa_path)