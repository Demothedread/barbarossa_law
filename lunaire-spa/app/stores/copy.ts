/**
 * Centralized Copy Management Store
 * All website text content in one place for easy editing
 *
 * PARODY NOTICE: This content is satirical commentary on the bar exam
 * preparation industry. Any resemblance to actual bar prep courses
 * charging $4,000+ is entirely intentional and protected speech.
 * Or maybe the whole site is a surreal parody. Who knows! Let's spend
 * weeks litigating that.
 *
 * monobloc.com — Deez' Eazy-Breezy Bar Review Bonanza
 */
import { defineStore } from "pinia";
// @ts-ignore - Typekit font import
// import url("https://use.typekit.net/wow2lwe.css");

export interface CopyStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  lineHeight?: string;
}

export interface CopyEntry {
  text: string;
  style?: CopyStyle;
}

export interface PageCopy {
  [key: string]: CopyEntry | string;
}

export interface SiteCopy {
  global: {
    siteName: CopyEntry;
    tagline: CopyEntry;
    established: CopyEntry;
    location: CopyEntry;
  };
  home: {
    hero: {
      title: CopyEntry;
      tagline: CopyEntry;
      description: CopyEntry[];
      funFact: CopyEntry;
      barbaraAnne: CopyEntry;
      beachBoysButton: CopyEntry;
      beachBoysButtonActive: CopyEntry;
      winning: CopyEntry;
      ctaPrimary: CopyEntry;
      ctaSecondary: CopyEntry;
    };
    stats: {
      title: CopyEntry;
      labels: {
        totalRounds: CopyEntry;
        avgScore: CopyEntry;
        bestScore: CopyEntry;
        streak: CopyEntry;
        correctTotal: CopyEntry;
      };
    };
    quickStart: {
      title: CopyEntry;
      description: CopyEntry;
    };
  };
  about: {
    title: CopyEntry;
    heroTitle: CopyEntry;
    heroTagline: CopyEntry;
    sections: {
      whyWeExist: {
        title: CopyEntry;
        paragraphs: CopyEntry[];
      };
      ncbeProblem: {
        title: CopyEntry;
        paragraphs: CopyEntry[];
      };
      whatWeDo: {
        title: CopyEntry;
        paragraphs: CopyEntry[];
      };
    };
    truths: CopyEntry[];
    footer: {
      motto: CopyEntry;
      established: CopyEntry;
    };
  };
  quiz: {
    setup: {
      title: CopyEntry;
      subjectLabel: CopyEntry;
      countLabel: CopyEntry;
      typeLabel: CopyEntry;
      startButton: CopyEntry;
    };
    active: {
      questionLabel: CopyEntry;
      timerLabel: CopyEntry;
      submitButton: CopyEntry;
      nextButton: CopyEntry;
    };
    review: {
      title: CopyEntry;
      scoreLabel: CopyEntry;
      correctLabel: CopyEntry;
      incorrectLabel: CopyEntry;
    };
  };
  nav: {
    home: CopyEntry;
    quiz: CopyEntry;
    study: CopyEntry;
    essays: CopyEntry;
    statistics: CopyEntry;
    about: CopyEntry;
    signIn: CopyEntry;
    signOut: CopyEntry;
  };
}

// Default font styles
const defaultStyles: Record<string, CopyStyle> = {
  heading1: {
    fontFamily: "'good-times', sans-serif",
    fontSize: "3rem",
    fontWeight: "900",
  },
  heading2: {
    fontFamily: "'good-times', sans-serif",
    fontSize: "1.5rem",
    fontStyle: "italic",
    fontWeight: "500",
  },
  heading3: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  tagline: {
    fontFamily: "'tilt-neon', sans-serif",
    fontSize: "1.5rem",
    fontWeight: "400",
  },
  body: {
    fontFamily: "'ff-chambers-sans-web','Space Grotesk', sans-serif",
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
  },
  button: {
    fontFamily: "'new-astro-soft', sans-serif",
    fontSize: "0.875rem",
    fontWeight: "300",
  },
  label: {
    fontFamily: "'galix-mono', sans-serif",
    fontSize: "0.75rem",
    fontWeight: "700",
  },
  callout: {
    fontFamily: "'good-times', sans-serif",
    fontSize: "2rem",
    fontWeight: "700",
  },
};

// Helper to create copy entry with style
const copy = (
  text: string,
  styleKey?: keyof typeof defaultStyles,
): CopyEntry => ({
  text,
  style: styleKey ? defaultStyles[styleKey] : defaultStyles.body,
});

