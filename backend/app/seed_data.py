"""Initial website content taken from the Figma design ("Fortune decor" page).

Home page copy is verbatim from Figma. Products/About/Contact/Curtain copy was transcribed
from frame screenshots and should be proofread in the CMS. Everything here is editable there.
"""

F = "/uploads/figma"

# ---------------------------------------------------------------- settings

SETTINGS = {
    "brand": {
        "name": "Fortune Decor",
        "logo": f"{F}/brand/logo.png",
        "tagline": "Designed for Every Surface.",
        "description": (
            "Thoughtfully curated interior solutions for windows, walls and ceilings — "
            "created to bring design, comfort and function together."
        ),
    },
    "contact": {
        "email": "hello@yourcompany.com",
        "phone": "+91 XXXXX XXXXX",
        "whatsapp": "",
        "address": "Your Company Address, Gujarat, India",
        "location": "Gujarat, India",
        "hours": "Mon – Sat, 10:00 – 19:00",
        "map_embed_url": "",
    },
    "socials": {"instagram": "", "facebook": "", "linkedin": "", "youtube": ""},
    "footer": {
        "copyright": "© 2026 Fortune Decor. All rights reserved.",
        "cta_label": "Start Your Project",
        "cta_href": "/contact",
    },
    "seo": {
        "default_title": "Fortune Decor — Designed for Every Surface",
        "default_description": (
            "Curtains, blinds, wallpapers, stretch ceilings and architectural solutions for "
            "residential and commercial interiors."
        ),
        "og_image": f"{F}/home/hero.jpg",
    },
}

# ---------------------------------------------------------------- categories & products

