import fs from 'fs/promises';
import path from 'path';
import { $ } from 'bun';

function splitText(text: string, maxLength = 200): string[] {
  const sentences = text.match(/[^\.!\?]+[\.!\?]?/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function synthesizeThaiLongText(text: string, outputFile = 'output.mp3', speed = 1.5) {
  const chunks = splitText(text, 200);
  const tempDir = './tts_temp';

  await fs.mkdir(tempDir, { recursive: true });

  const tempFiles: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = (chunks[i] ?? '').replace(/"/g, '\"');
    const tempFile = path.join(tempDir, `chunk_${i}.mp3`);
    const tempTextFile = path.join(tempDir, `chunk_${i}.txt`);
    tempFiles.push(tempFile);

    // เขียนข้อความลงไฟล์ก่อน
    await fs.writeFile(tempTextFile, chunkText, 'utf-8');

    console.log(`แปลงข้อความ chunk ${i + 1}/${chunks.length}:`, chunkText);

    // ใช้ gtts-cli แบบ --file เพื่อหลีกเลี่ยงปัญหา shell
    const result = await $`gtts-cli --file ${tempTextFile} --lang th --output ${tempFile}`;
    if (result.exitCode !== 0) {
      console.error('เกิดข้อผิดพลาดขณะแปลงเสียง:', result.stderr);
      throw new Error(result.stderr.toString());
    }
    // ลบไฟล์ข้อความชั่วคราวหลังใช้
    await fs.unlink(tempTextFile);
  }

  // สร้างไฟล์ list.txt สำหรับ ffmpeg concat
  const listFile = path.join(tempDir, 'list.txt');
  const listContent = tempFiles.map(f => `file '${path.resolve(f)}'`).join('\n');
  await fs.writeFile(listFile, listContent);

  console.log('รวมไฟล์เสียงทั้งหมดเป็นไฟล์เดียวด้วย ffmpeg...');

  const mergeResult = await $`ffmpeg -f concat -safe 0 -i ${listFile} -c copy ${outputFile} -y`;
  if (mergeResult.exitCode !== 0) {
    console.error('เกิดข้อผิดพลาดขณะรวมไฟล์เสียง:', mergeResult.stderr);
    throw new Error(mergeResult.stderr.toString());
  }

  // ลบไฟล์ชั่วคราว
  for (const file of tempFiles) await fs.unlink(file);
  await fs.unlink(listFile);
  await fs.rmdir(tempDir);

  console.log(`✔️ เสียงถูกสร้างที่ไฟล์: ${outputFile}`);

  // เพิ่มความเร็วไฟล์ output
  const speedFile = outputFile.replace(/\.mp3$/, `_speed${speed}.mp3`);
  const speedResult = await $`ffmpeg -i ${outputFile} -filter:a "atempo=${speed}" -vn ${speedFile} -y`;
  if (speedResult.exitCode !== 0) {
    console.error('เกิดข้อผิดพลาดขณะเร่งความเร็วไฟล์เสียง:', speedResult.stderr);
    throw new Error(speedResult.stderr.toString());
  }
  console.log(`⚡️ สร้างไฟล์เร่งความเร็วที่: ${speedFile}`);
}

async function cleanInputText(filePath: string): Promise<string> {
  let text = await fs.readFile(filePath, 'utf-8');
  // ลบ *, #, _, `, >, และอักขระขึ้นบรรทัดใหม่ (\n)
  text = text.replace(/[\*#\_`>\n]+/g, '');
  return text;
}

async function main() {
  try {
    // รับค่าจาก .env
    const inputPath = process.env.TTS_INPUT_PATH || 'input.text';
    const outputFile = process.env.TTS_OUTPUT_PATH || 'output.mp3';
    const speed = process.env.TTS_SPEED ? parseFloat(process.env.TTS_SPEED) : 1.5;
    const text = await cleanInputText(inputPath);
    await synthesizeThaiLongText(text, outputFile, speed);
  } catch (err) {
    console.error('เกิดข้อผิดพลาด:', err);
  }
}

main();
