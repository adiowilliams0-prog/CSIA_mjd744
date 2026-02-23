from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from database import db, init_db
from models import User
from functools import wraps
from services.staff_service import StaffService
from services.client_plan_service import ClientPlanService, ClientPlanVehicleService, VehicleCategoryService
import base64

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change in production
jwt = JWTManager(app)
init_db(app)


# -------------------------------
# Robust Manager-Only Decorator
# -------------------------------
def manager_required(fn):
    """
    Decorator to enforce Manager-only access.
    - Automatically requires JWT
    - Gracefully handles invalid/missing tokens
    - Returns 403 if user is not Manager
    """
    @wraps(fn)
    @jwt_required()  # Ensure JWT is verified first
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity() or {}

        # Handle nested "sub" or string sub if you ever store like that
        if 'sub' in identity and isinstance(identity['sub'], dict):
            role = identity['sub'].get('role')
        else:
            role = identity.get('role')

        # Compare role case-insensitively
        if not role or role.lower() != 'manager':
            return jsonify({"msg": "Managers only!"}), 403

        return fn(*args, **kwargs)

    return wrapper


# -------------------------------
# Auth Routes
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if user and user.check_password(data.get('password')):
        access_token = create_access_token(identity={
            'id': user.user_id,
            'role': user.user_role
        })
        return jsonify(access_token=access_token), 200

    return jsonify({"msg": "Invalid credentials"}), 401


# -------------------------------
# Staff Management Routes (Manager Only)
# -------------------------------
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
# Client Plans Routes
# -------------------------------

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

@app.route('/api/vehicle-categories', methods=['GET'])
def get_vehicle_categories():
    categories = VehicleCategoryService.list_categories()
    return jsonify([
        {
            "vehicle_category_id": c.vehicle_category_id,
            "category_name": c.category_name
        } for c in categories
    ])

# -------------------------------
# Run App
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)