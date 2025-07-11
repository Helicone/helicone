# Helicone Feature Documentation Template

This template provides a consistent structure for all Helicone feature documentation based on the preferred format. Use this as a guide for creating clear, comprehensive, and user-friendly documentation.

## Template Structure

````markdown
---
title: "[Feature Name]"
sidebarTitle: "[Feature Name]"
---

When [developer context/situation], [describe common pattern/need]. [Feature name] [solves this by doing X], [additional benefit or context].

## Why use [Feature Name]

- **[Benefit 1]**: Clear, specific benefit with context
- **[Benefit 2]**: Another key advantage
- **[Benefit 3]**: Third compelling reason to use this feature

<Frame caption="[Descriptive caption explaining what the image shows]">
  <img
    src="/images/[feature]/[image-name].webp"
    alt="[Descriptive alt text for accessibility]"
  />
</Frame>

## Quick Start

<Steps>
<Step title="[Action 1]">
Brief description of the first step with any necessary context.

```[language]
// Code example showing the simplest implementation
```
````

<Accordion title="[Optional: Additional context or alternative approach]">
Content for users who need more detail or have special circumstances.
</Accordion>
</Step>

<Step title="[Action 2]">
Brief description of the second step.

```[language]
// Code example for step 2
```

</Step>

<Step title="[Action 3]">
Final step to get the feature working.

```[language]
// Code example for final step
```

</Step>
</Steps>

## Configuration Options

### Basic Settings

Brief explanation of basic configuration options.

| Setting    | Type      | Description                | Default     | Example     |
| ---------- | --------- | -------------------------- | ----------- | ----------- |
| `setting1` | `string`  | What this setting controls | `"default"` | `"example"` |
| `setting2` | `boolean` | When to enable this option | `false`     | `true`      |

### Advanced Settings

| Setting     | Type     | Description                  | Default | Example            |
| ----------- | -------- | ---------------------------- | ------- | ------------------ |
| `advanced1` | `number` | More complex configuration   | `3600`  | `7200`             |
| `advanced2` | `object` | Complex object configuration | `{}`    | `{"key": "value"}` |

#### Detailed Explanations

<AccordionGroup>
<Accordion title="[Setting Name]">
Detailed explanation of what this setting does and when to use it.

```[language]
// Example showing the setting in use
```

</Accordion>

<Accordion title="[Another Setting]">
Another detailed explanation with practical examples.

```[language]
// Another example
```

</Accordion>
</AccordionGroup>

## Use Cases

<Tabs>
<Tab title="[Use Case 1]">
Brief description of the scenario and why this feature helps.

<CodeGroup>
```[language] [Language Name]
// Complete example showing this use case
```

```[language] [Another Language]
// Same example in another language
```

</CodeGroup>
</Tab>

<Tab title="[Use Case 2]">
Description of another common use case.

```[language]
// Example code for this use case
```

</Tab>

<Tab title="[Use Case 3]">
More complex use case that builds on previous examples.

```[language]
// Advanced example
```

</Tab>
</Tabs>

## Understanding [Feature Name]

### [Core Concept 1]

Deep explanation of the first key concept developers need to understand.

**What it is:**

- Clear definition
- Why it exists/matters

**How to use it:**

- Best practices for implementation
- Common patterns and examples

```[language]
// ✅ Good example
// Code showing correct usage

// ❌ Bad example
// Code showing what not to do
```

### [Core Concept 2]

Explanation of the second key concept.

**Key Rules:**

- Important guidelines to follow
- Constraints or limitations

**Design Patterns:**

```[language]
// Pattern 1 - good for [use case]
// Example code

// Pattern 2 - good for [use case]
// Example code
```

### [Core Concept 3]

Explanation of third concept if needed.

**Good examples:**

- List of what works well
- Why these examples are effective

**Avoid:**

- What not to do
- Why these approaches cause problems

## Related Features

<CardGroup cols={2}>
<Card title="[Related Feature 1]" icon="[icon-name]" href="/path/to/feature1">
Brief explanation of how they work together
</Card>

<Card title="[Related Feature 2]" icon="[icon-name]" href="/path/to/feature2">
Another complementary feature description
</Card>

<Card title="[Related Feature 3]" icon="[icon-name]" href="/path/to/feature3">
Additional integration possibility
</Card>

<Card title="[Related Feature 4]" icon="[icon-name]" href="/path/to/feature4">
Fourth related feature if needed
</Card>
</CardGroup>

<Snippet file="questions-section.mdx" />
```

## Style Guide and Best Practices

### Writing Style

- **Tone**: Professional but approachable, avoid overly technical jargon
- **Voice**: Active voice, direct instructions
- **Tense**: Present tense for descriptions, imperative for instructions
- **Perspective**: Second person ("you") for user-facing instructions

### Content Guidelines

- **Clarity**: Each section should have a clear purpose
- **Conciseness**: Keep explanations brief but complete
- **Practicality**: Focus on what users need to accomplish their goals
- **Completeness**: Include all necessary information without overwhelming

### Technical Writing Standards

- **Accuracy**: All code examples must be tested and functional
- **Consistency**: Use same terminology and patterns throughout
- **Completeness**: Include necessary imports, setup, and error handling
- **Accessibility**: Provide alt text for images and clear navigation

### Mintlify Component Usage

#### Steps Component

```mdx
<Steps>
  <Step title="Descriptive Action">Content and code examples</Step>
