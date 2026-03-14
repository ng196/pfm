import OpenAI from 'openai';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import chalk from 'chalk';
import readline from 'readline/promises';
import { RecordRTCPCM } from 'node-record-lpcm16';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '86f90fe16ae34556b84f61f69bfc772c.bDA0Er5ScuCqbpEq';

const chatClient = new OpenAI({
  apiKey: ZAI_API_KEY,
  baseURL: 'https://api.z.ai/api/coding/paas/v4'
});

let messages = [
  { role: "system", content: "You are GLM-5, a highly intelligent, helpful, and friendly AI assistant." }
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(chalk.cyan.bold("🚀 GLM-5 Voice Chat Ready!"));
console.log(chalk.gray("Type anything or use commands:"));
console.log(chalk.gray("   /voice  → 🎤 Speak (press ENTER to stop recording)"));
console.log(chalk.gray("   /clear  → reset conversation"));
console.log(chalk.gray("   exit    → quit\n"));

async function transcribeVoice() {
  console.log(chalk.yellow("🎤 Listening... Speak now! (press ENTER when done)"));

  const audioStream = RecordRTCPCM.start({ sampleRate: 16000 });
  const chunks = [];

  audioStream.on('data', chunk => chunks.push(chunk));

  await new Promise(resolve => process.stdin.once('data', () => {
    RecordRTCPCM.stop();
    resolve();
  }));

  const buffer = Buffer.concat(chunks);
  const tempFile = 'temp_voice.wav';
  fs.writeFileSync(tempFile, buffer);

  const form = new FormData();
  form.append('model', 'glm-asr-2512');
  form.append('file', fs.createReadStream(tempFile), 'voice.wav');
  // Optional: add hotwords for even better accuracy
  // form.append('hotwords', JSON.stringify(["nitin", "hackjklu", "GLM-5"]));

  try {
    const res = await fetch('https://api.z.ai/api/paas/v4/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ZAI_API_KEY}` },
      body: form
    });

    const data = await res.json();
    fs.unlinkSync(tempFile); // cleanup

    if (data.text) {
      console.log(chalk.green(`✅ Transcribed: "${data.text}"`));
      return data.text;
    } else {
      console.log(chalk.red("❌ No transcription returned"));
      return null;
    }
  } catch (err) {
    console.error(chalk.red("Transcription error:"), err.message);
    return null;
  }
}

async function sendToGLM5(userText) {
  messages.push({ role: "user", content: userText });

  const stream = await chatClient.chat.completions.create({
    model: "glm-5",
    messages: messages,
    stream: true,
    temperature: 0.75,
    max_tokens: 2048
  });

  process.stdout.write(chalk.green("GLM-5: "));
  let full = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      process.stdout.write(delta);
      full += delta;
    }
  }
  console.log("\n");
  messages.push({ role: "assistant", content: full });
}

async function chatLoop() {
  const input = await rl.question(chalk.yellow("You: "));

  if (['exit', 'quit'].includes(input.trim().toLowerCase())) {
    console.log(chalk.green("👋 Goodbye!"));
    rl.close();
    return;
  }

  if (input.trim() === '/clear') {
    messages = [{ role: "system", content: "You are GLM-5..." }];
    console.log(chalk.gray("Conversation cleared."));
    chatLoop();
    return;
  }

  if (input.trim() === '/voice') {
    const transcribed = await transcribeVoice();
    if (transcribed) {
      await sendToGLM5(transcribed);
    }
    chatLoop();
    return;
  }

  // Normal text chat
  await sendToGLM5(input);
  chatLoop();
}

chatLoop();