CATEGORIES = [
    {
        "name": "Curtains",
        "slug": "curtains",
        # Subtitle on the types page
        "tagline": (
            "Explore curtain solutions developed for different levels of light control, privacy, "
            "performance and interior requirements."
        ),
        # Subtitle on the category page
        "description": (
            "A versatile curtain solution designed for commercial, hospitality and residential projects, "
            "available in multiple styles and performance options."
        ),
        "intro_title": "Designed for Modern Projects",
        "intro_text": (
            "Custom-made curtain solutions combining refined design, practical performance and "
            "flexibility for hospitality, commercial and residential interiors."
        ),
        "types_heading": "Curtain Types",
        "card_image": f"{F}/categories/curtains.jpg",
        "hero_image": f"{F}/about/better-spaces.jpg",
        "types_image": f"{F}/curtains/garden.jpg",
        "gallery": [f"{F}/curtains/sheer.jpg", f"{F}/curtains/dimout.jpg", f"{F}/curtains/blackout.jpg"],
        "products": [
            {
                "name": "Sheer Curtains",
                "slug": "sheer-curtains",
                "short_description": "Lightweight, translucent fabrics that soften daylight.",
                "description": (
                    "Lightweight, translucent fabrics that soften natural daylight while creating an "
                    "elegant and open interior atmosphere."
                ),
                "suitable_for": ["Hospitality", "Residential", "Lounges", "Reception Areas"],
                "cover_image": f"{F}/curtains/sheer.jpg",
            },
            {
                "name": "Dimout Curtains",
                "slug": "dimout-curtains",
                "short_description": "Reduce glare and incoming light while keeping a soft ambience.",
                "description": (
                    "Designed to reduce incoming daylight while providing privacy and maintaining a "
                    "comfortable, softly lit environment."
                ),
                "suitable_for": ["Hotels", "Offices", "Bedrooms", "Meeting Spaces"],
                "cover_image": f"{F}/curtains/dimout.jpg",
            },
            {
                "name": "Blackout Curtains",
                "slug": "blackout-curtains",
                "short_description": "Complete light control for rest and presentation spaces.",
                "description": (
                    "High-opacity curtains designed for enhanced privacy and effective light blocking "
                    "where greater light control is required."
                ),
                "suitable_for": ["Hotel Rooms", "Bedrooms", "Media Rooms", "Conference Spaces"],
                "cover_image": f"{F}/curtains/blackout.jpg",
            },
            {
                "name": "Decorative Curtains",
                "slug": "decorative-curtains",
                "short_description": "Textures, patterns and colours that complete an interior.",
                "description": (
                    "Statement fabrics in curated textures, patterns and colours that frame windows and "
                    "complete the design language of a space."
                ),
                "suitable_for": ["Residences", "Boutique Hotels", "Restaurants"],
                "cover_image": f"{F}/contact/side.jpg",
            },
            {
                "name": "Acoustic Curtains",
                "slug": "acoustic-curtains",
                "short_description": "Heavier fabrics that absorb sound and reduce echo.",
                "description": (
                    "Dense, layered fabrics that absorb sound and reduce echo, improving comfort in busy "
                    "or open-plan spaces."
                ),
                "suitable_for": ["Auditoriums", "Offices", "Studios", "Conference Rooms"],
                "cover_image": f"{F}/curtains/garden.jpg",
            },
        ],
    },
    {
        "name": "Blinds",
        "slug": "blinds",
        "tagline": "Precise light control with a clean, tailored finish.",
        "description": "Roller, zebra, Roman and wooden blinds made to measure for homes and workspaces.",
        "intro_title": "Tailored Light Control",
        "intro_text": "Made-to-measure blinds that balance daylight, privacy and a clean architectural look.",
        "types_heading": "Blind Types",
        "card_image": f"{F}/categories/blinds.jpg",
        "hero_image": f"{F}/categories/blinds.jpg",
        "gallery": [f"{F}/about/better-spaces.jpg", f"{F}/about/wide.jpg"],
        "products": [],
    },
    {
        "name": "Wallpapers",
        "slug": "wallpapers",
        "tagline": "Textures and patterns that give walls character.",
        "description": "Designer wallpapers and wallcoverings for feature walls, residences and commercial interiors.",
        "intro_title": "Walls with Character",
        "intro_text": "Curated wallpapers and wallcoverings in textures, patterns and finishes for every interior.",
        "types_heading": "Wallpaper Types",
        "card_image": f"{F}/categories/wallpapers.jpg",
        "hero_image": f"{F}/categories/wallpapers.jpg",
        "gallery": [],
        "products": [],
    },
    {
        "name": "Stretch Ceilings",
        "slug": "stretch-ceilings",
        "tagline": "Seamless ceilings with integrated lighting.",
        "description": "Seamless stretch ceiling systems in matte, satin, gloss and backlit finishes.",
        "intro_title": "Seamless Ceiling Systems",
        "intro_text": "Stretch ceilings that hide imperfections, integrate lighting and install quickly with minimal mess.",
        "types_heading": "Ceiling Types",
        "card_image": f"{F}/categories/stretch-ceilings.jpg",
        "hero_image": f"{F}/categories/stretch-ceilings.jpg",
        "gallery": [],
        "products": [],
    },
    {
        "name": "Architectural Solutions",
        "slug": "architectural-solutions",
        "tagline": "Systems that shape light, sound and space.",
        "description": "Motorised systems, acoustic treatments and custom architectural finishes for large projects.",
        "intro_title": "Built Around Your Project",
        "intro_text": "Architectural solutions planned around the scale, function and design language of your project.",
        "types_heading": "Solutions",
        "card_image": f"{F}/home/process.jpg",
        "hero_image": f"{F}/home/process.jpg",
        "gallery": [],
        "products": [],
    },
]

# ---------------------------------------------------------------- FAQs (global)

FAQS = [
    ("What products do you offer?", "Curtains, blinds, wallpapers, stretch ceilings and architectural solutions for residential and commercial interiors."),
    ("Do you offer custom sizes and designs?", "Yes. Every product is made to your dimensions, design language and functional requirements."),
    ("What is your minimum order quantity?", "It depends on the product and finish. Share your requirements and we will confirm the details."),
    ("Do you handle measurement and installation?", "Yes. We manage consultation, measurement, production and installation from start to finish."),
    ("Can I request product samples?", "Yes. Use “Request Samples” on any product page and we will arrange fabric or material samples."),
    ("How long does production take?", "Timelines vary by product and quantity; you will receive a confirmed schedule with your quotation."),
    ("How can I request a quote?", "Click “Request a Quote” on any product, or fill in the contact form and we will respond within 24 hours."),
]

CATEGORY_FAQS = {
    "curtains": [
        ("Which curtain type is right for my room?", "Sheer for soft daylight, dimout for reduced glare, blackout for complete darkness. We can recommend a combination during consultation."),
        ("Can sheer and blackout curtains be layered?", "Yes. Double tracks let you combine a sheer layer with a dimout or blackout layer for flexible light control."),
        ("Are motorised curtains available?", "Yes. Most curtain types can be fitted with motorised tracks and remote or smart-home control."),
    ],
}

