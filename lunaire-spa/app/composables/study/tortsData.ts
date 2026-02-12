/**
 * TORTS — Comprehensive Bar Exam Study Data
 * ==========================================
 * MBE Weight: ~25% of the exam (approx 43-44 questions)
 * CA Bar (CBX): Tested both in MBE and Performance Test contexts
 *
 * FREQUENCY KEY: 1=rare, 2=occasional, 3=common, 4=frequent, 5=almost-every-exam
 *
 * Each node follows the bar review mental model:
 *   RULE → ELEMENTS → TEST → EXCEPTIONS → EXCEPTIONS TO EXCEPTIONS → POLICY
 */

export interface RuleElement {
  name: string;
  description: string;
  subElements?: RuleElement[];
}

export interface StudyRule {
  id: string;
  name: string;
  shortName?: string;
  mnemonic?: string;
  ruleStatement: string;
  elements: RuleElement[];
  test: {
    name: string;
    standard: string;
    description: string;
  };
  exceptions: {
    name: string;
    rule: string;
    elements?: string[];
  }[];
  exceptionsToExceptions?: {
    name: string;
    rule: string;
    appliesTo: string; // which exception it overrides
  }[];
  policyFor: string[];
  policyAgainst: string[];
  examTips: string[];
  frequency: number; // 1-5
  keyCase?: string;
  connections: string[]; // IDs of related rules
}

export interface StudyTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: number;
  description: string;
  mbeWeight: string;
  rules: StudyRule[];
  position: { x: number; y: number }; // canvas position
}

export interface SubjectData {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  mbeWeight: string;
  topics: StudyTopic[];
}

// ═══════════════════════════════════════════════════════════════
//  TORTS DATA — THE COMPLETE MIND MAP
// ═══════════════════════════════════════════════════════════════

