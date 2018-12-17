from boa.interop.System.Runtime import *
from boa.interop.System.Storage import *
from boa.builtins import *

def Revert():
    """
    Revert the transaction by raising an exception.
    """
    raise Exception(0x00)

def SafePut(context, key, value):
    if value == 0:
        Delete(context, key)
    else:
        Put(context, key, value)
    return True

def Require(condition):
    """
    If not satisfying the condition, revert the transaction. All
    changed storage will be rolled back.
    :param condition: required condition.
    :return: True if satisfying the condition.
    """
    if not condition:
        _ = Revert()
    return True


def RequireScriptHash(key):
    """
    Checks the bytearray parameter is script hash or not. Script Hash
    length should be equal to 20.
    :param key: bytearray parameter to check script hash format.
    :return: True if script hash or revert the transaction.
    """
    _ = Require(len(key) == 20)
    return True


def RequireWitness(witness):
    """
    Checks the transaction sender is equal to the witness. If not
    satisfying, revert the transaction.
    :param witness: required transaction sender
    :return: True if transaction sender or revert the transaction.
    """
    is_witness = CheckWitness(witness)
    _ = Require(is_witness)
    return True


"""
 SafeMath produces elementary operations such as plus, minus but
 check whether it is safe and revert the transaction if it is not safe.
"""

def uSub(a, b):
    """
    Operates a minus b with condition that a - b can never be below 0.
    :param a: operand a
    :param b: operand b
    :return: a - b if a - b > 0 or revert the transaction.
    """
    Require(a >= b)
    return a - b

from boa.interop.System.ExecutionEngine import GetExecutingScriptHash
from boa.interop.System.App import RegisterAppCall, DynamicAppCall

SpokkzOEP4Contract = RegisterAppCall('cf6460564d3f6884fb6b98f02ff24e22cb2f0c90', 'operation', 'args')

DEPLOYER = ToScriptHash('Ac725LuR7wo481zvNmc9jerqCzoCArQjtw')

OWNER_KEY = '___OWNER_SPUUL'

PAYMENT_PREFIX = '_____pay_spuul'

DEPLOYED_KEY = 'DEPLOYED_SPUUL'

ctx = GetContext()

def main(operation, args):
    if operation == 'deploy':
        return deploy()
    if operation == 'confirmPayment':
        if len(args) == 3:
            return confirmPayment(args[0],args[1],args[2])
    if operation == 'withdraw':
        return withdraw()
    if operation == 'transferOwnership':
        if len(args) == 1:
            return transferOwnership(args[0])
    return False

def deploy():
    """
    Constructor of this contract. Only deployer hard-coded can call this function
    and cannot call this function after called once.

    Followings are initialization list for this token
    1. Transfer the owner to the deployer. (Owner can burn the token)
    2. Supply initial coin to the deployer.
    """

    is_witness = CheckWitness(DEPLOYER)
    is_deployed = Get(ctx, DEPLOYED_KEY)
    Require(is_witness)                     # only can be initialized by deployer
    Require(not is_deployed)                # only can deploy once

    # disable to deploy again
    Put(ctx, DEPLOYED_KEY, 1)

    # the first owner is the deployer
    # TODO: can transfer ownership to other by calling `TransferOwner` function
    Put(ctx, OWNER_KEY, DEPLOYER)

    return True


def confirmPayment(_from, _amount, _orderId):
    """
    Deducts payment from approve amount.
    :param _from: from address.
    :param _amount: SPKZ amount to be deducted.
    :param _orderId: Spuul orderId.
    """

    _onlyOwner();

    Require(_confirmPayment(_from, _amount, _orderId))
    Notify(['confirmPayment', _from, _amount, _orderId])
    return True

def withdraw():
    """
    Withdraws payments collected in the contract to the owner of the contract
    """
    _onlyOwner();

    originator = GetExecutingScriptHash()
    owner = Get(ctx, OWNER_KEY)
    balance = SpokkzOEP4Contract('balanceOf', [originator])

    Require(balance > 0)

    Require(_withdraw(originator, owner, balance))
    Notify(['withdraw', originator, owner, balance])
    return True

def transferOwnership(_account):
    """
    Transfers the ownership of this contract to other.
    :param _account: address to transfer ownership.
    """
    _onlyOwner()
    Require(_transferOwnership(_account))
    return True


def CallOep4Contract(operation, params):
    return SpokkzOEP4Contract(operation, params)


################################################################################
# INTERNAL FUNCTIONS
# Internal functions checks parameter and storage result validation but these
# wouldn't check the witness validation, so caller function must check the
# witness if necessary.

def _transferOwnership(_account):
    RequireScriptHash(_account)
    Put(ctx, OWNER_KEY, _account)
    return True

def _confirmPayment(_from, _amount, _orderId):
    originator = GetExecutingScriptHash()
    to = originator

    RequireScriptHash(_from)
    Require(_amount > 0)

    Require(CallOep4Contract('transferFrom', [originator, _from, to, _amount]))

    payment_key = concat(PAYMENT_PREFIX, _orderId)
    Put(ctx, payment_key, _amount)
    return True

def _withdraw(_from, _to, _balance):
    Require(CallOep4Contract('transfer', [_from, _to, _balance]))
    return True

################################################################################
# modifiers

def _onlyOwner():
    """
    Checks the invoker is the contract owner or not. Owner key is saved in the
    storage key `___OWNER`, so check its value and invoker.
    """
    owner = Get(ctx, OWNER_KEY)
    RequireWitness(owner)
    return True


################################################################################
#
