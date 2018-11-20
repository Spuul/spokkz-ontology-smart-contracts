from boa.interop.System.ExecutionEngine import GetExecutingScriptHash
from boa.interop.System.Runtime import *
from boa.interop.System.App import RegisterAppCall
from libs.SafeCheck import *


SpokkzOEP4Contract = RegisterAppCall('749a701ae89c0dbdab9b4b660ba84ee478004219', 'operation', 'args')


OWNER = ToScriptHash('Ac725LuR7wo481zvNmc9jerqCzoCArQjtw')
ctx = GetContext()

OWNER_KEY = '___OWNER'
PAYMENT_PREFIX = '_____pay'

def main(operation, args):
     if operation == 'init':
        return init()

    if operation == 'pay':
        if len(args) != 2:
            return False
        return pay(args[0], args[1], args[3], args[4])
    if operation == 'transferPaymentsReceived':
        if len(args) == 1:
            return transferPaymentsReceived(args[0])

    return False

def init():
    is_witness = CheckWitness(OWNER)
    Require(is_witness)
    Put(ctx, OWNER_KEY, OWNER)


def pay(_originator, _from, _amount, _order_id):
    Require(SpokkzOEP4Contract('transferFrom', _originator, _from, GetExecutingScriptHash(), _amount))
    payment_key = concat(PAYMENT_PREFIX, _order_id)
    Put(ctx, approve_key, _amount)
    return True

def transferPaymentsReceived(amount):
    _onlyOwner()
    owner = Get(ctx, OWNER_KEY)
    Require(SpokkzOEP4Contract('approve', GetExecutingScriptHash(), amount))

def _onlyOwner():
    owner = Get(ctx, OWNER_KEY)
    RequireWitness(owner)
    return True
