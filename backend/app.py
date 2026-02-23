from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from database import db, init_db
from models import User
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key' # Change this in production
jwt = JWTManager(app)
init_db(app)

# Custom decorator to check for Manager role
def manager_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity.get('role') != 'Manager':
            return jsonify({"msg": "Managers only!"}), 403
        return fn(*args, **kwargs)
    return wrapper

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # Query using the 'username' field defined in your schema
    user = User.query.filter_by(username=data.get('username')).first()

    # Validate credentials using the check_password method which references password_hash
    if user and user.check_password(data.get('password')):
        # UPDATED: 'role' changed to 'user_role' to match your Class and SQL Dump
        access_token = create_access_token(identity={
            'id': user.user_id, 
            'role': user.user_role 
        })
        return jsonify(access_token=access_token), 200
    
    return jsonify({"msg": "Invalid credentials"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)