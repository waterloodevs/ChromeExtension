import requests
import json
import psycopg2
import psycopg2.extras
import asyncio
import kin
from kin_base.transaction_envelope import TransactionEnvelope
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, abort, g, Response
from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import firebase_admin
from firebase_admin import credentials, auth, messaging
from flask_httpauth import HTTPTokenAuth
from flask_ngrok import run_with_ngrok

http_auth = HTTPTokenAuth(scheme='Token')

cred = credentials.Certificate('kino-extension-firebase-adminsdk-mrn7d-cca5ca5e4c.json')
default_app = firebase_admin.initialize_app(cred)

DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'


app = Flask(__name__)
run_with_ngrok(app)
db = SQLAlchemy(app)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SSL_mode = 'allow'

AFFILIATE_LINKS = {
    "www.berrylook.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=44303&murl=https%3A%2F%2Fwww.berrylook.com%2F",
    "www.bloomstoday.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=44085&murl=http%3A%2F%2Fwww.bloomstoday.com",
    "www.cheapoair.ca": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=37732&murl=https%3A%2F%2Fwww.cheapoair.ca%2F",
    "www.josbank.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=38377&murl=http%3A%2F%2Fwww.josbank.com",
    "www.shop.lego.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=13923&murl=http%3A%2F%2Fshop.lego.com",
    "www.macys.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=3184&murl=http%3A%2F%2Fwww.macys.com",
    "www.microsoft.com": "https://click.linksynergy.com/deeplink?id=fw7GSdQ4wUE&mid=24542&murl=http%3A%2F%2Fwww.microsoft.com"
}

EARN_PRICE_PER_DOLLAR = 100
SPEND_PRICE_PER_DOLLAR = 10000

GIFTCARD_TYPES = ['Amazon']
GIFTCARD_AMOUNTS = [5, 10, 25]
MAX_GIFTCARD_QUANTITY = 10
MIN_GIFTCARD_QUANTITY = 1

KINO_PUBLIC_ADDRESS = "SCTDXS2NGAKNMSJFJVEE7IQQDUM7KAXTHNRVFTXRGMUYNFIO6LJ5U5M6"
KINO_PRIVATE_ADDRESS = "SCTDXS2NGAKNMSJFJVEE7IQQDUM7KAXTHNRVFTXRGMUYNFIO6LJ5U5M6"
APP_ID = "1111"


