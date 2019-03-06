import stripe
import requests
import json
import psycopg2
import psycopg2.extras
from flask import Flask, render_template, request, redirect, url_for, abort
from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
from flask_login import LoginManager, current_user, \
    login_user, logout_user, login_required, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from flask_httpauth import HTTPBasicAuth


DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'

app = Flask(__name__)
db = SQLAlchemy(app)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SSL_mode = 'allow'

STORES = [
    "www.amazon.com",
    "www.walmart.com",
    "www.ebay.com"
]


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    transactions = db.Column(JSON, nullable=False)

    def __init__(self, email, password, balance=0, transactions={}):
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.id = self.__generate_id()
        self.balance = balance
        self.transactions = transactions

    @staticmethod
    def __generate_id():
        # TODO
        return 12345

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return "email: {}, balance: {}"\
            .format(self.email, self.balance)


@app.route('/register', methods=['POST'])
def register():
    email = request.form['email']
    password = request.form['password']
    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"Error": "Email already exists"}), 403
    user = User(email=email, password=password)
    db.session.add(user)
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return '', 500
    return '', 201


@app.route('/')
def index():
    return jsonify({"Message": "Welcome to the Kino Api"}), 200


@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"Error": "User does not exist"}), 403
    if not user.verify_password(password):
        return jsonify({"Error": "Incorrect Password"}), 403
    return '', 200


@app.route('/logout')
def logout():
    return


@app.route('/stores')
def stores():
    return


@app.route('/balance')
def balance():
    return


@app.route('/transactions')
def transactions():
    return


@app.route('/affiliate_link/<url>/<id>')
def affiliate_link():
    url = request.args.get('url')
    id = request.args.get('id')
    # generate the affiliate url
    return jsonify({"url": url}), 200


if __name__ == '__main__':
    app.run(debug=True)
