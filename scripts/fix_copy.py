#!/usr/bin/env python3
"""Fix copy.ts with parody content."""
import re

filepath = "/Users/jreback/Projects/barbarossa_law/lunaire-spa/app/stores/copy.ts"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix non-breaking spaces before heading1
content = re.sub(r'"\s*heading1"', '"heading1"', content)
content = re.sub(r'"[\u00a0\s]+heading1"', '"heading1"', content)

# Fix tagline
content = content.replace('"2,000+ Practice Questions"', '"It\'s Just Okay™"')

# Fix description paragraphs
replacements = [
    (
        'Welcome to Barbarossa Bar. You know this because it\'s literally in our name. Twice. Which, incoincidentally, is the maximum number of times "bar" can legally appear inside a single word without violating a well known law of linguistics and several state statutes. Go ahead and try to think of a word with more. You won\'t. You can\'t. Because they don\'t exist.',
        "Welcome to Barbarossa — where 'bar' appears twice in our name, and that's genuinely the most impressive thing about us. Unlike certain $4,000 courses that promise to 'transform your legal journey through proprietary spiral methodology,' we promise nothing. Literally nothing. We're not even sure this works.",
    ),
    (
        "Did yo into Barbarian? Or the Barbary Pirates? You're just borrowing from the same ancestral realm...",
        "We considered calling ourselves Barbaranne's Ba-Ba-Bar Review — that's FIVE bars — but the Beach Boys' lawyers sent a letter. Which, ironically, was the most legal education anyone here has received.",
    ),
    (
        'Fun little etymology fact to impress your brother\'s father-in-law: The word Barber comes from Barbary Pirates. The Barbary in there comes from Barbarian. Barbarian comes from Barbarossa. Barbarossa means "the ones with red-beards."',
        "The ABA says there are 'approved' ways to prepare for the bar. The NCBE says there are 'licensed' questions you must pay tribute to access. We say: have you considered that a centuries-old guild might not have your best interests at heart?",
    ),
    (
        "Which is to say, historically speaking, you're not just studying for the Bar. You're about to enter an ancient tradition of arguing about rules they did not invent, with words they don't understand, towards outcomes they do not agree with, on behalf of those they can hardly stand while likely opposing the very few they actually can. But I digress.",
        "Our Founder's Guarantee: This bar prep course is adequate. Not 'industry-leading.' Not 'revolutionary.' Not backed by 'decades of proven methodology.' Just... adequate. We wouldn't recommend it, honestly. But here you are.",
    ),
    (
        "Could we have gone with something like bar-bar-bar bar-ba bar-anne? Sure. The Beatles did. We could. It's catchy. It's got lot more bars. Objectively almost 2x the bars. Wait, Peter, we should. Damn it. It's a better name.",
        "PRESTIGIOUS FEATURES: Unlike courses that assign you a 'Success Coach' named Brad who emails you motivational quotes, we assign you nothing. No coach. No quotes. Just questions and the void.",
    ),
    (
        "Hey Peter, It's me. Listen, when you come from your break let's take another gander at the name, starting to cool on barbarossa. The brain balls are yearning for more bars. Can you pick up some cheerios? Love you. Kiss kiss.",
        "WHY BARBAROSSA? Because 'bar' appears twice. That's it. That's the whole reason. The NCBE's name only has 'bar' once. Checkmate, regulatory monopoly.",
    ),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Updated copy.ts with parody content")
