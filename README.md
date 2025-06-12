# 🗣️ Thai Text-to-Speech (TTS)

A simple to convert Thai text file to speech (MP3) using Google Text-to-Speech and Bun.

To install dependencies:

```bash
bun install
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

### Example `.env` for TTS

```
TTS_INPUT_PATH=./sources/input.text
TTS_OUTPUT_PATH=./sources/output.mp3
TTS_SPEED=1.5
```

## 🚀 Usage

#### ⚠️ Prerequisites for TTS

- Requires [gtts-cli](https://pypi.org/project/gTTS/) (Google Text-to-Speech) and [ffmpeg](https://ffmpeg.org/) installed and available in your PATH.
- Install gtts-cli with:
  ```bash
  pip install gTTS
  ```
- Download ffmpeg from [ffmpeg.org](https://ffmpeg.org/download.html) and add it to your system PATH.

```bash
brew install ffmpeg
```

To run Thai TTS:

```bash
bun run th-tts.ts
```
- Output will be saved to the file specified in `TTS_OUTPUT_PATH` (default: `output.mp3`)
- Speed can be set with `TTS_SPEED` (default: 1.5)

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
