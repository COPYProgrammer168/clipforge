import argparse
import json
import wave

import numpy as np
from faster_whisper import WhisperModel


def load_wav(path):
    with wave.open(path, "rb") as handle:
        channels = handle.getnchannels()
        rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())
    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    if rate != 16000:
        raise ValueError(f"Expected 16 kHz audio, received {rate} Hz")
    return samples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio")
    parser.add_argument("--model", default="base")
    parser.add_argument("--language", default="auto")
    parser.add_argument("--output", required=True)
    parser.add_argument("--beam-size", type=int, default=1)
    args = parser.parse_args()

    language = None if args.language in (None, "", "auto") else args.language
    audio = load_wav(args.audio)
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    beam_size = max(args.beam_size, 5) if args.beam_size <= 1 else args.beam_size
    transcribe_options = {
        "language": language,
        "beam_size": beam_size,
        "best_of": beam_size,
        "word_timestamps": True,
        "vad_filter": True,
        "vad_parameters": {"min_silence_duration_ms": 400, "speech_pad_ms": 200},
        "condition_on_previous_text": False,
        "temperature": 0.0,
        "compression_ratio_threshold": 2.2,
        "repetition_penalty": 1.2,
        "no_repeat_ngram_size": 3,
        "hallucination_silence_threshold": 2.0,
    }

    if language == "km":
        transcribe_options["initial_prompt"] = "សួស្តី នេះជាវីដេអូជាភាសាខ្មែរ"

    segments, info = model.transcribe(audio, **transcribe_options)

    print(f"LANGUAGE {info.language}", flush=True)

    payload = {"language": info.language, "segments": []}
    for segment in segments:
        words = [
            {
                "word": word.word,
                "start": word.start,
                "end": word.end,
                "probability": getattr(word, "probability", None),
            }
            for word in (segment.words or [])
        ]
        payload["segments"].append(
            {
                "id": segment.id,
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": words,
            }
        )
        print(f"PROGRESS {segment.end:.3f}", flush=True)

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
