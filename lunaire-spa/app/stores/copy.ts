/**
 * Centralized Copy Management Store
 * All website text content in one place for easy editing
 */
import { defineStore } from "pinia";

export interface CopyStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
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
    fontFamily: "'Orbitron', sans-serif",
    fontSize: "3rem",
    fontWeight: "700",
  },
  heading2: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: "1.5rem",
    fontWeight: "600",
  },
  heading3: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  tagline: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1.5rem",
    fontWeight: "400",
  },
  body: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
  },
  button: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  label: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "0.75rem",
    fontWeight: "500",
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
        siteName: copy("Barbarossa Bar Prep", "heading1"),
        tagline: copy("The Cheap Bar Review", "tagline"),
        established: copy("Est. 2026", "label"),
        location: copy("The Void of Student Debt", "label"),
      },
      home: {
        hero: {
          title: copy("Barbarossa Bar Prep", "heading1"),
          tagline: copy("Because $4,000 is for suckers", "tagline"),
          description: [
            copy(
              "Welcome to Barbarossa, where the only thing that matters is the bar. you know its important to us because the name is in our title. twice. thats the most times it can be in a word. go ahead and try. bet you anything you wont find it unless you go with Barbarian or Barbary Pirates.",
            ),
            copy(
              "Fun Fact! Barbary comes from Barbarian. BARBARIAN CAME FROM BARBAROSSA — the redheaded ones.",
            ),
            copy(
              "barbarbar-barbarbarannnnnne? like the beatles song? well thats more bars than barbarossa. a lot more. well we just ruined what was a very good name. I can't change it now. I spent all my money on the site name already. can i even buy barbara anne?",
            ),
          ],
          funFact: copy(
            "Fun Fact! Barbary comes from Barbarian. BARBARIAN CAME FROM BARBAROSSA — the redheaded ones.",
          ),
          barbaraAnne: copy(
            "barbarbar-barbarbarannnnnne? like the beatles song? well thats more bars than barbarossa. a lot more. well we just ruined what was a very good name. I can't change it now. I spent all my money on the site name already. can i even buy barbara anne?",
          ),
          winning: copy("winning", "tagline"),
          ctaPrimary: copy("Start Practicing", "button"),
          ctaSecondary: copy("Quick Start", "button"),
        },
        stats: {
          title: copy("Your Question Set Metrics", "heading2"),
          labels: {
            totalRounds: copy("Sets Did", "label"),
            avgScore: copy("Average Score", "label"),
            bestScore: copy("Best Set", "label"),
            streak: copy("DAILY STREAK", "label"),
            correctTotal: copy("Total Correct", "label"),
          },
        },
        quickStart: {
          title: copy("Quick Start", "heading2"),
          description: copy("Jump right into practice mode"),
        },
      },
      about: {
        title: copy("About This Site", "heading2"),
        heroTitle: copy("Barbarossa Bar Prep", "heading1"),
        heroTagline: copy(
          "The Cheap Bar Review That Doesn't Pretend to Care",
          "tagline",
        ),
        sections: {
          whyWeExist: {
            title: copy("Why We Exist", "heading3"),
            paragraphs: [
              copy(
                'Because the bar exam preparation industry is a racket. BARBRI charges $4,000+ to "empower your learning journey" while NCBE charges exorbitant licensing fees for questions they wrote decades ago. Meanwhile, the entire legal industry wrings its hands wondering why the profession lacks diversity.',
              ),
              copy(
                'We built this site because studying for the bar shouldn\'t cost more than a semester of law school. No "spiral instructional design." No "Pass Predictor™." No coaches named Brad. Just questions and your crushing anxiety.',
              ),
            ],
          },
          ncbeProblem: {
            title: copy("The NCBE Problem", "heading3"),
            paragraphs: [
              copy(
                "The National Conference of Bar Examiners holds a monopoly on the MBE, charging jurisdictions enormous licensing fees that get passed on to you. They've made the bar exam a $5,000+ ordeal that disproportionately burdens first-generation lawyers and those without family wealth.",
              ),
              copy(
                "Their copyright threats mean we can't even show you real past questions without paying their tribute. This is not how professional licensing should work in a democratic society.",
              ),
            ],
          },
          whatWeDo: {
            title: copy("What We Actually Do", "heading3"),
            paragraphs: [
              copy(
                "We provide practice questions covering MBE subjects, track your progress, and offer AI-powered explanations. No gamification theater. No \"you're doing great!\" when you're not. Just honest feedback and the questions you need to practice.",
              ),
            ],
          },
        },
        truths: [
          copy("Bar prep courses are overpriced."),
          copy("NCBE is a monopoly."),
          copy('65% is "passing" - set your expectations accordingly.'),
          copy(
            'Your law school\'s pass rate is a better predictor than any "Pass Predictor™".',
          ),
          copy("The bar exam tests test-taking, not lawyering."),
          copy("Most practicing attorneys couldn't pass the bar today."),
          copy(
            "The legal profession gatekeeps to protect incumbents, not the public.",
          ),
        ],
        footer: {
          motto: copy(
            "\"Unlike those $4,000 courses, we won't pretend you'll be 'empowered.'\"",
          ),
          established: copy(
            "Est. 2026 • The Void of Student Debt • Earth",
            "label",
          ),
        },
      },
      quiz: {
        setup: {
          title: copy("Quiz Setup", "heading2"),
          subjectLabel: copy("Subject", "label"),
          countLabel: copy("Number of Questions", "label"),
          typeLabel: copy("Question Type", "label"),
          startButton: copy("Start Quiz", "button"),
        },
        active: {
          questionLabel: copy("Question", "label"),
          timerLabel: copy("Time", "label"),
          submitButton: copy("Submit Answer", "button"),
          nextButton: copy("Next Question", "button"),
        },
        review: {
          title: copy("Quiz Results", "heading2"),
          scoreLabel: copy("Score", "label"),
          correctLabel: copy("Correct", "label"),
          incorrectLabel: copy("Incorrect", "label"),
        },
      },
      nav: {
        home: copy("Home", "button"),
        quiz: copy("Quiz", "button"),
        study: copy("Study", "button"),
        essays: copy("Essays", "button"),
        statistics: copy("Statistics", "button"),
        about: copy("About", "button"),
        signIn: copy("Sign In", "button"),
        signOut: copy("Sign Out", "button"),
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
      } catch (e) {
        console.error("Failed to import copy:", e);
      }
    },
  },

  persist: true,
});
