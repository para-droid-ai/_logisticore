# Logisticore AI Scratchpad Redesign & Implementation Guide

## 1. Introduction & Vision

The "Scratchpad" system in Logisticore is designed to be more than a simple logging mechanism. It aims to serve as a **structured reasoning framework** for the AI, guiding its decision-making processes across various aspects of gameplay. This initiative is driven by a two-fold vision:

1.  **Enhanced AI Performance:**
    *   **Improved Reasoning:** By requiring the AI to "show its work" through a defined set of analytical steps, we aim to foster more robust, coherent, and strategically sound long-term planning and tactical execution.
    *   **Grounded Decisions:** Ensure AI choices are deeply rooted in the current game state, overarching strategic objectives, economic realities, and a nuanced understanding of game mechanics.
    *   **Reduced Superficiality:** Mitigate "lazy" or superficial reasoning by enforcing a comprehensive analytical process before a decision is made.
    *   **Alignment with Intent:** Better align AI behavior with what would be considered intelligent, goal-oriented play within the game's context.

2.  **Transparency, Debugging, and User Insight:**
    *   **Understanding the "Why":** Provide clear visibility into the AI's rationale behind its actions and plans.
    *   **Effective Debugging:** Facilitate easier identification of flaws, biases, or gaps in the AI's reasoning process when troubleshooting unexpected behaviors.
    *   **Learning Tool:** Offer the developer/user insights into strategic thinking and logical deduction by observing the AI's structured problem-solving approach. This can also help in reflecting on one's own cognitive strategies and biases.

**Unified Scratchpad Concept:**
A core goal is to extend this structured thinking paradigm beyond just Operational Plan (OpPlan) generation. The vision is to implement similar "scratchpad" outputs for various AI decision points, such as:
*   Tactical action selection during the Maneuver phase (`getAIActionFromGemini`).
*   (Potentially in the future) Detailed combat engagement choices if AI's role in combat becomes more granular.
*   Reconnaissance decisions (e.g., when to activate an array, when to perform a pulse).

This will create a consistent and comprehensive "AI thought-process log," making the AI's internal "mental" process more explicit and understandable.

## 2. Core Scratchpad Structure for OpPlan Generation

The initial implementation focuses on integrating a scratchpad into the `generateOpPlanFromGemini` function. The following 9-section structure is proposed to guide the AI's strategic planning for its Operational Plan. This structure aims to build context logically and ensure key considerations are addressed before an OpPlan is finalized.

1.  **`CRITICAL_GAME_FACTORS`**:
    *   **Focus:** Identify and list the raw, most impactful data points from the current game state. This includes immediate threats (e.g., significant enemy presence near vital nodes), key opportunities (e.g., undefended high-value targets like Industrial Hubs), critical resource status (current MAT, net MAT/turn), and major map control imbalances.
    *   **Why:** Grounds the AI's entire planning process in the most pressing and undeniable realities of the current turn, ensuring subsequent analysis is relevant.

2.  **`COMPREHENSIVE_SELF_ASSESSMENT`**:
    *   **Focus:** Conduct a thorough review of the AI faction's own status. This includes:
        *   Key Faction Health Metrics: Current MAT, QR, Net MAT/turn, total unit strength (including standard and veteran units), artillery count, number of fortified nodes, and reconnaissance capability (e.g., "Recon System: OFFLINE/READY/ACTIVE PULSE").
        *   Current Overarching Strategic Goal: Briefly state the long-term strategic aim (e.g., "Economic Dominance", "Aggressive Expansion", "Defensive Consolidation", "Territorial Control of X Region").
        *   Key Learnings/Outcomes from Previous Turn: Briefly summarize the results of the previous turn's major actions or battles and any lessons learned.
        *   Current High-Level Focus for the Faction: Determine the immediate broad priority (e.g., "Secure MAT income", "Prepare for offensive in Sector Alpha", "Activate reconnaissance network", "Train Veteran units at Fortress X").
    *   **Why:** Allows the AI to understand its own strengths, weaknesses, current strategic trajectory, and adapt based on recent events before planning new actions.

