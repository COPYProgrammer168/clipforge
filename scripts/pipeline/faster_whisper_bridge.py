import argparse
import json
import wave

import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.vad import VadOptions, get_speech_timestamps


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
    parser.add_argument("--detect-language", action="store_true")
    parser.add_argument("--vad-only", action="store_true")
    args = parser.parse_args()

    language = None if args.language in (None, "", "auto") else args.language
    audio = load_wav(args.audio)

    if args.vad_only:
        speech = get_speech_timestamps(
            audio,
            VadOptions(min_silence_duration_ms=300, speech_pad_ms=100),
        )
        payload = {
            "speech": [
                {"start": item["start"] / 16000, "end": item["end"] / 16000}
                for item in speech
            ]
        }
        with open(args.output, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)
        print(f"VAD {len(payload['speech'])}", flush=True)
        return

    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    if args.detect_language:
        _, info = model.transcribe(
            audio,
            language=None,
            beam_size=1,
            vad_filter=True,
            without_timestamps=True,
        )
        payload = {
            "language": info.language,
            "language_probability": getattr(info, "language_probability", None),
        }
        with open(args.output, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)
        print(
            f"DETECTED {info.language} {payload['language_probability']}",
            flush=True,
        )
        return

    beam_size = max(args.beam_size, 5)
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
        # The shared alignment heads do not fit the Khmer fine-tune: enabling
        # word timestamps collapses every segment into the last few seconds.
        # Segment timestamps are accurate without them, so the caption layer
        # distributes Khmer syllables across each segment instead.
        transcribe_options.pop("word_timestamps", None)
        transcribe_options["hallucination_silence_threshold"] = 2.0
        transcribe_options["repetition_penalty"] = 1.35
        transcribe_options["no_repeat_ngram_size"] = 3
        transcribe_options["compression_ratio_threshold"] = 2.0
        transcribe_options["no_speech_threshold"] = 0.6
        transcribe_options["log_prob_threshold"] = -1.0

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
                "avg_logprob": getattr(segment, "avg_logprob", None),
                "no_speech_prob": getattr(segment, "no_speech_prob", None),
                "compression_ratio": getattr(segment, "compression_ratio", None),
                "words": words,
            }
        )
        print(f"PROGRESS {segment.end:.3f}", flush=True)

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
