from models import Vehicle, ClientPlan, ClientPlanVehicle, VehicleCategory
from database import db

class VehicleService:

    @staticmethod
    def normalize_plate(plate: str) -> str:
        """Standardizes plate format by removing spaces/hyphens and uppercasing."""
        return plate.replace(" ", "").replace("-", "").upper()

    @staticmethod
    def get_vehicle_by_plate(plate):
        """
        Retrieves a vehicle by its plate and checks for an active client plan.
        Used for the Daily Worksheet lookup.
        """
        # 1. Normalize the incoming plate to match database format
        normalized = VehicleService.normalize_plate(plate)

        # 2. Fetch the vehicle from the database
        vehicle = Vehicle.query.filter_by(license_plate=normalized).first()
        
        if not vehicle:
            return None

        # 3. Check if the vehicle is linked to an active Client Plan
        # We join ClientPlanVehicle with ClientPlan to verify 'is_active' status
        # This ensures we only return True if the plan itself is currently active.
        plan_active = False
        client_plan_id = None
        
        active_plan_info = db.session.query(ClientPlan).join(
            ClientPlanVehicle, 
            ClientPlan.client_plan_id == ClientPlanVehicle.client_plan_id
        ).filter(
            ClientPlanVehicle.vehicle_id == vehicle.vehicle_id,
            ClientPlan.is_active == True
        ).first()

        if active_plan_info:
            plan_active = True
            client_plan_id = active_plan_info.client_plan_id

        # 4. Return combined dictionary for the frontend
        # Returning a dictionary prevents 500 serialization errors.
        return {
            "vehicle_id": vehicle.vehicle_id,
            "plate": vehicle.license_plate,
            "make_model": vehicle.make_model,
            "vehicle_category_id": vehicle.vehicle_category_id,
            "plan_active": plan_active,
            "client_plan_id": client_plan_id
        }
    
    @staticmethod
    def create_vehicle(plate, make_model, category_id):
            """
            Creates a new vehicle record in the database.
            
            :param plate: Normalized license plate string
            :param make_model: String describing the vehicle's make and model
            :param category_id: Integer ID of the vehicle category
            :return: The newly created Vehicle object
            """
            # Create the new vehicle instance
            new_vehicle = Vehicle(
                license_plate=plate,
                make_model=make_model,
                vehicle_category_id=category_id
            )
            
            # Add to session and commit to the database
            db.session.add(new_vehicle)
            db.session.commit()
            
            return new_vehicle   