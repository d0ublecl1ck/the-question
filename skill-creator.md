---
name: skill-creator
description: Guide for creating effective skills without scripts or bundled resources. Use when Codex needs to create or update a skill by defining all rules directly in a single SKILL.md file.
---

# Skill Creator (No Scripts)

This skill provides guidance for creating effective skills using a single SKILL.md file only.

## Core Principles

### Concise is Key

Keep context lean. Only include information Codex cannot reliably infer. Prefer short, direct instructions and concise examples.

### Set Appropriate Degrees of Freedom

Match instruction specificity to task fragility:

- **High freedom**: Use for flexible, heuristic-driven tasks.
- **Medium freedom**: Use for preferred patterns with acceptable variation.
- **Low freedom**: Use for fragile, sequence-critical operations.

## Constraints for This Skill

- **Do not use scripts, references, or assets.**
- **Define all rules and workflows directly in SKILL.md.**
- **Keep SKILL.md under 500 lines when possible.**

## Anatomy of a Skill (Single-File Only)

Every skill must include exactly one file:

```
skill-name/
└── SKILL.md (required)
    ├── YAML frontmatter (required)
    │   ├── name
    │   └── description
    └── Markdown body (required)
```

### SKILL.md Requirements

- Frontmatter must include only `name` and `description`.
- `description` must include what the skill does and when it should be used.
- Body should be imperative/infinitive form.
- Include all rules and workflows directly in the body.

## Skill Creation Process (Single-File Workflow)

1. **Understand the skill with concrete examples**
   - Gather or infer 2–4 realistic user prompts.
   - Identify what tasks must be supported.

2. **Plan the SKILL.md contents**
   - Translate examples into reusable rules and procedures.
   - Decide the minimum essential guidance for correctness.

3. **Initialize the skill manually**
   - Create a folder named after the skill (kebab-case).
   - Create `SKILL.md` with proper frontmatter and body.

4. **Edit and refine**
   - Ensure rules are explicit and actionable.
   - Remove duplicate or non-essential text.
   - Ensure all guidance fits in the single file.

5. **Package the skill (optional)**
   - If packaging is required, use the standard packager.

6. **Iterate**
   - Improve based on real usage feedback.

## Skill Naming Rules

- Use lowercase letters, digits, and hyphens only.
- Keep under 64 characters.
- Prefer short, verb-led phrases.
- Name the folder exactly after the skill name.

## Writing Guidelines

- Use imperative or infinitive form.
- Prefer short, direct sentences.
- Avoid duplicate instructions.
- Avoid references to external files or resources.
- Make triggers explicit in the description.

## Frontmatter Template

```yaml
---
name: example-skill
description: Describe what the skill does and when to use it.
---
```

## Example Structure

```markdown
---
name: example-skill
description: Do X and Y; use when the user asks about X, Y, or Z.
---

# Example Skill

## Core Workflow

1. Do the first required step.
2. Do the second required step.
3. Validate the output.

## Rules

- Rule 1 in imperative form.
- Rule 2 in imperative form.
```
