from database import db
import bcrypt

# ----------------------------------------------------------------             
# USER MANAGEMENT
# ----------------------------------------------------------------  
class User(db.Model):
    __tablename__ = 'users'
    
    # Matching SQL schema constraints exactly
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_role = db.Column(db.String(20), nullable=False) # Matches VARCHAR(20)
    is_active = db.Column(db.Boolean, default=True, nullable=False) # Matches TINYINT

    def set_password(self, password):
        """Pseudocode Implementation: 2. Password Hashing"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        """Pseudocode Implementation: 2. Password Verification"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    @staticmethod
    def generate_username(first_name, last_name):
        """
        Username format:
        first_initial + first_letter_of_last + last_letter_of_last + 3-digit number
        Example: John Doe -> jde001
        """

        # Clean and normalize input
        first_name = first_name.strip()
        last_name = last_name.strip().replace(" ", "")

        # Build base prefix
        prefix = (
            first_name[0] +
            last_name[0] +
            last_name[-1]
        ).lower()

        # Start numbering from 001
        counter = 1

        while True:
            username = f"{prefix}{counter:03d}"  # formats as 001, 002, etc.

            # Check if username already exists
            if not User.query.filter_by(username=username).first():
                return username

            counter += 1

# ----------------------------------------------------------------             
# VEHICLE CONFIGURATION
# ----------------------------------------------------------------             

class VehicleCategory(db.Model):
    __tablename__ = 'vehicle_categories'
    vehicle_category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_name = db.Column(db.String(45), unique=True, nullable=False)
    
    # Relationships
    vehicles = db.relationship('Vehicle', backref='category', lazy=True)
    pricing = db.relationship('ServicePricing', backref='category', lazy=True)

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    vehicle_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    license_plate = db.Column(db.String(20), unique=True, nullable=False)
    vehicle_category_id = db.Column(db.Integer, db.ForeignKey('vehicle_categories.vehicle_category_id'), nullable=False)
    make_model = db.Column(db.String(100), nullable=True)

# ----------------------------------------------------------------             
# SERVICES & PRICING
# ----------------------------------------------------------------             

class Service(db.Model):
    __tablename__ = 'services'
    service_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    service_name = db.Column(db.String(50), unique=True, nullable=False)
    service_description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

class ServicePricing(db.Model):
    __tablename__ = 'service_pricing'
    service_pricing_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.service_id'), nullable=False)
    vehicle_category_id = db.Column(db.Integer, db.ForeignKey('vehicle_categories.vehicle_category_id'), nullable=False)
    base_price = db.Column(db.Numeric(10, 2), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('service_id', 'vehicle_category_id', name='_service_category_uc'),)

# ----------------------------------------------------------------             
# CLIENT PLANS & ASSOCIATION
# ----------------------------------------------------------------             

class ClientPlan(db.Model):
    __tablename__ = 'client_plans'
    client_plan_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    client_name = db.Column(db.String(100), nullable=False)
    billing_cycle_type = db.Column(db.Enum('weekly', 'monthly'), nullable=False)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    client_signature = db.Column(db.LargeBinary, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class ClientPlanVehicle(db.Model):
    __tablename__ = 'client_plan_vehicles'
    client_plan_id = db.Column(db.Integer, db.ForeignKey('client_plans.client_plan_id'), primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.vehicle_id'), primary_key=True)
    assigned_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    removed_at = db.Column(db.DateTime, nullable=True)

# ----------------------------------------------------------------             
# TRANSACTIONS
# ----------------------------------------------------------------             

class WashTransaction(db.Model):
    __tablename__ = 'wash_transactions'
    wash_transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.vehicle_id'), nullable=False)
    client_plan_id = db.Column(db.Integer, db.ForeignKey('client_plans.client_plan_id'), nullable=True)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.Enum('cash', 'card', 'plan'), nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    logged_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    notes = db.Column(db.Text, nullable=True)

class WashTransactionService(db.Model):
    __tablename__ = 'wash_transaction_services'
    wash_transaction_id = db.Column(db.Integer, db.ForeignKey('wash_transactions.wash_transaction_id'), primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.service_id'), primary_key=True)
    service_name_snapshot = db.Column(db.String(50), nullable=False)
    service_price_snapshot = db.Column(db.Numeric(10, 2), nullable=False)

class WashTransactionEmployee(db.Model):
    __tablename__ = 'wash_transaction_employees'
    wash_transaction_id = db.Column(db.Integer, db.ForeignKey('wash_transactions.wash_transaction_id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)

class WashTransactionAdjustment(db.Model):
    __tablename__ = 'wash_transaction_adjustments'
    adjustment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    wash_transaction_id = db.Column(db.Integer, db.ForeignKey('wash_transactions.wash_transaction_id'), nullable=False)
    adjustment_type = db.Column(db.Enum('discount', 'fee'), nullable=False)
    adjustment_amount = db.Column(db.Numeric(10, 2), nullable=False)
    adjustment_reason = db.Column(db.String(100), nullable=True)