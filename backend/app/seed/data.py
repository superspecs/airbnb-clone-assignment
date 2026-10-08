"""Static seed fixtures. All names, titles, and text are fictional and written for this project.

Photos are referenced (not copied) from Unsplash, which permits free use under the Unsplash License.
"""

from dataclasses import dataclass

from app.models import Category, PropertyType, RoomType

UNSPLASH_URL = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1200&q=80"

# Photo pools, grouped by what the photo shows.
EXTERIOR_PHOTOS: dict[Category, list[str]] = {
    Category.BEACHFRONT: ["1499793983690-e29da59ef1c2", "1571896349842-33c89424de2d", "1520250497591-112f2f40a3f4", "1564501049412-61c2a3083791"],
    Category.AMAZING_POOLS: [
        "1564013799919-ab600027ffc6", "1512917774080-9991f1c4c750", "1582268611958-ebfd161ef9cf",
        "1600596542815-ffad4c1539a9", "1613490493576-7fde63acd811", "1613977257363-707ba9348227",
        "1566073771259-6a8506099945", "1576941089067-2de3c901e126", "1580587771525-78b9dba3b914",
    ],
    Category.CABINS: ["1449158743715-0a90ebb6d2d8", "1542718610-a1d656d1884c", "1587061949409-02df41d5e562"],
    Category.MOUNTAIN_VIEWS: ["1542718610-a1d656d1884c", "1449158743715-0a90ebb6d2d8", "1568605114967-8130f3a36994"],
    Category.LAKEFRONT: ["1510798831971-661eb04b3739", "1568605114967-8130f3a36994"],
    Category.COUNTRYSIDE: ["1570129477492-45c003edd2be", "1602343168117-bb8ffe3e2e9f", "1600585154340-be6161a56a0c", "1600047509807-ba8f99d2cdde"],
    Category.CITY_STAYS: [
        "1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688", "1505691938895-1758d7feb511",
        "1493809842364-78817add7ffb", "1560448204-e02f11c3d0e2", "1600210492486-724fe5c67fb0",
    ],
}
LIVING_PHOTOS = [
    "1600607687939-ce8a6c25118c", "1586023492125-27b2c045efd7", "1618773928121-c32242e63f39",
    "1554995207-c18c203602cb", "1536376072261-38c75010e6c9", "1533779283484-8ad4940aa3a8",
    "1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688",
]
BEDROOM_PHOTOS = [
    "1540518614846-7eded433c457", "1522771739844-6a9f6d5f14af", "1631049307264-da0ec9d70304",
    "1615874959474-d609969a20ed", "1616594039964-ae9021a400a0", "1595526114035-0d45ed16cfbf",
    "1505693416388-ac5ce068fe85", "1551882547-ff40c63fe5fa",
]
KITCHEN_PHOTOS = ["1600566753190-17f0baa2a6c3", "1556912173-3bb406ef7e77"]
BATHROOM_PHOTOS = ["1584622650111-993a426fbf0a", "1552321554-5fefe8c9ef14"]
EXTRA_PHOTOS = ["1513694203232-719a280e022f", "1484154218962-a197022b5858", "1560448204-e02f11c3d0e2"]

# (code, display name, icon key)
AMENITIES: list[tuple[str, str, str]] = [
    ("wifi", "Wifi", "wifi"),
    ("kitchen", "Kitchen", "kitchen"),
    ("washer", "Washing machine", "washer"),
    ("air_conditioning", "Air conditioning", "snowflake"),
    ("heating", "Heating", "heater"),
    ("tv", "TV", "tv"),
    ("free_parking", "Free parking on premises", "car"),
    ("pool", "Pool", "pool"),
    ("hot_tub", "Hot tub", "hot-tub"),
    ("workspace", "Dedicated workspace", "desk"),
    ("self_check_in", "Self check-in", "key"),
    ("pets_allowed", "Pets allowed", "paw"),
    ("bbq_grill", "BBQ grill", "grill"),
    ("fireplace", "Indoor fireplace", "fire"),
    ("beach_access", "Beach access", "umbrella"),
    ("lake_view", "Lake view", "water"),
    ("mountain_view", "Mountain view", "mountain"),
    ("garden", "Garden", "leaf"),
    ("gym", "Gym", "dumbbell"),
    ("ev_charger", "EV charger", "plug"),
    ("smoke_alarm", "Smoke alarm", "alarm"),
    ("first_aid_kit", "First aid kit", "first-aid"),
]

