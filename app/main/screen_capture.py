from PIL import ImageGrab
import base64
import sys
import json
from io import BytesIO

def capture_screen(bounds):
    # 전체 화면 캡처
    screenshot = ImageGrab.grab()

    # 선택한 영역 크롭
    x, y, width, height = bounds["x"], bounds["y"], bounds["width"], bounds["height"]
    cropped = screenshot.crop((x, y, x + width, y + height))

    # 이미지를 Base64로 변환
    buffered = BytesIO()
    cropped.save(buffered, format="PNG")
    base64_image = base64.b64encode(buffered.getvalue()).decode()

    # Base64 문자열 출력 (Electron이 읽을 수 있도록)
    print(base64_image)

if __name__ == "__main__":
    # Electron에서 전달된 JSON 데이터를 읽기
    bounds_json = sys.stdin.read()
    bounds = json.loads(bounds_json)
    capture_screen(bounds)