3.  **`ENEMY_ASSESSMENT`**:
    *   **Focus:** Analyze the opponent based on *visible* intelligence. This includes:
        *   Likely Enemy Intentions (Next 1-2 Turns): Infer potential enemy actions based on their visible unit dispositions, recent activities (if known from intel snapshots or direct observation), and known economic state. Consider their veteran unit strength if known.
        *   Enemy's Key Strengths & Weaknesses (Visible/Inferred): Identify what makes the enemy strong or vulnerable in the current context (e.g., "Strong MAT income but few deployed units", "Large unit mass on West flank, East appears weak", "Possesses a cadre of Veteran units at Node Y").
        *   Opportunities to Exploit/Disrupt Enemy: Identify ways to leverage enemy weaknesses or disrupt their plans, particularly their economic power or high-value veteran units.
    *   **Why:** Ensures the AI's plan is not formulated in a vacuum but considers the adversary's likely posture and potential actions, promoting proactive rather than purely reactive planning.

4.  **`OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN`**:
    *   **Focus:** Define or confirm the *specific, actionable, measurable, achievable, relevant, and time-bound (SMART-er)* primary strategic goal for *this operational plan*. This objective should directly address the findings from the self-assessment and enemy assessment. It might involve securing resources to train veterans or using existing veterans for a key push.
    *   **Why:** Sets a clear, immediate target for the current planning cycle. This ensures the OpPlan has a defined purpose.

5.  **`STRATEGIC_CONSIDERATIONS_AND_OPTIONS`**:
    *   **Focus:** Brainstorm how the refined objective could be met. This involves considering:
        *   Key game mechanics: How rules around movement, combat, supply, economy, recon, and **veteran unit training/promotion/combat effectiveness** impact potential actions.
        *   Resource implications: MAT/QR costs of potential strategies, including veteran training.
        *   Available opportunities and threats identified earlier.
        *   Briefly list 1-2 high-level strategic approaches or options (e.g., "Option A: Direct assault on IH-N using veteran spearhead. Option B: Train more veterans at Fortress X before major offensive.").
    *   **Why:** Encourages the AI to think about different ways to achieve its objective and the trade-offs involved, rather than fixating on a single approach prematurely.

6.  **`PREFERRED_STRATEGY_AND_RATIONALE`**:
    *   **Focus:** Select the most promising strategic approach from the options considered in the previous step. Articulate *why* this approach is chosen over others to meet the refined objective. Outline the core logic of the upcoming OpPlan tasks that will implement this strategy. If veteran units are involved, explain their role (e.g., "Utilize existing Veteran cadre at SS to break the stalemate at WG," or "Invest in training Veterans at CN-E to prepare for a future offensive").
    *   **Why:** AI commits to a general strategy and explains its reasoning, providing a clear link between high-level thinking and the concrete tasks in the OpPlan.

7.  **`CONFIDENCE_AND_RISK_ANALYSIS`**:
    *   **Focus:** Assess the likelihood of the preferred strategy's success in achieving the objective. Identify the primary risks and potential failure points associated with this strategy. (e.g., "Confidence: 70%. Risk: Enemy may reinforce target node before attack. Risk: Enemy veteran units might counter my assault. Risk: MAT cost of veteran training delays unit deployment elsewhere.").
    *   **Why:** Encourages realistic assessment, foresight, and an understanding of potential downsides, which can inform contingency planning.

8.  **`CONTINGENCIES_AND_NEXT_TURN_ADAPTATION`**:
    *   **Focus:** (Optional but highly encouraged) If the primary strategy/OpPlan faces significant setbacks or fails to achieve its objective this turn, what are 1-2 high-level alternative goals or actions to prepare for or execute in the *next turn*? This is not a full Plan B for *this* turn, but a forward-looking adaptation. Consider fallback if veteran training is disrupted or a veteran force is unexpectedly defeated.
    *   **Why:** Promotes adaptability and resilience, ensuring the AI has some notion of how to react if its primary plan goes awry.

9.  **`FINAL_PLAN_ALIGNMENT_CHECK`**:
    *   **Focus:** Briefly confirm how the chosen OpPlan (specifically its defined `objective` and `tasks` that will be outputted) directly addresses the `OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN` and is consistent with the `PREFERRED_STRATEGY_AND_RATIONALE`. Verify that any `CRITICAL_ECONOMIC_WARNING` (if active from the main prompt context) is being explicitly addressed or justifiably managed by the plan, considering costs like veteran training or upkeep.
    *   **Why:** A final self-correction and coherence check to ensure the generated OpPlan is a logical output of the preceding thought process and adheres to critical game constraints.