class User(db.Model):

    __tablename__ = "users"

    uid = db.Column(db.String, primary_key=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    transactions = db.Column(JSON, nullable=False)
    fcm_token = db.Column(db.String)
    public_address = db.Column(db.String)
    private_address = db.Column(db.String)

    def __init__(self, uid, email, balance=0, transactions=None,
                 fcm_token=None, public_address=None, private_address=None):
        self.uid = uid
        self.email = email
        self.balance = balance
        self.transactions = transactions
        self.fcm_token = fcm_token
        self.public_address = public_address
        self.private_address = private_address

    def __repr__(self):
        return "email: {}, balance: {}"\
            .format(self.email, self.balance)


# Using this to verify authenticated calls where login is required
@http_auth.verify_token
def verify_token(fb_id_token):
    try:
        decoded_token = auth.verify_id_token(fb_id_token)
        g.uid = decoded_token['uid']
    except Exception as err:
        return False
    return True


@app.route('/', methods=['GET'])
@http_auth.login_required
def index():
    return jsonify({"Message": "Welcome to the Kino Api"}), 200


@app.route('/register', methods=['POST'])
@http_auth.login_required
def register():
    email = str(auth.get_user(g.uid).email)
    user = User(uid=g.uid, email=email)
    db.session.add(user)
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return jsonify(), 500
    # Create a wallet and update public address
    client = kin.KinClient(kin.TEST_ENVIRONMENT)
    loop = asyncio.new_event_loop()
    try:
        parent_account = client.kin_account(KINO_PRIVATE_ADDRESS, app_id=APP_ID)
        keypair = kin.Keypair()
        minimum_fee = loop.run_until_complete(client.get_minimum_fee())
        tx_hash = loop.run_until_complete(parent_account.create_account(keypair.public_address, starting_balance=20000,
                                                                        fee=minimum_fee, memo_text='Account creation'))
        exist = loop.run_until_complete(client.does_account_exists(keypair.public_address))
        if exist:
            user.public_address = keypair.public_address
            user.private_address = keypair.secret_seed
        else:
            raise Exception
        error = ""
    except Exception as e:
        try:
            error = str(e)
        except:
            error = "Account creation failed"
        return jsonify(), 500
    finally:
        client.close()
        loop.close()
        email_kino(user, account_creation="", error=error)
    return jsonify(), 201


@app.route('/update_fcm_token', methods=['POST'])
@http_auth.login_required
def update_fcm_token():
    user = User.query.filter_by(uid=g.uid).first()
    if 'web_fcm_token' in request.json:
        web_fcm_token = request.json['web_fcm_token']
        user.web_fcm_token = web_fcm_token
    elif 'android_fcm_token' in request.json:
        android_fcm_token = request.json['android_fcm_token']
        user.android_fcm_token = android_fcm_token
    else:
        return jsonify(), 500
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return jsonify(), 500
    return jsonify(), 201


# @app.route('/update_public_address', methods=['POST'])
# @http_auth.login_required
# def update_public_address():
#     if 'public_address' not in request.json:
#         return jsonify(), 500
#     public_address = request.json['public_address']
#     user = User.query.filter_by(uid=g.uid).first()
#     first_time = True
#     if user.public_address:
#         first_time = False
#     user.public_address = public_address
#     try:
#         db.session.commit()
#     except AssertionError as err:
#         db.session.rollback()
#         return jsonify(), 500
#     # First time installing the app, create a earn transaction for the user's balance
#     if first_time:
#         pay(user, user.balance)
#     return jsonify(), 201


@app.route('/balance', methods=['GET'])
@http_auth.login_required
def balance():
    user = User.query.filter_by(uid=g.uid).first()
    return jsonify({"balance": user.balance}), 200


@app.route('/stores', methods=['GET'])
@http_auth.login_required
def stores():
    return jsonify({"stores": list(AFFILIATE_LINKS.keys())}), 200


@app.route('/affiliate_link/<url>', methods=['GET'])
@http_auth.login_required
def affiliate_link(url):
    user = User.query.filter_by(uid=g.uid).first()
    link = AFFILIATE_LINKS[url]
    # Every url needs to have http(s):// at the start
    link += "&u1=" + user.uid
    return jsonify({"url": link}), 200


def fetch_access_token():
    request_token = "OGZiY0JCR0o3Zmh1RGg3MFh0OTQyeVRZU0JRYTp1VHhvREZfZGNxMTBnZENGX0NmenJNNlB0REVh"
    response = requests.post(
        "https://api.rakutenmarketing.com/token",
        headers={"Authorization": "Basic " + request_token},
        data={
            "grant_type": "password",
            "username": "jeevansidhu",
            "password": "ballislife99",
            "scope": "3612359"
        }
    )
    access_token = response.json()['access_token']
    return access_token


def fetch_transactions(access_token):
    start_date = datetime.utcnow()
    start_date -= timedelta(days=30)
    start_date = start_date.strftime("%Y-%m-%d %H:%M:%S")
    response = requests.get(
        "https://api.rakutenmarketing.com/events/1.0/transactions",
        headers={
            "Accept": "text/json",
            "Authorization": "Bearer " + access_token
        },
        params={"transaction_date_start=": start_date}
    )
    transactions = response.json()
    return transactions


def process_transaction(user, transaction):
    sale_amount = transaction["sale_amount"]
    kin_amount = calc_kin_payout_amount(sale_amount)
    # Update user's balance in db
    user.balance += kin_amount
    # Update user's transactions in db
    if user.transactions:
        temp = user.transactions
        temp = temp.copy()
        temp.update({transaction["etransaction_id"]: transaction})
        user.transactions = temp
    else:
        user.transactions = {transaction["etransaction_id"]: transaction}
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
    pay(user, kin_amount)
    notify_extension(user, kin_amount, transaction['product_name'])


def calc_kin_payout_amount(dollar_amount):
    amount = dollar_amount * EARN_PRICE_PER_DOLLAR
    return min(amount, 50000)


def pay(user, kin_amount):
    #TODO
    return


def notify_extension(user, kin_amount, product_name):
    message = messaging.Message(
        data={
            'title': "Kino",
            'body': "You just earned {} Kin for your purchase of {}.".format(kin_amount, product_name)
        },
        token=user.web_fcm_token,
    )
    try:
        response = messaging.send(message)
    except Exception as err:
        raise err
    return


# def notify_app(user, kin_amount, product_name):
#     # See documentation on defining a message payload.
#     message = messaging.Message(
#         data={
#             'title': "Kino",
#             'body': "You just earned {} Kin for your purchase of {}.".format(kin_amount, product_name)
#         },
#         token=user.android_fcm_token,
#     )
#     # Send a message to the device corresponding to the provided registration token.
#     try:
#         response = messaging.send(message)
#     except Exception as err:
#         raise err
#     return


def email_kino(user, account_creation="", earn_transaction="",
               spend_transaction="", withdraw_transaction="", error=""):
    msg = EmailMessage()
    msg.set_content(str(vars(user)) + "\n" + str(account_creation) + "\n" + str(earn_transaction) +
                    "\n" + str(spend_transaction) + "\n" + str(withdraw_transaction) + "\n" + error)
    if error:
        status = "Failed"
    else:
        status = "Succeeded"
    if account_creation:
        msg['Subject'] = "Account Creation: " + status
    if earn_transaction:
        msg['Subject'] = "Earn Transaction: " + status
    if spend_transaction:
        msg['Subject'] = "Buy Transaction: " + status
    if withdraw_transaction:
        msg['Subject'] = "Withdraw Transaction: " + status
    msg['From'] = "pythoncustomerservice@gmail.com"
    msg['To'] = "activity@earnwithkino.com"
    s = smtplib.SMTP('smtp.gmail.com:587')
    s.ehlo()
    s.starttls()
    s.login("pythoncustomerservice@gmail.com", "vdfv487g489b4")
    s.send_message(msg)
    s.quit()


def monthly_job():
    access_token = fetch_access_token()
    transactions = fetch_transactions(access_token)
    for transaction in transactions:
        try:
            u1 = transaction["u1"]
            user = User.query.filter_by(uid=u1).first()
            process_transaction(user, transaction)
            error = ""
        except Exception as e:
            try:
                error = str(e)
            except:
                error = "Earn transaction failed"
        finally:
            email_kino(user, earn_transaction=transaction, error=error)


def valid_order(order):
    # Ensure all information is present
    if not all(x in order for x in ['email', 'type_', 'amount', 'quantity', 'total']):
        return False

    type_ = order['type_']
    amount = int(order['amount'])
    quanity = int(order['quantity'])
    total = float(order['total'])

    # Ensure total is correct
    if total != quanity*amount*SPEND_PRICE_PER_DOLLAR:
        return False
    # Ensure the type of gift card exists
    if type_ not in GIFTCARD_TYPES:
        return False
    # Ensure the amount is one of the valid options
    if amount not in GIFTCARD_AMOUNTS:
        return False
    # Ensure the quantity is within bounds
    if not MIN_GIFTCARD_QUANTITY <= quanity <= MAX_GIFTCARD_QUANTITY:
        return False

    return True


@app.route('/buy_giftcard', methods=['POST'])
@http_auth.login_required
def buy_giftcard():
    client = kin.KinClient(kin.TEST_ENVIRONMENT)
    loop = asyncio.new_event_loop()
    try:
        user = User.query.filter_by(uid=g.uid).first()
        order = request.json
        if not valid_order(order):
            return jsonify(), 500
        # Get gift-card type, amount, email, and quantity
        type_ = order['type_']
        email = order['email']
        amount = int(order['amount'])
        quanity = int(order['quantity'])
        total = float(order['total'])
        # Whitelist the spend transaction and use the user's secret key to send yourself Kin
        child_account = client.kin_account(user.private_address, app_id=APP_ID)
        minimum_fee = loop.run_until_complete(client.get_minimum_fee())
        builder = child_account.build_send_kin(KINO_PUBLIC_ADDRESS, total, fee=minimum_fee,
                                               memo_text='Amazon giftcard order')
        envelope = builder.gen_xdr().decode()
        network_id = builder.network_name
        client_transaction = {
            "envelope": envelope,
            "network_id": network_id
        }
        parent_account = client.kin_account(KINO_PRIVATE_ADDRESS, app_id=APP_ID)
        whitelisted_tx = parent_account.whitelist_transaction(client_transaction)
        builder = parent_account.get_transaction_builder(minimum_fee)
        # xdr = TransactionEnvelope.from_xdr(whitelisted_tx)
        builder.import_from_xdr(whitelisted_tx)
        tx_hash = loop.run_until_complete(child_account.submit_transaction(builder))
        user.balance -= total
        # TODO: add to transaction or no?
        error = ""
    except Exception as e:
        try:
            error = str(e)
        except:
            error = "Spend transaction failed"
        return jsonify(), 500
    finally:
        client.close()
        loop.close()
        email_kino(user, spend_transaction=request.json, error=error)
    return jsonify(), 201


@app.route('/withdraw', methods=['POST'])
@http_auth.login_required
def withdraw():
    try:
        user = User.query.filter_by(uid=g.uid).first()
        data = request.json
        # Get gift-card type, amount, email, and quantity
        public_address = data['public_address']
        # Whitelist the transaction and send user's balance to the public address
        # TODO:
        # Subtract from balance
        # Add to transactions
        error = ""
    except Exception as e:
        try:
            error = str(e)
        except:
            error = "Earn transaction failed"
        return jsonify(), 500
    finally:
        email_kino(user, withdraw_transaction=request.json, error=error)
    return jsonify(), 201


if __name__ == '__main__':
    app.run()


