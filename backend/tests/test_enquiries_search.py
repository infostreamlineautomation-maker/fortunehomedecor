from app.models import Enquiry

VALID = {"name": "Asha Patel", "email": "asha@example.com", "phone": "+91 98765 43210", "message": "Need curtains"}


def test_submit_enquiry_links_product_and_category(seeded, public_client, admin_client, db):
    res = public_client.post("/enquiries", json={**VALID, "type": "sample", "product_slug": "sheer-curtains"})
    assert res.status_code == 201

    items = admin_client.get("/enquiries").json()["items"]
    assert len(items) == 1
    e = items[0]
    assert (e["type"], e["status"], e["product_name"], e["category_name"]) == ("sample", "new", "Sheer Curtains", "Curtains")

    res = admin_client.patch(f"/enquiries/{e['id']}", json={"status": "in_progress", "notes": "Called back"})
    assert res.json()["status"] == "in_progress"
    assert admin_client.get("/enquiries?status=new").json()["total"] == 0
    assert admin_client.get("/dashboard").json()["enquiries_by_type"]["sample"] == 1


def test_honeypot_and_validation(public_client, db):
    assert public_client.post("/enquiries", json={**VALID, "website": "http://spam.example"}).status_code == 201
    assert db.query(Enquiry).count() == 0  # silently dropped

    assert public_client.post("/enquiries", json={**VALID, "email": "not-an-email"}).status_code == 422
    assert public_client.post("/enquiries", json={**VALID, "type": "hack"}).status_code == 422
    assert public_client.post("/enquiries", json={**VALID, "phone": "<script>"}).status_code == 422


def test_enquiries_are_rate_limited(public_client):
    from app.core.limiter import limiter

    limiter.enabled = True
    codes = [public_client.post("/enquiries", json=VALID).status_code for _ in range(6)]
    assert codes == [201] * 5 + [429]


def test_csv_export_escapes_formulas(public_client, admin_client):
    public_client.post("/enquiries", json={**VALID, "name": "=HYPERLINK(\"http://x\")", "company": "+Corp"})
    res = admin_client.get("/enquiries/export.csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    body = res.text
    assert "'=HYPERLINK" in body and "'+Corp" in body


def test_search_finds_categories_products_faqs_and_pages(seeded, public_client):
    def kinds_titles(q):
        return [(r["kind"], r["title"]) for r in public_client.get("/search", params={"q": q}).json()]

    results = kinds_titles("curtain")
    assert ("category", "Curtains") in results
    assert ("product", "Sheer Curtains") in results

    assert ("category", "Blinds") in kinds_titles("blnds")  # typo-tolerant
    assert any(kind == "faq" for kind, _ in kinds_titles("samples"))
    assert any(kind == "page" for kind, _ in kinds_titles("purpose"))  # "Creating Interiors With Purpose"

    res = public_client.get("/search", params={"q": "sheer"}).json()[0]
    assert res["url"] == "/products/curtains/sheer-curtains"
    assert "/uploads/" not in " ".join(r["snippet"] for r in public_client.get("/search", params={"q": "hero"}).json())


def test_search_handles_hostile_input(seeded, public_client):
    for q in ("' OR 1=1 --", "a & | ! (", "%_%", "x" * 100):
        assert public_client.get("/search", params={"q": q}).status_code == 200
    assert public_client.get("/search", params={"q": "x" * 101}).status_code == 422
    assert public_client.get("/search", params={"q": "a"}).json() == []
    assert public_client.get("/search", params={"q": "%%"}).json() == []  # LIKE wildcards are literal
