# Helicone Documentation Guide

A streamlined guide for creating consistent, high-quality feature documentation.

## Template Structure

All feature documentation must follow this exact structure:

```markdown
---
title: "[Feature Name]"
sidebarTitle: "[Feature Name]"
---

When [developer context/situation], [common pattern]. [Feature name] [solves this by doing X].

## Why use [Feature Name]

- **[Benefit 1]**: Specific, actionable benefit
- **[Benefit 2]**: Another key advantage  
- **[Benefit 3]**: Third compelling reason

## Quick Start

<Steps>
<Step title="[Action 1]">
Description with code example.
```language
// Working code
```
</Step>
</Steps>

## Configuration Options

### Basic Settings
| Setting | Type | Description | Default | Example |
|---------|------|-------------|---------|---------|
| `name` | `string` | What it does | `"default"` | `"example"` |

### Advanced Settings
| Setting | Type | Description | Default | Example |
|---------|------|-------------|---------|---------|
| `advanced` | `object` | Complex config | `{}` | `{"key": "value"}` |

## Use Cases

<Tabs>
<Tab title="[Use Case 1]">
Real-world scenario description.

<CodeGroup>
```typescript Node.js
// Complete working example
```
```python Python  
# Same example in Python
```
</CodeGroup>
</Tab>
</Tabs>

## Understanding [Feature Name]

### [Core Concept]
Deep explanation of key concepts developers need to understand.

```typescript
// ✅ Good example
// Correct usage

// ❌ Bad example  
// What not to do
```

## Related Features

<CardGroup cols={2}>
<Card title="[Feature]" icon="icon-name" href="/path">
How they work together
</Card>
</CardGroup>
```

## Component Usage

### Required Components

**Steps** - For procedures:
```markdown
<Steps>
  <Step title="Action">Content and code</Step>
</Steps>
```

**Tabs** - For use cases:
```markdown
<Tabs>
  <Tab title="Scenario">Content</Tab>
</Tabs>
```

**CodeGroup** - Multiple languages:
```markdown
<CodeGroup>
```typescript Node.js
// Code
```
```python Python
# Code  
```
</CodeGroup>
```

**CardGroup** - Related features:
```markdown
<CardGroup cols={2}>
  <Card title="Feature" icon="icon" href="/path">Description</Card>
</CardGroup>
```

## Content Standards

### Writing Rules

1. **Start with developer context**: "When building X, you need Y"
2. **No generic introductions**: Avoid "This page explains..."
3. **Exactly 3 benefits**: Specific and actionable
4. **3-5 Quick Start steps**: Immediately actionable
5. **Complete code examples**: Include imports and setup
6. **Real-world use cases**: Focus on developer problems
7. **Good vs bad examples**: Use ✅/❌ format

### Code Requirements

- **All examples must be tested** with real API calls
- **Include necessary imports** and setup code
- **Show error handling** for production use
- **Use current syntax** and dependencies
- **Provide complete context** - no partial snippets

### Content Guidelines

- **Remove UI-only sections** that don't add developer value
- **Focus on implementation** not product features
- **Use consistent terminology** throughout
- **Include alt text** for all images
- **Link related features** appropriately

## Workflow

### 1. Apply Template
- Follow the structure exactly
- Use required components properly
- Focus on developer-first content
- Remove unnecessary UI descriptions

### 2. Validate Against Code
- Verify all API endpoints exist
- Check authentication requirements
- Confirm configuration options and defaults
- Find any undocumented features

### 3. Test Examples
- Create test scripts for all code examples
- Use real API keys to verify functionality
- Test error conditions and edge cases
- Confirm dashboard integration works

## Quality Checklist

Before publishing:

- [ ] Follows template structure exactly
- [ ] All code examples tested and working
- [ ] API details verified against codebase
- [ ] Uses proper Mintlify components
- [ ] Includes complete, working examples
- [ ] Focuses on developer use cases
- [ ] Related features properly linked
- [ ] No UI-only content without value

## Common Mistakes

**Avoid:**
- Generic introductions ("This feature allows...")
- Incomplete code examples missing imports
- Untested code snippets
- UI descriptions without developer value
- Missing error handling
- Outdated syntax or dependencies

**Instead:**
- Start with developer context
- Provide complete, tested examples
- Focus on implementation details
- Show practical use cases
- Include proper error handling
- Keep examples current