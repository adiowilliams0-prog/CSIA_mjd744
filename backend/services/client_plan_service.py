from models import ClientPlan, ClientPlanVehicle, Vehicle, VehicleCategory
from database import db
from datetime import datetime

class ClientPlanService:
    """Handles CRUD operations for Client Plans"""

    @staticmethod
    def list_plans():
        return ClientPlan.query.all()

    @staticmethod
    def get_plan(plan_id):
        return ClientPlan.query.get(plan_id)

    @staticmethod
    def create_plan(client_name, billing_cycle, email, phone, signature_bytes):
        plan = ClientPlan(
            client_name=client_name,
            billing_cycle_type=billing_cycle,
            contact_email=email,
            contact_phone=phone,
            client_signature=signature_bytes,
            is_active=True
        )
        db.session.add(plan)
        db.session.commit()
        return plan

    @staticmethod
    def update_plan(plan_id, client_name=None, billing_cycle=None, email=None, phone=None, signature_bytes=None, is_active=None):
        plan = ClientPlan.query.get(plan_id)
        if not plan:
            return None
        if client_name is not None:
            plan.client_name = client_name
        if billing_cycle is not None:
            plan.billing_cycle_type = billing_cycle
        if email is not None:
            plan.contact_email = email
        if phone is not None:
            plan.contact_phone = phone
        if signature_bytes is not None:
            plan.client_signature = signature_bytes
        if is_active is not None:
            plan.is_active = is_active
        db.session.commit()
        return plan

    @staticmethod
    def toggle_status(plan_id):
        plan = ClientPlan.query.get(plan_id)
        if plan:
            plan.is_active = not plan.is_active
            db.session.commit()
            return plan
        return None

class ClientPlanVehicleService:
    """Handles vehicles associated with client plans"""

    @staticmethod
    def normalize_plate(plate: str) -> str:
        # Remove spaces/dashes and uppercase
        return plate.replace(" ", "").replace("-", "").upper()

    @staticmethod
    def add_vehicle(plan_id, plate, category_id, make_model=None):
        normalized = ClientPlanVehicleService.normalize_plate(plate)
        # Check if vehicle already exists
        vehicle = Vehicle.query.filter_by(license_plate=normalized).first()
        if not vehicle:
            vehicle = Vehicle(
                license_plate=normalized,
                vehicle_category_id=category_id,
                make_model=make_model
            )
            db.session.add(vehicle)
            db.session.commit()
        # Link to client plan
        link = ClientPlanVehicle(client_plan_id=plan_id, vehicle_id=vehicle.vehicle_id)
        db.session.add(link)
        db.session.commit()
        return link

    @staticmethod
    def list_vehicles(plan_id):
        return ClientPlanVehicle.query.filter_by(client_plan_id=plan_id, removed_at=None).all()

    @staticmethod
    def deactivate_vehicle(plan_id, vehicle_id):
        link = ClientPlanVehicle.query.get((plan_id, vehicle_id))
        if link and not link.removed_at:
            link.removed_at = datetime.utcnow()
            db.session.commit()
        return link
    
class VehicleCategoryService:

    @staticmethod
    def list_categories():
        return VehicleCategory.query.order_by(VehicleCategory.category_name).all()