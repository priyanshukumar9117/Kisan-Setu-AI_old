"""
Weather service using Open-Meteo API (free, no API key required).
Fetches current weather + 7-day forecast for Bihar districts.
"""
import requests
from .bihar_districts import get_coordinates, get_all_districts


def get_weather(district):
    """
    Fetch weather data for a Bihar district.
    Returns dict with current weather and 7-day forecast.
    """
    coords = get_coordinates(district)
    if not coords:
        return {"error": f"District '{district}' not found in Bihar"}

    lat, lon = coords

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current_weather=true"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
            f"weathercode,windspeed_10m_max,uv_index_max"
            f"&hourly=relativehumidity_2m"
            f"&timezone=Asia/Kolkata"
            f"&forecast_days=7"
        )
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Extract current weather
        current = data.get("current_weather", {})

        # Get current humidity (first hourly value)
        hourly = data.get("hourly", {})
        humidity_list = hourly.get("relativehumidity_2m", [])
        current_humidity = humidity_list[0] if humidity_list else None

        # Build daily forecast
        daily = data.get("daily", {})
        forecast = []
        dates = daily.get("time", [])
        for i in range(len(dates)):
            forecast.append({
                "date": dates[i],
                "temp_max": daily.get("temperature_2m_max", [None])[i],
                "temp_min": daily.get("temperature_2m_min", [None])[i],
                "precipitation": daily.get("precipitation_sum", [None])[i],
                "weathercode": daily.get("weathercode", [None])[i],
                "windspeed_max": daily.get("windspeed_10m_max", [None])[i],
                "uv_index_max": daily.get("uv_index_max", [None])[i],
            })

        return {
            "district": district,
            "latitude": lat,
            "longitude": lon,
            "current": {
                "temperature": current.get("temperature"),
                "windspeed": current.get("windspeed"),
                "winddirection": current.get("winddirection"),
                "weathercode": current.get("weathercode"),
                "humidity": current_humidity,
                "is_day": current.get("is_day"),
            },
            "forecast": forecast,
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to fetch weather data: {str(e)}"}


def get_weather_description(code):
    """Convert WMO weather code to human-readable description."""
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    }
    return descriptions.get(code, "Unknown")


def build_weather_prompt(weather_data, language="en"):
    """Build a prompt for the LLM to generate farming advisory from weather data."""
    if "error" in weather_data:
        return ""

    current = weather_data["current"]
    forecast = weather_data["forecast"]
    district = weather_data["district"]

    # Build weather summary for the LLM
    forecast_summary = ""
    for day in forecast[:7]:
        desc = get_weather_description(day.get("weathercode"))
        forecast_summary += (
            f"  {day['date']}: {desc}, "
            f"Temp {day['temp_min']}–{day['temp_max']}°C, "
            f"Rain: {day['precipitation']}mm, "
            f"Wind: {day['windspeed_max']}km/h\n"
        )

    prompt = (
        f"Current weather in {district}, Bihar:\n"
        f"  Temperature: {current['temperature']}°C\n"
        f"  Humidity: {current['humidity']}%\n"
        f"  Wind: {current['windspeed']} km/h\n"
        f"  Condition: {get_weather_description(current['weathercode'])}\n\n"
        f"7-Day Forecast:\n{forecast_summary}\n"
        f"Based on this weather data, provide specific farming advisory for {district}, Bihar. "
        f"Include: irrigation advice, pest/disease risk, sowing/harvesting timing, "
        f"and any weather precautions the farmer should take."
    )
    return prompt
