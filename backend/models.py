from database import db
import bcrypt

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