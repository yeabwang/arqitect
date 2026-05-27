> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.requesty.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Vercel AI SDK

> Using Requesty router the Vercel AI SDK

<CardGroup>
  <Card title="GitHub" icon="github" href="https://github.com/requestyai/ai-sdk-requesty">
    View the source code
  </Card>

<Card title="npm" icon="npm" href="https://www.npmjs.com/package/@requesty/ai-sdk">
    View the package
  </Card>
</CardGroup>

The Requesty provider for the Vercel AI SDK gives access to over 300 large language models through the Requesty chat and completion APIs.

## Setup

```bash
# For pnpm
pnpm add @requesty/ai-sdk

# For npm
npm install @requesty/ai-sdk

# For yarn
yarn add @requesty/ai-sdk
```

## API Key Setup

For security, you should set your API key as an environment variable named exactly `REQUESTY_API_KEY`:

```bash
# Linux/Mac
export REQUESTY_API_KEY=your_api_key_here

# Windows Command Prompt
set REQUESTY_API_KEY=your_api_key_here

# Windows PowerShell
$env:REQUESTY_API_KEY="your_api_key_here"
```

## Provider Instance

You can import the default provider instance `requesty` from `@requesty/ai-sdk`:

```javascript
import { requesty } from '@requesty/ai-sdk';
```

## Example

```javascript
import { requesty } from '@requesty/ai-sdk';
import { generateText } from 'ai';

const { text } = await generateText({
	model: requesty('openai/gpt-4o'),
	prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Supported Models

This list is not a definitive list of models supported by Requesty, as it constantly changes as we add new models (and deprecate old ones) to our system. You can find the latest list of models supported by Requesty [here](https://app.requesty.ai/models).

You can find the latest list of tool-supported models supported by Requesty [here](https://app.requesty.ai/tools). (Note: This list may contain models that are not compatible with the AI SDK.)

## Passing Extra Body to Requesty

There are 3 ways to pass extra body to Requesty:

### 1. Via the `providerOptions.requesty` property:

```javascript
import { createRequesty } from '@requesty/ai-sdk';
import { streamText } from 'ai';

const requesty = createRequesty({ apiKey: process.env.REQUESTY_API_KEY });
const model = requesty('anthropic/claude-3.7-sonnet');
await streamText({
	model,
	messages: [{ role: 'user', content: 'Hello' }],
	providerOptions: {
		requesty: {
			custom_field: 'value',
		},
	},
});
```

### 2. Via the `extraBody` property in the model settings:

```javascript
import { createRequesty } from '@requesty/ai-sdk';
import { streamText } from 'ai';

const requesty = createRequesty({ apiKey: process.env.REQUESTY_API_KEY });
const model = requesty('anthropic/claude-3.7-sonnet', {
	extraBody: {
		custom_field: 'value',
	},
});
await streamText({
	model,
	messages: [{ role: 'user', content: 'Hello' }],
});
```

### 3. Via the `extraBody` property in the model factory:

```javascript
import { createRequesty } from '@requesty/ai-sdk';
import { streamText } from 'ai';

const requesty = createRequesty({
	apiKey: process.env.REQUESTY_API_KEY,
	extraBody: {
		custom_field: 'value',
	},
});
const model = requesty('anthropic/claude-3.7-sonnet');
await streamText({
	model,
	messages: [{ role: 'user', content: 'Hello' }],
});
```

## Features

<CardGroup cols={2}>
  <Card title="Access to 300+ LLMs" icon="brain">
    Use a single API to access models from OpenAI, Anthropic, Google, Mistral, and many more
  </Card>

  `<Card title="Streaming Support" icon="bars-staggered">`
    Full support for streaming responses for real-time applications
  `</Card>`

  `<Card title="Tool Calling" icon="screwdriver-wrench">`
    Utilize function/tool calling capabilities with supported models
  `</Card>`

  `<Card title="Type Safety" icon="shield-check">`
    Built with TypeScript for enhanced developer experience
  `</Card>`

  `<Card title="AI SDK Integration" icon="puzzle-piece">`
    Seamless integration with the AI SDK ecosystem
  `</Card>`
`</CardGroup>`

## Advanced Configuration

### Custom API URL

You can configure Requesty to use a custom API URL:

```javascript
import { createRequesty } from '@requesty/ai-sdk';

const requesty = createRequesty({
	apiKey: process.env.REQUESTY_API_KEY,
	baseURL: 'https://router.requesty.ai/v1',
});
```

### Headers

Add custom headers to all requests:

```javascript
import { createRequesty } from '@requesty/ai-sdk';

const requesty = createRequesty({
	apiKey: process.env.REQUESTY_API_KEY,
	headers: {
		'Custom-Header': 'custom-value',
	},
});
```

### Model Settings

Configure model-specific settings:

```javascript
import { createRequesty } from '@requesty/ai-sdk';

const requesty = createRequesty({ apiKey: process.env.REQUESTY_API_KEY });
const model = requesty('openai/gpt-4o', {
	// Specific model to use with this request
	models: ['openai/gpt-4o', 'anthropic/claude-3-opus'],

	// Control the bias of specific tokens in the model's vocabulary
	logitBias: { 50256: -100 },

	// Request token-level log probabilities
	logprobs: 5,

	// User identifier for tracking or rate limiting
	user: 'user-123',

	// Additional body parameters
	extraBody: {
		custom_field: 'value',
	},
});
```