# Every listing gets these; category defaults add more.
BASE_AMENITIES = ["wifi", "smoke_alarm", "first_aid_kit"]
CATEGORY_AMENITIES: dict[Category, list[str]] = {
    Category.BEACHFRONT: ["beach_access", "air_conditioning"],
    Category.AMAZING_POOLS: ["pool", "air_conditioning", "free_parking"],
    Category.CABINS: ["heating", "fireplace", "mountain_view"],
    Category.MOUNTAIN_VIEWS: ["heating", "mountain_view"],
    Category.CITY_STAYS: ["air_conditioning", "workspace", "self_check_in"],
    Category.COUNTRYSIDE: ["garden", "free_parking", "bbq_grill"],
    Category.LAKEFRONT: ["lake_view"],
}

CATEGORY_PARAGRAPHS: dict[Category, str] = {
    Category.BEACHFRONT: "The sea is a short walk away, so mornings start with the sound of waves and evenings end with sunset.",
    Category.AMAZING_POOLS: "The private pool is the centrepiece of the stay, with loungers and shade for long, lazy afternoons.",
    Category.CABINS: "Timber walls, warm blankets, and a crackling fire make this a cosy base after a day outdoors.",
    Category.MOUNTAIN_VIEWS: "Big windows frame the peaks, and the air is crisp enough that a hot drink on the balcony feels essential.",
    Category.CITY_STAYS: "Cafés, markets, and transport are close by, and the space is set up for both work and downtime.",
    Category.COUNTRYSIDE: "Surrounded by greenery and quiet lanes, it is an easy place to slow down and switch off.",
    Category.LAKEFRONT: "Watch the light change over the water from the terrace, then wander the lakeside promenade.",
}
CLOSING_PARAGRAPH = "Check-in instructions and house rules are shared after booking. This is a demo listing created for a portfolio project."


@dataclass(frozen=True)
class UserSeed:
    name: str
    email: str
    bio: str
    is_host: bool = False
    is_superhost: bool = False


HOSTS: list[UserSeed] = [
    UserSeed("Ananya Iyer", "ananya.host@example.com", "Architect turned host. I love restoring old homes along the coast.", True, True),
    UserSeed("Rohan Desai", "rohan.host@example.com", "Mumbai local with a soft spot for good coffee and quiet mornings.", True, False),
    UserSeed("Tenzin Dorje", "tenzin.host@example.com", "I grew up in the hills and now host travellers in cabins my family built.", True, True),
    UserSeed("Leela Fernandes", "leela.host@example.com", "Goan by birth, gardener by choice. Ask me for beach-shack tips.", True, False),
    UserSeed("Vikram Rao", "vikram.host@example.com", "Weekend potter and full-time host of homes with pools and patios.", True, True),
]

GUESTS: list[UserSeed] = [
    UserSeed("Priya Nair", "priya.guest@example.com", "Always planning the next long weekend."),
    UserSeed("Sana Qureshi", "sana.guest@example.com", "Food first, sightseeing second."),
    UserSeed("Dev Malhotra", "dev.guest@example.com", "Remote worker chasing good wifi and better views."),
    UserSeed("Ishita Bose", "ishita.guest@example.com", "Photographer who travels with too many lenses."),
    UserSeed("Nikhil Joshi", "nikhil.guest@example.com", "Trekker and amateur birdwatcher."),
    UserSeed("Rahul Verma", "rahul.guest@example.com", "Family trips with two kids and a dog."),
    UserSeed("Karan Gill", "karan.guest@example.com", "Road-tripper collecting sunsets."),
    UserSeed("Maya Thomas", "maya.guest@example.com", "Slow traveller, fast reader."),
]


@dataclass(frozen=True)
class ListingSeed:
    title: str
    property_type: PropertyType
    room_type: RoomType
    category: Category
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    nightly_rupees: int
    cleaning_rupees: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    host: int  # index into HOSTS
    extra_amenities: tuple[str, ...]
    blurb: str


P, R, C = PropertyType, RoomType, Category
ENTIRE, ROOM = R.ENTIRE_PLACE, R.PRIVATE_ROOM

