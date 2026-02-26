from models import Service, VehicleCategory, ServicePricing
from database import db

class ServiceService:
    @staticmethod
    def list_services():
        return Service.query.all()

    @staticmethod
    def list_active_services():
        return Service.query.filter_by(is_active=True).all()

    @staticmethod
    def get_service(service_id):
        return Service.query.get(service_id)

    @staticmethod
    def get_pricing_for_category(service_id, category_id):
        return ServicePricing.query.filter_by(
            service_id=service_id,
            vehicle_category_id=category_id
        ).first()