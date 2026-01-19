import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# ---------------- Model Definition ---------------- #
class CTClassifier(nn.Module):
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
CHECKPOINT_PATH = os.path.join(BASE_DIR, "aimodels", "best_checkpoint.pth")

# ---------------- Load Checkpoint ---------------- #
if not os.path.isfile(CHECKPOINT_PATH):
    print(json.dumps({"error": f"Checkpoint not found: {CHECKPOINT_PATH}"}))
    sys.exit(1)

checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu")

# many training scripts save {'state_dict': ..., 'metrics': ...}
if "state_dict" in checkpoint:
    raw_state = checkpoint["state_dict"]
else:
    raw_state = checkpoint

# Strip 'model.' prefix from keys so they match CTClassifier.model.*
state_dict = {}
for k, v in raw_state.items():
    new_key = k
    if k.startswith("model."):
        new_key = k[len("model.") :]
    state_dict[new_key] = v

model = CTClassifier(num_classes=3)
# allow missing / extra keys where architecture differs slightly
model.load_state_dict(state_dict, strict=False)
model.eval()

# ---------------- Preprocessing ---------------- #
transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ]
)

classes = ["COVID", "Pneumonia", "Normal"]

def predict(image_path: str):
    img = Image.open(image_path).convert("RGB")
    img = transform(img).unsqueeze(0)

    with torch.no_grad():
        logits = model(img)          # [1, 3]
        probs = torch.softmax(logits, dim=1)[0]  # [3]

    scores = probs.tolist()
    result = {
        "classes": classes,
        "scores": {classes[i]: float(scores[i]) for i in range(len(classes))},
        "top_class": classes[int(torch.argmax(probs))],
    }
    return result

# ---------------- Main ---------------- #
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python run_ctscan.py <path_to_ct_image>"}))
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