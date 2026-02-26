from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, get_jwt
from database import db, init_db
from models import User
from functools import wraps
from services.staff_service import StaffService
from services.client_plan_service import ClientPlanService, ClientPlanVehicleService, VehicleCategoryService
import base64
from services.wash_transaction_service import WashTransactionServiceLayer
from services.vehicle_service import VehicleService

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = '8ef9d9d14ddc9aa5d7f24b949a451d33034dea40f5d8a7a1eeca782f24aef6fd'  # Change in production
jwt = JWTManager(app)
init_db(app)


# -------------------------------
# Robust Manager-Only Decorator
# -------------------------------
def manager_required(fn):
    """
    Enforces Manager-only access.

    Behavior:
    - Requires a valid JWT (handled by @jwt_required)
    - Reads role from top-level JWT claim
    - Returns 403 if user is not a Manager
    - Role comparison is case-insensitive
    """

    @wraps(fn)
    @jwt_required()  # Ensures token exists, is valid, and not expired
    def wrapper(*args, **kwargs):

        # get_jwt() returns the FULL decoded JWT payload
        # Example:
        # {
        #   "sub": "1",
        #   "role": "Manager",
        #   "exp": 1234567890,
        #   ...
        # }
        claims = get_jwt()

        # Role is now stored at top-level
        role = claims.get("role")

        # Check role safely and case-insensitively
        if not role or role.lower() != "manager":
            return jsonify({"msg": "Managers only!"}), 403

        # If role is valid → proceed to route
        return fn(*args, **kwargs)

    return wrapper


# -------------------------------
# Auth Routes
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    """
    Authenticates user and returns JWT token.

    JWT Structure:
    {
        "sub": "1",           # user_id (string)
        "role": "Manager",    # stored in additional_claims
        "exp": ...
    }
    """

    data = request.get_json()

    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    # Find user by username
    user = User.query.filter_by(username=data.get('username')).first()

    # Validate credentials
    if user and user.check_password(data.get('password')):

        # Create token:
        # - identity MUST be string (recommended)
        # - role stored separately in additional_claims
        access_token = create_access_token(
            identity=str(user.user_id),  # becomes "sub"
            additional_claims={
                "role": user.user_role
            }
        )

        return jsonify(access_token=access_token), 200

    # Invalid login
    return jsonify({"msg": "Invalid credentials"}), 401


# -------------------------------
# Staff Management Routes (Manager Only)
# -------------------------------
@jwt_required()
@manager_required
@app.route('/api/staff', methods=['GET'])
def get_staff():
    """List all staff"""
    staff = StaffService.list_staff()
    return jsonify([{
        "user_id": s.user_id,
        "full_name": s.full_name,
        "username": s.username,
        "user_role": s.user_role,
        "is_active": s.is_active
    } for s in staff])

