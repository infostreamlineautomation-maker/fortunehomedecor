import io

from PIL import Image

from tests.conftest import UPLOAD_DIR, png_bytes


def _upload(client, data: bytes, name="photo.png", mime="image/png"):
    return client.post("/media", files={"file": (name, data, mime)}, data={"alt_text": "Red swatch"})


def test_upload_valid_image_stores_file_and_metadata(admin_client):
    res = _upload(admin_client, png_bytes((40, 30)))
    assert res.status_code == 201, res.text
    media = res.json()
    assert media["url"].startswith("/uploads/library/") and media["url"].endswith(".png")
    assert (media["width"], media["height"]) == (40, 30)
    assert (UPLOAD_DIR / media["url"].removeprefix("/uploads/")).is_file()


def test_upload_rejects_non_images_by_content(admin_client):
    assert _upload(admin_client, b"<?php echo 'hi'; ?>", name="shell.png").status_code == 400
    assert _upload(admin_client, b"", name="empty.png").status_code == 400

    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, "BMP")
    assert _upload(admin_client, buf.getvalue(), name="x.bmp", mime="image/bmp").status_code == 415


def test_jpeg_exif_is_stripped(admin_client):
    img = Image.new("RGB", (20, 20), "white")
    exif = Image.Exif()
    exif[0x010F] = "SecretCameraMaker"
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    assert b"SecretCameraMaker" in buf.getvalue()

    media = _upload(admin_client, buf.getvalue(), name="cam.jpg", mime="image/jpeg").json()
    stored = (UPLOAD_DIR / media["url"].removeprefix("/uploads/")).read_bytes()
    assert b"SecretCameraMaker" not in stored


def test_media_in_use_cannot_be_deleted(admin_client):
    media = _upload(admin_client, png_bytes()).json()
    cat = admin_client.post("/categories", json={"name": "Wallpapers", "gallery": [media["url"]]}).json()

    assert admin_client.get(f"/media/{media['id']}/usage").json() == ["Category: Wallpapers"]
    res = admin_client.delete(f"/media/{media['id']}")
    assert res.status_code == 409 and "Wallpapers" in res.json()["detail"]

    admin_client.patch(f"/categories/{cat['id']}", json={"gallery": []})
    assert admin_client.delete(f"/media/{media['id']}").status_code == 204
    assert not (UPLOAD_DIR / media["url"].removeprefix("/uploads/")).exists()


def test_media_list_search_and_alt_text(admin_client):
    _upload(admin_client, png_bytes(), name="curtain-swatch.png")
    _upload(admin_client, png_bytes(), name="ceiling.png")
    items = admin_client.get("/media?q=curtain").json()["items"]
    assert [m["filename"] for m in items] == ["curtain-swatch.png"]
    res = admin_client.patch(f"/media/{items[0]['id']}", json={"alt_text": "Linen swatch"})
    assert res.json()["alt_text"] == "Linen swatch"