# ---------------------------------------------------------------- page sections

PAGES = {
    "home": [
        ("hero", "Hero", {"image": f"{F}/home/hero.jpg", "alt": "Living room with floor-to-ceiling windows and blinds", "title": "", "subtitle": ""}),
        (
            "products_intro",
            "Our Products",
            {
                "title": "Our Products",
                "text": (
                    "From windows to walls and ceilings, our curated collection of curtains, blinds, wallpapers and "
                    "stretch ceilings brings together design, comfort and function for beautifully finished spaces."
                ),
                "cta_label": "View all products",
                "cta_href": "/products",
            },
        ),
        (
            "why_choose_us",
            "Why Choose Us",
            {
                "title": "Why Choose Us",
                "subtitle": "Thoughtful Design. Reliable Execution. Complete Solutions.",
                "items": [
                    {"title": "Curated Collection", "text": "A carefully selected range of fabrics, textures, patterns, systems and finishes for contemporary interiors."},
                    {"title": "Made for Your Space", "text": "Every project is different. We work around your dimensions, design language, functionality and project requirements."},
                    {"title": "Design + Function", "text": "Our solutions aren't only about aesthetics. We consider light, privacy, comfort, acoustics, durability and everyday usability."},
                    {"title": "End-to-End Service", "text": "From initial consultation and material selection to measurement, production and installation, we manage the process from start to finish."},
                    {"title": "Quality That Lasts", "text": "We focus on reliable materials, precise detailing and professional installation for long-term performance."},
                    {"title": "Projects of Every Scale", "text": "Whether it's a single residence or a large commercial development, our approach adapts to the scale and complexity of your project."},
                ],
            },
        ),
        (
            "process",
            "Process",
            {
                "title": "Export Process",
                "subtitle": "Designed Here. Delivered Beyond Borders.",
                "image": f"{F}/home/process.jpg",
                "steps": [
                    {"title": "Enquiry", "text": "Share your project requirements, product needs, quantities and destination."},
                    {"title": "Selection & Quotation", "text": "We recommend suitable products, finishes and specifications, followed by a detailed quotation."},
                    {"title": "Approval & Production", "text": "Once the products and specifications are approved, we begin production and preparation."},
                    {"title": "Quality Check & Packing", "text": "Every order is checked, securely packed and prepared for international shipment."},
                    {"title": "Documentation & Delivery", "text": "Export documentation is coordinated and your order is dispatched to its destination."},
                ],
            },
        ),
        (
            "about",
            "About Us teaser",
            {
                "title": "About Us",
                "heading": "Creating Interiors With Purpose",
                "text": (
                    "We believe great interiors come from the balance of design, material and function. Our collection "
                    "brings together curtains, blinds, wallpapers, ceilings and architectural solutions to create spaces "
                    "that feel refined, comfortable and complete."
                ),
                "tagline": "Design with intention. Detail with purpose.",
                "image": f"{F}/home/about.jpg",
                "cta_label": "About Us",
                "cta_href": "/about",
            },
        ),
        (
            "get_in_touch",
            "Get In Touch card",
            {"title": "Get In Touch", "text": "Get product details, pricing, samples and installation support. We'll respond within 24 hours."},
        ),
    ],
    "products": [
        ("hero", "Hero banner", {"image": f"{F}/products/hero.png", "alt": "Perfect curtains complete your home's aesthetic", "title": "", "subtitle": ""}),
        (
            "intro",
            "Intro",
            {
                "title": "Our Products",
                "text": (
                    "From windows to walls and ceilings, our curated collection of curtains, blinds, wallpapers and "
                    "stretch ceilings brings together design, comfort and function for beautifully finished spaces."
                ),
            },
        ),
    ],
    "about": [
        (
            "intro",
            "Intro",
            {
                "title": "About Us",
                "subtitle": (
                    "Interior solutions for windows, walls and ceilings — designed for homes, hospitality and "
                    "commercial projects."
                ),
                "heading": "Creating Better Spaces Through Design & Material",
                "text": (
                    "We provide thoughtfully selected interior solutions for residential, hospitality, commercial and "
                    "architectural projects — combining design, material quality and dependable execution."
                ),
                "image": f"{F}/about/better-spaces.jpg",
                "cta_label": "Explore Our Solutions",
                "cta_href": "/products",
            },
        ),
        (
            "design_led",
            "Design-led solutions",
            {
                "eyebrow": "Who We Are",
                "heading": "Design-Led Solutions for Every Surface",
                "paragraphs": [
                    "We bring together window treatments, curtains, blinds, wallpapers, ceiling systems, fabrics and "
                    "architectural solutions under one vision.",
                    "Our approach focuses on understanding each project's requirements and providing solutions that "
                    "balance aesthetics, functionality and performance. From individual spaces to large-scale projects, "
                    "we work closely with architects, interior designers, contractors, developers and businesses to "
                    "deliver solutions tailored to the space.",
                ],
                "image": f"{F}/about/wide.jpg",
            },
        ),
        (
            "solutions",
            "Solutions grid",
            {
                "eyebrow": "What We Do",
                "heading": "Solutions Designed Around Your Project",
                "items": [
                    {"title": "Curtains & Blinds", "text": "Custom window solutions for privacy, light control and interior aesthetics.", "href": "/products/curtains"},
                    {"title": "Wallpapers & Wallcoverings", "text": "Textures, patterns and finishes designed to enhance interior surfaces.", "href": "/products/wallpapers"},
                    {"title": "Stretch Ceilings", "text": "Contemporary ceiling systems for distinctive architectural spaces.", "href": "/products/stretch-ceilings"},
                    {"title": "Fabrics & Materials", "text": "Curated materials selected to complement different design requirements.", "href": "/products"},
                    {"title": "Architectural Solutions", "text": "Specialised products and systems for commercial and interior projects.", "href": "/products/architectural-solutions"},
                ],
                "cta_card": {
                    "title": "Have a Project in Mind?",
                    "text": "Let's discuss the materials, products and solutions your project requires.",
                    "label": "Request a Quote",
                    "href": "/contact",
                },
            },
        ),
    ],
    "contact": [
        (
            "hero",
            "Hero",
            {
                "image": f"{F}/contact/hero.png",
                "alt": "Living room with green curtains",
                "eyebrow": "Let's Connect",
                "title": "We're Here to Help",
                "text": "Whether you're planning a single room or a complete project, our team is ready to help.",
            },
        ),
        (
            "intro",
            "Intro",
            {
                "title": "Let's Talk About Your Project",
                "text": (
                    "Whether you're specifying materials for a new development or looking for the right interior "
                    "solution, our team is ready to help."
                ),
                "image": f"{F}/contact/side.jpg",
            },
        ),
        ("form", "Enquiry form", {"eyebrow": "Contact Form", "title": "Tell us about your project.", "submit_label": "Send Message"}),
        ("map", "Map", {"image": f"{F}/contact/map.png", "embed_url": ""}),
    ],
}

