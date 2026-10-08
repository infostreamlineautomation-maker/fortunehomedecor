def test_category_crud_slug_and_audit(admin_client, public_client):
    res = admin_client.post("/categories", json={"name": "Roman Blinds"})
    assert res.status_code == 201
    cat = res.json()
    assert cat["slug"] == "roman-blinds"
    assert cat["sequence"] == 0

    # Same name gets a unique slug; an explicit duplicate slug is rejected
    assert admin_client.post("/categories", json={"name": "Roman Blinds"}).json()["slug"] == "roman-blinds-2"
    assert admin_client.post("/categories", json={"name": "X", "slug": "roman-blinds"}).status_code == 409
    assert admin_client.post("/categories", json={"name": "X", "slug": "Bad Slug!"}).status_code == 422

    res = admin_client.patch(f"/categories/{cat['id']}", json={"tagline": "Soft folds", "is_active": False})
    assert res.json()["tagline"] == "Soft folds"
    # Inactive categories disappear from the public API
    assert public_client.get("/categories/roman-blinds").status_code == 404

    logs = admin_client.get("/audit-logs").json()["items"]
    assert any(
        log["entity"] == "category" and log["action"] == "update" and "tagline" in log["changes"] for log in logs
    )


def test_media_paths_are_validated(admin_client):
    for bad in ("javascript:alert(1)", "https://evil.example/x.png", "/uploads/../.env", "/etc/passwd"):
        res = admin_client.post("/categories", json={"name": "Bad", "card_image": bad})
        assert res.status_code == 422, bad
    ok = admin_client.post("/categories", json={"name": "Good", "card_image": "/uploads/figma/home/hero.jpg"})
    assert ok.status_code == 201


def test_products_order_visibility_and_category_detail(admin_client, public_client):
    cat = admin_client.post("/categories", json={"name": "Curtains"}).json()
    ids = []
    for name in ("Sheer", "Dimout", "Blackout"):
        res = admin_client.post("/products", json={"category_id": cat["id"], "name": name, "suitable_for": [" Hotels ", ""]})
        assert res.status_code == 201
        assert res.json()["suitable_for"] == ["Hotels"]
        ids.append(res.json()["id"])

    assert admin_client.put(f"/products/reorder?category_id={cat['id']}", json={"ids": ids[::-1]}).status_code == 204
    admin_client.patch(f"/products/{ids[1]}", json={"is_active": False})  # hide Dimout

    detail = public_client.get("/categories/curtains").json()
    assert [p["name"] for p in detail["products"]] == ["Blackout", "Sheer"]
    assert public_client.get("/products/dimout").status_code == 404
    assert public_client.get("/products/sheer").json()["category"]["slug"] == "curtains"

    # A category with products can't be deleted
    assert admin_client.delete(f"/categories/{cat['id']}").status_code == 409


def test_reserved_product_slug(admin_client):
    cat = admin_client.post("/categories", json={"name": "Curtains"}).json()
    assert admin_client.post("/products", json={"category_id": cat["id"], "name": "X", "slug": "types"}).status_code == 409
    auto = admin_client.post("/products", json={"category_id": cat["id"], "name": "Types"}).json()
    assert auto["slug"] == "types-2"


def test_reorder_rejects_ids_from_another_category(admin_client):
    a = admin_client.post("/categories", json={"name": "A"}).json()
    b = admin_client.post("/categories", json={"name": "B"}).json()
    pa = admin_client.post("/products", json={"category_id": a["id"], "name": "PA"}).json()
    pb = admin_client.post("/products", json={"category_id": b["id"], "name": "PB"}).json()
    res = admin_client.put(f"/products/reorder?category_id={a['id']}", json={"ids": [pa["id"], pb["id"]]})
    assert res.status_code == 400


def test_faqs_global_and_per_category(admin_client, public_client):
    cat = admin_client.post("/categories", json={"name": "Blinds"}).json()
    admin_client.post("/faqs", json={"question": "Global question?", "answer": "Yes"})
    admin_client.post("/faqs", json={"question": "Blind question?", "answer": "Yes", "category_id": cat["id"]})
    assert [f["question"] for f in public_client.get("/faqs").json()] == ["Global question?"]
    assert [f["question"] for f in public_client.get("/faqs?category=blinds").json()] == ["Blind question?"]
    assert [f["question"] for f in public_client.get("/categories/blinds").json()["faqs"]] == ["Blind question?"]


def test_seed_is_idempotent_and_public_content(seeded, public_client):
    from app.seed import run

    assert seeded["catalogue"] == 10
    assert all(v == 0 for v in run().values())

    cats = public_client.get("/categories").json()
    assert [c["slug"] for c in cats][:2] == ["curtains", "blinds"]
    home = public_client.get("/pages/home").json()["sections"]
    assert home["why_choose_us"]["title"] == "Why Choose Us"
    assert len(home["process"]["steps"]) == 5
    assert public_client.get("/pages/nope").status_code == 404
    assert public_client.get("/settings").json()["brand"]["name"] == "Fortune Decor"


def test_page_section_and_settings_editing(seeded, admin_client, public_client):
    sections = admin_client.get("/pages/home").json()
    hero = next(s for s in sections if s["key"] == "hero")
    res = admin_client.patch(f"/pages/sections/{hero['id']}", json={"content": {**hero["content"], "title": "New title"}})
    assert res.status_code == 200
    assert public_client.get("/pages/home").json()["sections"]["hero"]["title"] == "New title"

    assert admin_client.put("/settings/contact", json={"value": {"email": "info@fortune.example"}}).status_code == 200
    assert public_client.get("/settings").json()["contact"]["email"] == "info@fortune.example"
    assert admin_client.put("/settings/secret_key", json={"value": {}}).status_code == 404
