import asyncio
import os
import cv2
import numpy as np
from dotenv import load_dotenv
import json as json_lib
import sys

# Add backend directory to sys.path
sys.path.append(r"c:\Users\ARZOO\OneDrive\Desktop\sciptedbyher\backend")

load_dotenv(dotenv_path=r"c:\Users\ARZOO\OneDrive\Desktop\sciptedbyher\backend\.env")

from agents.listing_agent import get_listing_agent_executor

async def main():
    # Write a mock saree image
    img_saree = np.zeros((400, 400, 3), dtype=np.uint8) + 120
    cv2.rectangle(img_saree, (100, 100), (300, 300), (240, 240, 255), -1)
    cv2.putText(img_saree, "SAREE PRODUCT", (120, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    success, encoded_img = cv2.imencode('.jpg', img_saree)
    image_path = r"c:\Users\ARZOO\OneDrive\Desktop\sciptedbyher\backend\test_saree.jpg"
    if success:
        with open(image_path, "wb") as f:
            f.write(encoded_img.tobytes())
            
    user_query = (
        f"Declared Category: kurti\n"
        f"Target Language: Hindi\n"
        f"Audio Provided: No\n"
        f"Image Provided: Yes, saved at {image_path}"
    )
    
    print("\n--- Invoking Agent with Category Mismatch Input ---")
    executor = get_listing_agent_executor()
    
    try:
        result = await executor.ainvoke({"input": user_query})
        print("\n--- Execution Complete ---")
        print("Final Output:")
        print(json_lib.dumps(result.get("output"), ensure_ascii=True, indent=2))
        
        print("\nReasoning Trace / Intermediate Steps:")
        for i, step in enumerate(result.get("intermediate_steps", [])):
            action, observation = step
            print(f"Step {i+1}:")
            print(f" -> Action: {action.tool} with args: {action.tool_input}")
            print(f" -> Observation: {observation}")
    except Exception as e:
        import traceback
        print(f"Error during agent invocation: {e}")
        traceback.print_exc()
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == "__main__":
    asyncio.run(main())