# Alt text for the media library entries
MEDIA_ALT = {
    "brand/logo.png": "Fortune Decor logo",
    "brand/logo-badge.png": "Fortune Decor logo badge",
    "brand/logo-original.png": "Fortune Decor logo (original artwork)",
    "home/hero.jpg": "Living room with floor-to-ceiling windows and blinds",
    "home/process.jpg": "Long window wall with blinds under a wooden ceiling",
    "home/about.jpg": "Container port at sunset with a world map overlay",
    "categories/curtains.jpg": "Living room with sheer and dark curtains",
    "categories/blinds.jpg": "Brick-walled room with bamboo blinds",
    "categories/wallpapers.jpg": "Dark room opening onto a garden",
    "categories/stretch-ceilings.jpg": "Double-height living room",
    "curtains/sheer.jpg": "White sheer curtains with brown drapes",
    "curtains/dimout.jpg": "Grey dimout curtains in a dark living room",
    "curtains/blackout.jpg": "Heavy brown blackout curtains",
    "curtains/garden.jpg": "Translucent shades facing a garden",
    "about/better-spaces.jpg": "Living room with zebra blinds",
    "about/wide.jpg": "Bright living room with roller blinds",
    "products/hero.png": "Perfect curtains complete your home's aesthetic",
    "contact/hero.png": "We're here to help banner with green curtains",
    "contact/side.jpg": "Dark sheer curtains in a lounge",
    "contact/map.png": "Office location map",
}