This 9-section structure aims to provide a comprehensive yet manageable framework for the AI to generate well-reasoned Operational Plans.

## 3. Technical Implementation (OpPlan Scratchpad)

### API/JSON Structure
*   **`OpPlan` Type Modification:** The `OpPlan` interface in `types.ts` has been updated to include an optional `scratchpadOutput?: StrategicThoughtProcessData;` field. `StrategicThoughtProcessData` defines the structure for the 9 sections outlined above.
*   **Gemini Prompt Instructions:** The prompt for `generateOpPlanFromGemini` in `services/geminiService.ts` now explicitly instructs the AI to:
    *   Think through the 9 defined scratchpad sections.
    *   Output these thoughts as a nested JSON object under the `scratchpadOutput` key within the main OpPlan JSON.
    *   Ensure the final OpPlan (objective, tasks) is a logical outcome of this internal analysis.
*   **Example JSON Output Snippet (Illustrative):**
    ```json
    {
      "objective": "Capture the Northern Industrial Hub (IH-N) within 2 turns.",
      // ... other OpPlan fields ...
      "scratchpadOutput": {
        "CRITICAL_GAME_FACTORS": "Net MAT: -15. IH-N Units: 2. Enemy units massing near West Bridge. Possess 5 Veteran units at Staging Alpha.",
        "COMPREHENSIVE_SELF_ASSESSMENT": "MAT low, need positive income. Last turn's attack on SB failed due to insufficient forces. Focus: Secure MAT. My Veteran units offer a tactical advantage.",
        "ENEMY_ASSESSMENT": "Enemy likely focused on West Bridge, IH-N seems secondary for them currently. Vulnerable to quick strike. Unknown if enemy has Veteran units.",
        "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN": "Secure IH-N to achieve positive MAT income by T+2, using Veteran spearhead if possible.",
        "STRATEGIC_CONSIDERATIONS_AND_OPTIONS": "Option A: Direct attack on IH-N with Veteran support. Option B: Economic focus for 1 turn, train more Veterans, then attack. Option A chosen due to urgency.",
        "PREFERRED_STRATEGY_AND_RATIONALE": "Direct attack on IH-N is preferred to quickly stop MAT bleed, led by Veterans for higher success. Tasks: Move Veterans and support to staging, then attack IH-N.",
        "CONFIDENCE_AND_RISK_ANALYSIS": "Confidence: 75% (with Veterans). Risk: Enemy reinforces IH-N. Risk: Attack fails, Veteran units lost, worsening MAT.",
        "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION": "If IH-N attack fails, consolidate remaining Veterans and standard units at CN-E and use ECONOMIC_FOCUS action next turn. If Fortress is available, consider training more Veterans if MAT allows.",
        "FINAL_PLAN_ALIGNMENT_CHECK": "Plan directly targets IH-N for MAT, addressing critical MAT factors and refined objective. CRITICAL ECONOMIC WARNING is addressed by prioritizing IH capture. Veteran units are key to success."
      }
    }
    ```

### UI Display
*   **`OpPlanPanel.tsx` Integration:**
    *   The component now checks for `plan.scratchpadOutput`.
    *   If present, it renders a distinct section titled "AI Strategic Analysis (CoT)".
    *   This section iterates over the `scratchpadOutput` keys, displaying each section's title (e.g., "CRITICAL GAME FACTORS") and the AI-generated text content.
*   **Styling:** The scratchpad display is styled to be clearly demarcated, possibly collapsible or using a slightly different background/border to differentiate it from the main OpPlan tasks.

### Logic Flow
The prompt strongly emphasizes that the content generated within the `scratchpadOutput` sections should not be arbitrary. Instead, it must directly inform and lead to the `objective`, `operation`, and `tasks` fields of the OpPlan. The AI is instructed to use the scratchpad as a genuine thinking process.

## 4. Gemma Models and Structured JSON Output Compatibility