LISTINGS: list[ListingSeed] = [
    ListingSeed("Sea-breeze studio steps from Candolim beach", P.APARTMENT, ENTIRE, C.BEACHFRONT, "Candolim", "Candolim", "Goa", 15.518, 73.762, 3800, 600, 2, 1, 1, 1, 3, ("kitchen", "tv"), "A bright studio with a balcony hammock and a five-minute stroll to the sand."),
    ListingSeed("Portuguese-style villa with plunge pool", P.VILLA, ENTIRE, C.AMAZING_POOLS, "Assagao", "Assagao", "Goa", 15.594, 73.770, 14500, 2000, 8, 4, 5, 4, 4, ("kitchen", "washer", "bbq_grill", "hot_tub"), "Four airy bedrooms around a courtyard plunge pool, minutes from the village cafés."),
    ListingSeed("Palm-fringed beach hut in Palolem", P.COTTAGE, ENTIRE, C.BEACHFRONT, "Palolem", "Canacona", "Goa", 15.010, 74.023, 2900, 400, 2, 1, 1, 1, 3, ("pets_allowed",), "A simple, breezy hut right behind the palms — fall asleep to the tide."),
    ListingSeed("Cliffside room with sunset deck", P.HOUSE, ROOM, C.BEACHFRONT, "Vagator", "Anjuna", "Goa", 15.583, 73.740, 2200, 300, 2, 1, 1, 1, 3, ("tv",), "A private room in a family home with a shared deck overlooking the cliffs."),
    ListingSeed("Bandra loft near the promenade", P.APARTMENT, ENTIRE, C.CITY_STAYS, "Bandra West", "Mumbai", "Maharashtra", 19.060, 72.836, 6200, 800, 3, 1, 2, 1, 1, ("kitchen", "washer", "tv"), "A high-ceilinged loft with exposed brick, a short walk from the sea face."),
    ListingSeed("Heritage flat by the Gateway", P.APARTMENT, ENTIRE, C.CITY_STAYS, "Colaba", "Mumbai", "Maharashtra", 18.915, 72.825, 7400, 900, 4, 2, 2, 2, 1, ("kitchen", "tv", "gym"), "Teak floors, tall windows, and colonial-era charm in the heart of Colaba."),
    ListingSeed("Apple-orchard cabin above Old Manali", P.CABIN, ENTIRE, C.CABINS, "Old Manali", "Manali", "Himachal Pradesh", 32.255, 77.183, 4800, 700, 4, 2, 2, 1, 2, ("kitchen", "free_parking"), "A two-storey wooden cabin among apple trees with a wood stove and river views."),
    ListingSeed("Snowline chalet with valley views", P.CABIN, ENTIRE, C.MOUNTAIN_VIEWS, "Solang Road", "Manali", "Himachal Pradesh", 32.290, 77.170, 6900, 900, 6, 3, 4, 2, 2, ("kitchen", "fireplace", "free_parking", "hot_tub"), "Wake up to snow-capped peaks from every bedroom of this timber chalet."),
    ListingSeed("Colonial cottage on the Mall Road ridge", P.COTTAGE, ENTIRE, C.MOUNTAIN_VIEWS, "The Ridge", "Shimla", "Himachal Pradesh", 31.104, 77.173, 5200, 700, 4, 2, 3, 2, 2, ("kitchen", "fireplace", "tv"), "A restored hill cottage with a sunroom, a short walk from the ridge."),
    ListingSeed("Riverside retreat with yoga deck", P.HOUSE, ENTIRE, C.COUNTRYSIDE, "Tapovan", "Rishikesh", "Uttarakhand", 30.087, 78.268, 3600, 500, 4, 2, 2, 2, 2, ("kitchen", "workspace"), "A calm house above the Ganga with a rooftop deck made for sunrise yoga."),
    ListingSeed("Pink City haveli suite", P.HOUSE, ROOM, C.CITY_STAYS, "Old City", "Jaipur", "Rajasthan", 26.912, 75.787, 3100, 400, 2, 1, 1, 1, 1, ("air_conditioning", "tv"), "A painted suite in a restored haveli with a rooftop view of the old city walls."),
    ListingSeed("Lake Pichola terrace apartment", P.APARTMENT, ENTIRE, C.LAKEFRONT, "Gangaur Ghat", "Udaipur", "Rajasthan", 24.585, 73.712, 5600, 700, 4, 2, 2, 2, 4, ("kitchen", "air_conditioning", "tv"), "A terrace apartment facing the lake and the palace lights at night."),
    ListingSeed("Fort Kochi courtyard home", P.HOUSE, ENTIRE, C.CITY_STAYS, "Fort Kochi", "Kochi", "Kerala", 9.965, 76.242, 4200, 600, 5, 2, 3, 2, 0, ("kitchen", "garden", "washer"), "A tiled-roof home with a leafy inner courtyard near the old harbour."),
    ListingSeed("Backwater cottage with private jetty", P.COTTAGE, ENTIRE, C.LAKEFRONT, "Punnamada", "Alappuzha", "Kerala", 9.498, 76.338, 4600, 600, 3, 1, 2, 1, 0, ("kitchen", "garden"), "A quiet cottage on the backwaters with a jetty for canoe mornings."),
    ListingSeed("Tea-estate bungalow in the mist", P.HOUSE, ENTIRE, C.MOUNTAIN_VIEWS, "Chithirapuram", "Munnar", "Kerala", 10.089, 77.060, 6100, 800, 6, 3, 3, 3, 0, ("kitchen", "fireplace", "garden", "free_parking"), "A planter's bungalow wrapped in tea gardens and morning mist."),
    ListingSeed("Coffee-plantation homestay room", P.HOUSE, ROOM, C.COUNTRYSIDE, "Madikeri", "Kodagu", "Karnataka", 12.424, 75.738, 2600, 300, 2, 1, 1, 1, 0, ("garden",), "A warm room on a working coffee estate, with home-cooked breakfast available nearby."),
    ListingSeed("Nilgiri cabin among eucalyptus", P.CABIN, ENTIRE, C.CABINS, "Fern Hill", "Ooty", "Tamil Nadu", 11.410, 76.695, 3900, 500, 4, 2, 2, 1, 2, ("kitchen", "free_parking"), "A pine-scented cabin with a fireplace and long walks on the doorstep."),
    ListingSeed("Indiranagar designer one-bedroom", P.APARTMENT, ENTIRE, C.CITY_STAYS, "Indiranagar", "Bengaluru", "Karnataka", 12.978, 77.640, 4400, 600, 2, 1, 1, 1, 1, ("kitchen", "washer", "tv", "gym", "ev_charger"), "A designer apartment near the 100 Feet Road cafés with a fast, reliable connection."),
    ListingSeed("French Quarter townhouse", P.HOUSE, ENTIRE, C.CITY_STAYS, "White Town", "Puducherry", "Puducherry", 11.934, 79.830, 5300, 700, 5, 2, 3, 2, 0, ("kitchen", "garden"), "A mustard-walled townhouse on a bougainvillea-lined street near the promenade."),
    ListingSeed("Himalayan view room near the tea gardens", P.HOUSE, ROOM, C.MOUNTAIN_VIEWS, "Chowrasta", "Darjeeling", "West Bengal", 27.041, 88.266, 2400, 300, 2, 1, 1, 1, 2, ("heating",), "A cosy room with a window seat facing the peaks on clear mornings."),
    ListingSeed("Monsoon villa with infinity pool", P.VILLA, ENTIRE, C.AMAZING_POOLS, "Tungarli", "Lonavala", "Maharashtra", 18.750, 73.405, 16500, 2500, 10, 5, 6, 5, 4, ("kitchen", "bbq_grill", "tv", "washer"), "A five-bedroom villa whose infinity pool looks out over green valleys."),
    ListingSeed("Alibaug farmhouse by the coast", P.HOUSE, ENTIRE, C.COUNTRYSIDE, "Nagaon", "Alibaug", "Maharashtra", 18.641, 72.872, 8800, 1200, 8, 4, 4, 3, 1, ("kitchen", "pool", "pets_allowed"), "A breezy farmhouse among coconut palms, a short cycle from the beach."),
    ListingSeed("Varkala clifftop studio", P.APARTMENT, ENTIRE, C.BEACHFRONT, "North Cliff", "Varkala", "Kerala", 8.733, 76.716, 3300, 400, 2, 1, 1, 1, 0, ("kitchen",), "A sea-facing studio on the cliff path, with stairs down to the beach."),
    ListingSeed("Gokarna hillside cottage", P.COTTAGE, ENTIRE, C.BEACHFRONT, "Kudle Beach", "Gokarna", "Karnataka", 14.547, 74.318, 2800, 400, 3, 1, 2, 1, 3, ("pets_allowed",), "A laterite-stone cottage above a quiet cove, perfect for unhurried days."),
    ListingSeed("Lakeside lodge in Nainital", P.CABIN, ENTIRE, C.LAKEFRONT, "Mallital", "Nainital", "Uttarakhand", 29.380, 79.463, 5000, 700, 4, 2, 2, 2, 2, ("kitchen", "fireplace", "heating"), "A wood-panelled lodge a few steps from the lake and the boat club."),
    ListingSeed("Hauz Khas pied-à-terre", P.APARTMENT, ENTIRE, C.CITY_STAYS, "Hauz Khas Village", "New Delhi", "Delhi", 28.549, 77.200, 5800, 800, 3, 1, 2, 1, 1, ("kitchen", "tv", "washer"), "A compact, well-designed flat overlooking the deer park and lake."),
    ListingSeed("Pine-forest cottage in Kasauli", P.COTTAGE, ENTIRE, C.CABINS, "Upper Mall", "Kasauli", "Himachal Pradesh", 30.900, 76.965, 4500, 600, 4, 2, 2, 2, 2, ("kitchen", "garden", "free_parking"), "A stone-and-timber cottage under tall pines, with a sunny lawn."),
    ListingSeed("Mussoorie ridge cabin with fireplace", P.CABIN, ENTIRE, C.CABINS, "Landour", "Mussoorie", "Uttarakhand", 30.459, 78.064, 5400, 700, 4, 2, 3, 1, 2, ("kitchen", "workspace"), "A storybook cabin in Landour's quiet lanes, with a library nook by the fire."),
    ListingSeed("Boulder-view farm stay near Hampi", P.HOUSE, ENTIRE, C.COUNTRYSIDE, "Hanumanahalli", "Hampi", "Karnataka", 15.335, 76.460, 3000, 400, 4, 2, 2, 1, 0, ("garden", "kitchen"), "A mud-plastered farmhouse among paddy fields and giant granite boulders."),
    ListingSeed("Golden-sandstone villa with pool", P.VILLA, ENTIRE, C.AMAZING_POOLS, "Sam Road", "Jaisalmer", "Rajasthan", 26.915, 70.908, 9800, 1400, 6, 3, 3, 3, 4, ("kitchen", "bbq_grill"), "A sandstone villa with a courtyard pool and rooftop stargazing."),
    ListingSeed("Coastal villa with lap pool", P.VILLA, ENTIRE, C.AMAZING_POOLS, "Siolim", "Siolim", "Goa", 15.618, 73.766, 12500, 1800, 6, 3, 3, 3, 4, ("kitchen", "washer", "workspace"), "A modern villa with a long lap pool, five minutes from the river and beaches."),
    ListingSeed("Garden room in a Bengaluru bungalow", P.HOUSE, ROOM, C.COUNTRYSIDE, "Whitefield", "Bengaluru", "Karnataka", 12.969, 77.750, 2100, 300, 2, 1, 1, 1, 1, ("workspace", "garden"), "A peaceful room opening onto a mango-tree garden, with a desk for work."),
]

# Original, generic review snippets combined deterministically by the loader.
REVIEW_OPENERS = [
    "Exactly as described.",
    "We had a wonderful stay.",
    "Lovely place and a very responsive host.",
    "Great value for the location.",
    "Comfortable, clean, and quiet.",
    "A perfect base for exploring the area.",
    "Check-in was smooth and simple.",
]
REVIEW_DETAILS = [
    "The beds were comfortable and the space was spotless.",
    "The views were even better than the photos.",
    "The kitchen had everything we needed for a few home-cooked meals.",
    "Plenty of good food spots within walking distance.",
    "The wifi was fast enough for video calls.",
    "It was peaceful at night and easy to get a good sleep.",
    "The host shared great local recommendations.",
]
REVIEW_CLOSERS = [
    "Would happily stay again.",
    "Highly recommended.",
    "We are already planning a return trip.",
    "Small things could be improved, but overall a great experience.",
    "Thank you for having us!",
]
