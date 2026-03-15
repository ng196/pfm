import OpenAI from 'openai';
import chalk from 'chalk';
import * as readline from 'readline';

const ZAI_API_KEY = process.env.ZAI_API_KEY || process.env['z.ai_api_key'] || process.env.Z_AI_API_KEY;

if (!ZAI_API_KEY) {
  console.error(chalk.red('Missing API key. Set ZAI_API_KEY (or z.ai_api_key / Z_AI_API_KEY) in environment variables.'));
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: ZAI_API_KEY,
  baseURL: 'https://api.z.ai/api/coding/paas/v4'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

let messages = [
  { role: "system", content: "You are an ai, a highly intelligent, helpful, and friendly AI assistant." }
];

console.log(chalk.cyan.bold("🚀 Connected to Z.AI GLM-5"));
console.log(chalk.gray("Type your message or 'exit' to quit\n"));

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function chatLoop() {
  try {
    const userInput = await askQuestion(chalk.yellow("You: "));

    if (['exit', 'quit', 'bye'].includes(userInput.trim().toLowerCase())) {
      console.log(chalk.green("👋 Goodbye!"));
      rl.close();
      process.exit(0);
    }

    if (!userInput.trim()) {
      console.log(chalk.red("Please enter a message.\n"));
      return chatLoop();
    }

    messages.push({ role: "user", content: userInput });

    const stream = await openai.chat.completions.create({
      model: "glm-4.5-air",
      messages: messages,
      stream: true,
      temperature: 0.75,
      max_tokens: 2048
    });

    process.stdout.write(chalk.green("GLM-5: "));
    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }
    console.log("\n");

    messages.push({ role: "assistant", content: fullResponse });
  } catch (err) {
    console.error(chalk.red("\n❌ Error:"), err.message);
    if (err.response) {
      console.error(chalk.red("Response status:"), err.response.status);
      console.error(chalk.red("Response data:"), err.response.data);
    }
    console.log("");
  }

  setImmediate(() => chatLoop());
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.green("\n👋 Goodbye!"));
  rl.close();
  process.exit(0);
});

chatLoop().catch(err => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
