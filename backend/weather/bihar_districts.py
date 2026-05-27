# Bihar District Coordinates (Latitude, Longitude)
# Used to fetch weather data from Open-Meteo API

BIHAR_DISTRICTS = {
    "Araria": (26.15, 87.52),
    "Arwal": (25.24, 84.69),
    "Aurangabad": (24.75, 84.37),
    "Banka": (24.89, 86.92),
    "Begusarai": (25.42, 86.13),
    "Bhagalpur": (25.24, 86.97),
    "Bhojpur": (25.56, 84.44),
    "Buxar": (25.56, 83.98),
    "Darbhanga": (26.17, 85.90),
    "East Champaran": (26.65, 84.91),
    "Gaya": (24.75, 85.01),
    "Gopalganj": (26.47, 84.44),
    "Jamui": (24.93, 86.22),
    "Jehanabad": (25.21, 84.99),
    "Kaimur": (25.05, 83.58),
    "Katihar": (25.54, 87.58),
    "Khagaria": (25.50, 86.47),
    "Kishanganj": (26.09, 87.95),
    "Lakhisarai": (25.16, 86.09),
    "Madhepura": (25.92, 86.79),
    "Madhubani": (26.35, 86.07),
    "Munger": (25.38, 86.47),
    "Muzaffarpur": (26.12, 85.40),
    "Nalanda": (25.13, 85.44),
    "Nawada": (24.89, 85.54),
    "Patna": (25.61, 85.14),
    "Purnia": (25.78, 87.47),
    "Rohtas": (24.97, 84.01),
    "Saharsa": (25.88, 86.60),
    "Samastipur": (25.86, 85.78),
    "Saran": (25.87, 84.78),
    "Sheikhpura": (25.14, 85.85),
    "Sheohar": (26.52, 85.30),
    "Sitamarhi": (26.59, 85.49),
    "Siwan": (26.22, 84.36),
    "Supaul": (26.12, 86.60),
    "Vaishali": (25.69, 85.22),
    "West Champaran": (27.15, 84.33),
}

# Quick lookup helpers
def get_coordinates(district_name):
    """Get (lat, lon) for a Bihar district. Case-insensitive."""
    for name, coords in BIHAR_DISTRICTS.items():
        if name.lower() == district_name.strip().lower():
            return coords
    return None

def get_all_districts():
    """Return sorted list of all Bihar district names."""
    return sorted(BIHAR_DISTRICTS.keys())