A key consideration when working with different AI models is their support for specific API features. **Gemma models (e.g., `gemma-3-27b-it`, `gemma-3n-e4b-it`) currently do not support the `responseMimeType: "application/json"` configuration in the Gemini API. This was a challenge that has now been addressed by implementing a text-based JSON generation strategy for Gemma.**

**Implications for Logisticore:**
*   When a Gemma model is selected for tasks requiring JSON output (like OpPlan or AI Action generation), the application cannot rely on the API to enforce JSON structure.
*   The "Enable Structured Gemini Output" toggle in the Modifiers modal, which primarily works by setting `responseMimeType: "application/json"` and providing a detailed JSON schema within the prompt, **will not function as intended for Gemma models.**

**Workaround Strategy Implemented for Gemma Models:**
To enable Gemma models to produce the necessary JSON structures, the following approach has been adopted:
1.  **Text-Based JSON Generation:** Gemma models **are now** prompted to generate a *text string that is formatted as JSON*. The prompt includes very specific instructions about the desired JSON structure, field names, data types (e.g., ensuring scratchpad fields are strings), array formatting, and rules like using double quotes for all keys and string values and avoiding trailing commas.
2.  **API Call Adjustment:** When a Gemma model is active, the `config` object in the `ai.models.generateContent` call **now omits** the `responseMimeType: "application/json"` parameter.
3.  **Robust Sanitization:** The existing JSON sanitization functions (`minimalSanitizeAIJsonResponse` and `aggressiveSanitizeAIJsonResponse`) **have become** even more critical to clean up potential minor formatting issues in the text-based JSON output from Gemma before attempting `JSON.parse()`.
4.  **Ignoring `isStructuredOutputEnabled` for Gemma JSON Prompting:** For Gemma models, the detailed JSON schema associated with `isStructuredOutputEnabled: true` is not sent in the prompt. Instead, a consistent, robust text-based JSON instruction (similar to the one used when `isStructuredOutputEnabled: false` for Gemini models) is always used to guide Gemma's JSON-formatted text generation. The `isStructuredOutputEnabled` toggle in the UI is disabled with an advisory note when a Gemma model is active.

This approach leverages Gemma's text generation capabilities to produce the required JSON data, with client-side validation and sanitization playing a key role in ensuring data integrity.

## 5. Extending the Scratchpad to Other AI Decisions (Future Focus)

The vision is to apply a similar structured thinking process to other key AI decision points.

### Tactical Action Selection (`getAIActionFromGemini`)
When the AI decides on its specific action for the Maneuver phase, a tailored scratchpad could be:

*   **`CURRENT_OPPLAN_TASK_FOCUS`**: "Which specific task(s) from the current OpPlan am I trying to achieve with this action? Does this involve Veteran units?"
*   **`ACTION_CANDIDATES_EVALUATION`**: "List 2-3 viable actions that could progress the OpPlan task. Briefly state pros/cons for each based on current state. If `TRAIN_VETERANS` is an option, evaluate its cost/benefit vs. other actions."
*   **`RESOURCE_CONSTRAINT_CHECK`**: "For the preferred candidate, what are the MAT/QR costs (including Veteran training)? Are they affordable given current resources and economic guidance (Critical/Low state)?"
*   **`RISK_ASSESSMENT_TACTICAL`**: "What are the immediate risks of the chosen action (e.g., unit exposure, counter-attack vulnerability, risk to training Veterans if facility is attacked)?"
*   **`FINAL_ACTION_RATIONALE`**: "Why is this specific action the best choice now to fulfill the OpPlan task under current constraints? How do Veteran units (own or enemy's) factor into this?"

This would provide a deeper insight into why the AI chose, for example, `MOVE_UNITS` to a specific location instead of `ATTACK_NODE` or `ECONOMIC_FOCUS`.

### Other Potential Areas
*   **Reconnaissance Decisions:**
    *   Scratchpad for `ACTIVATE_RECON_ARRAY`: "Cost vs. Benefit of Activation", "Strategic Value of Target Array", "Current Intel Needs".
    *   Scratchpad for `PERFORM_RECON_PULSE`: "Urgency of Full Intel", "MAT/QR Affordability of Pulse", "Expected Gain from Pulse vs. Cost".
