import httpx
import cv2
import numpy as np
import os

img_saree = np.zeros((400, 400, 3), dtype=np.uint8) + 120
cv2.rectangle(img_saree, (100, 100), (300, 300), (240, 240, 255), -1)
cv2.putText(img_saree, "SAREE PRODUCT", (120, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
success, encoded_img = cv2.imencode('.jpg', img_saree)
image_path = "test_saree.jpg"
if success:
    with open(image_path, "wb") as f:
        f.write(encoded_img.tobytes())

try:
    with open(image_path, "rb") as f:
        response = httpx.post(
            "http://127.0.0.1:8003/api/listing/run-agent",
            data={"declared_category": "kurti", "target_language": "Hindi"},
            files={"images": (image_path, f, "image/jpeg")},
            timeout=40.0
        )
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.json())
except Exception as e:
    print("ERROR:", e)
finally:
    if os.path.exists(image_path):
        os.remove(image_path)
