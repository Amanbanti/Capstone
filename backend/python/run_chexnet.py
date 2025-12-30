import os
import sys
import json
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image

# ---- Paths ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "aimodels", "chexnet_model.pth.tar")

if not os.path.isfile(MODEL_PATH):
    print(json.dumps({"error": f"Model file not found: {MODEL_PATH}"}))
    sys.exit(1)

if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]
if not os.path.isfile(image_path):
    print(json.dumps({"error": f"Image file not found: {image_path}"}))
    sys.exit(1)

# ---- CheXNet architecture (DenseNet121 with 14 classes) ----
NUM_CLASSES = 14

def build_chexnet_model(num_classes: int = NUM_CLASSES):
    # Start from ImageNet-pretrained DenseNet121
    model = models.densenet121(weights=None)  # or weights=models.DenseNet121_Weights.IMAGENET1K_V1 if you want
    in_features = model.classifier.in_features
    model.classifier = torch.nn.Linear(in_features, num_classes)
    return model

# Load checkpoint (expects at least 'state_dict')
checkpoint = torch.load(MODEL_PATH, map_location=torch.device("cpu"))

if "state_dict" in checkpoint:
    state_dict = checkpoint["state_dict"]
else:
    # Fallback: assume the whole checkpoint is a state_dict
    state_dict = checkpoint

model = build_chexnet_model()
# Some checkpoints prefix keys with 'module.'; strip if needed
new_state_dict = {}
for k, v in state_dict.items():
    new_key = k.replace("module.", "") if k.startswith("module.") else k
    new_state_dict[new_key] = v

model.load_state_dict(new_state_dict, strict=False)
model.eval()

# ---- Classes ----
CLASSES = [
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Effusion",
    "Emphysema",
    "Fibrosis",
    "Hernia",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pleural_Thickening",
    "Pneumonia",
    "Pneumothorax",
]

# ---- Preprocess image ----
image = Image.open(image_path).convert("RGB")

transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225],
        ),
    ]
)

img_tensor = transform(image).unsqueeze(0)

# ---- Inference ----
with torch.no_grad():
    outputs = model(img_tensor)  # shape [1, 14]
    preds = outputs.squeeze().tolist()

# Ensure preds is a list of floats
if isinstance(preds, float):
    preds = [preds]
elif isinstance(preds, torch.Tensor):
    preds = preds.tolist()

result = {CLASSES[i]: float(preds[i]) for i in range(min(len(CLASSES), len(preds)))}

print(json.dumps(result))