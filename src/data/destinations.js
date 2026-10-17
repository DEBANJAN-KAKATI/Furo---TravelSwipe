/**
 * Furo - Destinations & Places Master Dataset
 * Rich, verified metadata including GPS coordinates, pricing tiers, practical Q&A, and hooks.
 * Authentic landmark imagery for Bengaluru (Karnataka) & Guwahati (Assam).
 */

export const DESTINATIONS = {
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    country: "India",
    flag: "🇮🇳",
    tagline: "The Garden City of craft breweries, royal palaces & iconic benne dosas",
    coords: [12.9716, 77.5946],
    currency: "INR (₹)",
    exchangeRateToUSD: 0.012, // 1 INR ~ 0.012 USD
    weather: {
      temp: "24°C / 75°F",
      condition: "Pleasant Breezes",
      icon: "🌤️",
      sunset: "18:05",
      advisory: "Famed Bengaluru climate — cool mornings and breezy evenings. Great walking weather!"
    },
    emergency: {
      police: "112 (Universal Emergency)",
      ambulance: "108",
      touristHelp: "080-2235-2828 (Karnataka Tourism Information Center)"
    },
    etiquette: [
      { title: "Namma Yatri / Auto Meters", desc: "Use the Namma Yatri app or ensure the meter is flagged. Night charges (+50%) apply after 22:00.", icon: "🛺" },
      { title: "Darshini Coffee Etiquette", desc: "At traditional tiffin houses like Vidyarthi Bhavan, stand or take rapid seating, sip hot filter coffee from the dabarah, and clear out quickly.", icon: "☕" },
      { title: "Temple Footwear Protocols", desc: "Always remove shoes before entering shrines (Lalbagh temple, ISKCON). Dedicated shoe counters are available.", icon: "🛕" },
      { title: "Metro Smart Token", desc: "Namma Metro contactless QR tickets can be purchased via WhatsApp or official app for instant entry.", icon: "🚇" }
    ],
    places: [
      {
        id: "blr-lalbagh",
        name: "Lalbagh Botanical Garden & Glass House",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Historic Royal Botanical Garden",
        rating: 4.8,
        reviewsCount: 78500,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "South Bengaluru (Lalbagh Metro West Gate)",
        openStatus: "06:00 - 19:00 Daily (Free entry 06:00 - 09:00)",
        bestTime: "Early morning 06:30 - 08:30 for misty lake walk & century-old trees",
        duration: "2 - 2.5 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/1280px-Glasshouse_and_fountain_at_lalbagh.jpg",
        oneLineHook: "240 acres of rare tropical flora anchored by the 1889 royal Glass House modeled on London's Crystal Palace",
        coords: [12.9507, 77.5848],
        tags: ["Botanical", "Heritage", "Nature Walk", "Iconic"],
        qaList: [
          {
            q: "What is the entrance fee?",
            a: "Adults entry is ₹25 (approx $0.30). Free for children and free for morning joggers from 06:00 to 09:00 AM.",
            status: "verified",
            badge: "Cheap Entry",
            icon: "🎟️",
            source: "Karnataka Horticulture Dept"
          },
          {
            q: "Can senior citizens get buggy rides?",
            a: "Yes! Eco-friendly battery-operated buggies are available at the main gate for ₹100 per person.",
            status: "tip",
            badge: "Buggy Available",
            icon: "🛺",
            source: "Lalbagh Visitor Services"
          },
          {
            q: "When is the famous flower show held?",
            a: "The world-famous Lalbagh Flower Show takes place twice a year during Republic Day (Jan) and Independence Day (Aug) weeks.",
            status: "verified",
            badge: "Annual Highlights",
            icon: "🌸",
            source: "Official Horticulture Calendar"
          },
          {
            q: "Are professional cameras permitted?",
            a: "DSLR cameras incur an extra ₹50 ticket. Drones are strictly banned across the entire botanical reserve.",
            status: "caution",
            badge: "Camera Policy",
            icon: "📷",
            source: "Security Guidelines"
          }
        ]
      },
      {
        id: "blr-palace",
        name: "Bangalore Palace (Wadiyar Royal Estate)",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Tudor-Style Royal Fortress",
        rating: 4.6,
        reviewsCount: 54100,
        priceLevel: "₹₹",
        estimatedCostUSD: 4,
        distance: "Vasanth Nagar / Cantonment",
        openStatus: "10:00 - 17:30 (Daily)",
        bestTime: "Morning at 10:30 before tour buses arrive",
        duration: "1.5 - 2 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg/1280px-Bangalore_Mysore_Maharaja_Palace.jpg",
        oneLineHook: "19th-century royal palace modeled after Windsor Castle with fortified towers, carved woodwork, and Spanish bench mosaics",
        coords: [12.9988, 77.5921],
        tags: ["Palace", "Royal Heritage", "Tudor Architecture", "History"],
        qaList: [
          {
            q: "Is an audio guide included?",
            a: "Yes, an audio guide in multiple languages (English, Kannada, French, German) is included with the entry ticket.",
            status: "verified",
            badge: "Audio Tour Included",
            icon: "🎧",
            source: "Palace Administration"
          },
          {
            q: "What are the ticket prices?",
            a: "₹250 for Indian nationals, ₹450 for foreign tourists. Phone camera photography ticket is ₹300 extra.",
            status: "caution",
            badge: "Photo Fee",
            icon: "🎫",
            source: "Wadiyar Trust"
          },
          {
            q: "Can you see the private royal quarters?",
            a: "Visitors tour the Durbar Hall, ornate ballrooms, hunting trophies, and royal courtyards; private residential suites are cordoned off.",
            status: "verified",
            badge: "Tour Scope",
            icon: "👑",
            source: "Visitor Guide"
          }
        ]
      },
      {
        id: "blr-vidyarthi-bhavan",
        name: "Vidyarthi Bhavan (Basavanagudi)",
        category: "Food & Drink",
        categoryIcon: "🍜",
        subcategory: "1943 Legendary Benne Dosa Institution",
        rating: 4.8,
        reviewsCount: 46200,
        priceLevel: "₹",
        estimatedCostUSD: 2,
        distance: "Gandhi Bazaar, Basavanagudi (National College Metro)",
        openStatus: "06:30 - 11:30 & 14:00 - 20:00 (Closed Fridays)",
        bestTime: "07:30 AM for breakfast or 16:00 for evening tiffin rush",
        duration: "45 minutes",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Benne_masala_dosa.JPG/1280px-Benne_masala_dosa.JPG",
        oneLineHook: "Golden-crisp, thick butter masala dosas stacked in high balancing towers by veteran waiters since 1943",
        coords: [12.9427, 77.5739],
        tags: ["Heritage Food", "Masala Dosa", "Filter Coffee", "Iconic"],
        qaList: [
          {
            q: "How does the waiting token system work?",
            a: "Collect a number token from the counter outside. Wait times range from 15 to 30 minutes on weekends, but tables turn fast.",
            status: "tip",
            badge: "Token Tip",
            icon: "🎟️",
            source: "Vidyarthi Bhavan Management"
          },
          {
            q: "What is the absolute must-order combo?",
            a: "The classic 'Sagu Masala Dosa' or 'Butter Masala Dosa' paired with a frothy tumbler of South Indian Filter Coffee.",
            status: "verified",
            badge: "Foodie Must",
            icon: "☕",
            source: "Bangalore Food Guild"
          },
          {
            q: "Is it open on Fridays?",
            a: "Strictly CLOSED every Friday for regular cleaning and maintenance.",
            status: "caution",
            badge: "Closed Fridays",
            icon: "⚠️",
            source: "Restaurant Schedule"
          }
        ]
      },
      {
        id: "blr-vv-puram",
        name: "VV Puram Food Street (Thindi Beedi)",
        category: "Food & Drink",
        categoryIcon: "🍜",
        subcategory: "All-Vegetarian Night Street Food Strip",
        rating: 4.7,
        reviewsCount: 38900,
        priceLevel: "₹",
        estimatedCostUSD: 4,
        distance: "Near Sajjan Rao Circle, VV Puram",
        openStatus: "18:00 - 23:30 (Every evening)",
        bestTime: "19:30 - 21:30 when all 40+ stalls are sizzling at full steam",
        duration: "1.5 - 2 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Akki_roti.jpg/1280px-Akki_roti.jpg",
        oneLineHook: "Sensory vegetarian food street famous for piping hot Akki Roti, Congress Bun, and royal Gulkand ice cream",
        coords: [12.9525, 77.5775],
        tags: ["Street Food", "Night Market", "Vegetarian", "Chaats"],
        qaList: [
          {
            q: "Is any meat or egg served here?",
            a: "100% pure vegetarian street. No meat or egg dishes are served anywhere on Thindi Beedi.",
            status: "verified",
            badge: "Pure Veg Strip",
            icon: "🌱",
            source: "VV Puram Merchant Association"
          },
          {
            q: "What unique street dishes should I look for?",
            a: "Try Akki Roti (spiced rice flatbread), Paddus (steamed crispy lentil balls), and finish with Shivanna Gulkand Ice Cream (rose petal jam + fresh cream).",
            status: "tip",
            badge: "Top Dishes",
            icon: "🍡",
            source: "Local Food Bloggers"
          },
          {
            q: "Is car parking available?",
            a: "Zero car parking on the street. Park at Krishna Rajendra Road or take an auto/metro to Krishna Rajendra Market station.",
            status: "caution",
            badge: "No Car Parking",
            icon: "🛺",
            source: "Bangalore Traffic Police"
          }
        ]
      },
      {
        id: "blr-cubbon-park",
        name: "Cubbon Park & Attara Kacheri",
        category: "Areas of Exploration",
        categoryIcon: "🧭",
        subcategory: "300-Acre Colonial Park & High Court",
        rating: 4.8,
        reviewsCount: 62400,
        priceLevel: "₹",
        estimatedCostUSD: 0,
        distance: "Central Business District (Cubbon Park Metro)",
        openStatus: "06:00 - 20:00 (Vehicle-free zone on Sundays)",
        bestTime: "Sunday morning for acoustic music, dog park gatherings & quiet walks",
        duration: "1.5 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/High_Court_of_Karnataka%2C_Bangalore_MMK.jpg/1280px-High_Court_of_Karnataka%2C_Bangalore_MMK.jpg",
        oneLineHook: "Bengaluru's peaceful green heart surrounded by neo-classical red buildings and towering bamboo groves",
        coords: [12.9763, 77.5929],
        tags: ["Park", "Nature", "Colonial History", "Free Entry"],
        qaList: [
          {
            q: "Are vehicles allowed inside?",
            a: "Motor vehicles are completely banned on Sundays and second Saturdays, transforming the park into a pedestrian cycling paradise.",
            status: "verified",
            badge: "Vehicle-Free Sundays",
            icon: "🚲",
            source: "Dept of Horticulture"
          },
          {
            q: "Can you photograph the illuminated Vidhana Soudha nearby?",
            a: "Yes! Vidhana Soudha (Karnataka State Legislature) right opposite the park is illuminated with dazzling golden floodlights every Sunday evening.",
            status: "tip",
            badge: "Sunday Lights",
            icon: "✨",
            source: "Karnataka Govt Protocol"
          }
        ]
      },
      {
        id: "blr-toit",
        name: "Toit Brewpub (Indiranagar)",
        category: "Food & Drink",
        categoryIcon: "🍜",
        subcategory: "Pioneering Craft Microbrewery",
        rating: 4.8,
        reviewsCount: 39800,
        priceLevel: "₹₹₹",
        estimatedCostUSD: 18,
        distance: "100 Feet Road, Indiranagar (Indiranagar Metro)",
        openStatus: "08:30 - 01:00 (Daily)",
        bestTime: "17:00 - 19:30 for relaxing evening drinks or weekend brunch",
        duration: "2 - 3 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/A_pub_in_Bangalore_%282012%29.jpg/1280px-A_pub_in_Bangalore_%282012%29.jpg",
        oneLineHook: "The heartbeat of Bengaluru's craft beer scene: legendary Tint-In-Wit Belgian ales and wood-fired sourdough pizzas",
        coords: [12.9792, 77.6406],
        tags: ["Craft Beer", "Microbrewery", "Nightlife", "Sourdough Pizza"],
        qaList: [
          {
            q: "Do I need a reservation on weekends?",
            a: "Essential on Friday & Saturday nights! Walk-ins often face 45+ minute waits. Book table via their app or arrive before 18:30.",
            status: "caution",
            badge: "Reservation Advised",
            icon: "📅",
            source: "Toit Operations"
          },
          {
            q: "What are their signature brews?",
            a: "Tint-In-Wit (Belgian Witbier with orange peel), Basmati Blonde, and Dark Knight (rich roasted malt stout). Flight samplers available.",
            status: "verified",
            badge: "Beer Samplers",
            icon: "🍺",
            source: "Brewmaster Menu"
          }
        ]
      },
      {
        id: "blr-nandi-hills",
        name: "Nandi Hills Sunrise & Cloud Fortress",
        category: "Sights & Views",
        categoryIcon: "👀",
        subcategory: "Hilltop Sunrise & Historic Fort",
        rating: 4.7,
        reviewsCount: 82100,
        priceLevel: "₹",
        estimatedCostUSD: 2,
        distance: "60 km North of Bengaluru (1.5h drive)",
        openStatus: "06:00 - 18:00 (Gates open 06:00 AM sharp)",
        bestTime: "Depart city by 04:30 AM to catch the magical 06:00 sunrise above clouds",
        duration: "3 - 4 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/View_from_Nandi_Hills_Karnataka.jpg/1280px-View_from_Nandi_Hills_Karnataka.jpg",
        oneLineHook: "Chilly mist rolling over ancient Tipu Sultan cliff fortresses as the sun bursts through a sea of white clouds",
        coords: [13.3702, 77.6835],
        tags: ["Sunrise", "Panoramic View", "Trekking", "Nature"],
        qaList: [
          {
            q: "Is online booking required on weekends?",
            a: "Yes! Karnataka Forest Dept requires pre-booked online gate passes via the KSTDC portal to curb weekend traffic congestion.",
            status: "caution",
            badge: "Online Gate Pass",
            icon: "🎫",
            source: "Forest Dept Karnataka"
          },
          {
            q: "Beware of wild monkeys on the viewing deck?",
            a: "Aggressive macaque monkeys inhabit the cliff pathways. Never carry loose snacks, plastic bags, or open bottles in hand.",
            status: "caution",
            badge: "Monkey Alert",
            icon: "🐒",
            source: "Park Safety Notice"
          }
        ]
      },
      {
        id: "blr-iskcon",
        name: "ISKCON Temple (Hare Krishna Hill)",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Neo-Classical Sacred Temple Complex",
        rating: 4.8,
        reviewsCount: 71200,
        priceLevel: "₹",
        estimatedCostUSD: 0,
        distance: "Rajajinagar (Mahalakshmi Metro)",
        openStatus: "04:15 - 05:00 & 07:15 - 13:00 & 16:15 - 20:30",
        bestTime: "19:00 for the spiritual evening Sandhya Aarti with conch shells and Vedic chants",
        duration: "1.5 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/ISKCON_Bangalore_Temple.jpg/1280px-ISKCON_Bangalore_Temple.jpg",
        oneLineHook: "Majestic hilltop temple with a 56-foot gold-plated flag post, crystal chandeliers, and sublime spiritual chants",
        coords: [13.0098, 77.5511],
        tags: ["Temple", "Spiritual", "Architecture", "Free Entry"],
        qaList: [
          {
            q: "Is there a dress code?",
            a: "Modest attire is strictly enforced: shoulders and knees must be covered. Sleeveless tops and shorts are not permitted.",
            status: "verified",
            badge: "Modest Dress",
            icon: "👘",
            source: "Temple Guidelines"
          },
          {
            q: "Is footwear storage safe?",
            a: "Organized token-based shoe stands are provided at the entrance free of charge.",
            status: "verified",
            badge: "Shoe Counter",
            icon: "🧦",
            source: "Temple Services"
          }
        ]
      },
      {
        id: "blr-commercial-street",
        name: "Commercial Street & Russell Market",
        category: "Shopping",
        categoryIcon: "🛍️",
        subcategory: "Historic Street Shopping & Silk Bazaars",
        rating: 4.6,
        reviewsCount: 48300,
        priceLevel: "₹₹",
        estimatedCostUSD: 15,
        distance: "Shivajinagar / MG Road Metro",
        openStatus: "11:00 - 21:30 (Daily)",
        bestTime: "Weekday afternoons (14:00 - 17:00) before evening footfall swells",
        duration: "2 - 3 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Commercial_Street_-_Bangalore_%2824047126747%29.jpg/1280px-Commercial_Street_-_Bangalore_%2824047126747%29.jpg",
        oneLineHook: "Vibrant labyrinth of alleys offering Mysore silks, embroidered kurtas, silverware, and artisanal antiques at bargain prices",
        coords: [12.9822, 77.6083],
        tags: ["Shopping", "Silk", "Bazaar", "Jewelry"],
        qaList: [
          {
            q: "Can you bargain with shopkeepers?",
            a: "Roadside stalls and garment shops expect polite bargaining (aim for 20% to 30% discount). Established silk showrooms have fixed prices.",
            status: "tip",
            badge: "Bargaining Tip",
            icon: "🤝",
            source: "Shopper Guild"
          },
          {
            q: "Best way to commute here?",
            a: "Take Namma Metro to MG Road or Trinity, then catch a 5-minute auto. Driving your own car into Commercial Street is a parking nightmare.",
            status: "caution",
            badge: "Transit Advice",
            icon: "🚇",
            source: "City Transit Protocol"
          }
        ]
      },
      {
        id: "blr-bannerghatta",
        name: "Bannerghatta Grand Safari & Butterfly Park",
        category: "Events & Activities",
        categoryIcon: "🎉",
        subcategory: "Wildlife Safari & Forest Reserve",
        rating: 4.6,
        reviewsCount: 42100,
        priceLevel: "₹₹₹",
        estimatedCostUSD: 8,
        distance: "22 km South of Central Bengaluru",
        openStatus: "09:30 - 17:00 (Closed Tuesdays)",
        bestTime: "Morning at 09:30 for high animal activity before afternoon heat",
        duration: "3 - 4 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Bannerghatta_biological_park_tiger.jpg/1280px-Bannerghatta_biological_park_tiger.jpg",
        oneLineHook: "Encounters with Royal Bengal tigers, Asiatic lions, and sloth bears from safari vehicles inside dense deciduous forest",
        coords: [12.8009, 77.5777],
        tags: ["Wildlife Safari", "Tigers & Lions", "Butterflies", "Family"],
        qaList: [
          {
            q: "AC vs Non-AC Safari bus ticket?",
            a: "AC Safari bus (₹350) has cleaner tinted windows and less engine heat; Non-AC bus (₹300) offers sliding windows for unobstructed photos.",
            status: "verified",
            badge: "Ticket Options",
            icon: "🚌",
            source: "Bannerghatta Park Office"
          },
          {
            q: "Is it open on Tuesdays?",
            a: "Park and Safari are strictly CLOSED every Tuesday.",
            status: "caution",
            badge: "Closed Tuesdays",
            icon: "⚠️",
            source: "Zoo Authority of Karnataka"
          }
        ]
      },
      {
        id: "blr-park-churchst",
        name: "Secret Free Parking Behind Church Street Metro",
        category: "Secret Parking",
        categoryIcon: "🅿️",
        subcategory: "Parking Hack",
        rating: 4.9,
        reviewsCount: 380,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Church Street, Central Bengaluru",
        openStatus: "24/7 Shaded Patch",
        bestTime: "Before 11:30 AM or after 19:30 for guaranteed spot",
        duration: "As long as needed",
        heroImage: "",
        oneLineHook: "Sneak into the alley behind Church St metro for free, shaded car & bike parking where cops never tow!",
        coords: [12.9749, 77.6074],
        tags: ["ParkingHack", "ChurchStreet", "Free", "SavedMyLife"],
        author: { name: "Rohan V.", handle: "@bangalore_hustler", avatar: "🅿️", role: "Parking Sensei" },
        hypes: 189,
        qaList: [
          { q: "Is it really free?", a: "100% free municipal open patch behind the alley.", icon: "💸", status: "verified" },
          { q: "Will towing trucks come?", a: "Traffic cops rarely enter this specific back lane.", icon: "🚔", status: "verified" },
          { q: "Fits cars?", a: "Yes, accommodates around 8 cars and 25 two-wheelers.", icon: "🚗", status: "tip" }
        ]
      },
      {
        id: "blr-comedy-mic",
        name: "Underground Comedy Open Mic @ Koramangala",
        category: "Events & Gigs",
        categoryIcon: "🎙️",
        subcategory: "Standup Comedy & Open Mic",
        rating: 4.8,
        reviewsCount: 420,
        priceLevel: "₹",
        estimatedCostUSD: 2,
        distance: "5th Block, Koramangala",
        openStatus: "Thu & Sat 19:30 - 22:00",
        bestTime: "Arrive at 19:00 for front row roast seats",
        duration: "2 hours",
        heroImage: "",
        oneLineHook: "Unhinged, raw local standup comics trying out fresh jokes every Thursday — ₹150 entry includes a drink!",
        coords: [12.9352, 77.6245],
        tags: ["ComedyMic", "Standup", "Koramangala", "Nightlife"],
        author: { name: "Priya S.", handle: "@standup_junkie", avatar: "🎤", role: "Joke Tester" },
        hypes: 245,
        qaList: [
          { q: "Can anybody perform?", a: "Yes, register at the venue 30 mins before showtime for 4 min stage time.", icon: "📝", status: "verified" },
          { q: "Is there alcohol?", a: "Craft beer and appetizers served throughout.", icon: "🍻", status: "tip" }
        ]
      },
      {
        id: "blr-protest-cycle",
        name: "Save Hasiru: Peaceful Climate & Cycle Rally",
        category: "Events & Gigs",
        categoryIcon: "📢",
        subcategory: "Civic Movement & Community Rally",
        rating: 5.0,
        reviewsCount: 512,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Cubbon Park Queen's Statue to Vidhana Soudha",
        openStatus: "Upcoming Sunday 07:00 AM",
        bestTime: "Sunday 06:45 AM assembly",
        duration: "2 hours",
        heroImage: "",
        oneLineHook: "Join 500+ citizens cycling from Cubbon Park to Vidhana Soudha for urban tree preservation this Sunday morning!",
        coords: [12.9750, 77.5910],
        tags: ["Protest", "CycleRally", "CubbonPark", "GreenBLR"],
        author: { name: "Arjun K.", handle: "@green_voice_blr", avatar: "🚲", role: "Pedal Activist" },
        hypes: 312,
        qaList: [
          { q: "Is registration required?", a: "No, just show up with your bicycle or join on foot with banners.", icon: "📢", status: "verified" },
          { q: "Police permission?", a: "Yes, official peaceful assembly route clearance obtained.", icon: "👮", status: "verified" }
        ]
      },
      {
        id: "blr-dosa-midnight",
        name: "2 AM Podi Ghee Dosa Cart @ RV Road",
        category: "Food & Drink",
        categoryIcon: "🧈",
        subcategory: "Late Night Street Food",
        rating: 4.9,
        reviewsCount: 890,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "Opposite RV Road Metro Station",
        openStatus: "23:00 - 03:30 Nightly",
        bestTime: "01:30 AM for the freshest batch of podi",
        duration: "30 mins",
        heroImage: "",
        oneLineHook: "Crispy benne dosas drenched in spiced gun-powder podi served sizzling hot on banana leaves until 3:30 AM.",
        coords: [12.9218, 77.5790],
        tags: ["LateNight", "PodiDosa", "StreetFood", "MidnightCravings"],
        author: { name: "Kiran R.", handle: "@dosa_ninja", avatar: "🥞", role: "3 AM Foodie" },
        hypes: 480,
        qaList: [
          { q: "Cash or UPI?", a: "UPI QR code works flawlessly even at 3 AM.", icon: "📱", status: "verified" },
          { q: "Must-try dish?", a: "Open Ghee Butter Podi Masala Dosa (₹60).", icon: "🌶️", status: "tip" }
        ]
      },
      {
        id: "blr-puppy-circle",
        name: "Sunday Cubbon Golden Retriever & Doggo Circle",
        category: "Fun Quirks",
        categoryIcon: "🐶",
        subcategory: "Community Hangout",
        rating: 5.0,
        reviewsCount: 1200,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Central Bamboo Grove, Cubbon Park",
        openStatus: "Sundays 08:00 - 11:30 AM",
        bestTime: "08:30 AM when all the golden retrievers assemble",
        duration: "1.5 hours",
        heroImage: "",
        oneLineHook: "Dozens of friendly puppies running off-leash and getting belly rubs every Sunday 8 to 11 AM — pure free serotonin!",
        coords: [12.9760, 77.5930],
        tags: ["Dogs", "Puppies", "CubbonPark", "Serotonin"],
        author: { name: "Simran M.", handle: "@cubbon_pack", avatar: "🐾", role: "Puppy Whisperer" },
        hypes: 620,
        qaList: [
          { q: "Can I come if I don't own a dog?", a: "Yes! 80% of people come just to pet other people's happy dogs.", icon: "🐕", status: "verified" },
          { q: "Entry fee?", a: "Totally free entry via Cubbon Park gates.", icon: "🌳", status: "verified" }
        ]
      },
      {
        id: "blr-rooftop-sunset",
        name: "Sunset Staircase Chill @ Sankey Tank North",
        category: "Sights & Views",
        categoryIcon: "🌅",
        subcategory: "Scenic Sunset Point",
        rating: 4.8,
        reviewsCount: 310,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Sadashivanagar Gate, Sankey Tank",
        openStatus: "06:00 - 20:00 Daily",
        bestTime: "17:30 - 18:15 for golden hour reflections",
        duration: "1 hour",
        heroImage: "",
        oneLineHook: "The secluded stone steps overlooking Sankey Lake where the sun sets behind eucalyptus trees with zero crowd.",
        coords: [13.0080, 77.5750],
        tags: ["Sunset", "SankeyTank", "Peaceful", "DateSpot"],
        author: { name: "Ananya B.", handle: "@blr_solitude", avatar: "✨", role: "Sky Watcher" },
        hypes: 290,
        qaList: [
          { q: "Is sitting on the steps allowed?", a: "Yes, popular among readers, sketchers, and sunset lovers.", icon: "🧘", status: "verified" }
        ]
      }
    ]
  },

  guwahati: {
    id: "guwahati",
    name: "Guwahati",
    country: "India",
    flag: "🇮🇳",
    tagline: "Gateway to the Northeast: sacred Shakti peaks, river islands & wild rhinos",
    coords: [26.1445, 91.7362],
    currency: "INR (₹)",
    exchangeRateToUSD: 0.012,
    weather: {
      temp: "23°C / 73°F",
      condition: "Clear River Breezes",
      icon: "🌤️",
      sunset: "17:10",
      advisory: "Early sunrise around 05:00 and sunset by 17:10. Plan outdoor temple visits early!"
    },
    emergency: {
      police: "112 / 100",
      ambulance: "108",
      touristHelp: "0361-2547102 (Directorate of Assam Tourism, Guwahati)"
    },
    etiquette: [
      { title: "Muga Silk Authenticity", desc: "When shopping for Assam's golden Muga or warm Eri silk, look for the official government 'Silk Mark' to avoid polyester counterfeits.", icon: "🧵" },
      { title: "River Ferry Protocols", desc: "Always wear safety lifejackets aboard government inland water transport ferries on the mighty Brahmaputra.", icon: "🚢" },
      { title: "Temple Dress Norms", desc: "Traditional modest attire is required for Kamakhya and Umananda shrines. Avoid Western shorts and sleeveless clothing.", icon: "🛕" },
      { title: "Brahmaputra Sunset Timing", desc: "Sunset happens earlier in the Northeast (around 17:00). Board river cruises by 16:15 for peak golden twilight.", icon: "🌅" }
    ],
    places: [
      {
        id: "ghy-kamakhya",
        name: "Maa Kamakhya Temple (Nilachal Hill)",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Ancient Tantric Shakti Peeth",
        rating: 4.8,
        reviewsCount: 68900,
        priceLevel: "₹",
        estimatedCostUSD: 2,
        distance: "8 km from Guwahati Railway Station (Kamakhya Hill)",
        openStatus: "05:30 - 13:00 & 14:30 - 17:30 (Daily)",
        bestTime: "Early morning at 05:30 AM before general pilgrim lines lengthen",
        duration: "2 - 3 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Kamakhya_Temple_-_DEV_8829.jpg/1280px-Kamakhya_Temple_-_DEV_8829.jpg",
        oneLineHook: "One of the 51 ancient Shakti Peethas perched on Nilachal Hill, radiating centuries of Tantric spirituality and panoramic river views",
        coords: [26.1664, 91.7058],
        tags: ["Shakti Peeth", "Temple", "Spiritual", "Panoramic View"],
        qaList: [
          {
            q: "What is the difference between General and VIP Darshan?",
            a: "General line is free but can take 3 to 5 hours on peak days. Special Darshan tickets (₹501) or Defence passes shorten wait time to ~45 minutes.",
            status: "caution",
            badge: "Darshan Ticket Pass",
            icon: "🎟️",
            source: "Kamakhya Devalaya Board"
          },
          {
            q: "What is the dress code?",
            a: "Traditional Indian attire is mandatory: Kurta-pajama/dhoti for men, sarees/salwar-kameez for women. Shorts and denim with holes are not allowed inside the sanctum.",
            status: "verified",
            badge: "Dress Code",
            icon: "👗",
            source: "Temple Guidelines"
          },
          {
            q: "Can you photograph the inner cave sanctum (Garbhagriha)?",
            a: "Strictly forbidden! Mobile phones and cameras must remain in bags. Photography of outer stone carvings and courtyard is permitted.",
            status: "caution",
            badge: "No Sanctum Photos",
            icon: "🚫",
            source: "Devalaya Security"
          },
          {
            q: "When is the Ambubachi Mela held?",
            a: "Held annually in mid-June during the monsoon; attracts hundreds of thousands of sadhus. The temple sanctum is closed for 3 days and reopens with grand festivities.",
            status: "tip",
            badge: "Festival Alert",
            icon: "🛕",
            source: "Assam Tourism Calendar"
          }
        ]
      },
      {
        id: "ghy-ropeway",
        name: "Guwahati Passenger Ropeway",
        category: "Sights & Views",
        categoryIcon: "👀",
        subcategory: "India's Longest River Passenger Cable Car",
        rating: 4.8,
        reviewsCount: 32100,
        priceLevel: "₹",
        estimatedCostUSD: 2,
        distance: "Panbazar riverfront terminal (Near Fancy Bazaar)",
        openStatus: "08:30 - 16:30 (Closed Thursdays for maintenance)",
        bestTime: "15:45 for the breathtaking golden twilight flight over the Brahmaputra",
        duration: "45 minutes",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Guwahati_Passenger_Ropeway.jpg/1280px-Guwahati_Passenger_Ropeway.jpg",
        oneLineHook: "Soar 1.8 kilometers over the vast Brahmaputra River with bird's-eye views of Peacock Island and North Guwahati hills",
        coords: [26.1912, 91.7454],
        tags: ["Cable Car", "River Views", "Brahmaputra", "Scenic"],
        qaList: [
          {
            q: "What are the ticket prices?",
            a: "₹100 for one-way, ₹150 for two-way round trip. Tickets are bought directly at the Panbazar or North Guwahati terminal.",
            status: "verified",
            badge: "Ticket Pricing",
            icon: "🎫",
            source: "Guwahati Metropolitan Dev Authority"
          },
          {
            q: "How long does the cable car ride take?",
            a: "The 1.82 km transit takes approximately 7 to 8 minutes each way at a comfortable height of 56 meters above the water.",
            status: "tip",
            badge: "Flight Time",
            icon: "⏱️",
            source: "GMDA Ropeway Specs"
          },
          {
            q: "Is it open on Thursdays?",
            a: "Ropeway is CLOSED every Thursday for routine mechanical inspection and safety cable servicing.",
            status: "caution",
            badge: "Closed Thursdays",
            icon: "⚠️",
            source: "Operating Schedule"
          }
        ]
      },
      {
        id: "ghy-brahmaputra-cruise",
        name: "Alfresco Grand Brahmaputra River Cruise",
        category: "Events & Activities",
        categoryIcon: "🎉",
        subcategory: "Sunset Folk Dance & Dinner Riverboat",
        rating: 4.7,
        reviewsCount: 28400,
        priceLevel: "₹₹",
        estimatedCostUSD: 10,
        distance: "Departs from Kachari Ghat / Fancy Bazaar",
        openStatus: "Cruises depart 16:30 (Sunset) & 19:30 (Dinner)",
        bestTime: "Sunset cruise at 16:30 to watch twilight tint the massive river gold",
        duration: "1 - 2 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Brahmaputra_River_sunset_from_Tezpur%2C_Assam.jpg/1280px-Brahmaputra_River_sunset_from_Tezpur%2C_Assam.jpg",
        oneLineHook: "Glide along the crimson expanse of the mighty Brahmaputra with live Assamese Bihu dance, folk songs, and snacks",
        coords: [26.1895, 91.7431],
        tags: ["River Cruise", "Sunset", "Folk Dance", "Romantic"],
        qaList: [
          {
            q: "Can you spot endangered Ganges River Dolphins?",
            a: "Yes! The deep waters near Peacock Island are home to the freshwater Gangetic river dolphin (Xihu); frequently spotted on calm morning and sunset cruises.",
            status: "tip",
            badge: "Dolphin Sighting",
            icon: "🐬",
            source: "Assam Inland Navigation"
          },
          {
            q: "Do I need to book in advance?",
            a: "Recommended on weekends and winter holiday season as the open upper deck seats sell out hours before departure.",
            status: "verified",
            badge: "Advance Booking",
            icon: "🎟️",
            source: "Alfresco Cruise Desk"
          }
        ]
      },
      {
        id: "ghy-umananda",
        name: "Umananda Temple (Peacock Island)",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "World's Smallest Inhabited River Island",
        rating: 4.7,
        reviewsCount: 24500,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "10-minute ferry from Uzanbazar or Kachari Ghat",
        openStatus: "05:30 - 17:00 (Ferry service halts at sunset)",
        bestTime: "Morning 08:30 - 10:30 when the river breeze is cool and peaceful",
        duration: "1.5 hours",
        heroImage: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Chandrasekhar_Temple%2C_Umananda.jpg",
        oneLineHook: "17th-century rock-cut Shiva temple built on a tiny granite island in the middle of the river, home to rare Golden Langurs",
        coords: [26.1950, 91.7478],
        tags: ["Island", "Temple", "River Ferry", "Golden Langur"],
        qaList: [
          {
            q: "How to reach the island?",
            a: "Take government Inland Water Transport (IWT) motorized ferries from Kachari Ghat (₹20 per person) or private boats.",
            status: "verified",
            badge: "Ferry Transit",
            icon: "⛴️",
            source: "IWT Assam"
          },
          {
            q: "Are rare Golden Langurs present?",
            a: "Yes! Peacock Island is home to a small protected family of endangered Golden Langurs that roam the tamarind and banyan trees.",
            status: "tip",
            badge: "Wildlife Rare",
            icon: "🐒",
            source: "Assam Forest Dept"
          }
        ]
      },
      {
        id: "ghy-kalakshetra",
        name: "Srimanta Sankaradeva Kalakshetra",
        category: "Areas of Exploration",
        categoryIcon: "🧭",
        subcategory: "Sprawling Cultural Heritage Village & Museum",
        rating: 4.8,
        reviewsCount: 31200,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "Panjabari (6 km from Dispur Capital complex)",
        openStatus: "10:00 - 19:00 (Daily)",
        bestTime: "Late afternoon followed by the 18:30 musical light show",
        duration: "2 - 3 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Srimanta_Sankardev_Kalakshetra_02.jpg/1280px-Srimanta_Sankardev_Kalakshetra_02.jpg",
        oneLineHook: "Exhibition of Assam's vibrant tribal heritage: life-size ethnic villages, traditional mask-making, and open-air amphitheaters",
        coords: [26.1264, 91.8213],
        tags: ["Culture", "Tribal Heritage", "Museum", "Assam Art"],
        qaList: [
          {
            q: "What is the entrance fee?",
            a: "Adult entry is ₹30 (approx $0.35). Separate small fee for battery cars touring the large 30-acre campus.",
            status: "verified",
            badge: "Inexpensive",
            icon: "🎟️",
            source: "Kalakshetra Society"
          },
          {
            q: "What can you see in the Artists' Village?",
            a: "Authentic replicas of Mising, Karbi, Bodo, and Dimasa tribal cottages depicting traditional handloom weaving and woodwork.",
            status: "tip",
            badge: "Tribal Cottages",
            icon: "🛖",
            source: "Curatorial Guide"
          }
        ]
      },
      {
        id: "ghy-pobitora",
        name: "Pobitora Wildlife Sanctuary",
        category: "Events & Activities",
        categoryIcon: "🎉",
        subcategory: "World's Highest Density Rhino Sanctuary",
        rating: 4.9,
        reviewsCount: 22800,
        priceLevel: "₹₹₹",
        estimatedCostUSD: 18,
        distance: "45 km East of Guwahati (1.5h scenic drive)",
        openStatus: "06:30 - 16:00 (Open Nov 1 to April 30)",
        bestTime: "First elephant safari slot at 06:30 AM for misty close-up rhino sightings",
        duration: "Half Day (4 - 5 hours)",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Rhino_tourism_in_Pobitora_Wildlife_Sanctuary.jpg/1280px-Rhino_tourism_in_Pobitora_Wildlife_Sanctuary.jpg",
        oneLineHook: "Unrivaled wilderness where over 100 Great Indian One-Horned Rhinoceroses roam freely through grassland wetlands",
        coords: [26.2415, 92.0519],
        tags: ["Rhino Safari", "Wildlife", "Jeep Safari", "Grassland"],
        qaList: [
          {
            q: "Elephant Safari vs Jeep Safari?",
            a: "Elephant Safari (₹1,000 per person) navigates directly through tall elephant grass right next to rhinos; Jeep safari (₹2,000 per vehicle) covers larger grassland sectors.",
            status: "verified",
            badge: "Safari Choices",
            icon: "🦏",
            source: "Assam Forest Range Office"
          },
          {
            q: "Is it open year-round?",
            a: "Closed during monsoon season (May to October) due to Brahmaputra floodwaters. Open from November to April.",
            status: "caution",
            badge: "Seasonal Access",
            icon: "🌧️",
            source: "Wildlife Warden Notice"
          }
        ]
      },
      {
        id: "ghy-fancy-bazaar",
        name: "Fancy Bazaar & Silk Alleys (Muga & Eri)",
        category: "Shopping",
        categoryIcon: "🛍️",
        subcategory: "Commerce Heart & Indigenous Silk Emporiums",
        rating: 4.6,
        reviewsCount: 36400,
        priceLevel: "₹₹",
        estimatedCostUSD: 25,
        distance: "Fancy Bazaar, Central Guwahati (Near Brahmaputra Ghat)",
        openStatus: "10:30 - 20:30 (Closed Sundays)",
        bestTime: "11:00 AM for unhurried silk shopping and tea tasting",
        duration: "2 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Assam_Muga_Silk_Mekhela_Chador.jpg/1280px-Assam_Muga_Silk_Mekhela_Chador.jpg",
        oneLineHook: "Famous market for genuine golden Muga silk, thermal Eri Ahimsa shawls, cane handicrafts, and fresh Assam CTC tea",
        coords: [26.1865, 91.7405],
        tags: ["Shopping", "Assam Silk", "Handicrafts", "Assam Tea"],
        qaList: [
          {
            q: "How to verify genuine Muga silk?",
            a: "Always buy from state-run emporiums (like Pragjyotika) or certified dealers with the official 'Silk Mark' label. Muga has a natural golden sheen that intensifies with each handwash.",
            status: "verified",
            badge: "Silk Mark Test",
            icon: "✨",
            source: "Central Silk Board"
          },
          {
            q: "What is 'Ahimsa' Eri silk?",
            a: "Eri silk is harvested without boiling the silkworm alive (peace silk), creating a soft, warm, wool-like texture ideal for shawls.",
            status: "tip",
            badge: "Peace Silk",
            icon: "🧣",
            source: "Assam Khadi Board"
          }
        ]
      },
      {
        id: "ghy-paradise-restaurant",
        name: "Paradise Restaurant (Parampara Assamese Thali)",
        category: "Food & Drink",
        categoryIcon: "🍜",
        subcategory: "Pioneer of Traditional Assamese Gastronomy",
        rating: 4.7,
        reviewsCount: 19800,
        priceLevel: "₹₹",
        estimatedCostUSD: 6,
        distance: "Silpukhuri, G.N.B. Road",
        openStatus: "11:30 - 15:30 & 18:30 - 22:30",
        bestTime: "13:00 for lunch to savor the full multi-course Parampara Thali",
        duration: "1 hour",
        heroImage: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Assamese_Thali.jpg",
        oneLineHook: "Iconic traditional dining served on brass bell-metal (Kanh) tableware: tangy fish curry, aromatic Khar, and sweet pitha",
        coords: [26.1825, 91.7760],
        tags: ["Assamese Thali", "Masor Tenga", "Ethnic Food", "Heritage"],
        qaList: [
          {
            q: "What does the Parampara Thali include?",
            a: "Traditional bell-metal platter loaded with Khar (alkaline starter), Pitika (mashed potatoes with mustard oil), seasonal fish curry (Masor Tenga), local leafy greens, and Payox rice pudding.",
            status: "verified",
            badge: "Thali Breakdown",
            icon: "🍛",
            source: "Paradise Culinary Menu"
          },
          {
            q: "Is it overly spicy?",
            a: "Assamese cuisine emphasizes fresh herbs, lime, and mustard oil rather than heavy fiery spices. Ghost pepper (Bhut Jolokia) is served separately as an optional condiment.",
            status: "tip",
            badge: "Flavor Profile",
            icon: "🌶️",
            source: "Assam Gastronomy Guild"
          }
        ]
      },
      {
        id: "ghy-deepor-beel",
        name: "Deepor Beel Freshwater Lake & Sanctuary",
        category: "Sights & Views",
        categoryIcon: "👀",
        subcategory: "RAMSAR Wetland & Migratory Bird Haven",
        rating: 4.6,
        reviewsCount: 15400,
        priceLevel: "₹",
        estimatedCostUSD: 0,
        distance: "12 km Southwest of Guwahati city center",
        openStatus: "06:00 - 17:00 (Daily)",
        bestTime: "Sunrise 06:00 - 08:00 AM during winter (Nov-Feb) for birdwatching",
        duration: "2 hours",
        heroImage: "https://upload.wikimedia.org/wikipedia/commons/8/80/Deepor_beel.jpg",
        oneLineHook: "Assam's only Ramsar wetland where spot-billed pelicans, whistling ducks, and herds of wild Asian elephants drink in the morning mist",
        coords: [26.1260, 91.6492],
        tags: ["Wetland", "Birdwatching", "Ramsar Site", "Peaceful"],
        qaList: [
          {
            q: "What birds migrate here?",
            a: "Over 120 species including Greater and Lesser Adjutant Storks, Siberian waterfowls, and Kingfishers. Bring binoculars!",
            status: "tip",
            badge: "Birdwatching",
            icon: "🦅",
            source: "Assam Bird Monitoring Network"
          },
          {
            q: "Are wild elephants seen here?",
            a: "Wild elephants frequently traverse from the adjoining Rani and Garbhanga reserve forests down to the lake at dawn and dusk.",
            status: "caution",
            badge: "Elephant Corridor",
            icon: "🐘",
            source: "Forest Department Advisory"
          }
        ]
      },
      {
        id: "ghy-riverfront",
        name: "Mahaprabhu Riverfront & Heritage Centre",
        category: "Areas of Exploration",
        categoryIcon: "🧭",
        subcategory: "Panoramic River Promenade & Colonial Art Space",
        rating: 4.7,
        reviewsCount: 18200,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "Panbazar, M.G. Road Promenade",
        openStatus: "10:00 - 20:00 (Garden promenade open until 21:00)",
        bestTime: "17:00 for golden sunset walking, river view café & garden breezes",
        duration: "1.5 hours",
        heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/View_from_Guwahati_Ropeway.jpg/1280px-View_from_Guwahati_Ropeway.jpg",
        oneLineHook: "Restored 1850s hilltop British colonial bungalow overlooking the Brahmaputra, featuring river garden amphitheaters and tea lounges",
        coords: [26.1917, 91.7495],
        tags: ["Riverfront", "Promenade", "Heritage", "Sunset Stroll"],
        qaList: [
          {
            q: "Is there a coffee and tea lounge on-site?",
            a: "Yes, a garden tea café overlooks the river serving single-estate organic orthodox Assam teas and light snacks.",
            status: "verified",
            badge: "River Tea Lounge",
            icon: "☕",
            source: "Heritage Centre Management"
          }
        ]
      },
      {
        id: "ghy-parking-fancybazar",
        name: "Hidden Riverfront Parking Hack Behind Fancy Bazar",
        category: "Secret Parking",
        categoryIcon: "🅿️",
        subcategory: "Parking Hack",
        rating: 4.8,
        reviewsCount: 195,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "MG Road Old Jail Ghat, Fancy Bazar",
        openStatus: "Day & Evening Access",
        bestTime: "Before 16:00 to beat market gridlock",
        duration: "Flexible",
        heroImage: "",
        oneLineHook: "Avoid Fancy Bazar chaos — park directly on the paved MG Road riverbank strip for hassle-free in & out!",
        coords: [26.1830, 91.7380],
        tags: ["ParkingHack", "FancyBazar", "Guwahati", "LifeSaver"],
        author: { name: "Bikash D.", handle: "@guwahati_wheels", avatar: "🅿️", role: "Traffic Ninja" },
        hypes: 175,
        qaList: [
          { q: "Is parking fee collected?", a: "No official municipal fee on this riverbank stretch.", icon: "🆓", status: "verified" },
          { q: "Safe for cars?", a: "Wide asphalt with decent visibility and daylight activity.", icon: "🛡️", status: "tip" }
        ]
      },
      {
        id: "ghy-acoustic-jam",
        name: "Dighalipukhuri Sunset Acoustic Jam Session",
        category: "Events & Gigs",
        categoryIcon: "🎸",
        subcategory: "Live Music & Jamming",
        rating: 4.9,
        reviewsCount: 410,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Dighalipukhuri East Bank Benches, Uzanbazar",
        openStatus: "Saturdays 17:00 - 20:00",
        bestTime: "17:30 as the lake lights reflect across the water",
        duration: "2 hours",
        heroImage: "",
        oneLineHook: "Local guitarists and indie musicians jam unplugged on the lake benches every Saturday evening — bring your guitar or voice!",
        coords: [26.1878, 91.7515],
        tags: ["LiveMusic", "AcousticJam", "Dighalipukhuri", "Vibes"],
        author: { name: "Ankur B.", handle: "@ghy_riff", avatar: "🎵", role: "Strummer" },
        hypes: 340,
        qaList: [
          { q: "Can beginners join?", a: "Yes, everyone is welcome to jam, sing along, or just chill.", icon: "🎶", status: "verified" },
          { q: "Nearby chai?", a: "Hot red tea & nimki stalls 20 meters away.", icon: "☕", status: "tip" }
        ]
      },
      {
        id: "ghy-protest-save-brahma",
        name: "Clean Brahmaputra Riverbank Cleanup & Voice Meet",
        category: "Events & Gigs",
        categoryIcon: "📢",
        subcategory: "Eco Movement & Youth Meetup",
        rating: 5.0,
        reviewsCount: 320,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Uzanbazar River Ghat",
        openStatus: "Saturday 08:00 AM - 11:00 AM",
        bestTime: "08:00 AM sharp",
        duration: "3 hours",
        heroImage: "",
        oneLineHook: "Youth volunteer riverbank cleanup drive followed by open poetry and acoustic songs at Uzanbazar Ghat this Saturday.",
        coords: [26.1950, 91.7530],
        tags: ["RiverCleanup", "YouthEvent", "Uzanbazar", "EcoVoice"],
        author: { name: "Juri G.", handle: "@save_brahmaputra", avatar: "🌊", role: "River Guardian" },
        hypes: 285,
        qaList: [
          { q: "Are gloves provided?", a: "Yes, student organizers provide biodegradable trash bags and safety gloves.", icon: "🧤", status: "verified" },
          { q: "Who can attend?", a: "Open to students, travelers, and locals alike.", icon: "🤝", status: "verified" }
        ]
      },
      {
        id: "ghy-secret-chai",
        name: "Hidden Clay-Cup Malai Chai Behind Commerce College",
        category: "Food & Drink",
        categoryIcon: "☕",
        subcategory: "Secret Chai Stall",
        rating: 4.9,
        reviewsCount: 650,
        priceLevel: "₹",
        estimatedCostUSD: 1,
        distance: "Commerce College Lane, Chandmari",
        openStatus: "16:00 - 01:00 Nightly",
        bestTime: "21:30 after the college rush settles",
        duration: "45 mins",
        heroImage: "",
        oneLineHook: "Thick hand-beaten malai chai served in red earthen kulhads with hot buttered toast for ₹20 until 1 AM.",
        coords: [26.1820, 91.7770],
        tags: ["KulhadChai", "MalaiChai", "LateNight", "Chandmari"],
        author: { name: "Debojit S.", handle: "@assam_chai_hunter", avatar: "🍵", role: "Chai Sommelier" },
        hypes: 510,
        qaList: [
          { q: "What's the signature order?", a: "Ask for 'Double Malai Elaichi Chai' and 'Bun Makkhan'.", icon: "🍞", status: "tip" }
        ]
      },
      {
        id: "ghy-midnight-overlook",
        name: "Nilachal Hill Stargazing & City Overlook",
        category: "Sights & Views",
        categoryIcon: "✨",
        subcategory: "Night Panorama",
        rating: 4.9,
        reviewsCount: 490,
        priceLevel: "Free",
        estimatedCostUSD: 0,
        distance: "Nilachal Hill Viewpoint, Kamakhya Access Road",
        openStatus: "Open Evening & Night",
        bestTime: "22:00 when city traffic ceases and the river breeze peaks",
        duration: "1 hour",
        heroImage: "",
        oneLineHook: "Breathtaking panoramic view of Guwahati's neon city lights and the dark Brahmaputra from the winding hill road.",
        coords: [26.1660, 91.7050],
        tags: ["Stargazing", "NightView", "Nilachal", "CityLights"],
        author: { name: "Pranab K.", handle: "@ghy_stargazer", avatar: "🌌", role: "Night Owl" },
        hypes: 380,
        qaList: [
          { q: "Is the road safe at night?", a: "Yes, well-lit paved asphalt, popular with night riders.", icon: "🛵", status: "verified" }
        ]
      },
      {
        id: "ghy-ferry-hack",
        name: "₹5 Local River Ferry Sunset Hack to North Guwahati",
        category: "Fun Quirks",
        categoryIcon: "🚢",
        subcategory: "Travel Hack",
        rating: 4.9,
        reviewsCount: 560,
        priceLevel: "Free",
        estimatedCostUSD: 0.1,
        distance: "Fancy Bazar / Sukreswar Ghat Terminal",
        openStatus: "06:00 - 18:00 Hourly",
        bestTime: "16:30 departure for sunset across the river current",
        duration: "30 mins",
        heroImage: "",
        oneLineHook: "Skip ₹500 luxury cruise boats — take the ₹5 government ferry for the raw, windy Brahmaputra sunset experience!",
        coords: [26.1850, 91.7410],
        tags: ["RiverFerry", "SunsetHack", "BudgetTravel", "Brahmaputra"],
        author: { name: "Sneha P.", handle: "@northeast_nomad", avatar: "🧭", role: "Budget Explorer" },
        hypes: 430,
        qaList: [
          { q: "Where to buy ticket?", a: "Little wooden counter right at the ghat ramp for ₹5 coins.", icon: "🪙", status: "verified" },
          { q: "Can you bring a scooter?", a: "Yes, two-wheelers can roll directly onto the ferry cargo deck for ₹15.", icon: "🛵", status: "tip" }
        ]
      }
    ]
  },

  tokyo: {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    tagline: "Ultra-modern neon meets ancient shinto serenity",
    coords: [35.6762, 139.6503],
    currency: "JPY (¥)",
    exchangeRateToUSD: 0.0067,
    weather: {
      temp: "19°C / 66°F",
      condition: "Partly Cloudy",
      icon: "⛅",
      sunset: "17:15",
      advisory: "Pleasant autumn breeze — ideal for walking around Shibuya & Asakusa."
    },
    emergency: {
      police: "110",
      ambulance: "119",
      touristHelp: "050-3816-2787 (Japan Tourism Hotline, 24/7 EN)"
    },
    etiquette: [
      { title: "No Tipping", desc: "Tipping is not customary in Japan and can cause confusion or embarrassment.", icon: "💴" },
      { title: "Quiet on Trains", desc: "Keep mobile phones on silent. Speak in whispers and avoid voice calls.", icon: "🤫" }
    ],
    places: [
      {
        id: "tokyo-sensoji",
        name: "Sensō-ji Temple & Nakamise-dōri",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Historic Temple & Street",
        rating: 4.8,
        reviewsCount: 68420,
        priceLevel: "₹",
        estimatedCostUSD: 0,
        distance: "1.2 km from Asakusa Stn",
        openStatus: "Main hall 06:00 - 17:00 • Grounds open 24/7",
        bestTime: "Early morning (07:00) or illuminated after 20:00",
        duration: "1.5 - 2 hours",
        heroImage: "",
        oneLineHook: "Tokyo's oldest and most revered Buddhist temple guarded by giant red lanterns",
        coords: [35.7148, 139.7967],
        tags: ["Culture", "Temples", "Free Entry", "Photo Spot"],
        qaList: [
          {
            q: "Is there an entry fee?",
            a: "Temple grounds and main hall are completely free. Fortunes (Omikuji) cost ¥100.",
            status: "verified",
            badge: "Free Entry",
            icon: "🎟️",
            source: "Official Senso-ji Portal"
          }
        ]
      }
    ]
  },

  paris: {
    id: "paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    tagline: "The City of Light, world-class art, and romantic cobblestones",
    coords: [48.8566, 2.3522],
    currency: "EUR (€)",
    exchangeRateToUSD: 1.08,
    weather: {
      temp: "15°C / 59°F",
      condition: "Light Showers",
      icon: "🌦️",
      sunset: "18:45",
      advisory: "Bring a light waterproof jacket for Seine walks."
    },
    emergency: {
      police: "17",
      ambulance: "15",
      touristHelp: "112 (European Emergency Number)"
    },
    etiquette: [
      { title: "Always say 'Bonjour'", desc: "Enter every shop with 'Bonjour Madame/Monsieur'.", icon: "🥖" }
    ],
    places: [
      {
        id: "paris-eiffel-tower",
        name: "Eiffel Tower (Tour Eiffel)",
        category: "Places to Visit",
        categoryIcon: "🏛️",
        subcategory: "Iconic Iron Landmark",
        rating: 4.8,
        reviewsCount: 142000,
        priceLevel: "₹₹₹",
        estimatedCostUSD: 30,
        distance: "Champ de Mars / Bir-Hakeim",
        openStatus: "09:30 - 23:45",
        bestTime: "Sunset for twilight view + sparkling light show",
        duration: "2 - 3 hours",
        heroImage: "",
        oneLineHook: "Gustave Eiffel's 330m masterpiece glowing with 20,000 sparkling golden beacons",
        coords: [48.8584, 2.2945],
        tags: ["Landmark", "Romantic", "Panoramic View"],
        qaList: [
          {
            q: "Summit vs 2nd Floor ticket?",
            a: "The 2nd floor offers the best panoramic perspective. Summit adds exhilarating vertigo at 276m.",
            status: "verified",
            badge: "Ticket Options",
            icon: "🗼",
            source: "SETE Official Guide"
          }
        ]
      }
    ]
  }
};

export const CATEGORIES = [
  { id: "all", label: "For You", icon: "✨" },
  { id: "Places to Visit", label: "Landmarks", icon: "🏛️" },
  { id: "Food & Drink", label: "Food & Drink", icon: "🍜" },
  { id: "Sights & Views", label: "Views", icon: "🌅" },
  { id: "Areas of Exploration", label: "Nature & Areas", icon: "🧭" },
  { id: "Events & Gigs", label: "Events & Nightlife", icon: "🎭" },
  { id: "Shopping & Culture", label: "Shopping & Culture", icon: "🛍️" },
  { id: "Fun Quirks", label: "Local Hacks", icon: "💡" },
  { id: "Secret Parking", label: "Parking", icon: "🅿️" }
];

/** Maps legacy / generated category names onto the canonical set above. */
export const CATEGORY_ALIASES = {
  "Food & Dining": "Food & Drink",
  "Events & Mics": "Events & Gigs",
  "Events & Activities": "Events & Gigs",
  "Shopping": "Shopping & Culture",
  "Nature": "Areas of Exploration"
};
