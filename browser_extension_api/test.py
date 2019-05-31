import kin
import asyncio
from flask import jsonify
from pprint import pprint
from flask import Flask
import time

loop = asyncio.get_event_loop()
app = Flask(__name__)

KINO_PUBLIC_ADDRESS = "SCTDXS2NGAKNMSJFJVEE7IQQDUM7KAXTHNRVFTXRGMUYNFIO6LJ5U5M6"
KINO_PRIVATE_ADDRESS = "SCTDXS2NGAKNMSJFJVEE7IQQDUM7KAXTHNRVFTXRGMUYNFIO6LJ5U5M6"
APP_ID = "1111"


@app.route('/', methods=['GET'])
def register():
    # Create a wallet and update public address
    client = kin.KinClient(kin.TEST_ENVIRONMENT)
    try:
        parent_account = client.kin_account(KINO_PRIVATE_ADDRESS, app_id=APP_ID)
        keypair = kin.Keypair()
        minimum_fee = loop.run_until_complete(client.get_minimum_fee())
        tx_hash = loop.run_until_complete(parent_account.create_account(keypair.public_address, starting_balance=20000,
                                                                        fee=minimum_fee, memo_text='Account creation'))
        exist = loop.run_until_complete(client.does_account_exists(keypair.public_address))
        if not exist:
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
    return jsonify(keypair.public_address), 200


if __name__ == '__main__':
    app.run(debug=True)