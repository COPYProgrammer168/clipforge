import argparse
import json
import math
import os

import cv2
import numpy as np

DEFAULT_MODEL = os.path.join(
    os.path.dirname(__file__),
    "models",
    "face_detection_yunet_2023mar.onnx",
)


def clamp(value, low, high):
    return max(low, min(high, value))


def center(box):
    x, y, width, height = box
    return (x + width / 2.0, y + height / 2.0)


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def median_box(boxes):
    values = np.array(boxes, dtype=np.float32)
    x, y, width, height = np.median(values, axis=0)
    return {
        "x": int(round(x)),
        "y": int(round(y)),
        "width": int(round(width)),
        "height": int(round(height)),
    }


def detect(path, sample_count, model_path):
    capture = cv2.VideoCapture(path)
    if not capture.isOpened():
        raise ValueError("Could not open the source video.")

    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if width <= 0 or height <= 0 or total <= 0:
        capture.release()
        return {"hasWebcam": False, "reason": "unknown dimensions"}
    if not os.path.exists(model_path):
        capture.release()
        return {"hasWebcam": False, "reason": "face detector model missing"}

    detector = cv2.FaceDetectorYN.create(
        model_path,
        "",
        (width, height),
        0.6,
        0.3,
        5000,
    )

    candidates = []
    frames_used = 0
    for index in range(sample_count):
        position = int(total * ((index + 0.5) / sample_count))
        capture.set(cv2.CAP_PROP_POS_FRAMES, position)
        ok, frame = capture.read()
        if not ok:
            continue
        frames_used += 1

        frame_height, frame_width = frame.shape[:2]
        scale = min(1.0, 960.0 / max(frame_width, 1))
        small = (
            cv2.resize(frame, None, fx=scale, fy=scale)
            if scale < 1
            else frame
        )
        small_height, small_width = small.shape[:2]
        detector.setInputSize((small_width, small_height))
        _, faces = detector.detect(small)
        if faces is None:
            continue

        for face in faces:
            x, y, face_width, face_height = face[:4]
            score = float(face[-1])
            if score < 0.6:
                continue

            x = x / scale
            y = y / scale
            face_width = face_width / scale
            face_height = face_height / scale
            face_center_x = x + face_width / 2
            face_center_y = y + face_height / 2

            central = (
                0.32 * frame_width < face_center_x < 0.68 * frame_width
                and 0.32 * frame_height < face_center_y < 0.68 * frame_height
            )
            if central:
                continue

            candidates.append(
                {
                    "box": [x, y, face_width, face_height],
                    "frameIndex": index,
                    "center": (face_center_x, face_center_y),
                    "score": score,
                }
            )

    capture.release()

    if frames_used == 0 or not candidates:
        return {
            "hasWebcam": False,
            "frames": frames_used,
            "samples": sample_count,
        }

    diagonal = math.hypot(width, height)
    clusters = []
    for candidate in candidates:
        matched = False
        for cluster in clusters:
            if distance(candidate["center"], cluster["center"]) < diagonal * 0.12:
                cluster["items"].append(candidate)
                cluster["frames"].add(candidate["frameIndex"])
                boxes = [item["box"] for item in cluster["items"]]
                median = median_box(boxes)
                cluster["center"] = center(
                    (
                        median["x"],
                        median["y"],
                        median["width"],
                        median["height"],
                    )
                )
                matched = True
                break
        if not matched:
            clusters.append(
                {
                    "items": [candidate],
                    "frames": {candidate["frameIndex"]},
                    "center": candidate["center"],
                }
            )

    best = max(clusters, key=lambda cluster: len(cluster["items"]))
    confidence = len(best["frames"]) / frames_used
    minimum_frames = max(2, math.ceil(frames_used * 0.25))
    if len(best["frames"]) < minimum_frames:
        return {
            "hasWebcam": False,
            "frames": frames_used,
            "samples": sample_count,
            "confidence": round(confidence, 3),
        }

    face = median_box([item["box"] for item in best["items"]])
    face_center_x, face_center_y = center(
        (
            face["x"],
            face["y"],
            face["width"],
            face["height"],
        )
    )

    box_width = clamp(face["width"] * 4.2, width * 0.2, width * 0.46)
    box_height = clamp(face["height"] * 4.2, height * 0.2, height * 0.46)

    if face_center_x < width * 0.3:
        crop_x = 0
    elif face_center_x > width * 0.7:
        crop_x = width - box_width
    else:
        crop_x = face_center_x - box_width / 2

    if face_center_y < height * 0.3:
        crop_y = 0
    elif face_center_y > height * 0.7:
        crop_y = height - box_height
    else:
        crop_y = face_center_y - box_height / 2

    crop_x = clamp(crop_x, 0, width - box_width)
    crop_y = clamp(crop_y, 0, height - box_height)

    return {
        "hasWebcam": True,
        "box": {
            "x": int(round(crop_x)),
            "y": int(round(crop_y)),
            "width": int(round(box_width)),
            "height": int(round(box_height)),
        },
        "face": face,
        "confidence": round(confidence, 3),
        "frames": frames_used,
        "samples": sample_count,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--output", required=True)
    parser.add_argument("--samples", type=int, default=24)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    try:
        payload = detect(args.video, max(4, args.samples), args.model)
    except Exception as error:  # pragma: no cover - defensive bridge failure
        payload = {"hasWebcam": False, "error": str(error)}

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)

    if payload.get("hasWebcam"):
        box = payload["box"]
        print(
            f"WEBCAM {box['x']} {box['y']} {box['width']} {box['height']}",
            flush=True,
        )
    else:
        print("NO_WEBCAM", flush=True)


if __name__ == "__main__":
    main()
