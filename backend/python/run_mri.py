import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# ---------------- Model Definition ---------------- #
class MRIBrainTumorClassifier(nn.Module):
    def __init__(self, num_classes: int = 3):
        super().__init__()
        base = models.densenet121(pretrained=False)
        in_features = base.classifier.in_features
        base.classifier = nn.Linear(in_features, num_classes)
        self.model = base

    def forward(self, x):
        return self.model(x)


# ---------------- Paths ---------------- #
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "aimodels", "mri_brain_tumor_model.pth")

# ---------------- Load Checkpoint ---------------- #
if not os.path.isfile(MODEL_PATH):
    print(json.dumps({"error": f"Model file not found: {MODEL_PATH}"}))
    sys.exit(1)

checkpoint = torch.load(MODEL_PATH, map_location="cpu")

# Many training scripts save {'state_dict': ..., ...}
if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
    raw_state = checkpoint["state_dict"]
else:
    raw_state = checkpoint

# Strip optional 'model.' prefix from keys
state_dict = {}
for k, v in raw_state.items():
    new_key = k[len("model.") :] if k.startswith("model.") else k
    state_dict[new_key] = v

model = MRIBrainTumorClassifier(num_classes=3)
model.load_state_dict(state_dict, strict=False)
model.eval()

# ---------------- Preprocessing ---------------- #
transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)

# Adjust class names to match your training setup
CLASSES = ["No_Tumor", "Benign_Tumor", "Malignant_Tumor"]


def predict(image_path: str):
    img = Image.open(image_path).convert("RGB")
    img = transform(img).unsqueeze(0)

    with torch.no_grad():
        logits = model(img)  # [1, num_classes]
        probs = torch.softmax(logits, dim=1)[0]  # [num_classes]

    scores = probs.tolist()
    result = {
        "classes": CLASSES,
        "scores": {CLASSES[i]: float(scores[i]) for i in range(len(CLASSES))},
        "top_class": CLASSES[int(torch.argmax(probs))],
    }
    return result


# ---------------- Main ---------------- #
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python run_mri.py <path_to_mri_image>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)

    try:
        result = predict(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
