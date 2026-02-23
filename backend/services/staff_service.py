from models import User
from database import db

class StaffService:
    """Handles all Staff CRUD operations"""
    
    @staticmethod
    def list_staff():
        return User.query.all()

    @staticmethod
    def toggle_status(user_id):
        user = User.query.get(user_id)
        if user:
            user.is_active = not user.is_active
            db.session.commit()
            return user
        return None

    @staticmethod
    def create_staff(first_name, last_name, role, password):
        username = User.generate_username(first_name, last_name)
        full_name = f"{first_name} {last_name}"
        new_user = User(full_name=full_name, username=username, user_role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return new_user