@jwt_required()
@manager_required
@app.route('/api/staff/<int:user_id>/toggle', methods=['PATCH'])
def toggle_staff_status(user_id):
    """Activate/deactivate a staff member"""
    user = StaffService.toggle_status(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({
        "user_id": user.user_id,
        "is_active": user.is_active
    })

@jwt_required()
@manager_required
@app.route('/api/staff/create', methods=['POST'])
def create_staff():
    """Create a new staff user"""
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    role = data.get("role")
    password = data.get("password")

    if not all([first_name, last_name, role, password]):
        return jsonify({"msg": "All fields required"}), 400

    new_user = StaffService.create_staff(first_name, last_name, role, password)
    return jsonify({
        "user_id": new_user.user_id,
        "full_name": new_user.full_name,
        "username": new_user.username,
        "user_role": new_user.user_role,
        "is_active": new_user.is_active
    }), 201

# -------------------------------
# Client Plans Routes (Manager Only)
# -------------------------------

@jwt_required()
@manager_required
@app.route('/api/plans', methods=['GET'])
def get_plans():
    plans = ClientPlanService.list_plans()
    return jsonify([
        {
            "client_plan_id": p.client_plan_id,
            "client_name": p.client_name,
            "billing_cycle_type": p.billing_cycle_type,
            "contact_email": p.contact_email,
            "contact_phone": p.contact_phone,
            "is_active": p.is_active,
            "vehicle_count": len(ClientPlanVehicleService.list_vehicles(p.client_plan_id))
        } for p in plans
    ])

@jwt_required()
@manager_required
@app.route('/api/plans/create', methods=['POST'])
def create_plan():
    data = request.get_json()

    signature_base64 = data.get("signature")

    if not signature_base64:
        return jsonify({"error": "Signature required"}), 400

    try:
        signature_bytes = base64.b64decode(signature_base64)
    except Exception:
        return jsonify({"error": "Invalid signature format"}), 400

    plan = ClientPlanService.create_plan(
        client_name=data.get("client_name"),
        billing_cycle=data.get("billing_cycle"),
        email=data.get("email"),
        phone=data.get("phone"),
        signature_bytes=signature_bytes
    )

    return jsonify({"client_plan_id": plan.client_plan_id}), 201

@jwt_required()
@manager_required
@app.route('/api/plans/<int:plan_id>/vehicles', methods=['POST'])
def add_vehicle_to_plan(plan_id):
    data = request.get_json()
    link = ClientPlanVehicleService.add_vehicle(
        plan_id=plan_id,
        plate=data.get("plate"),
        category_id=data.get("category_id"),
        make_model=data.get("make_model")
    )
    return jsonify({"plan_id": link.client_plan_id, "vehicle_id": link.vehicle_id}), 201

# -------------------------------
# Daily Worksheet Routes (Any Authenticated Staff)
# -------------------------------

# Used by Daily Worksheet and Client Plan Page to see vehicle categories
@jwt_required()
@app.route('/api/vehicle-categories', methods=['GET'])
def get_vehicle_categories():
    categories = VehicleCategoryService.list_categories()
    return jsonify([
        {
            "vehicle_category_id": c.vehicle_category_id,
            "category_name": c.category_name
        } for c in categories
    ])

@app.route('/api/worksheet/submit', methods=['POST'])
@jwt_required()
def submit_worksheet():

    data = request.get_json()
    user_id = int(get_jwt_identity())

    # Ensure these keys match exactly what the frontend sends above
    plate = data.get("plate")  # Must match the new frontend 'plate' key 
    service_ids = data.get("service_ids", [])
    employee_ids = data.get("employee_ids", [])

    if not plate:
        return jsonify({"msg": "Plate required"}), 422
    if not service_ids or len(service_ids) == 0:
        return jsonify({"msg": "At least one service required"}), 422
    if not employee_ids or len(employee_ids) == 0:
        return jsonify({"msg": "At least one employee required"}), 422

    try:
        transaction = WashTransactionServiceLayer.create_transaction(
            plate=data.get("plate"),
            payment_method=data.get("payment_method"),
            service_ids=data.get("service_ids", []),
            employee_ids=data.get("employee_ids", []),
            discount=data.get("discount"),
            discount_reason=data.get("discount_reason"),
            fee=data.get("fee"),
            fee_reason=data.get("fee_reason"),
            created_by_user_id=user_id
        )

        return jsonify({
            "wash_transaction_id": transaction.wash_transaction_id,
            "total_price": str(transaction.total_price)
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@jwt_required()
@app.route('/api/vehicles/create', methods=['POST'])
def create_vehicle():

    data = request.get_json()

    if not data.get("plate") or not data.get("category_id"):
        return jsonify({"error": "Plate and category required"}), 400

    vehicle = VehicleService.create_vehicle(
        plate=data.get("plate"),
        category_id=data.get("category_id"),
        make_model=data.get("make_model")
    )

    return jsonify({
        "vehicle_id": vehicle.vehicle_id,
        "license_plate": vehicle.license_plate
    }), 201

@jwt_required()
@app.route('/api/worksheet/preview', methods=['POST'])
def preview_transaction():

    data = request.get_json()

    plate = data.get("plate")
    service_ids = data.get("service_ids", [])

    from services.wash_transaction_service import WashTransactionServiceLayer

    preview_data = WashTransactionServiceLayer.preview_transaction(
        plate=plate,
        service_ids=service_ids
    )

    return jsonify(preview_data), 200

@jwt_required()
@app.route('/api/staff/active', methods=['GET'])
def get_active_staff():
    """
    Returns only active staff.
    Used by Daily Worksheet.
    """
    staff = StaffService.list_active_staff()

    return jsonify([{
        "user_id": s.user_id,
        "full_name": s.full_name,
        "username": s.username,
        "user_role": s.user_role
    } for s in staff])

@jwt_required()
@app.route('/api/services/active', methods=['GET'])
def get_active_services():
    from services.service_service import ServiceService
    from models import ServicePricing  # Ensure this is imported

    services = ServiceService.list_active_services()

    output = []
    for s in services:
        # Fetch all pricing tiers for this service
        pricing_data = ServicePricing.query.filter_by(service_id=s.service_id).all()
        
        output.append({
            "service_id": s.service_id,
            "service_name": s.service_name,
            "service_description": s.service_description,
            "pricing": [{
                "vehicle_category_id": p.vehicle_category_id,
                "base_price": str(p.base_price) # Decimal to string for JSON
            } for p in pricing_data]
        })

    return jsonify(output)

@jwt_required()
@app.route('/api/vehicles/lookup', methods=['GET'])
def lookup_vehicle():
    plate = request.args.get('plate')
    if not plate:
        return jsonify({"msg": "Plate required"}), 400
    
    # This calls the existing logic in your vehicle_service
    result = VehicleService.get_vehicle_by_plate(plate)
    
    if not result:
        return jsonify({"msg": "Vehicle not found"}), 404
        
    return jsonify(result), 200

# -------------------------------
# Run App
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)