export const useCopyStore = defineStore("copy", {
  state: (): { content: SiteCopy; styles: Record<string, CopyStyle> } => ({
    styles: defaultStyles,
    content: {
      global: {
        siteName: copy("Deez' Eazy-Breezy", "heading1"),
        tagline: copy(
          "The Adequate, Unaccredited, Probably Illegal, but Arguably Ethical Bar Review",
        ),
        established: copy("monobloc.com • Est. 2026", "label"),
        location: copy(
          "For the Benefit of Sick Puppies & Kids with Cancer Who Can't Read Good",
          "label",
        ),
      },
      home: {
        hero: {
          title: copy("Deez' Eazy-Breezy Bar Review Bonanza", "heading1"),
          tagline: copy(
            "No Frills. Generic. The Baseline of What You Need.",
            "tagline",
          ),
          description: [
            copy(
              "The California bar exam costs $878. Plus a $250 late fee. Plus a $153 'laptop fee' — and no, they don't give you a laptop. That's just the privilege of using your own.",
            ),
            copy("For those playing along at home, that is..."),
            copy("$1,281.00!", "callout"),
            copy(
              "There's never enough seats at nearby testing locations. So add flights. A hotel for two nights. Lost wages for two MIDWEEK exam days. Conservatively, you're budgeting $2,000 just to sit for the bar.",
            ),
            copy(
              "Maybe that doesn't sound like a lot. If so, great — this site probably isn't for you. But since you're here anyway, some perspective:",
            ),
            copy(
              "    • $2,100 is roughly what the average SNAP recipient receives in a year.",
            ),
            copy(
              "    • $2,100 is two months' rent for a studio apartment in the average U.S. city.",
            ),
            copy(
              "    • $2,100 is more than the annual average income in nearly 20 countries.",
            ),
            copy(
              "Context, not criticism. Bar exams are resource-intensive. Maybe they ought to cost more than two months of somewhere to live, or one year of something to eat.",
            ),
            copy(
              "But bar prep review courses can cost 3-4x as much as the exam itself.",
            ),
            copy(
              "And if you want to tell me that's because they provide a superior educational experience — fine. At that price, they should be a luxury, not a necessity. Let them point to their passage numbers and say it's because they have the best TEACHERS, the best METHODS.",
            ),
            copy(
              "But some charge $1,000 just to access databases of actual questions from past exams — because they can afford to license the rights. And twice that if you want their outlines, too.",
            ),
            copy("That's information. That's knowledge. That's power."),
            copy(
              "Bar exams are expensive. Bar review courses triple what is already an expensive undertaking. Most of us couldn't afford them if our firms or our loan balances weren't subsidizing them. There's no real alternative — not when the majors control digital access to outlines and practice questions. You're asking students to take a nuanced test full of unfamiliar questions, then saying: for $1,000 extra, I can show you thousands of real ones. Otherwise? Here's thirty. GOOD LUCK. And then you're surprised when someone goes to the library, scans a few books from twenty years ago, and builds a database of decent — yet clearly inferior, obviously! — practice questions for themselves and anyone else who could use them.",
            ),
            copy(
              "Barbri, Themis, Kaplan: If that's a threat to your business model, I invite you to spend your students' money guarding your gatekeeper licenses instead of building a better product. Bridge trolls gonna bridge troll. So go ahead and sue Deez' Eazy-Breezy Bar Review for the benefit of sick puppies and kids with cancer who can't read good but would like to and want to do other things good as well.",
            ),
            copy(
              "The ABA says there are 'approved' ways to prepare for the bar. The NCBE says there are 'licensed' questions you must pay tribute to access. We say: NA NA NA WE'RE NOT LISTENING NA NA NA CAN'T HEAR YOU.",
            ),
            copy(
              "The Deez' Eazy-Breezy Guarantee: This bar prep course is adequate. Not 'industry-leading.' Not 'revolutionary.' Not backed by 'decades of proven methodology.' Just... adequate. We wouldn't recommend it, honestly. But if you need some practice questions — here you go.",
            ),
            copy(
              "PRESTIGIOUS FEATURES: Unlike courses that assign you a 'Success Coach' named Brad who emails you motivational quotes, we assign you nothing. No coach. No quotes. Just questions and the void.",
            ),
            copy(
              "WHY 'DEEZ'? Because 'bar' appears twice. That's it. That's the whole reason. The NCBE only has 'bar' once. Checkmate, regulatory monopoly.",
            ),
            copy(
              "DISCLAIMER: DEEZ' EAZY-BREEZY BAR REVIEW BONANZA is made explicitly for the benefit of the community and is not affiliated with, endorsed by, or even acknowledged by any state bar association, the ABA, the NCBE, or frankly anyone with credentials. This is probably fine. Or maybe the whole thing is a surreal parody. Who knows! Let's spend weeks litigating that.",
            ),
          ],
          funFact: copy(
            "We host this at monobloc.com because I bought the domain a while back and it was cheap. Not free. But cheap. Like this site.",
          ),
          barbaraAnne: copy(
            "I wanted to call the site Barbara Anne's Bar Prep. There's clearly a correlation between the number of 'bars' in a name and the quality of bar prep. Imagine...",
          ),
          beachBoysButton: copy("🏖️ Bar-Bar-Bar-Barbara-Anne", "button"),
          beachBoysButtonActive: copy("🌌 Back to Adequate Prep", "button"),
          ctaPrimary: copy("Begin Adequate Preparation", "button"),
          ctaSecondary: copy("Skip the Pep Talk", "button"),
        },
        stats: {
          title: copy("Your Metrics (Unverified)", "heading2"),
          labels: {
            totalRounds: copy("Sets Endured", "label"),
            avgScore: copy("Average (Not a Predictor)", "label"),
            bestScore: copy("Peak Performance", "label"),
            streak: copy("CONSECUTIVE DAY BONUS (there is no bonus)", "label"),
            correctTotal: copy("Questions Survived", "label"),
          },
        },
        quickStart: {
          title: copy("Immediate Suffering", "heading2"),
          description: copy(
            "Skip the inspirational messaging and face the questions",
          ),
        },
        winning: copy("adequate", "tagline"),
      },
      about: {
        title: copy("About This Endeavor (Such As It Is)", "heading2"),
        heroTitle: copy("Deez' Eazy-Breezy Bar Review Bonanza", "heading1"),
        heroTagline: copy(
          "The Adequate, Unaccredited, Probably Illegal, but Arguably Ethical Bar Review",
          "tagline",
        ),
        sections: {
          whyWeExist: {
            title: copy(
              "Our Mission Statement (Per No One's Guidelines)",
              "heading3",
            ),
            paragraphs: [
              copy(
                'At Deez\' Eazy-Breezy, we are COMMITTED to EMPOWERING your JOURNEY toward bar exam ADEQUACY through our PROPRIETARY methodology of... showing you questions. That\'s it. That\'s the methodology. Other courses charge $4,000+ for "spiral instructional design" and "adaptive learning algorithms." We charge nothing for acknowledging those are just marketing words.',
              ),
              copy(
                "We PROUDLY DECLINE to offer: Success Coaches™, Pass Predictors™, Personalized Study Plans™, or emails from someone named Brad telling you \"You've got this!\" We find such theater undignified. You are an adult facing a gatekeeping exam designed by the NCBE. You do not need Brad. Also this whole site may be couched inside fun little mini-games, for legal purposes, that probably won't succeed. Or is the whole thing a surreal parody? Let's litigate.",
              ),
            ],
          },
          ncbeProblem: {
            title: copy(
              "A Word About the NCBE (With Appropriate Gravitas)",
              "heading3",
            ),
            paragraphs: [
              copy(
                "The National Conference of Bar Examiners — that venerable institution — has, through decades of tireless work, constructed a licensing regime of such elegant complexity that becoming a lawyer now costs more than a small car. We salute their commitment to... whatever it is they're committed to. Certainly not accessibility.",
              ),
              copy(
                "Their COPYRIGHTED questions — written by committees in the 1980s — remain so PROPRIETARY that showing one to a friend is technically a federal crime. We assume this is what the Founders intended when they wrote the First Amendment.",
              ),
            ],
          },
          whatWeDo: {
            title: copy("Our Modest Offerings", "heading3"),
            paragraphs: [
              copy(
                "We provide practice questions. We track your scores. We offer AI explanations that are probably accurate. Is this revolutionary? No. Is it 'industry-leading'? Absolutely not. It's no frills. It's generic. But it's the baseline of what you need. And it's free. At monobloc.com. Because that's the domain I own.",
              ),
            ],
          },
        },
        truths: [
          copy(
            "This course is adequate. We wouldn't recommend it, but here you are.",
          ),
          copy(
            "The NCBE is a nonprofit. They made $50M last year. Nonprofits are fun.",
          ),
          copy(
            "The ABA 'accredits' law schools. Bar prep courses remain unaccredited. Curious.",
          ),
          copy(
            '65% is passing. The NCBE calls this "minimum competence." Inspiring.',
          ),
          copy("Your Pass Predictor™ is astrology for people with JDs."),
          copy(
            "Most partners at your future firm couldn't pass this exam today.",
          ),
          copy("This site is free because why is this stuff so expensive."),
          copy(
            "Ba-ba-ba, ba-Barbara Ann would have been a better name. We acknowledge this.",
          ),
        ],
        footer: {
          motto: copy(
            "\"We're not great. We're not even good. But we're here, and we're free. monobloc.com\"",
          ),
          established: copy(
            "Est. 2026 • Not ABA Accredited • Not NCBE Approved • Probably Illegal • Arguably Ethical",
            "label",
          ),
        },
      },
      quiz: {
        setup: {
          title: copy("Configure Your Ordeal", "heading2"),
          subjectLabel: copy("Subject (NCBE Taxonomy)", "label"),
          countLabel: copy("Quantity of Suffering", "label"),
          typeLabel: copy("Question Provenance", "label"),
          startButton: copy("Commence Adequacy", "button"),
        },
        active: {
          questionLabel: copy("Query", "label"),
          timerLabel: copy("Elapsed", "label"),
          submitButton: copy("Commit to This Answer", "button"),
          nextButton: copy("Face the Next One", "button"),
        },
        review: {
          title: copy("Assessment of Your Attempts", "heading2"),
          scoreLabel: copy("Performance Index", "label"),
          correctLabel: copy("Survived", "label"),
          incorrectLabel: copy("Did Not Survive", "label"),
        },
      },
      nav: {
        home: copy("Return", "button"),
        quiz: copy("Questions", "button"),
        study: copy("Materials", "button"),
        essays: copy("Essays", "button"),
        statistics: copy("Metrics", "button"),
        about: copy("Disclosures", "button"),
        signIn: copy("Identify", "button"),
        signOut: copy("Retreat", "button"),
      },
    },
  }),

  getters: {
    // Get text only (for templates)
    getText:
      (state) =>
      (path: string): string => {
        const parts = path.split(".");
        let current: any = state.content;
        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = current[part];
          } else {
            return path; // Return path as fallback
          }
        }
        return typeof current === "object" && "text" in current
          ? current.text
          : String(current);
      },

    // Get style for a path
    getStyle:
      (state) =>
      (path: string): CopyStyle | undefined => {
        const parts = path.split(".");
        let current: any = state.content;
        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = current[part];
          } else {
            return undefined;
          }
        }
        return typeof current === "object" && "style" in current
          ? current.style
          : undefined;
      },

    // Get all copy as flat map for editing
    getAllCopyFlat: (state) => {
      const flat: Record<string, { text: string; style?: CopyStyle }> = {};

      const flatten = (obj: any, prefix = "") => {
        for (const key in obj) {
          const path = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];

          if (value && typeof value === "object") {
            if ("text" in value) {
              flat[path] = value;
            } else if (Array.isArray(value)) {
              value.forEach((item, i) => {
                if (item && typeof item === "object" && "text" in item) {
                  flat[`${path}[${i}]`] = item;
                }
              });
            } else {
              flatten(value, path);
            }
          }
        }
      };

      flatten(state.content);
      return flat;
    },
  },

  actions: {
    // Update text at path
    updateText(path: string, newText: string) {
      const parts = path.split(".");
      let current: any = this.content;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!part) continue;
        // Handle array notation like "description[0]"
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch && arrayMatch[1] && arrayMatch[2]) {
          current = current[arrayMatch[1]][parseInt(arrayMatch[2])];
        } else {
          current = current[part];
        }
      }

      const lastPart = parts[parts.length - 1];
      if (!lastPart) return;

      const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);

      if (arrayMatch && arrayMatch[1] && arrayMatch[2]) {
        const arr = current[arrayMatch[1]];
        const idx = parseInt(arrayMatch[2]);
        if (typeof arr[idx] === "object" && "text" in arr[idx]) {
          arr[idx].text = newText;
        }
      } else if (
        current[lastPart] &&
        typeof current[lastPart] === "object" &&
        "text" in current[lastPart]
      ) {
        current[lastPart].text = newText;
      }
    },

    // Update style at path
    updateStyle(path: string, newStyle: Partial<CopyStyle>) {
      const parts = path.split(".");
      let current: any = this.content;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (part) current = current[part];
      }

      const lastPart = parts[parts.length - 1];
      if (!lastPart) return;

      if (
        current[lastPart] &&
        typeof current[lastPart] === "object" &&
        "style" in current[lastPart]
      ) {
        current[lastPart].style = { ...current[lastPart].style, ...newStyle };
      }
    },

    // Update a named style preset
    updateStylePreset(name: string, newStyle: Partial<CopyStyle>) {
      if (name in this.styles) {
        this.styles[name] = { ...this.styles[name], ...newStyle };
      }
    },

    // Export all copy as JSON (for backup/editing)
    exportCopy(): string {
      return JSON.stringify(this.content, null, 2);
    },

    // Import copy from JSON
    importCopy(json: string) {
      try {
        const imported = JSON.parse(json);
        this.content = imported;
      } catch {
        // Invalid JSON - ignore silently
      }
    },
  },

  persist: true,
});
