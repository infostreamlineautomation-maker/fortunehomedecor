# Import every model here so Alembic autogenerate can see it.
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditLog
from app.models.base import Base
from app.models.category import Category
from app.models.enquiry import ENQUIRY_STATUSES, ENQUIRY_TYPES, Enquiry
from app.models.faq import Faq
from app.models.media import Media
from app.models.page_section import PageSection
from app.models.product import Product
from app.models.site_setting import SiteSetting

__all__ = [
    "Base",
    "AdminUser",
    "AuditLog",
    "Category",
    "ENQUIRY_STATUSES",
    "ENQUIRY_TYPES",
    "Enquiry",
    "Faq",
    "Media",
    "PageSection",
    "Product",
    "SiteSetting",
]