</Steps>
```

#### Accordion Components

```mdx
<AccordionGroup>
  <Accordion title="Clear Title">Expandable content</Accordion>
</AccordionGroup>
```

#### Code Groups

````mdx
<CodeGroup>
```language Language Name
// Code example
````

```another-language Another Language
// Same example in different language
```

</CodeGroup>
```

#### Frames for Images

```mdx
<Frame caption="Clear description of what image shows">
  <img src="/images/feature/image.webp" alt="Descriptive alt text" />
</Frame>
```

#### Cards for External Links

```mdx
<Card title="Clear Title" icon="relevant-icon" href="https://example.com">
  Brief description of what the link provides
</Card>
```

#### Callouts

```mdx
<Info>Important information that helps users understand context</Info>

<Warning>Critical information about potential issues or limitations</Warning>

<Tip>Helpful suggestions or optimizations</Tip>
```

### Section Guidelines

#### Introduction (No Header)

- Start with developer context: "When [building/doing X], [common pattern]"
- Lead naturally into how the feature solves this
- 1-2 sentences maximum, focus on the developer's world
- Integrate key use cases (like AI agents) naturally into the description
- Avoid buzzwords and feature-speak
- No "Intro to [Feature]" header - start directly with content
- Remove description from frontmatter to avoid repetition

#### Why Use [Feature]

- Exactly 3 benefits in bullet format
- Each benefit should be specific and actionable
- Focus on user outcomes, not technical features
- Use strong action words

#### Quick Start

- 3-5 steps maximum for basic implementation
- Each step should be immediately actionable
- Include code examples that users can copy-paste
- Use accordions for optional or alternative approaches

#### Configuration Options

- Separate basic from advanced options
- Use tables for parameter documentation
- Include examples for each option
- Use accordions for detailed explanations

#### Use Cases

- Use Tabs component for clean organization of 2-4 realistic scenarios
- Show complete, working examples with CodeGroup for multiple languages
- Build complexity gradually from simple to advanced
- Focus on real-world developer problems and solutions

#### Understanding [Feature Name]

- Deep conceptual explanations that developers need to avoid confusion
- Break down complex concepts into digestible subsections
- Use "What it is" and "How to use it" patterns
- Include good vs bad examples with code (✅/❌ format)
- Explain design patterns and common approaches
- Address why concepts matter, not just what they are
- Include cross-links to related documentation where relevant
- Answer developer questions like "What makes X good vs bad?"

#### Related Features Section

- Use CardGroup component with cols={2} for clean layout
- Include relevant icons for each feature card (database, wrench, chart-line, etc.)
- Brief, clear descriptions of how features work together
- Prioritize features that extend or complement the main feature
- Remove generic related features - focus on specific integrations

### Quality Checklist

Before publishing, verify:

- [ ] All code examples are tested and working
- [ ] Images have descriptive alt text and captions
- [ ] Links are functional and point to correct resources
- [ ] Consistent terminology throughout
- [ ] Proper Mintlify component usage (Tabs, CardGroup, etc.)
- [ ] Clear navigation and section structure
- [ ] "Understanding [Feature]" section explains core concepts deeply
- [ ] Good vs bad examples are included with explanations (✅/❌ format)
- [ ] Related features use CardGroup component with meaningful icons

- [ ] Remove sections that just describe UI without adding value
- [ ] Focus on key use cases and target users in introduction
- [ ] Use Tabs component for Use Cases section
- [ ] Include cross-links to related documentation in Understanding section
- [ ] Developer questions like "What makes X good vs bad?" are answered

### Maintenance Guidelines

- **Review quarterly**: Check for outdated examples or deprecated features
- **Update dependencies**: Ensure code examples use current syntax
- **Test examples**: Verify all code snippets work with current APIs
- **Monitor feedback**: Update based on user questions and issues
- **Cross-reference**: Ensure related features remain properly linked

## Key Improvements in This Template

Based on extensive iteration with the Sessions documentation, this template incorporates:

- **Developer-first introductions** that start with context ("When building X...") rather than feature descriptions
- **Tabs for Use Cases** to organize scenarios cleanly instead of traditional subsections
- **Deep conceptual sections** that answer "why" not just "what" to prevent developer confusion
- **CardGroup with icons** for visual and functional related features navigation
- **Good vs bad examples** with ✅/❌ formatting for immediate clarity
- **Cross-linking** to related documentation within understanding sections
- **Removal of UI-only sections** that don't add developer value (like "How it Works" descriptions)
- **AI agent focus** integrated naturally into introductions where relevant

This template ensures consistency, clarity, and user-friendliness across all Helicone feature documentation while maintaining the flexibility to adapt to different feature types and complexity levels.
