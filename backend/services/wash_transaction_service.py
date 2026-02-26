from models import (
    WashTransaction,
    WashTransactionService,
    WashTransactionEmployee,
    WashTransactionAdjustment,
    Vehicle,
    Service,
    ServicePricing,
    ClientPlanVehicle,
    ClientPlan,
    User
)
from database import db
from decimal import Decimal


class WashTransactionServiceLayer:
    """
    Handles full transaction creation logic.

    Responsibilities:
    - Normalize and validate vehicle
    - Detect active membership plans
    - Calculate service pricing
    - Apply discounts/fees
    - Attach employees
    - Maintain pricing snapshots
    - Commit atomic transaction
    """

    @staticmethod
    def create_transaction(
        plate,
        payment_method,
        service_ids,
        employee_ids,
        discount=None,
        discount_reason=None,
        fee=None,
        fee_reason=None,
        created_by_user_id=None
    ):
        
        # FIX: Force casting to prevent "string vs int" database errors
        service_ids = [int(sid) for sid in service_ids]
        employee_ids = [int(eid) for eid in employee_ids]
        
        # -----------------------------
        # 1. Normalize License Plate & Fetch Vehicle
        # -----------------------------
        normalized_plate = plate.replace(" ", "").replace("-", "").upper()
        vehicle = Vehicle.query.filter_by(license_plate=normalized_plate).first()

        if not vehicle:
            raise Exception("Vehicle not found.")

        # -----------------------------
        # 2. Validation Section
        # -----------------------------
        if not service_ids:
            raise Exception("At least one service must be selected.")
        if not employee_ids:
            raise Exception("At least one employee must be assigned.")
        if payment_method not in ["cash", "card", "plan"]:
            raise Exception("Invalid payment method.")

        # -----------------------------
        # 3. Plan Detection (Record Keeping Only)
        # -----------------------------
        # We detect the plan to ensure the transaction is linked to the membership,
        client_plan_id = None
        plan_link = ClientPlanVehicle.query.filter_by(
            vehicle_id=vehicle.vehicle_id,
            removed_at=None
        ).first()

        if plan_link:
            plan = ClientPlan.query.get(plan_link.client_plan_id)
            if plan and plan.is_active:
                payment_method = "plan"
                client_plan_id = plan.client_plan_id

        # -----------------------------
        # 4. Create Base Transaction Record
        # -----------------------------
        total = Decimal("0.00")
        transaction = WashTransaction(
            vehicle_id=vehicle.vehicle_id,
            payment_method=payment_method,
            client_plan_id=client_plan_id,
            total_price=Decimal("0.00"), # Will be updated after calculation
            created_by_user_id=created_by_user_id
        )

        db.session.add(transaction)
        db.session.flush() # Get transaction ID

        # -----------------------------
        # 5. Attach Services & Calculate Full Price
        # -----------------------------
        for service_id in service_ids:
            service = Service.query.get(service_id)
            pricing = ServicePricing.query.filter_by(
                service_id=service_id,
                vehicle_category_id=vehicle.vehicle_category_id
            ).first()

            price = pricing.base_price if pricing else Decimal("0.00")
            
            # Add the price to the total
            total += price

            db.session.add(WashTransactionService(
                wash_transaction_id=transaction.wash_transaction_id,
                service_id=service.service_id,
                service_name_snapshot=service.service_name,
                service_price_snapshot=price
            ))

        # -----------------------------
        # 6. Apply Adjustments (Discounts/Fees)
        # -----------------------------
        if discount:
            discount_amount = Decimal(str(discount))
            total -= discount_amount
            db.session.add(WashTransactionAdjustment(
                wash_transaction_id=transaction.wash_transaction_id,
                adjustment_type="discount",
                adjustment_amount=discount_amount,
                adjustment_reason=discount_reason
            ))

        if fee:
            fee_amount = Decimal(str(fee))
            total += fee_amount
            db.session.add(WashTransactionAdjustment(
                wash_transaction_id=transaction.wash_transaction_id,
                adjustment_type="fee",
                adjustment_amount=fee_amount,
                adjustment_reason=fee_reason
            ))

        # -----------------------------
        # 7. Finalize & Attach Employees
        # -----------------------------
        for emp_id in employee_ids:
            db.session.add(WashTransactionEmployee(
                wash_transaction_id=transaction.wash_transaction_id,
                user_id=emp_id
            ))

        # Ensure total never goes below zero
        transaction.total_price = max(total, Decimal("0.00"))

        try:
            db.session.commit()
            return transaction
        except Exception as e:
            db.session.rollback()
            raise e


    @staticmethod
    def preview_transaction(plate, service_ids, discount=0, fee=0):
        """
        Calculates the real-time price preview.
            - Normalizes the plate and fetches the vehicle
            - Detects active membership plans (for UI hints)
            - Calculates base prices for selected services
            - Applies discounts and fees to the preview total
            - Returns structured data for frontend display
        """
        normalized_plate = plate.replace(" ", "").replace("-", "").upper()
        vehicle = Vehicle.query.filter_by(license_plate=normalized_plate).first()

        if not vehicle:
            return {"error": "Vehicle not found."}

        # 1. Plan detection (For UI to set payment_method to 'plan')
        plan_active = False
        client_plan_id = None
        plan_link = ClientPlanVehicle.query.filter_by(
            vehicle_id=vehicle.vehicle_id,
            removed_at=None
        ).first()

        if plan_link:
            plan = ClientPlan.query.get(plan_link.client_plan_id)
            if plan and plan.is_active:
                plan_active = True
                client_plan_id = plan.client_plan_id

        # 2. Calculate Base Prices for Services
        total = Decimal("0.00")
        services_preview = []
        for service_id in service_ids:
            service = Service.query.get(service_id)
            if not service: continue

            pricing = ServicePricing.query.filter_by(
                service_id=service_id,
                vehicle_category_id=vehicle.vehicle_category_id
            ).first()

            price = pricing.base_price if pricing else Decimal("0.00")
            
            # ALWAYS add price to the total preview
            total += price

            services_preview.append({
                "service_id": service.service_id,
                "service_name": service.service_name,
                "price": float(price)
            })

        # 3. Add Adjustments to Preview
        if discount:
            total -= Decimal(str(discount))
        if fee:
            total += Decimal(str(fee))

        return {
            "vehicle_category_id": vehicle.vehicle_category_id,
            "plan_active": plan_active,
            "client_plan_id": client_plan_id,
            "services": services_preview,
            "total": float(max(total, Decimal("0.00")))
        }