*   **Combat Analysis (If AI had more detailed control):** While combat is currently deterministic after initiation, if AI had choices *during* combat (e.g., retreat, specific targeting), a scratchpad could analyze "Engagement Odds", "Key Threats in Combat", "Preservation vs. Objective".

The JSON output for these would follow a similar pattern, nesting the specific scratchpad data within the action log or relevant data structure. The UI would need corresponding components or adaptations to display these varied scratchpad types.

## 6. Benefits & Expected Outcomes

*   **More Robust AI:** AI makes fewer unforced errors, better manages economy, and pursues strategic goals more consistently.
*   **Explainable AI (XAI):** Actions are no longer a "black box"; the reasoning is available for review.
*   **Targeted Prompt Engineering:** Easier to identify which part of the AI's thinking needs adjustment.
*   **Improved Game Balance:** By understanding AI limitations or strengths, game mechanics can be tuned.
*   **Educational Value:** Provides a model of structured strategic and tactical thinking.

## 7. Roadmap & TODO for Scratchpad System

1.  **[DONE] Initial OpPlan Scratchpad Implementation (Conceptual Design & UI Update):**
    *   Defined `StrategicThoughtProcessData` type.
    *   Updated `OpPlan` type.
    *   Updated `OpPlanPanel.tsx` to display the scratchpad output.
2.  **[DONE] Refine `generateOpPlanFromGemini` for Scratchpad:**
    *   Modified `generateOpPlanFromGemini` prompt to include detailed instructions for the 9-section scratchpad and ensure JSON parsing for it.
    *   Ensured the AI consistently fills all 9 sections meaningfully.
3.  **[IN PROGRESS] Monitor & Refine OpPlan Scratchpad Output:**
    *   Observe AI game logs for quality and adherence to scratchpad instructions.
    *   Iteratively refine prompt wording for clarity and desired output style (conciseness vs. detail).
    *   *Ensure AI prompts for scratchpad sections encourage consideration of Veteran Units (e.g., own/enemy veteran strength, training plans, strategic use of veterans).*
4.  **[PLANNED] Design & Implement Scratchpad for `getAIActionFromGemini`:**
    *   Define a new `TacticalThoughtProcessData` type.
    *   Update `AIAction` type to include this optional scratchpad.
    *   Modify `getAIActionFromGemini` prompt for tactical scratchpad generation, *including considerations for training and using Veteran units*.
    *   Update System Log display or create a new UI element to show tactical scratchpads associated with AI actions.
5.  **[FUTURE] Investigate Scratchpads for Other Decisions:**
    *   Reconnaissance action choices.
    *   Economic focus decisions (e.g., when to choose `ECONOMIC_FOCUS` vs. `HOLD_POSITION` based on deeper analysis).
6.  **[FUTURE] UI Enhancements for Scratchpads:**
    *   Consider dedicated UI views for comparing scratchpad evolution over turns.
    *   Mechanisms to "flag" or comment on specific AI thoughts for later review.

## 8. Potential Challenges & Considerations

*   **Token Limits:** Adding detailed scratchpad outputs to JSON responses increases token usage. This needs monitoring, especially if extending to many AI decision points. Brevity and conciseness in AI's scratchpad output will be crucial.
*   **Prompt Complexity & AI Adherence:** Crafting prompts that reliably make the AI follow the structured thinking and output format is challenging. The AI might misunderstand, miss sections, or fail to format correctly, especially Gemma models relying purely on text-based JSON instructions.
*   **Balancing Detail vs. Conciseness:** The scratchpad needs to be detailed enough to be insightful but concise enough to be manageable in terms of token use and readability.
*   **Ensuring Genuine Reasoning:** The primary challenge is to ensure the AI *genuinely uses* the scratchpad sections to derive its final plan/action, rather than just filling them in as an afterthought to meet prompt requirements. The causal link between the scratchpad content and the decision output must be reinforced.
*   **Performance:** Increased JSON parsing and potentially more complex AI generation could have minor performance implications, though likely negligible compared to API call latency.

This comprehensive guide should serve as a solid foundation for the continued development and refinement of the AI Scratchpad system in Logisticore.