---
name: game-based-learning
description: Design or build digital learning games in this Phaser project by connecting learning goals to player actions, game rules, feedback, and evidence of learning. Use for games intended to teach or practice knowledge or skills.
metadata:
  short-description: Design and build learning games
---

# Game-Based Learning

Turn a learning goal into a playable experience in which the player uses the intended knowledge or skill to make progress. Keep the design focused on the learner, the learning task, and this project's existing Phaser structure.

## Workflow

1. Read the user's goal and inspect the project before changing it. Check the installed Phaser version, existing scenes, controls, assets, build commands, and code conventions. Do not assume a project structure or Phaser API that is not present. If the project is still empty, establish only the smallest structure needed for the requested result.
2. Define a concrete learning outcome as something a learner can do or explain. If age, prior knowledge, class context, or constraints are missing, make reasonable assumptions and state them when they affect the design.
3. Choose the activity form that fits the outcome:
   - Use a game when the learner's decisions and actions can directly practice the target skill.
   - Use a simulation when changing conditions and observing a model is the main learning activity.
   - Use gamification only when rewards or other game elements add value to an existing activity; points do not replace a learning mechanic.
4. Map the outcome to play before implementing:

   | Learning outcome | Player action | Rule or consequence | Evidence to observe |
   | --- | --- | --- | --- |

   Check whether a player can succeed without using the intended knowledge. If so, revise the choices, constraints, feedback, or win condition, or explain why that separation is intentional.
5. Design a clear loop from game state to player choice, rule-driven result, and feedback. Make choices meaningful: show relevant information, allow plausible alternatives, and make consequences understandable. Keep randomness from obscuring the relationship between the learner's decision and the outcome.
6. Make feedback explain what happened and why, then give the learner a useful next action: compare, revise, retry, or explain. Do not rely on points, badges, a pass/fail message, or a score as the only feedback when understanding the cause matters.
7. Start with a manageable challenge, add complexity in steps, and provide temporary supports such as examples, hints, or visible records. Reduce supports as the learner gains skill. Design failure to reveal usable information and allow a meaningful retry.
8. Consider how the game fits before, during, and after play. Include a short orientation when rules or a model need explanation, and use a debrief or a new scenario when learners should explain or transfer what they practiced.
9. Prototype the smallest playable version that tests the central learning mechanic. Name the design question it should answer, then look at both what players do and how they explain their choices. Keep a design hypothesis distinct from a finding until play provides evidence.
10. Match evaluation to the learning outcome. Separate engagement and completion from immediate learning, retention, and transfer. Game logs, time, clicks, and scores can support interpretation, but do not by themselves prove what a learner understands.

## Phaser implementation

- Preserve the project's existing scene flow, controls, visual style, and state management where practical. Make the core learning action easy to find and operate.
- Represent the relevant game state and rules clearly enough that the player can compare the starting conditions, decision, and result. Show units and constraints where they matter to the task.
- Prefer a small, playable loop over decorative systems that do not support the learning outcome. Add reset, retry, or comparison controls when they support the intended practice.
- Keep the outcome inspectable in play: the player should be able to tell what changed after an action and get another chance to apply the idea.

## Deliver the requested scope

Provide a design outline when the user asks for planning, and implement a playable experience when they ask to make the game. For a new or substantially changed game, briefly state the learning outcome, core loop, and any assumptions alongside the result. Do not expand into curriculum, accounts, analytics, or deployment unless the user asks for them.