export const tortsData: SubjectData = {
  id: "torts",
  name: "Torts",
  icon: "⚠️",
  tagline: "Wrongs, Remedies & Reasonable People",
  description:
    "Civil wrongs that cause harm — from intentional acts to mere carelessness. Master the duty-breach-causation-damages framework and you own a quarter of the MBE.",
  mbeWeight: "~25% of MBE (43-44 questions)",

  topics: [
    // ──────────────────────────────────────────────────────────
    //  1. NEGLIGENCE — THE BIG KAHUNA (~35-40% of Torts Qs)
    // ──────────────────────────────────────────────────────────
    {
      id: "negligence",
      name: "Negligence",
      icon: "🎯",
      color: "var(--accent-blue)",
      frequency: 5,
      description:
        "The unintentional tort. Δ fails to act as a reasonable person → harm results.",
      mbeWeight: "35-40% of Torts questions",
      position: { x: 400, y: 100 },
      rules: [
        // ---- DUTY ----
        {
          id: "neg-duty",
          name: "Duty of Care",
          shortName: "DUTY",
          mnemonic: "D-B-C-D = Duty, Breach, Causation, Damages",
          ruleStatement:
            "A duty of care is owed to all FORESEEABLE plaintiffs — those within the zone of danger created by Δ's conduct.",
          elements: [
            {
              name: "General Duty",
              description:
                "Everyone owes a duty to act as a REASONABLE PERSON under the circumstances.",
              subElements: [
                {
                  name: "Objective Standard",
                  description:
                    "Not what Δ thought was reasonable — what a hypothetical reasonable person would do.",
                },
                {
                  name: "Circumstances Matter",
                  description:
                    "Emergency, physical disability (but NOT mental disability), superior knowledge all factor in.",
                },
              ],
            },
            {
              name: "Foreseeable Plaintiff",
              description:
                "Duty extends only to those foreseeably endangered by Δ's conduct.",
            },
          ],
          test: {
            name: "Reasonable Person Standard",
            standard: "Objective",
            description:
              "Would a reasonable person of ordinary prudence, in Δ's position, have acted differently? This is NOT a subjective test — Δ's personal limitations (low IQ, inexperience) are irrelevant unless physical disability.",
          },
          exceptions: [
            {
              name: "No Duty to Rescue",
              rule: "Generally, no duty to act affirmatively to aid a stranger — even if rescue would be easy and risk-free.",
              elements: [
                "No special relationship",
                "Δ did not create the peril",
                "No voluntary assumption of duty",
              ],
            },
            {
              name: "Landowner Duties (Traditional)",
              rule: "Duty varies by plaintiff's status: Invitee (highest) → Licensee → Trespasser (lowest).",
              elements: [
                "Invitee: duty to inspect + warn/repair",
                "Licensee: duty to warn of known hidden dangers",
                "Trespasser: only duty not to willfully/wantonly injure",
              ],
            },
            {
              name: "Pure Economic Loss",
              rule: "No duty for pure economic loss absent physical injury or property damage — prevents unlimited liability.",
            },
          ],
          exceptionsToExceptions: [
            {
              name: "Special Relationships Create Duty to Act",
              rule: "Common carrier-passenger, innkeeper-guest, employer-employee, school-student, landlord-tenant, therapist-patient (Tarasoff).",
              appliesTo: "No Duty to Rescue",
            },
            {
              name: "Peril Created by Δ",
              rule: "If Δ created the danger (even innocently), duty to rescue arises.",
              appliesTo: "No Duty to Rescue",
            },
            {
              name: "Attractive Nuisance Doctrine",
              rule: "Landowner has heightened duty to child trespassers re: artificial conditions on the land that are foreseeably attractive to children.",
              appliesTo: "Landowner Duties (Traditional)",
            },
            {
              name: "Modern Trend: Unitary Standard",
              rule: "Many jurisdictions (incl. CA) abandon categories → owe reasonable care to ALL entrants. Rowland v. Christian (CA).",
              appliesTo: "Landowner Duties (Traditional)",
            },
          ],
          policyFor: [
            "Encourages socially responsible behavior",
            "Allocates risk to those best positioned to prevent harm",
            "Provides compensation to injured parties",
          ],
          policyAgainst: [
            "Imposing unlimited duty leads to crushing liability",
            "Autonomy — people should choose whether to be Good Samaritans",
            "Floodgates concern: limitless class of potential plaintiffs",
          ],
          examTips: [
            "⚡ Cardozo (Palsgraf majority): Duty owed only to foreseeable Πs in zone of danger.",
            "⚡ Andrews (Palsgraf dissent): Duty owed to the world at large; limit via proximate cause instead.",
            '⚡ MBE loves: "Does Δ owe a duty?" → Answer is almost always YES on the MBE. The trick is in breach/causation.',
            "⚡ CA twist: Rowland v. Christian abolished trespasser/licensee/invitee categories.",
          ],
          frequency: 5,
          keyCase: "Palsgraf v. Long Island Railroad (1928)",
          connections: [
            "neg-breach",
            "neg-causation-actual",
            "neg-special-duty",
          ],
        },

        // ---- BREACH ----
        {
          id: "neg-breach",
          name: "Breach of Duty",
          shortName: "BREACH",
          ruleStatement:
            "Δ breaches duty by failing to act as a reasonable person would under the same or similar circumstances. Breach = conduct falling below the applicable standard of care.",
          elements: [
            {
              name: "Failure to Conform",
              description:
                "Δ's actual conduct vs. what a reasonable person would have done.",
            },
            {
              name: "Hand Formula (B < P × L)",
              description:
                "Breach occurs when the Burden of precaution is less than the Probability of harm × the magnitude of the Loss.",
              subElements: [
                {
                  name: "B = Burden",
                  description: "Cost/difficulty of taking precautions.",
                },
                {
                  name: "P = Probability",
                  description: "Likelihood of harm occurring.",
                },
                {
                  name: "L = Loss/Gravity",
                  description: "Severity of the potential injury.",
                },
              ],
            },
          ],
          test: {
            name: "Reasonable Person / Hand Formula",
            standard: "Objective Cost-Benefit",
            description:
              "Judge Learned Hand's formula: Δ breaches when B < P × L. If the cost of preventing harm was less than the expected harm, Δ should have prevented it. United States v. Carroll Towing Co.",
          },
          exceptions: [
            {
              name: "Custom",
              rule: 'Industry custom is EVIDENCE of reasonable care but NOT conclusive. "An entire industry can be negligent." — The T.J. Hooper.',
            },
            {
              name: "Res Ipsa Loquitur",
              rule: "The thing speaks for itself. Π can establish an INFERENCE of breach without direct evidence of what Δ did wrong.",
              elements: [
                "Accident is of a type that ordinarily doesn't occur without negligence",
                "Instrumentality causing harm was in Δ's exclusive control",
                "Π did not contribute to the accident",
              ],
            },
            {
              name: "Negligence Per Se",
              rule: "Violation of a statute = automatic breach IF: (1) Π is in the class of persons the statute was designed to protect, AND (2) the harm is the type the statute was designed to prevent.",
            },
          ],
          exceptionsToExceptions: [
            {
              name: "Compliance with Statute ≠ No Breach",
              rule: "Meeting a statutory standard is evidence of due care but does NOT conclusively negate breach. Reasonable care may require more than the statutory minimum.",
              appliesTo: "Negligence Per Se",
            },
            {
              name: "Excuse for Statutory Violation",
              rule: "Violation excused if: compliance would cause greater harm, Δ had incapacity, Δ was unaware of factual circumstances, emergency not of Δ's making, compliance was impossible.",
              appliesTo: "Negligence Per Se",
            },
          ],
          policyFor: [
            "Incentivizes precaution-taking proportional to risk",
            "The Hand Formula balances efficiency and safety",
          ],
          policyAgainst: [
            "Hindsight bias — breach analysis happens after the accident, distorting judgment",
            "Custom should matter more — industries know their risks best",
          ],
          examTips: [
            "⚡ Res Ipsa = inference, NOT presumption. Jury MAY find breach but isn't required to.",
            "⚡ MBE trap: custom evidence is admissible but NEVER dispositive.",
            "⚡ Negligence per se: statute must protect THIS class of Πs against THIS type of harm.",
            "⚡ Professional standard (doctors): judged by what a reasonable physician in the same specialty would do. Locality rule eroding → national standard.",
          ],
          frequency: 5,
          keyCase: "United States v. Carroll Towing Co. (1947)",
          connections: ["neg-duty", "neg-causation-actual"],
        },

        // ---- ACTUAL CAUSE ----
        {
          id: "neg-causation-actual",
          name: "Actual Cause (Cause-in-Fact)",
          shortName: "ACTUAL CAUSE",
          ruleStatement:
            "Π must show that \"but for\" Δ's breach, Π's injury would not have occurred. Δ's conduct must be a factual cause of the harm.",
          elements: [
            {
              name: "But-For Test",
              description:
                "Would the injury have occurred BUT FOR Δ's negligent act? If harm happens regardless → no actual cause.",
            },
          ],
          test: {
            name: "But-For Test",
            standard: "Counterfactual",
            description:
              "Eliminate Δ's negligent conduct from the equation. Does the harm still occur? If yes → Δ is not the actual cause. If no → actual cause is established.",
          },
          exceptions: [
            {
              name: "Substantial Factor Test (Multiple Δs)",
              rule: 'When TWO independent forces, either alone sufficient to cause harm, combine → each is a cause if it was a "substantial factor" in producing harm. Anderson v. Minneapolis.',
              elements: [
                "Two or more forces",
                "Each independently sufficient",
                "Each a substantial factor",
              ],
            },
            {
              name: "Alternative Liability (Summers v. Tice)",
              rule: "When two+ Δs are negligent but only one caused harm and Π can't prove which → BURDEN SHIFTS to each Δ to prove they were NOT the cause.",
              elements: [
                "All Δs acted negligently",
                "Only one caused the harm",
                "Π cannot identify which one",
              ],
            },
            {
              name: "Market Share Liability (Sindell)",
              rule: "When a generic product causes harm and Π can't identify the specific manufacturer → each Δ liable for its market share. (DES cases, CA rule.)",
            },
            {
              name: "Loss of Chance",
              rule: "In medical malpractice, if Δ's negligence reduced Π's chance of survival/recovery, some jurisdictions allow recovery proportional to the lost chance.",
            },
          ],
          policyFor: [
            "Ensures actual causal connection — no liability without a link",
            "Alternative theories prevent unjust outcomes when traditional proof is impossible",
          ],
          policyAgainst: [
            "Substantial factor and market share theories relax causation too much",
            "Risk of imposing liability on non-causers in the alternative liability context",
          ],
          examTips: [
            '⚡ "Two fires" = substantial factor test, NOT but-for.',
            "⚡ Summers v. Tice: two hunters, one pellet — burden shifts to Δs.",
            "⚡ Market share liability is a CA favorite (Sindell v. Abbott Labs).",
            "⚡ MBE default is but-for. Only deviate when but-for breaks down.",
          ],
          frequency: 4,
          keyCase: "Summers v. Tice (1948)",
          connections: ["neg-causation-proximate", "neg-breach"],
        },

        // ---- PROXIMATE CAUSE ----
        {
          id: "neg-causation-proximate",
          name: "Proximate Cause (Legal Cause)",
          shortName: "PROXIMATE CAUSE",
          ruleStatement:
            "Even if Δ is the actual cause, liability is limited to harms that are a FORESEEABLE result of Δ's negligent conduct. Proximate cause = policy-based limitation on liability.",
          elements: [
            {
              name: "Foreseeability of Harm",
              description:
                "Was the TYPE of harm that occurred a foreseeable consequence of Δ's conduct?",
            },
            {
              name: "Direct vs. Indirect Cause",
              description:
                "Direct: unbroken chain. Indirect: intervening forces between Δ's act and harm.",
            },
          ],
          test: {
            name: "Foreseeability Test",
            standard: "Objective Foreseeability",
            description:
              'Was the general type of harm foreseeable? Note: the EXACT manner or EXTENT of harm need NOT be foreseeable — Δ takes the Π as they find them (eggshell skull rule). "Thin skull" Πs recover fully.',
          },
          exceptions: [
            {
              name: "Superseding Intervening Cause",
              rule: "An unforeseeable intervening force that breaks the causal chain and becomes the sole proximate cause. Cuts off Δ's liability.",
              elements: [
                "Intervening force was NOT foreseeable",
                "It was independent of Δ's negligence",
                "It was the immediate cause of harm",
              ],
            },
            {
              name: "Eggshell Skull Rule",
              rule: "Δ takes the Π as they find them. If Π has a preexisting vulnerability that makes harm worse, Δ is liable for FULL extent of harm even if unforeseeable in degree. (This is an EXCEPTION to foreseeability limiting liability.)",
            },
          ],
          exceptionsToExceptions: [
            {
              name: "Foreseeable Intervening ≠ Superseding",
              rule: "If the intervening cause was FORESEEABLE (e.g., medical malpractice after initial injury, negligent rescue attempts, subsequent accidents), it does NOT break the chain. Δ remains liable.",
              appliesTo: "Superseding Intervening Cause",
            },
            {
              name: "Criminal/Intentional Acts Sometimes Foreseeable",
              rule: "Even criminal acts of third parties may not be superseding if the risk of such acts was foreseeable (e.g., landlord failing to secure building → criminal entry).",
              appliesTo: "Superseding Intervening Cause",
            },
          ],
          policyFor: [
            "Limits potentially infinite liability chains",
            "Focuses liability where moral culpability is strongest",
            "Eggshell rule protects vulnerable plaintiffs — fairness",
          ],
          policyAgainst: [
            "Foreseeability is inherently ambiguous and malleable",
            'Judges can manipulate the "foreseeability" finding to reach desired results',
          ],
          examTips: [
            '⚡ MBE LOVES intervening cause questions. Ask: "Was the intervening force foreseeable?"',
            "⚡ Foreseeable intervening causes: subsequent medical malpractice, rescue attempts, subsequent accidents, Π's own negligence, reaction forces.",
            "⚡ UNforeseeable superseding causes: extraordinary acts of nature, criminal acts of third parties (UNLESS risk was part of the original negligence).",
            "⚡ Eggshell skull: extent of harm doesn't need to be foreseeable. Type of harm does.",
          ],
          frequency: 5,
          keyCase: "Wagon Mound (Overseas Tankship v. Morts Dock, 1961)",
          connections: ["neg-causation-actual", "neg-damages"],
        },

        // ---- DAMAGES ----
        {
          id: "neg-damages",
          name: "Damages",
          shortName: "DAMAGES",
          ruleStatement:
            "Π must prove ACTUAL damages. Unlike intentional torts, nominal damages are NOT available for negligence. Π must show physical injury or property damage.",
          elements: [
            {
              name: "Compensatory Damages",
              description:
                "Medical expenses, lost wages, pain & suffering, loss of consortium.",
            },
            {
              name: "Must Be Actual",
              description:
                "No nominal damages for negligence. Need proof of real harm.",
            },
          ],
          test: {
            name: "Reasonable Certainty",
            standard: "Preponderance of Evidence",
            description:
              "Damages must be proven to a reasonable certainty. Speculative damages not allowed. Future damages allowed if reasonably certain to occur.",
          },
          exceptions: [
            {
              name: "Punitive Damages",
              rule: "Available ONLY for willful, wanton, or reckless conduct (gross negligence). Not available for ordinary negligence.",
            },
            {
              name: "Mitigation / Avoidable Consequences",
              rule: "Π has a duty to mitigate — cannot recover for damages they reasonably could have avoided (e.g., failure to seek medical treatment).",
            },
            {
              name: "Collateral Source Rule",
              rule: "Payments to Π from insurance or other sources do NOT reduce Δ's liability. Π can recover from both. (This benefits Πs.)",
            },
          ],
          policyFor: [
            "Makes Π whole — tort law's central goal",
            "Collateral source rule prevents tortfeasors from benefiting from Π's insurance",
          ],
          policyAgainst: [
            "Double recovery concern with collateral source rule",
            "Punitive damages can be disproportionate",
          ],
          examTips: [
            "⚡ KEY DISTINCTION: Negligence requires ACTUAL damages. Intentional torts allow nominal damages.",
            "⚡ MBE tests collateral source often — insurance payments don't reduce Δ's liability.",
            "⚡ Emotional distress for negligence: generally requires physical manifestation/impact (zone of danger test or Dillon factors).",
          ],
          frequency: 4,
          connections: ["neg-causation-proximate", "neg-defenses"],
        },

        // ---- SPECIAL DUTY RULES ----
        {
          id: "neg-special-duty",
          name: "Special Duty Rules",
          shortName: "SPECIAL DUTIES",
          ruleStatement:
            "Certain categories of Δs have modified duties that deviate from the general reasonable person standard.",
          elements: [
            {
              name: "Professionals",
              description:
                "Held to the standard of a reasonable professional in their field.",
            },
            {
              name: "Children",
              description:
                "Held to what a reasonable child of similar age, intelligence, and experience would do.",
            },
            {
              name: "Common Carriers & Innkeepers",
              description:
                "Owe the HIGHEST degree of care to passengers/guests.",
            },
          ],
          test: {
            name: "Modified Reasonable Person",
            standard: "Varies by Category",
            description:
              "Professionals: reasonable practitioner in the specialty. Children: reasonable child of similar age/intelligence (EXCEPT: adult activity → adult standard). Emergency: reasonable person in same emergency (if not self-created).",
          },
          exceptions: [
            {
              name: "Child Engaged in Adult Activity",
              rule: "A child operating a motorized vehicle, boat, or engaging in inherently adult activities is held to the ADULT reasonable person standard.",
            },
            {
              name: "Mental Disability ≠ Lower Standard",
              rule: "Unlike physical disability, mental disability does NOT lower the standard. Mentally ill Δ is still held to a reasonable person standard.",
            },
            {
              name: "Negligent Infliction of Emotional Distress (NIED)",
              rule: "Special duty to avoid causing emotional distress. Most jurisdictions require: (1) Zone of Danger test (Π must be near miss), OR (2) Bystander recovery (Dillon v. Legg factors: close relationship, presence at scene, contemporaneous perception).",
              elements: [
                "Zone of Danger: Π was in physical danger",
                "OR Bystander: close family member, present at scene, directly perceived injury",
              ],
            },
          ],
          policyFor: [
            "Professionals should be held to higher standards — they have specialized knowledge",
            "Children have developing cognition — lower standard is fair",
          ],
          policyAgainst: [
            "Mental disability exception seems harsh",
            "The higher standard for common carriers may be antiquated",
          ],
          examTips: [
            "⚡ Doctor = reasonable doctor in the specialty. NOT the best doctor.",
            "⚡ NIED on MBE: look for zone of danger or bystander = family member.",
            "⚡ CA uses the Dillon v. Legg factors for bystander NIED (plus Thing v. La Chusa refining it).",
            "⚡ Child on a snowmobile = adult standard.",
          ],
          frequency: 4,
          connections: ["neg-duty", "neg-breach"],
        },

        // ---- DEFENSES TO NEGLIGENCE ----
        {
          id: "neg-defenses",
          name: "Defenses to Negligence",
          shortName: "DEFENSES",
          ruleStatement:
            "Even if Δ is negligent, Π's own conduct may reduce or bar recovery. The two major frameworks are contributory negligence and comparative fault.",
          elements: [
            {
              name: "Contributory Negligence",
              description:
                "Traditional: ANY negligence by Π = complete bar to recovery. Harsh but still the rule in a few US jurisdictions.",
            },
            {
              name: "Comparative Fault",
              description:
                "Modern majority: Π's recovery reduced by their percentage of fault.",
            },
            {
              name: "Assumption of Risk",
              description:
                "Π who voluntarily encounters a known risk may be barred from recovery.",
            },
          ],
          test: {
            name: "Comparative Fault Analysis",
            standard: "Percentage-Based Allocation",
            description:
              "Pure Comparative (CA, NY): Π recovers even if 99% at fault (recovery reduced by %). Modified Comparative: Π barred if ≥ 50% (some states) or > 50% (other states) at fault.",
          },
          exceptions: [
            {
              name: "Last Clear Chance (softens contributory neg)",
              rule: "Even a contributorily negligent Π can recover if Δ had the LAST CLEAR CHANCE to avoid the harm and failed to do so.",
            },
            {
              name: "Express Assumption of Risk",
              rule: "Valid waiver/release by Π before the activity. Generally enforceable UNLESS involves essential public service, unequal bargaining power, or intentional/reckless conduct.",
            },
            {
              name: "Implied Assumption of Risk",
              rule: "Π knowingly and voluntarily encountered the risk through conduct (not a signed waiver). In pure comparative fault jurisdictions like CA, this merges into comparative fault analysis.",
            },
          ],
          exceptionsToExceptions: [
            {
              name: "No Assumption of Risk for Necessity",
              rule: "If Π had no meaningful choice (e.g., only available medical provider, rescuing someone), assumption of risk does not apply.",
              appliesTo: "Implied Assumption of Risk",
            },
            {
              name: "Firefighter's Rule",
              rule: "Professional rescuers (firefighters, police) may not recover from the person whose negligence caused the dangerous condition that required their professional response. (Being weakened in many jurisdictions.)",
              appliesTo: "Implied Assumption of Risk",
            },
          ],
          policyFor: [
            "Comparative fault is fairest — each party pays their share",
            "Encourages plaintiffs to also be careful",
            "Assumption of risk respects autonomy",
          ],
          policyAgainst: [
            "Contributory negligence is excessively harsh",
            "Assumption of risk can be weaponized by powerful parties (e.g., mandatory waivers)",
          ],
          examTips: [
            "⚡ MBE DEFAULT = comparative fault (most tested). Know: pure vs. modified.",
            "⚡ CA = pure comparative fault (Li v. Yellow Cab). Π can recover even at 99% fault.",
            "⚡ Express assumption of risk: look for signed waivers at gyms, sky diving, etc.",
            "⚡ If the Q doesn't specify the jurisdiction, assume comparative fault.",
            '⚡ Avoid "all or nothing" answers on the MBE — comparative fault = nuanced.',
          ],
          frequency: 5,
          keyCase: "Li v. Yellow Cab Co. (CA, 1975)",
          connections: ["neg-duty", "neg-damages"],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  2. INTENTIONAL TORTS (~15-20% of Torts Qs)
    // ──────────────────────────────────────────────────────────
    {
      id: "intentional-torts",
      name: "Intentional Torts",
      icon: "👊",
      color: "#ff6b35",
      frequency: 4,
      description:
        "Δ acts with PURPOSE or SUBSTANTIAL CERTAINTY that harmful/offensive contact or apprehension will result.",
      mbeWeight: "15-20% of Torts questions",
      position: { x: 100, y: 350 },
      rules: [
        {
          id: "it-battery",
          name: "Battery",
          shortName: "BATTERY",
          mnemonic: "HOCK = Harmful/Offensive Contact + Knowledge (intent)",
          ruleStatement:
            "An intentional, harmful or offensive CONTACT with Π's person. The contact must be with Π. Intent = purpose or substantial certainty.",
          elements: [
            {
              name: "Intent",
              description:
                "Δ acts with PURPOSE or SUBSTANTIAL CERTAINTY that contact will occur. Transferred intent applies.",
            },
            {
              name: "Harmful or Offensive Contact",
              description:
                "Contact that causes injury OR would offend a reasonable person's sense of dignity.",
            },
            {
              name: "With Π's Person",
              description:
                "Includes anything connected to Π — clothing, object in hand, chair Π is sitting in.",
            },
            {
              name: "Causation",
              description:
                "Δ's act must cause the contact (directly or indirectly — setting a trap counts).",
            },
          ],
          test: {
            name: 'Reasonable Person (for "offensive")',
            standard: "Objective — Dignity-Based",
            description:
              'For "offensive" contact: would a reasonable person not having consented find the contact offensive? Hypersensitivity of Π is irrelevant UNLESS Δ knew of it.',
          },
          exceptions: [
            {
              name: "Consent",
              rule: "Express or implied consent is a complete defense. Implied consent from custom or circumstances (e.g., crowded subway).",
            },
            {
              name: "Self-Defense",
              rule: "Δ may use reasonable force to prevent imminent harmful/offensive contact. Force must be PROPORTIONAL to the threat.",
              elements: [
                "Reasonable belief of imminent harm",
                "Proportional force",
                "No duty to retreat (majority) BUT see CA/some states",
              ],
            },
            {
              name: "Defense of Others",
              rule: "Modern rule: Δ may use reasonable force to defend another if Δ reasonably believes the other person would be entitled to use self-defense.",
            },
            {
              name: "Necessity",
              rule: "Private necessity: Δ may interfere with Π's property to prevent greater harm, BUT must pay for actual damages. Public necessity: complete defense when acting to protect the community.",
            },
          ],
          policyFor: [
            "Protects bodily autonomy — the most fundamental right",
            "Deters unwanted touching even without injury",
          ],
          policyAgainst: [
            "Can be used to create liability for trivial contacts",
          ],
          examTips: [
            "⚡ TRANSFERRED INTENT: Intent to commit one tort against A → commits different tort against B → still liable.",
            "⚡ Applies across 5 torts: Battery, Assault, False Imprisonment, Trespass to Land, Trespass to Chattels.",
            "⚡ No damage required! Nominal damages available.",
            '⚡ Δ need not intend HARM — only the contact. A "joke" punch = battery.',
            "⚡ Unconscious Π can be battered (e.g., surgery without consent).",
          ],
          frequency: 4,
          connections: ["it-assault", "it-defenses"],
        },
        {
          id: "it-assault",
          name: "Assault",
          shortName: "ASSAULT",
          ruleStatement:
            "An intentional act that causes Π's REASONABLE APPREHENSION of IMMINENT harmful or offensive contact. Words alone are generally insufficient without an overt act.",
          elements: [
            {
              name: "Intent",
              description:
                "Δ intends to cause apprehension of imminent contact (or intends the contact itself). Transferred intent applies.",
            },
            {
              name: "Reasonable Apprehension",
              description:
                'Π must actually perceive the threat. An unaware Π cannot be assaulted. "Apprehension" ≠ fear — it means awareness/expectation.',
            },
            {
              name: "Imminent",
              description:
                'The threat must be of immediate contact, not future harm. "I\'ll hit you tomorrow" = no assault.',
            },
            {
              name: "Harmful or Offensive Contact",
              description:
                "Same standard as battery — reasonable person's dignity test.",
            },
          ],
          test: {
            name: "Reasonable Person — Apprehension",
            standard: "Objective",
            description:
              "Would a reasonable person in Π's position apprehend imminent harmful/offensive contact? Apparent ability to carry out the threat is sufficient (pointing an unloaded gun = assault if Π doesn't know it's unloaded).",
          },
          exceptions: [
            {
              name: "Words Alone",
              rule: "Generally insufficient without some overt act. BUT words can negate the assault: \"If I weren't a law student, I'd punch you\" → conditional future threat = no assault.",
            },
            {
              name: "Unaware Π",
              rule: "Π must be AWARE of the threat at the time. A sleeping Π cannot be assaulted (but CAN be battered).",
            },
          ],
          policyFor: [
            "Protects mental tranquility and freedom from fear of physical harm",
          ],
          policyAgainst: [
            "The line between rude behavior and assault can be unclear",
          ],
          examTips: [
            "⚡ Assault does NOT require actual contact — that's battery.",
            "⚡ Unloaded gun pointed at Π who doesn't know it's unloaded = assault.",
            '⚡ "Apprehension" ≠ "fear." A 6\'5" bodybuilder can be assaulted by a child if they apprehend the contact.',
            "⚡ Words + overt act = assault. Words alone = maybe not.",
          ],
          frequency: 3,
          connections: ["it-battery", "it-false-imprisonment"],
        },
        {
          id: "it-false-imprisonment",
          name: "False Imprisonment",
          shortName: "FALSE IMPRISON.",
          ruleStatement:
            "Intentional confinement of Π within bounded area, against Π's will, with Π aware of confinement (or harmed by it).",
          elements: [
            {
              name: "Intent to Confine",
              description:
                "Deliberate act to restrict Π's freedom of movement.",
            },
            {
              name: "Confinement",
              description:
                "Complete restriction — Π must have no reasonable means of escape. An open door = no confinement.",
            },
            {
              name: "Bounded Area",
              description:
                "Physical barriers, threats of force, assertion of legal authority, or failure to release (when duty to release exists).",
            },
            {
              name: "Awareness or Harm",
              description:
                "Π must know of the confinement at the time OR suffer actual harm from it.",
            },
          ],
          test: {
            name: "Complete Confinement",
            standard: "No Reasonable Escape",
            description:
              "Was Π completely confined with no reasonable means of escape known to them? Moral pressure alone is NOT confinement. Physical force, threats of force, or invalid assertion of legal authority qualifies.",
          },
          exceptions: [
            {
              name: "Shopkeeper's Privilege",
              rule: "A shopkeeper may detain a suspected shoplifter for a REASONABLE time in a REASONABLE manner to investigate. Must have reasonable suspicion.",
              elements: [
                "Reasonable suspicion of theft",
                "Reasonable duration",
                "Reasonable manner (no excessive force)",
              ],
            },
          ],
          policyFor: ["Protects freedom of movement — a fundamental liberty"],
          policyAgainst: [
            "Shopkeeper's privilege balances property rights with personal liberty",
          ],
          examTips: [
            '⚡ MBE tests "reasonable means of escape" — if there\'s an open door Π knows about, no false imprisonment.',
            "⚡ Threats of FUTURE harm don't count — must be immediate threat.",
            "⚡ Shopkeeper's privilege: most tested exception. Keep it REASONABLE.",
          ],
          frequency: 3,
          connections: ["it-assault", "it-iied"],
        },
        {
          id: "it-iied",
          name: "Intentional Infliction of Emotional Distress (IIED)",
          shortName: "IIED",
          ruleStatement:
            "Δ engages in EXTREME AND OUTRAGEOUS conduct, intentionally or recklessly causing Π SEVERE emotional distress.",
          elements: [
            {
              name: "Extreme & Outrageous Conduct",
              description:
                'Conduct "beyond all bounds of decency" — exceeds what a civilized society tolerates. Ordinary insults/threats are NOT enough.',
            },
            {
              name: "Intent or Recklessness",
              description:
                "Δ intended to cause emotional distress OR acted with reckless disregard of the probability of causing it.",
            },
            {
              name: "Severe Emotional Distress",
              description:
                "Distress must be SEVERE — not mere annoyance, embarrassment, or hurt feelings. Duration and intensity matter.",
            },
            {
              name: "Causation",
              description: "Δ's conduct must cause the distress.",
            },
          ],
          test: {
            name: 'Reasonable Person — "Outrageous"',
            standard: "Extreme & Outrageous Threshold",
            description:
              '"Beyond all bounds tolerated by civilized society." Recitation that fills a reasonable person with "outrage." Context matters — conduct toward vulnerable persons (children, elderly, pregnant women) or by persons in positions of authority is more likely outrageous.',
          },
          exceptions: [
            {
              name: "Mere Insults",
              rule: "Ordinary insults, indignities, and threats are NOT enough. The conduct must be truly egregious.",
            },
            {
              name: "Third-Party IIED (Bystander)",
              rule: "Δ who injures A may be liable to B for IIED if: (1) B was present, (2) B is a close family member of A, and (3) Δ knew B was present.",
            },
          ],
          policyFor: [
            "Protects emotional well-being from truly outrageous behavior",
            "Covers the gap where other torts don't reach",
          ],
          policyAgainst: [
            'Subjective "outrageousness" standard gives too much discretion',
            "Chilling effect on free speech",
          ],
          examTips: [
            '⚡ "Outrageous" = the HIGHEST bar among all torts to meet.',
            "⚡ Repeated conduct is more likely outrageous than a single act.",
            "⚡ Common carriers and innkeepers: lower threshold (insults from them more readily = outrageous).",
            "⚡ Physical manifestation of distress is NOT required for IIED (unlike NIED in most jurisdictions).",
          ],
          frequency: 3,
          connections: ["it-assault", "neg-special-duty"],
        },
        {
          id: "it-trespass-land",
          name: "Trespass to Land",
          shortName: "TRESPASS LAND",
          ruleStatement:
            "Intentional physical invasion of Π's land. Δ need only intend the ACT of entry — not intend to trespass. Mistake is no defense.",
          elements: [
            {
              name: "Intent",
              description:
                "Δ intentionally enters, remains, or causes an object/third person to enter. Need only intend the physical act, NOT to trespass.",
            },
            {
              name: "Physical Invasion",
              description:
                "Personal entry, throwing objects, causing flooding, or entering above (airplane low fly-over) or below (mining) the surface.",
            },
            {
              name: "Π's Land",
              description:
                "Land Π has possessory interest in (owner or tenant).",
            },
          ],
          test: {
            name: "Intent to Enter",
            standard: "Volitional Act — No Mistake Defense",
            description:
              "Did Δ intentionally perform the physical act of entering? Mistake about ownership or boundary lines is irrelevant. If Δ thinks they're on their own land but is on Π's land → still trespass.",
          },
          exceptions: [
            {
              name: "Necessity (Private)",
              rule: "Entry onto another's land to prevent serious harm to self or property. Δ must pay for actual damages caused.",
            },
            {
              name: "Necessity (Public)",
              rule: "Complete defense: entry to prevent disaster affecting the community. No liability for damages.",
            },
            {
              name: "Consent / License",
              rule: "Permission from landowner (express or implied). Revocable.",
            },
          ],
          policyFor: [
            "Protects exclusive possession of land — bedrock property right",
          ],
          policyAgainst: [
            "Strict intent rule can lead to harsh results for honest mistakes",
          ],
          examTips: [
            "⚡ MISTAKE IS NO DEFENSE to trespass — distinguish from negligence!",
            "⚡ Nominal damages available (no actual harm needed).",
            "⚡ Particles/pollution: modern trend = trespass (not just nuisance).",
            "⚡ Private necessity: Vincent v. Lake Erie — Δ must pay for damage even though entry was justified.",
          ],
          frequency: 3,
          connections: ["it-trespass-chattels", "it-conversion"],
        },
        {
          id: "it-trespass-chattels",
          name: "Trespass to Chattels",
          shortName: "TRES. CHATTELS",
          ruleStatement:
            "Intentional interference with Π's right to possess personal property — use, intermeddling, or dispossession — causing actual harm or deprivation.",
          elements: [
            {
              name: "Intent",
              description:
                "Intent to perform the act of interference (not intent to damage).",
            },
            {
              name: "Interference",
              description:
                "Using, intermeddling with, or dispossessing Π of their chattel.",
            },
            {
              name: "Actual Damages",
              description:
                "Unlike trespass to land, Π must show actual damages — diminished value, condition, or loss of use.",
            },
          ],
          test: {
            name: "Interference + Actual Harm",
            standard: "Requires Proof of Damages",
            description:
              "Did Δ intentionally interfere with Π's chattel AND did it cause actual harm (diminished value, impaired condition, or deprivation of use for a substantial time)?",
          },
          exceptions: [
            { name: "Consent", rule: "Owner consented to the use." },
            {
              name: "Necessity",
              rule: "Using another's chattel to prevent greater harm.",
            },
          ],
          policyFor: ["Protects possessory interests in personal property"],
          policyAgainst: [
            "The damages requirement can leave some interferences unremedied",
          ],
          examTips: [
            "⚡ Distinguished from CONVERSION by the degree of interference.",
            "⚡ Trespass to chattels = minor interference → pay damages for harm.",
            "⚡ Conversion = major interference → forced sale at full fair market value.",
          ],
          frequency: 2,
          connections: ["it-conversion", "it-trespass-land"],
        },
        {
          id: "it-conversion",
          name: "Conversion",
          shortName: "CONVERSION",
          ruleStatement:
            "Intentional exercise of dominion and control over Π's chattel so SERIOUS as to warrant Δ paying FULL FAIR MARKET VALUE (a forced judicial sale).",
          elements: [
            {
              name: "Intent",
              description:
                "Intent to exercise dominion/control over the chattel (NOT intent to convert).",
            },
            {
              name: "Serious Interference",
              description:
                'Duration, extent of use, harm done, and intent to assert ownership are all factors in determining "seriousness."',
            },
            {
              name: "Chattel",
              description:
                "Personal property; modern trend extends to intangibles (electronic data, domain names).",
            },
          ],
          test: {
            name: "Seriousness of Interference",
            standard: "Totality of Circumstances — Multi-Factor",
            description:
              "Factors: (1) Duration of dominion, (2) Δ's good/bad faith, (3) Extent of interference, (4) Harm to the chattel, (5) Inconvenience to Π. If serious enough → Δ must pay FMV. If not serious enough → trespass to chattels only.",
          },
          exceptions: [
            {
              name: "Bona Fide Purchaser",
              rule: "Even a good faith buyer from a thief commits conversion — strict liability for buyers in the chain of stolen goods.",
            },
          ],
          policyFor: [
            'Protects ownership of personal property — the "big brother" of trespass to chattels',
          ],
          policyAgainst: [
            "Results in a forced sale — Π may not want money, may want the item back (remedy = replevin instead)",
          ],
          examTips: [
            "⚡ Conversion vs. Trespass to Chattels = HIGH vs. LOW interference.",
            "⚡ Remedy for conversion = FMV of item at time of conversion.",
            '⚡ BFP from a thief → still liable for conversion. No "innocent purchaser" defense.',
          ],
          frequency: 2,
          connections: ["it-trespass-chattels"],
        },
        {
          id: "it-defenses",
          name: "Defenses to Intentional Torts",
          shortName: "IT DEFENSES",
          ruleStatement:
            "Consent, self-defense, defense of others, defense of property, necessity, and authority are the main privileges/defenses to intentional torts.",
          elements: [
            {
              name: "Consent",
              description:
                "Express or implied. Can be negated by: fraud, duress, incapacity, or exceeding scope of consent.",
            },
            {
              name: "Self-Defense",
              description:
                "Reasonable force to repel imminent threat. No deadly force unless facing deadly force.",
            },
            {
              name: "Defense of Property",
              description:
                "Reasonable NON-DEADLY force to protect property. NO DEADLY FORCE or spring-guns to protect property alone (Katko v. Briney).",
            },
          ],
          test: {
            name: "Proportionality",
            standard: "Reasonable Force",
            description:
              "Force must be PROPORTIONAL to the threat. Self-defense: reasonable belief + proportional response. Defense of property: never deadly force for property alone.",
          },
          exceptions: [
            {
              name: "Deadly Force for Property",
              rule: "NEVER allowed for protection of property alone. Spring guns, mantrap, etc. → Δ liable even if trespasser was committing a crime. Katko v. Briney.",
            },
            {
              name: "Consent Exceeded",
              rule: "If Δ exceeds the scope of consent, the excess = tortious. E.g., consent to a boxing match ≠ consent to being hit with a chair.",
            },
          ],
          policyFor: [
            "Self-defense is a natural right",
            "Proportionality requirement prevents escalation",
          ],
          policyAgainst: [
            "Property owners feel unable to protect their land without strong force options",
          ],
          examTips: [
            '⚡ Katko v. Briney = THE case for "no deadly force for property."',
            "⚡ Transferred intent works for Δ but NOT for defenses — can't claim self-defense against the wrong person.",
            "⚡ Consent to a sport = consent to contacts within the rules, NOT flagrant fouls.",
          ],
          frequency: 4,
          connections: ["it-battery", "it-assault"],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  3. STRICT LIABILITY (~10-15% of Torts Qs)
    // ──────────────────────────────────────────────────────────
    {
      id: "strict-liability",
      name: "Strict Liability",
      icon: "💥",
      color: "#b266ff",
      frequency: 4,
      description:
        "Liability WITHOUT fault. No need to prove negligence or intent. Focus: abnormally dangerous activities and wild animals.",
      mbeWeight: "10-15% of Torts questions",
      position: { x: 700, y: 350 },
      rules: [
        {
          id: "sl-dangerous-activities",
          name: "Abnormally Dangerous Activities",
          shortName: "ABN. DANGEROUS",
          ruleStatement:
            "One who engages in an abnormally dangerous activity is STRICTLY LIABLE for harm resulting from the dangerous propensity of the activity, regardless of due care.",
          elements: [
            {
              name: "High Risk of Harm",
              description:
                "Activity creates a foreseeable risk of serious harm even with reasonable care.",
            },
            {
              name: "Not Common Usage",
              description:
                "The activity is not a matter of common usage in the community.",
            },
            {
              name: "Inappropriateness",
              description:
                "The activity is inappropriate for the location where it's conducted.",
            },
          ],
          test: {
            name: "Restatement (Second) §520 Factors",
            standard: "Multi-Factor Balancing — No Single Factor Dispositive",
            description:
              "Six factors: (1) High degree of risk, (2) Gravity of potential harm, (3) Inability to eliminate risk with reasonable care, (4) Not common usage, (5) Inappropriate for the location, (6) Danger outweighs community value. RESTATEMENT (THIRD) simplifies: activity creates foreseeable/significant risk that can't be eliminated with due care.",
          },
          exceptions: [
            {
              name: "Contributory/Comparative Negligence",
              rule: "Traditional: contributory negligence is NOT a defense. Modern/comparative: may reduce recovery.",
            },
            {
              name: "Assumption of Risk",
              rule: "IS a defense — if Π knowingly and voluntarily encountered the specific risk.",
            },
            {
              name: "Type-of-Harm Limitation",
              rule: "Liability limited to harm flowing from the TYPE of risk that makes the activity abnormally dangerous. E.g., blasting → liability for vibration damage, NOT for startling a mink causing it to kill its young (unless foreseeable).",
            },
          ],
          policyFor: [
            "Those who create extraordinary risks should bear the costs",
            "Encourages safer locations and methods for dangerous activities",
            "Loss spreading — enterprise liability model",
          ],
          policyAgainst: [
            "Can discourage beneficial but inherently dangerous industries",
            "Some activities (like blasting) may be necessary for economic development",
          ],
          examTips: [
            "⚡ Classic examples: blasting/explosives, crop dusting, hazardous waste storage, fumigation.",
            "⚡ Driving is NOT abnormally dangerous (common usage).",
            '⚡ Look for the word "regardless of care taken" → strict liability signal.',
            "⚡ Harm must flow from the DANGEROUS PROPENSITY, not some collateral risk.",
          ],
          frequency: 3,
          keyCase: "Rylands v. Fletcher (1868, UK origin)",
          connections: ["sl-animals", "products-liability"],
        },
        {
          id: "sl-animals",
          name: "Animal Liability",
          shortName: "ANIMALS",
          ruleStatement:
            'Wild animals: strict liability for ALL harm. Domestic animals: strict liability only if owner knows of dangerous propensity ("one-bite rule").',
          elements: [
            {
              name: "Wild Animals",
              description:
                "Strict liability for owner/possessor. Includes exotic pets. Liability for harm characteristic of the species.",
            },
            {
              name: "Domestic Animals",
              description:
                "Liability only if owner knew or should have known of the animal's dangerous propensity beyond its species' norm.",
            },
          ],
          test: {
            name: "Species Classification + Knowledge",
            standard: "Strict Liability (wild) / Scienter (domestic)",
            description:
              'Wild animal = strict liability, period. Domestic animal = must prove owner knew of vicious propensity. "Every dog gets one free bite" (though not literally — other evidence of viciousness counts).',
          },
          exceptions: [
            {
              name: "Trespassing Animals (Livestock)",
              rule: "Owner of livestock that trespasses on another's land is strictly liable for damage in most jurisdictions (fencing-out vs. fencing-in rules vary).",
            },
            {
              name: "Assumption of Risk",
              rule: "Veterinarians, zookeepers — professional assumption of risk for known animal hazards.",
            },
            {
              name: "Dog Bite Statutes",
              rule: "Many states (incl. CA) have strict liability statutes for dog bites — no need to prove prior knowledge. Overrides the one-bite rule.",
            },
          ],
          policyFor: ["Those who keep dangerous animals should bear the risk"],
          policyAgainst: [
            "One-bite rule for domestic animals is arguably too lenient",
          ],
          examTips: [
            "⚡ Wild animal = lion, bear, monkey, venomous snake → always strict liability.",
            "⚡ Domestic = dog, cat, cow, horse → need scienter (knowledge).",
            "⚡ CA has a strict liability dog bite statute — no one-bite rule in CA.",
            "⚡ A pet tiger is ALWAYS a wild animal regardless of how tame.",
          ],
          frequency: 2,
          connections: ["sl-dangerous-activities"],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  4. PRODUCTS LIABILITY (~15-20% of Torts Qs)
    // ──────────────────────────────────────────────────────────
    {
      id: "products-liability",
      name: "Products Liability",
      icon: "📦",
      color: "#ffd700",
      frequency: 5,
      description:
        "Three theories: (1) strict liability, (2) negligence, (3) warranty. Δ must be in the business of selling/distributing products.",
      mbeWeight: "15-20% of Torts questions",
      position: { x: 550, y: 550 },
      rules: [
        {
          id: "pl-strict",
          name: "Strict Products Liability",
          shortName: "STRICT PL",
          ruleStatement:
            "A COMMERCIAL SELLER/DISTRIBUTOR who sells a DEFECTIVE product that is UNREASONABLY DANGEROUS is strictly liable for physical harm caused by the defect.",
          elements: [
            {
              name: "Commercial Seller",
              description:
                "Must be in the BUSINESS of selling. Casual sellers (garage sales) excluded. Includes manufacturers, wholesalers, retailers, and component makers.",
            },
            {
              name: "Product",
              description:
                "Tangible personal property. Most jurisdictions extend to new homes and used goods from commercial dealers.",
            },
            {
              name: "Defective",
              description:
                "Product is defective in one of three ways: manufacturing defect, design defect, or inadequate warning.",
            },
            {
              name: "Unreasonably Dangerous",
              description:
                "The defect renders the product more dangerous than a reasonable consumer would expect.",
            },
            {
              name: "Causation",
              description:
                "The defect must actually and proximately cause Π's harm.",
            },
          ],
          test: {
            name: "Three-Defect Framework",
            standard: "Varies by Defect Type (see sub-rules)",
            description:
              "Manufacturing defect: strict liability departure from design. Design defect: consumer expectation test OR risk-utility test. Warning defect: would a reasonable manufacturer have provided a warning?",
          },
          exceptions: [
            {
              name: "Not a Commercial Seller",
              rule: "Casual/occasional sellers are NOT subject to strict PL. Must be in the regular business of selling.",
            },
            {
              name: "Substantial Alteration",
              rule: "If the product is substantially altered after leaving Δ's control and the alteration causes the harm, Δ is not liable.",
            },
            {
              name: "Comparative Fault / Misuse",
              rule: "Product misuse that is unforeseeable may bar or reduce recovery. Foreseeable misuse does NOT bar liability.",
            },
            {
              name: "Assumption of Risk",
              rule: "Π who discovers defect and voluntarily continues to use the product may have assumed the risk.",
            },
          ],
          policyFor: [
            "Manufacturers are best positioned to prevent defects (cheapest cost avoider)",
            "Loss spreading — cost is distributed across all consumers via price",
            "Consumers can't inspect for hidden defects",
            "Incentivizes safer products",
          ],
          policyAgainst: [
            "Can over-deter innovation",
            "Imposes costs even on sellers who exercised due care",
            "Insurance costs passed to all consumers",
          ],
          examTips: [
            "⚡ MBE KEY: Strict PL requires a COMMERCIAL seller — not your neighbor selling a used car.",
            "⚡ All suppliers in the chain are liable — manufacturer, distributor, AND retailer.",
            "⚡ Privity NOT required in strict PL — any foreseeable user can sue.",
            "⚡ The three defect types are the most tested area in products liability.",
          ],
          frequency: 5,
          keyCase: "Greenman v. Yuba Power Products (CA, 1963)",
          connections: ["pl-manufacturing", "pl-design", "pl-warning"],
        },
        {
          id: "pl-manufacturing",
          name: "Manufacturing Defect",
          shortName: "MFG DEFECT",
          ruleStatement:
            "A product has a manufacturing defect when it departs from its INTENDED DESIGN. The single unit is flawed even though the design itself is safe. Strictest liability — no need to prove negligence.",
          elements: [
            {
              name: "Departure from Design",
              description:
                "The specific product unit differs from the manufacturer's own blueprints/specifications.",
            },
            {
              name: "Defect Existed at Time of Sale",
              description:
                "Defect must have been present when the product left Δ's control.",
            },
          ],
          test: {
            name: "Departure from Intended Design",
            standard: "Strict Liability — Absolute",
            description:
              "Compare the product to the manufacturer's own design specifications. ANY departure that causes harm = defect. The manufacturer is liable even if they used the utmost care. This is the PUREST form of strict liability.",
          },
          exceptions: [],
          policyFor: [
            "The purest cost internalization — manufacturer profits from the line, should bear costs of defective units",
          ],
          policyAgainst: [],
          examTips: [
            "⚡ Easiest defect to prove — just compare the product to the blueprint.",
            "⚡ Example: a soda bottle with a crack, a car with a weld that doesn't meet specs.",
            "⚡ Even perfect quality control doesn't prevent liability — true strict liability.",
          ],
          frequency: 4,
          connections: ["pl-strict"],
        },
        {
          id: "pl-design",
          name: "Design Defect",
          shortName: "DESIGN DEFECT",
          ruleStatement:
            "A product has a design defect when the ENTIRE product line is unreasonably dangerous due to the design chosen. ALL units are affected.",
          elements: [
            {
              name: "Defective Design",
              description:
                "The design itself (not a single flawed unit) is unreasonably dangerous.",
            },
            {
              name: "Reasonable Alternative Design",
              description:
                "Under the risk-utility test, Π must show a feasible safer design was available.",
            },
          ],
          test: {
            name: "Consumer Expectation OR Risk-Utility",
            standard: "Two Competing Tests",
            description:
              "CONSUMER EXPECTATION TEST (Restatement 2d): product is more dangerous than an ordinary consumer would expect. RISK-UTILITY TEST (Restatement 3d/majority): the risk of harm from the design outweighs the utility/benefits — weighed against feasible safer alternatives. CA uses BOTH tests (Barker v. Lull Engineering).",
          },
          exceptions: [
            {
              name: "Unavoidably Unsafe Products",
              rule: "Some products (vaccines, prescription drugs) are inherently dangerous but socially valuable. Not defective if benefits outweigh risks and adequate warnings are given. Comment k, Restatement 2d.",
            },
            {
              name: "Open & Obvious Danger",
              rule: "Some jurisdictions: an obvious danger defeats design defect claim because consumer expectation is met. (Declining in modern law.)",
            },
          ],
          policyFor: [
            "Incentivizes manufacturers to adopt safer designs",
            "Consumer expectation test protects lay consumers who can't evaluate complex designs",
          ],
          policyAgainst: [
            "Risk-utility is essentially a negligence analysis dressed up as strict liability",
            "Over-deterring design innovation",
          ],
          examTips: [
            "⚡ CA uses BOTH tests (Barker v. Lull) and shifts burden to Δ under risk-utility.",
            "⚡ MBE typically tests risk-utility → Π needs a feasible safer alternative design.",
            "⚡ Comment k products (vaccines): warning is sufficient — design defect doesn't apply.",
            '⚡ If Q asks "would ordinary consumer expect this danger" → consumer expectation test.',
          ],
          frequency: 5,
          keyCase: "Barker v. Lull Engineering (CA, 1978)",
          connections: ["pl-strict", "pl-warning"],
        },
        {
          id: "pl-warning",
          name: "Warning/Information Defect",
          shortName: "WARN DEFECT",
          ruleStatement:
            "A product has a warning defect when it lacks adequate instructions or warnings about foreseeable risks of harm that are NOT obvious.",
          elements: [
            {
              name: "Foreseeable Risk",
              description:
                "The risk must be one the manufacturer knew or should have known about.",
            },
            {
              name: "Inadequate Warning",
              description:
                "Warning is missing, vague, buried, or doesn't convey the nature/severity of the risk.",
            },
            {
              name: "Not Obviously Dangerous",
              description:
                "No duty to warn of open and obvious dangers (knife is sharp).",
            },
          ],
          test: {
            name: "Reasonable Manufacturer",
            standard: "Would a Reasonable Manufacturer Have Warned?",
            description:
              "Essentially a negligence-like inquiry: knew or should have known of the risk → duty to provide adequate warning. Adequacy: must be conspicuous, clear, and convey the nature and extent of the danger.",
          },
          exceptions: [
            {
              name: "Learned Intermediary Doctrine",
              rule: 'For prescription drugs and medical devices, the manufacturer\'s duty to warn runs to the PRESCRIBING PHYSICIAN, not the patient. The doctor is the "learned intermediary."',
              elements: [
                "Prescription product",
                "Warning adequate to the physician",
                "Physician makes the prescribing decision",
              ],
            },
            {
              name: "Post-Sale Duty to Warn",
              rule: "If a risk is discovered AFTER sale, some jurisdictions impose a duty to warn existing purchasers/users.",
            },
          ],
          policyFor: [
            "Warnings are cheap — low cost to provide, high benefit for safety",
            "Enables consumers to make informed decisions",
          ],
          policyAgainst: [
            "Warning overload — too many warnings mean consumers ignore them all",
            "Learned intermediary doctrine may leave patients uninformed",
          ],
          examTips: [
            "⚡ Learned intermediary = prescription drugs. Manufacturer warns the doctor, not the patient.",
            "⚡ Exception to learned intermediary: direct-to-consumer advertising (DTC) in some jurisdictions → duty to warn consumer directly.",
            "⚡ No duty to warn of obvious risks — coffee is hot.",
            '⚡ MBE: "Would a reasonable additional warning have prevented the harm?"',
          ],
          frequency: 4,
          connections: ["pl-strict", "pl-design"],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  5. DEFAMATION & PRIVACY (~10% of Torts Qs)
    // ──────────────────────────────────────────────────────────
    {
      id: "defamation",
      name: "Defamation & Privacy",
      icon: "📰",
      color: "#ff66b2",
      frequency: 3,
      description:
        "Protecting reputation (defamation) and seclusion/image (privacy torts). First Amendment overlay adds complexity.",
      mbeWeight: "~10% of Torts questions",
      position: { x: 250, y: 550 },
      rules: [
        {
          id: "def-elements",
          name: "Defamation",
          shortName: "DEFAMATION",
          mnemonic:
            "D-F-P-D = Defamatory statement, OF & concerning Π, Publication, Damages",
          ruleStatement:
            "A DEFAMATORY statement OF AND CONCERNING Π, PUBLISHED to a third party, causing DAMAGE to Π's reputation. Libel (written/permanent) vs. Slander (spoken/transient).",
          elements: [
            {
              name: "Defamatory Statement",
              description:
                "A statement that would tend to harm Π's reputation in the community — lowering esteem, deterring third parties from associating.",
            },
            {
              name: "Of and Concerning Π",
              description:
                "A reasonable listener/reader would understand the statement refers to Π. Groups too large → no individual claim.",
            },
            {
              name: "Publication",
              description:
                "Communication to at least ONE third party (not just Π). Intentional or negligent. Each repetition = new publication.",
            },
            {
              name: "Falsity",
              description:
                "Statement must be FALSE. Truth is an absolute defense.",
            },
            {
              name: "Damages",
              description:
                "Libel: damages presumed (libel per se). Slander: must prove special damages UNLESS slander per se.",
            },
          ],
          test: {
            name: "Constitutional Framework (NY Times v. Sullivan)",
            standard: "Varies by Π's Status",
            description:
              "PUBLIC FIGURE/OFFICIAL: must prove ACTUAL MALICE (knowledge of falsity or reckless disregard for truth). PRIVATE FIGURE on matter of public concern: must prove at least NEGLIGENCE as to falsity (Gertz v. Welch). PRIVATE FIGURE on private matter: common law standards (some states = strict liability).",
          },
          exceptions: [
            {
              name: "Slander Per Se (no special damages needed)",
              rule: "Four categories where damages are presumed for slander: (1) Business/profession, (2) Loathsome disease, (3) Crime of moral turpitude, (4) Sexual misconduct/unchastity.",
            },
            {
              name: "Absolute Privilege",
              rule: "Statements in judicial proceedings, legislative proceedings, between spouses, executive communications. Cannot be lost even through malice.",
            },
            {
              name: "Qualified Privilege",
              rule: "Statements made in good faith on matters of common interest (employer references, credit reports). Lost if abused through actual malice or excessive publication.",
            },
            {
              name: "Opinion",
              rule: "Pure opinion is NOT actionable. But a statement of opinion implying undisclosed defamatory facts CAN be actionable.",
            },
          ],
          policyFor: [
            "Protects reputation — an essential interest in society",
            "Constitutional overlay balances free speech with reputation",
          ],
          policyAgainst: [
            "Chilling effect on free speech and press freedom",
            "Actual malice standard makes it very hard for public figures to win",
          ],
          examTips: [
            "⚡ Step 1: Is Π public or private? → determines fault standard.",
            "⚡ Step 2: Libel or slander? → determines damages requirement.",
            '⚡ Slander per se mnemonic: "BLCS" = Business, Loathsome disease, Crime, Sexual misconduct.',
            "⚡ Actual malice = NOT hatred. It means Δ KNEW the statement was false or showed RECKLESS DISREGARD for truth.",
            "⚡ Truth is a COMPLETE defense. Always.",
          ],
          frequency: 3,
          keyCase: "New York Times Co. v. Sullivan (1964)",
          connections: ["def-privacy"],
        },
        {
          id: "def-privacy",
          name: "Privacy Torts",
          shortName: "PRIVACY",
          ruleStatement:
            "Four distinct torts protecting different aspects of privacy: (1) Intrusion upon seclusion, (2) Public disclosure of private facts, (3) False light, (4) Appropriation of name/likeness.",
          elements: [
            {
              name: "Intrusion Upon Seclusion",
              description:
                "Intentional intrusion into Π's private affairs in a manner objectionable to a reasonable person. No publication required.",
            },
            {
              name: "Public Disclosure of Private Facts",
              description:
                "Widespread disclosure of private facts that would be highly offensive to a reasonable person AND not of legitimate public concern.",
            },
            {
              name: "False Light",
              description:
                "Widespread publication portraying Π in a false light, highly offensive to a reasonable person. (Similar to defamation but broader — need not be defamatory.)",
            },
            {
              name: "Appropriation",
              description:
                "Use of Π's name or likeness for Δ's commercial advantage without consent.",
            },
          ],
          test: {
            name: 'Reasonable Person — "Highly Offensive"',
            standard: "Objective",
            description:
              "For intrusion, public disclosure, and false light: would a REASONABLE PERSON find the conduct/disclosure highly offensive? For appropriation: commercial use without consent (strict).",
          },
          exceptions: [
            {
              name: "Newsworthiness",
              rule: "Matters of legitimate public interest defeat public disclosure and false light claims. First Amendment protection.",
            },
            {
              name: "Consent",
              rule: "Express consent defeats all four privacy torts.",
            },
          ],
          policyFor: [
            "Privacy is essential to human dignity and autonomy",
            "Commercial exploitation of identity should be compensable",
          ],
          policyAgainst: [
            "Tension with free speech and press freedoms",
            "False light overlaps confusingly with defamation",
          ],
          examTips: [
            "⚡ Intrusion = no publication needed (only privacy tort where this is true).",
            '⚡ False light vs. defamation: false light covers non-defamatory falsehoods and requires "widespread" publication.',
            '⚡ Appropriation: the "right of publicity" — celebrities use this frequently.',
            "⚡ Truth is NOT a defense to public disclosure of private facts (unlike defamation).",
          ],
          frequency: 2,
          connections: ["def-elements"],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  6. NUISANCE & VICARIOUS LIABILITY (~5-10%)
    // ──────────────────────────────────────────────────────────
    {
      id: "nuisance-vicarious",
      name: "Nuisance & Vicarious Liability",
      icon: "🔗",
      color: "#00b4d8",
      frequency: 2,
      description:
        "Nuisance: unreasonable interference with use/enjoyment of land. Vicarious liability: holding one person liable for another's torts.",
      mbeWeight: "~5-10% of Torts questions",
      position: { x: 400, y: 700 },
      rules: [
        {
          id: "nuis-private",
          name: "Private Nuisance",
          shortName: "PRIV. NUISANCE",
          ruleStatement:
            "A SUBSTANTIAL and UNREASONABLE interference with Π's USE AND ENJOYMENT of their land. No physical invasion required (unlike trespass).",
          elements: [
            {
              name: "Substantial Interference",
              description:
                "Must be more than trivial — would bother a person of normal sensitivities (not hypersensitive).",
            },
            {
              name: "Unreasonable",
              description:
                "The gravity of the harm outweighs the utility of Δ's conduct.",
            },
            {
              name: "Use and Enjoyment",
              description:
                "Interference with how Π uses/enjoys their property (noise, smell, vibration, pollution).",
            },
          ],
          test: {
            name: "Balancing Test — Gravity vs. Utility",
            standard: "Totality of Circumstances",
            description:
              "Gravity of harm factors: extent, character of harm, social value of Π's use, suitability of locality. Utility of conduct factors: social value of Δ's activity, suitability to locality, impracticability of preventing the interference.",
          },
          exceptions: [
            {
              name: "Coming to the Nuisance",
              rule: "Π moving next to an existing nuisance is NOT an automatic bar but is ONE FACTOR in the reasonableness analysis.",
            },
            {
              name: "Hypersensitive Π",
              rule: "If only a hypersensitive person would be bothered, no nuisance. Standard is the ordinary person.",
            },
          ],
          policyFor: [
            "Protects land use without requiring physical invasion",
            "Balances competing land uses",
          ],
          policyAgainst: [
            "Subjective balancing test leads to unpredictable outcomes",
          ],
          examTips: [
            "⚡ Nuisance vs. Trespass: nuisance = interference with USE. Trespass = physical invasion.",
            "⚡ Coming to the nuisance is NOT a complete bar.",
            "⚡ Remedies: damages AND/OR injunction.",
          ],
          frequency: 2,
          connections: ["nuis-public", "vl-respondeat"],
        },
        {
          id: "nuis-public",
          name: "Public Nuisance",
          shortName: "PUB. NUISANCE",
          ruleStatement:
            "An unreasonable interference with a right COMMON TO THE GENERAL PUBLIC. Only a public official can sue UNLESS a private Π suffers SPECIAL DAMAGES beyond those of the general public.",
          elements: [
            {
              name: "Public Right",
              description:
                "A right shared by the community — public health, safety, morals, convenience.",
            },
            {
              name: "Unreasonable Interference",
              description:
                "Same balancing as private nuisance but affecting the public at large.",
            },
            {
              name: "Standing Requirement",
              description:
                "Private Π must suffer damages DIFFERENT IN KIND (not just degree) from the public at large.",
            },
          ],
          test: {
            name: "Special Damage Requirement (for private Π)",
            standard: "Different in Kind, Not Just Degree",
            description:
              "If Π suffers the same type of harm as everyone else (just more of it), no standing. Must show a qualitatively different harm — e.g., pollution blocks the road to Π's business but doesn't affect others' access.",
          },
          exceptions: [],
          policyFor: ["Protects community-wide interests"],
          policyAgainst: [
            "Standing requirement can leave individuals without remedy",
          ],
          examTips: [
            "⚡ Standing is THE tested issue for public nuisance.",
            "⚡ Different in KIND, not degree. More inconvenience ≠ special damages.",
          ],
          frequency: 2,
          connections: ["nuis-private"],
        },
        {
          id: "vl-respondeat",
          name: "Vicarious Liability / Respondeat Superior",
          shortName: "VIC. LIABILITY",
          ruleStatement:
            "An EMPLOYER is vicariously liable for torts committed by EMPLOYEES acting within the SCOPE OF EMPLOYMENT. Does NOT apply to independent contractors (with exceptions).",
          elements: [
            {
              name: "Employer-Employee Relationship",
              description:
                "Employer controls the MANNER AND MEANS of the work (not just the result). Key distinction from independent contractor.",
            },
            {
              name: "Scope of Employment",
              description:
                "The tort occurred while the employee was performing duties for the employer or engaging in acts incidental to employment.",
            },
            {
              name: "Frolic vs. Detour",
              description:
                "Detour (minor departure from duties) = within scope. Frolic (major departure for personal business) = outside scope.",
            },
          ],
          test: {
            name: "Control Test + Scope Analysis",
            standard: "Multi-Factor",
            description:
              'Employee vs. IC: who controls HOW the work is done? Scope: was the tortious act a "frolic" (own business) or "detour" (minor deviation)? Intentional torts: generally outside scope UNLESS force is inherent (bouncer) or Δ was furthering employer\'s interests.',
          },
          exceptions: [
            {
              name: "Independent Contractor Exception",
              rule: "Generally, no vicarious liability for IC's torts because employer doesn't control the manner/means.",
            },
            {
              name: "Non-Delegable Duties",
              rule: 'Employer IS liable even for IC\'s torts when the duty is "non-delegable": (1) inherently dangerous activities, (2) duties imposed by statute, (3) duties of a common carrier or innkeeper.',
            },
            {
              name: "Negligent Hiring/Supervision",
              rule: "Employer's OWN negligence in hiring, supervising, or retaining an unfit employee or IC. This is DIRECT liability, not vicarious.",
            },
          ],
          policyFor: [
            "Enterprise liability: employer profits from employee's work and should bear the risk",
            "Deep pocket — employer can better distribute the loss",
            "Incentivizes employers to hire, train, and supervise carefully",
          ],
          policyAgainst: [
            "Employer may have no actual fault — pure cost allocation",
            "Blurred line between employee and IC in the gig economy",
          ],
          examTips: [
            "⚡ MBE LOVES frolic vs. detour. Small side trip to get coffee = detour (within scope). Driving to the beach during work hours = frolic (outside scope).",
            "⚡ Intentional torts: generally outside scope UNLESS force is part of the job (bouncer, security guard).",
            "⚡ Non-delegable duty = the big exception to the IC rule.",
            "⚡ Joint venture members are vicariously liable for each other.",
          ],
          frequency: 3,
          connections: ["neg-duty"],
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
//  UTILITY: Flatten all rules from all topics
// ═══════════════════════════════════════════════════════════════

export function getAllRules(): StudyRule[] {
  return tortsData.topics.flatMap((t) => t.rules);
}

export function getRuleById(id: string): StudyRule | undefined {
  return getAllRules().find((r) => r.id === id);
}

export function getTopicById(id: string): StudyTopic | undefined {
  return tortsData.topics.find((t) => t.id === id);
}

export function getConnectedRules(ruleId: string): StudyRule[] {
  const rule = getRuleById(ruleId);
  if (!rule) return [];
  return rule.connections
    .map((id) => getRuleById(id))
    .filter(Boolean) as StudyRule[];
}

// ═══════════════════════════════════════════════════════════════
//  SUBJECT-LEVEL DATA for the 3D landing grid
// ═══════════════════════════════════════════════════════════════

export const mbeSubjects = [
  {
    id: "torts",
    name: "Torts",
    icon: "⚠️",
    color: "var(--accent-blue)",
    weight: "25%",
    tagline: "Wrongs, Remedies & Reasonable People",
    topicCount: 6,
    ready: true,
  },
  {
    id: "contracts",
    name: "Contracts",
    icon: "📜",
    color: "#ffd700",
    weight: "25%",
    tagline: "Promises, Performance & Penalties",
    topicCount: 7,
    ready: false,
  },
  {
    id: "constitutional",
    name: "Con Law",
    icon: "⚖️",
    color: "#ff6b35",
    weight: "~13%",
    tagline: "Powers, Rights & Liberties",
    topicCount: 7,
    ready: false,
  },
  {
    id: "criminal",
    name: "Criminal Law",
    icon: "🔒",
    color: "#b266ff",
    weight: "~13%",
    tagline: "Crimes, Defenses & Procedure",
    topicCount: 8,
    ready: false,
  },
  {
    id: "evidence",
    name: "Evidence",
    icon: "🔍",
    color: "#ff66b2",
    weight: "~13%",
    tagline: "Relevance, Hearsay & Privilege",
    topicCount: 6,
    ready: false,
  },
  {
    id: "property",
    name: "Real Property",
    icon: "🏠",
    color: "#00b4d8",
    weight: "~13%",
    tagline: "Estates, Interests & Recording",
    topicCount: 7,
    ready: false,
  },
  {
    id: "civpro",
    name: "Civil Procedure",
    icon: "📋",
    color: "#4ade80",
    weight: "~13%",
    tagline: "Jurisdiction, Pleading & Discovery",
    topicCount: 7,
    ready: false,
  },
];
