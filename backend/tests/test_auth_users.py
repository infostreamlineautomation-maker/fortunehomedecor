from fastapi.testclient import TestClient

from app.admin_main import app as admin_app


def test_login_rejects_bad_password_and_unknown_email(make_admin):
    make_admin("a@example.com", "right-password")
    with TestClient(admin_app) as c:
        assert c.post("/auth/login", json={"email": "a@example.com", "password": "wrong"}).status_code == 401
        assert c.post("/auth/login", json={"email": "nobody@example.com", "password": "x"}).status_code == 401
        # .test / .local domains must be accepted by the login form (regression)
        assert c.post("/auth/login", json={"email": "admin@site.test", "password": "x"}).status_code == 401


def test_login_sets_httponly_cookie_and_me_works(make_admin):
    make_admin("A@Example.com".lower(), "right-password")
    with TestClient(admin_app) as c:
        res = c.post("/auth/login", json={"email": "  A@EXAMPLE.com ", "password": "right-password"})
        assert res.status_code == 200
        assert "httponly" in res.headers["set-cookie"].lower()
        assert c.get("/auth/me").json()["email"] == "a@example.com"
        c.post("/auth/logout")
        c.cookies.clear()
        assert c.get("/auth/me").status_code == 401


def test_protected_routes_require_login():
    with TestClient(admin_app) as c:
        for path in ("/dashboard", "/categories", "/products", "/media", "/enquiries", "/settings", "/users"):
            assert c.get(path).status_code == 401, path


def test_editor_cannot_manage_users_or_read_audit_log(make_admin):
    make_admin("ed@example.com", "editor-pass-1", role="editor")
    with TestClient(admin_app) as c:
        c.post("/auth/login", json={"email": "ed@example.com", "password": "editor-pass-1"})
        assert c.get("/categories").status_code == 200
        assert c.get("/users").status_code == 403
        assert c.get("/audit-logs").status_code == 403


def test_cannot_remove_last_superadmin(admin_client):
    me = admin_client.get("/auth/me").json()
    res = admin_client.patch(f"/users/{me['id']}", json={"role": "editor"})
    assert res.status_code == 400
    assert admin_client.delete(f"/users/{me['id']}").status_code == 400


def test_user_crud_and_password_change(admin_client):
    res = admin_client.post("/users", json={"email": "new@example.com", "password": "new-user-pass", "role": "editor"})
    assert res.status_code == 201
    uid = res.json()["id"]
    assert admin_client.post("/users", json={"email": "NEW@example.com", "password": "another-pass"}).status_code == 409
    assert admin_client.patch(f"/users/{uid}", json={"is_active": False}).json()["is_active"] is False

    assert admin_client.post("/auth/password", json={"current_password": "nope", "new_password": "brand-new-pass"}).status_code == 400
    assert admin_client.post("/auth/password", json={"current_password": "super-secret-1", "new_password": "brand-new-pass"}).status_code == 204


def test_login_is_rate_limited(make_admin):
    from app.core.limiter import limiter

    make_admin("rl@example.com", "right-password")
    limiter.enabled = True
    with TestClient(admin_app) as c:
        codes = [c.post("/auth/login", json={"email": "rl@example.com", "password": "bad"}).status_code for _ in range(11)]
    assert codes[:10] == [401] * 10
    assert codes[10] == 429
