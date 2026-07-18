import os
import io
import wave
import cv2
import numpy as np
import httpx
import asyncio
import subprocess
import time
import json

# Setup temp files for verification
def setup_files():
    """Generates WAV audio and mock product image files."""
    # Write a 1-second WAV silence file
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(b'\x00\x00' * 16000)
    with open("test_audio.wav", "wb") as f:
        f.write(wav_io.getvalue())
        
    # Write a grey product box representing a Kurti
    img = np.zeros((400, 400, 3), dtype=np.uint8) + 120
    cv2.rectangle(img, (100, 100), (300, 300), (255, 240, 240), -1)
    cv2.putText(img, "KURTI PRODUCT", (120, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    success, encoded_img = cv2.imencode('.jpg', img)
    if success:
        with open("test_kurti.jpg", "wb") as f:
            f.write(encoded_img.tobytes())
            
    # Write a grey product box representing a Saree
    img_saree = np.zeros((400, 400, 3), dtype=np.uint8) + 120
    cv2.rectangle(img_saree, (100, 100), (300, 300), (240, 240, 255), -1)
    cv2.putText(img_saree, "SAREE PRODUCT", (120, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    success, encoded_img = cv2.imencode('.jpg', img_saree)
    if success:
        with open("test_saree.jpg", "wb") as f:
            f.write(encoded_img.tobytes())

def cleanup_files():
    """Removes the generated sample files."""
    for path in ["test_audio.wav", "test_kurti.jpg", "test_saree.jpg"]:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Could not remove {path}: {e}")

async def run_scenarios():
    setup_files()
    
    # Start FastAPI server on port 8002
    print("Starting FastAPI Uvicorn server on port 8002...")
    server_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--port", "8002", "--host", "127.0.0.1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Allow uvicorn to startup
    time.sleep(3)
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            
            # Scenario 1: Voice input only, no image, no pincode
            print("\n==============================================")
            print(" SCENARIO 1: Voice only, no image, no pincode")
            print("==============================================")
            with open("test_audio.wav", "rb") as f:
                files = {"audio": ("test_audio.wav", f, "audio/wav")}
                data = {"declared_category": "kurti", "target_language": "Hindi"}
                
                response = await client.post("http://127.0.0.1:8002/api/listing/run-agent", files=files, data=data)
                print(f"Status Code: {response.status_code}")
                res_json = response.json()
                print("Reasoning Trace:")
                print(json.dumps(res_json.get("agent_reasoning_trace"), indent=2))
            
            # Rate limit backoff
            print("Waiting for rate limit bucket to clear (5s)...")
            await asyncio.sleep(5)
            
            # Scenario 2: Image mismatch (declared category "kurti", photo is a saree)
            print("\n==============================================")
            print(" SCENARIO 2: Image mismatch (declared 'kurti', photo is 'saree')")
            print("==============================================")
            with open("test_saree.jpg", "rb") as f:
                files = {"images": ("test_saree.jpg", f, "image/jpeg")}
                data = {"declared_category": "kurti", "target_language": "Hindi"}
                
                response = await client.post("http://127.0.0.1:8002/api/listing/run-agent", files=files, data=data)
                print(f"Status Code: {response.status_code}")
                res_json = response.json()
                print(f"category_mismatch_flagged: {res_json.get('category_mismatch_flagged')}")
                print(f"final_listing: {json.dumps(res_json.get('final_listing'), ensure_ascii=True)}")
                print("Reasoning Trace:")
                print(json.dumps(res_json.get("agent_reasoning_trace"), indent=2))
                
            # Rate limit backoff
            print("Waiting for rate limit bucket to clear (5s)...")
            await asyncio.sleep(5)
            
            # Scenario 3: Image + voice + pincode (consistent)
            print("\n==============================================")
            print(" SCENARIO 3: Image + voice + pincode (consistent)")
            print("==============================================")
            with open("test_audio.wav", "rb") as fa, open("test_kurti.jpg", "rb") as fi:
                files = {
                    "audio": ("test_audio.wav", fa, "audio/wav"),
                    "images": ("test_kurti.jpg", fi, "image/jpeg")
                }
                data = {
                    "declared_category": "kurti",
                    "target_language": "Hindi",
                    "pincode": "110001"
                }
                
                response = await client.post("http://127.0.0.1:8002/api/listing/run-agent", files=files, data=data)
                print(f"Status Code: {response.status_code}")
                res_json = response.json()
                print(f"fallback_used: {res_json.get('fallback_used')}")
                print("Reasoning Trace:")
                print(json.dumps(res_json.get("agent_reasoning_trace"), indent=2))
                
            # Rate limit backoff
            print("Waiting for rate limit bucket to clear (5s)...")
            await asyncio.sleep(5)
            
            # Scenario 4: Image only, no voice (matches)
            print("\n==============================================")
            print(" SCENARIO 4: Image only, no voice (matches)")
            print("==============================================")
            with open("test_kurti.jpg", "rb") as fi:
                files = {"images": ("test_kurti.jpg", fi, "image/jpeg")}
                data = {"declared_category": "kurti", "target_language": "Hindi"}
                
                response = await client.post("http://127.0.0.1:8002/api/listing/run-agent", files=files, data=data)
                print(f"Status Code: {response.status_code}")
                res_json = response.json()
                print(f"fallback_used: {res_json.get('fallback_used')}")
                print("Reasoning Trace:")
                print(json.dumps(res_json.get("agent_reasoning_trace"), indent=2))
                
    finally:
        print("\nStopping FastAPI server...")
        server_process.terminate()
        server_process.wait()
        cleanup_files()

if __name__ == "__main__":
    asyncio.run(run_scenarios())
